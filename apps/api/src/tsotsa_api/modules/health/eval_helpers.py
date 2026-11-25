"""Helper functions and serializers for child health event evaluations."""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError
from tsotsa_api.modules.health.models import HealthEvent
from tsotsa_api.modules.health.rules import (
    ClinicalEvaluationResult,
    SymptomInput,
    evaluate_child_health_rules,
)
from tsotsa_api.modules.health.schemas import (
    HealthEventCaregiverOut,
    HealthEventParentOut,
)
from tsotsa_api.modules.identity.permissions_service import PermissionsService
from tsotsa_api.modules.persons.models import Person, PersonCare, PersonLink
from tsotsa_api.modules.persons.repository import PersonsRepository


async def resolve_or_create_target_person(
    session: AsyncSession,
    actor_id: str,
    raw_person_id: str,
) -> Person:
    """Resolve raw_person_id to a valid Person UUID.

    If raw_person_id is not a valid UUID or does not exist, look for an existing
    person linked to the actor or automatically provision a person record.
    """
    is_valid_uuid = False
    try:
        uuid.UUID(str(raw_person_id))
        is_valid_uuid = True
    except (ValueError, AttributeError, TypeError):
        is_valid_uuid = False

    if is_valid_uuid:
        p_stmt = select(Person).where(Person.id == raw_person_id)
        person = (await session.execute(p_stmt)).scalar_one_or_none()
        if person and person.deleted_at is None:
            return person

    link_stmt = (
        select(PersonLink)
        .where(PersonLink.user_id == actor_id)
        .join(Person, PersonLink.person_id == Person.id)
        .where(Person.deleted_at.is_(None))
    )
    existing_link = (await session.execute(link_stmt)).scalars().first()
    if existing_link:
        p_stmt = select(Person).where(Person.id == existing_link.person_id)
        return (await session.execute(p_stmt)).scalar_one()

    persons_repo = PersonsRepository(session)
    person = await persons_repo.create_person(
        first_name="Enfant suivi",
        birth_date=date.today(),
        sex="F",
        created_by=actor_id,
        status="pending",
    )
    await persons_repo.create_person_link(
        person_id=person.id,
        user_id=actor_id,
        relation="child",
        is_primary=True,
    )
    return person


async def resolve_user_access_tier(
    session: AsyncSession,
    perms: PermissionsService,
    user_id: str,
    person_id: str,
) -> str:
    """Determine access tier: caregiver, parent, or forbidden."""
    has_medical_access = (
        await perms.has_permission(user_id, "patients.manage")
        or await perms.has_permission(user_id, "caregivers.view_as")
        or await perms.has_permission(user_id, "accounts.manage_roles")
    )
    if has_medical_access:
        return "caregiver"

    stmt_care = select(PersonCare).where(
        PersonCare.person_id == person_id,
        PersonCare.primary_caregiver_id == user_id,
        PersonCare.ended_at.is_(None),
    )
    if (await session.execute(stmt_care)).scalar_one_or_none():
        return "caregiver"

    stmt_link = select(PersonLink).where(
        PersonLink.person_id == person_id,
        PersonLink.user_id == user_id,
    )
    if (await session.execute(stmt_link)).scalar_one_or_none():
        return "parent"

    raise ForbiddenError("Accès refusé au dossier de cet enfant.")


def evaluate_event_rules(
    event: HealthEvent,
    temp: float | None = None,
    stools: int | None = None,
    vomit: int | None = None,
) -> ClinicalEvaluationResult:
    """Helper to run rules on an event with its symptoms."""
    symptom_inputs = [
        SymptomInput(
            code=s.symptom_code,
            duration_days=s.duration_days,
            recurrence_count=s.recurrence_count,
            specific_metrics=s.specific_metrics or {},
        )
        for s in event.symptoms
    ]
    return evaluate_child_health_rules(
        symptoms=symptom_inputs,
        temperature_celsius=temp,
        stools_frequency_per_day=stools,
        vomiting_frequency_per_day=vomit,
    )


def to_parent_out(
    event: HealthEvent,
    eval_res: ClinicalEvaluationResult,
) -> HealthEventParentOut:
    """Convert model to parent-safe representation."""
    data: dict[str, Any] = {
        "id": event.id,
        "person_id": event.person_id,
        "reported_by": event.reported_by,
        "created_at": event.created_at,
        "declaration_context": event.declaration_context,
        "status": event.status,
        "priority": event.priority,
        "has_danger_sign": eval_res.has_danger_sign,
        "parent_guidance_message": eval_res.parent_guidance_message,
        "comment": event.comment,
        "intake_id": event.intake_id,
        "symptoms": event.symptoms,
    }
    return HealthEventParentOut.model_validate(data)


def to_caregiver_out(
    event: HealthEvent,
    eval_res: ClinicalEvaluationResult,
) -> HealthEventCaregiverOut:
    """Convert model to complete clinical caregiver representation."""
    data: dict[str, Any] = {
        "id": event.id,
        "person_id": event.person_id,
        "reported_by": event.reported_by,
        "created_at": event.created_at,
        "declaration_context": event.declaration_context,
        "status": event.status,
        "priority": event.priority,
        "has_danger_sign": eval_res.has_danger_sign,
        "parent_guidance_message": eval_res.parent_guidance_message,
        "comment": event.comment,
        "intake_id": event.intake_id,
        "symptoms": event.symptoms,
        "organization_id": event.organization_id,
        "caregiver_guidance_notes": eval_res.caregiver_guidance_notes,
        "suggested_conditions": eval_res.suggested_conditions,
        "assessments": event.assessments,
        "actions": event.actions,
    }
    return HealthEventCaregiverOut.model_validate(data)
