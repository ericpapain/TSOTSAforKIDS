"""Service orchestrating child health and well-being events, triage and evaluations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.health.eval_helpers import (
    evaluate_event_rules,
    resolve_user_access_tier,
    to_caregiver_out,
    to_parent_out,
)
from tsotsa_api.modules.health.models import (
    ClinicalAssessment,
    HealthEvent,
    HealthEventAction,
    HealthEventSymptom,
)
from tsotsa_api.modules.health.repository import HealthRepository
from tsotsa_api.modules.health.rules import (
    SymptomInput,
    evaluate_child_health_rules,
)
from tsotsa_api.modules.health.schemas import (
    ClinicalAssessmentCreate,
    HealthAlertSummary,
    HealthEventActionCreate,
    HealthEventCaregiverOut,
    HealthEventCreate,
    HealthEventParentOut,
    SymptomCatalogOut,
)
from tsotsa_api.modules.identity.permissions_service import PermissionsService
from tsotsa_api.modules.notifications.service import NotificationsService
from tsotsa_api.modules.persons.models import Person
from tsotsa_api.shared.types import generate_uuid7


class HealthService:
    """Business logic for reporting, triaging, and clinically managing health events."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = HealthRepository(session)
        self.audit = AuditService(session)
        self.perms = PermissionsService(session)
        self.notifs = NotificationsService(session)

    async def get_symptom_catalog(self) -> list[SymptomCatalogOut]:
        """Retrieve full active symptoms catalog sorted by order."""
        items = await self.repo.get_symptom_catalog(only_active=True)
        return [SymptomCatalogOut.model_validate(it) for it in items]

    async def declare_health_event(
        self,
        actor_id: str,
        payload: HealthEventCreate,
        ip: str | None = None,
    ) -> HealthEventParentOut | HealthEventCaregiverOut:
        """Create and triage a new health event."""
        tier = await resolve_user_access_tier(
            self.session, self.perms, actor_id, payload.person_id
        )

        p_stmt = select(Person).where(Person.id == payload.person_id)
        person = (await self.session.execute(p_stmt)).scalar_one_or_none()
        if not person or person.deleted_at is not None:
            raise NotFoundError("Enfant suivi introuvable.")

        rule_inputs = [
            SymptomInput(
                code=s.symptom_code,
                duration_days=s.duration_days,
                recurrence_count=s.recurrence_count,
                specific_metrics=s.specific_metrics,
            )
            for s in payload.symptoms
        ]
        eval_result = evaluate_child_health_rules(
            symptoms=rule_inputs,
            temperature_celsius=payload.temperature_celsius,
            stools_frequency_per_day=payload.stools_frequency_per_day,
            vomiting_frequency_per_day=payload.vomiting_frequency_per_day,
        )
        event_id = generate_uuid7()
        event = HealthEvent(
            id=event_id,
            person_id=payload.person_id,
            reported_by=actor_id,
            intake_id=payload.intake_id,
            declaration_context=payload.declaration_context,
            status="open",
            priority=eval_result.priority,
            comment=payload.comment,
        )
        symptoms = [
            HealthEventSymptom(
                id=generate_uuid7(),
                health_event_id=event_id,
                symptom_code=s.symptom_code,
                duration=s.duration,
                duration_days=s.duration_days,
                recurrence_count=s.recurrence_count,
                specific_metrics=s.specific_metrics,
            )
            for s in payload.symptoms
        ]
        saved_event = await self.repo.create_health_event(event, symptoms)

        await self.audit.log(
            action="create",
            entity="health_event",
            entity_id=event_id,
            actor_user_id=actor_id,
            ip=ip,
            details={
                "priority": eval_result.priority,
                "has_danger_sign": eval_result.has_danger_sign,
            },
        )

        if tier == "caregiver":
            return to_caregiver_out(saved_event, eval_result)
        return to_parent_out(saved_event, eval_result)

    async def list_events_for_person(
        self,
        actor_id: str,
        person_id: str,
        status: str | None = None,
        priority: str | None = None,
    ) -> list[HealthEventParentOut | HealthEventCaregiverOut]:
        """Fetch timeline of health events for a child."""
        tier = await resolve_user_access_tier(
            self.session, self.perms, actor_id, person_id
        )
        events = await self.repo.list_events_by_person(person_id, status=status, priority=priority)

        results: list[HealthEventParentOut | HealthEventCaregiverOut] = []
        for e in events:
            ev_res = evaluate_event_rules(e)
            if tier == "caregiver":
                results.append(to_caregiver_out(e, ev_res))
            else:
                results.append(to_parent_out(e, ev_res))
        return results

    async def get_health_event(
        self,
        actor_id: str,
        event_id: str,
    ) -> HealthEventParentOut | HealthEventCaregiverOut:
        """Fetch health event details by ID."""
        event = await self.repo.get_health_event_by_id(event_id)
        if not event:
            raise NotFoundError("Événement de santé introuvable.")

        tier = await resolve_user_access_tier(
            self.session, self.perms, actor_id, event.person_id
        )
        ev_res = evaluate_event_rules(event)
        if tier == "caregiver":
            return to_caregiver_out(event, ev_res)
        return to_parent_out(event, ev_res)

    async def add_clinical_assessment(
        self,
        caregiver_id: str,
        event_id: str,
        payload: ClinicalAssessmentCreate,
        ip: str | None = None,
    ) -> HealthEventCaregiverOut:
        """Add clinical doctor assessment to an open health event."""
        event = await self.repo.get_health_event_by_id(event_id)
        if not event:
            raise NotFoundError("Événement de santé introuvable.")

        tier = await resolve_user_access_tier(
            self.session, self.perms, caregiver_id, event.person_id
        )
        if tier != "caregiver":
            raise ForbiddenError(
                "Seul un professionnel de santé peut enregistrer une évaluation médicale."
            )

        assessment = ClinicalAssessment(
            id=generate_uuid7(),
            health_event_id=event_id,
            caregiver_id=caregiver_id,
            clinical_notes=payload.clinical_notes,
            suspected_condition=payload.suspected_condition,
            requires_investigation=payload.requires_investigation,
            investigation_type=payload.investigation_type,
        )
        await self.repo.add_assessment(assessment)

        if event.status in ["open", "submitted"]:
            event.status = "under_review"
            await self.session.flush()
        await self.audit.log(
            action="create",
            entity="clinical_assessment",
            entity_id=assessment.id,
            actor_user_id=caregiver_id,
            ip=ip,
            details={"event_id": event_id},
        )

        refreshed = await self.repo.get_health_event_by_id(event_id)
        assert refreshed is not None
        ev_res = evaluate_event_rules(refreshed)
        return to_caregiver_out(refreshed, ev_res)

    async def add_health_action(
        self,
        actor_id: str,
        event_id: str,
        payload: HealthEventActionCreate,
        ip: str | None = None,
    ) -> HealthEventCaregiverOut:
        """Record a medical action or resolve the event."""
        event = await self.repo.get_health_event_by_id(event_id)
        if not event:
            raise NotFoundError("Événement de santé introuvable.")

        tier = await resolve_user_access_tier(
            self.session, self.perms, actor_id, event.person_id
        )
        if tier != "caregiver":
            raise ForbiddenError(
                "Seul un professionnel de santé peut enregistrer une action médicale."
            )

        new_status = "resolved" if payload.action_type == "closed" else None
        action = HealthEventAction(
            id=generate_uuid7(),
            health_event_id=event_id,
            actor_id=actor_id,
            action_type=payload.action_type,
            details=payload.details,
        )
        await self.repo.add_action(action, new_event_status=new_status)

        await self.audit.log(
            action="create",
            entity="health_event_action",
            entity_id=action.id,
            actor_user_id=actor_id,
            ip=ip,
            details={"action_type": payload.action_type, "new_status": new_status},
        )

        refreshed = await self.repo.get_health_event_by_id(event_id)
        assert refreshed is not None
        ev_res = evaluate_event_rules(refreshed)
        return to_caregiver_out(refreshed, ev_res)

    async def list_open_health_alerts(
        self,
        actor_id: str,
        min_priority: str | None = None,
    ) -> list[HealthAlertSummary]:
        """Fetch alert summaries for caregivers and supervisors."""
        has_perm = (
            await self.perms.has_permission(actor_id, "patients.manage")
            or await self.perms.has_permission(actor_id, "caregivers.view_as")
        )
        if not has_perm:
            raise ForbiddenError("Accès réservé aux soignants et coordinateurs.")

        priorities = (
            ["urgent", "high"]
            if min_priority == "high"
            else ["urgent", "high", "attention"]
        )
        events = await self.repo.list_open_alerts(priorities=priorities)

        results: list[HealthAlertSummary] = []
        for ev in events:
            p_stmt = select(Person.pseudonym).where(Person.id == ev.person_id)
            pseudonym = (await self.session.execute(p_stmt)).scalar_one_or_none()
            ev_res = evaluate_event_rules(ev)
            results.append(
                HealthAlertSummary(
                    event_id=ev.id,
                    person_id=ev.person_id,
                    person_code=pseudonym,
                    created_at=ev.created_at,
                    priority=ev.priority,
                    status=ev.status,
                    symptoms_summary=[s.symptom_code for s in ev.symptoms],
                    has_danger_sign=ev_res.has_danger_sign,
                    requires_urgent_transfer=ev.priority == "urgent",
                )
            )
        return results
