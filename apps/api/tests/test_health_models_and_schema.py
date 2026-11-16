"""Unit tests for Health & Well-being data models, relationships and schema integrity."""

from __future__ import annotations

from datetime import UTC, date, datetime

import pytest
from sqlalchemy import select

from tests.seed_helpers import seed_symptom_catalog, seed_test_catalog
from tsotsa_api.modules.health.models import (
    ClinicalAssessment,
    HealthEvent,
    HealthEventAction,
    HealthEventSymptom,
    SymptomCatalog,
)
from tsotsa_api.modules.identity.models import User, UserRole
from tsotsa_api.modules.intakes.models import Intake
from tsotsa_api.modules.organizations.models import Organization
from tsotsa_api.modules.persons.models import Person


@pytest.mark.asyncio
async def test_symptom_catalog_danger_signs_and_categories(db_session):
    """Verify SymptomCatalog records, danger signs and categories."""
    await seed_symptom_catalog(db_session)

    res = (await db_session.execute(select(SymptomCatalog))).scalars().all()
    assert len(res) >= 12

    danger_signs = (
        (
            await db_session.execute(
                select(SymptomCatalog).where(SymptomCatalog.is_danger_sign.is_(True))
            )
        )
        .scalars()
        .all()
    )
    danger_codes = {ds.code for ds in danger_signs}
    assert "convulsions" in danger_codes
    assert "unconscious_lethargic" in danger_codes
    assert "unable_drink_breastfeed" in danger_codes
    assert "vomits_everything" in danger_codes
    assert "severe_respiratory_distress" in danger_codes


@pytest.mark.asyncio
async def test_health_event_standalone_creation(db_session):
    """Verify creating a standalone health event with symptoms."""
    role_map = await seed_test_catalog(db_session)
    await seed_symptom_catalog(db_session)

    parent = User(display_name="Parent Test", status="active")
    db_session.add(parent)
    await db_session.flush()

    ur = UserRole(user_id=parent.id, role_id=role_map["parent"].id)
    db_session.add(ur)

    child = Person(
        pseudonym="#A-101",
        first_name="Fanta",
        birth_date=date(2023, 5, 10),
        sex="F",
        status="validated",
        created_by=parent.id,
    )
    db_session.add(child)
    await db_session.flush()

    event = HealthEvent(
        person_id=child.id,
        reported_by=parent.id,
        declaration_context="standalone",
        status="submitted",
        priority="attention",
        comment="L'enfant semble très chaud depuis ce matin.",
    )
    db_session.add(event)
    await db_session.flush()

    symptom = HealthEventSymptom(
        health_event_id=event.id,
        symptom_code="fever",
        duration="today",
        duration_days=1,
        specific_metrics={"temp_measured": True, "temp_value": 38.8, "temp_time": "08:30"},
    )
    db_session.add(symptom)
    await db_session.commit()

    # Query back and verify relations
    reloaded = (
        await db_session.execute(select(HealthEvent).where(HealthEvent.id == event.id))
    ).scalar_one()

    assert reloaded.status == "submitted"
    assert reloaded.priority == "attention"
    assert len(reloaded.symptoms) == 1
    assert reloaded.symptoms[0].symptom_code == "fever"
    assert reloaded.symptoms[0].specific_metrics["temp_value"] == 38.8


@pytest.mark.asyncio
async def test_health_event_during_meal_association(db_session):
    """Verify health event linked to a meal intake without losing intake state."""
    await seed_test_catalog(db_session)
    await seed_symptom_catalog(db_session)

    parent = User(display_name="Parent Intakes", status="active")
    db_session.add(parent)
    await db_session.flush()

    child = Person(
        pseudonym="#A-102",
        first_name="Bouba",
        birth_date=date(2022, 11, 1),
        sex="M",
        status="validated",
        created_by=parent.id,
    )
    db_session.add(child)
    await db_session.flush()

    intake = Intake(
        person_id=child.id,
        item_type="product",
        quantity=1,
        unit="sachet",
        taken_at=datetime.now(UTC),
        consumption="refused",
        origin="app",
        notes="A refusé après deux cuillères",
        recorded_by=parent.id,
    )
    db_session.add(intake)
    await db_session.flush()

    event = HealthEvent(
        person_id=child.id,
        reported_by=parent.id,
        intake_id=intake.id,
        declaration_context="during_meal",
        status="submitted",
        priority="high",
        comment="Vomissement immédiat pendant la prise",
    )
    db_session.add(event)
    await db_session.flush()

    symptom = HealthEventSymptom(
        health_event_id=event.id,
        symptom_code="vomiting",
        duration="today",
        specific_metrics={"vomiting_frequency": 2, "after_meal": True},
    )
    db_session.add(symptom)
    await db_session.commit()

    reloaded = (
        await db_session.execute(select(HealthEvent).where(HealthEvent.id == event.id))
    ).scalar_one()

    assert reloaded.intake_id == intake.id
    assert reloaded.declaration_context == "during_meal"


@pytest.mark.asyncio
async def test_clinical_assessment_and_actions_workflow(db_session):
    """Verify caregiver clinical assessment and action history on a health event."""
    await seed_test_catalog(db_session)
    await seed_symptom_catalog(db_session)

    doctor = User(display_name="Dr Talla", status="active")
    parent = User(display_name="Parent Marie", status="active")
    org = Organization(name="CMA Bonassama", type="cma", status="active")
    db_session.add_all([doctor, parent, org])
    await db_session.flush()

    child = Person(
        pseudonym="#A-103",
        first_name="Amina",
        birth_date=date(2023, 1, 15),
        sex="F",
        status="validated",
        created_by=parent.id,
    )
    db_session.add(child)
    await db_session.flush()

    event = HealthEvent(
        person_id=child.id,
        reported_by=parent.id,
        organization_id=org.id,
        declaration_context="standalone",
        status="submitted",
        priority="high",
    )
    db_session.add(event)
    await db_session.flush()

    # Caregiver evaluates
    assessment = ClinicalAssessment(
        health_event_id=event.id,
        caregiver_id=doctor.id,
        clinical_notes="Suspicion d'infection respiratoire aiguë. Toux depuis 5 jours.",
        suspected_condition="Pneumonie suspectée",
        requires_investigation=True,
        investigation_type="Radiographie thoracique et numération",
    )
    action = HealthEventAction(
        health_event_id=event.id,
        actor_id=doctor.id,
        action_type="referred_to_facility",
        details="Orientation vers le centre médical pour examen d'urgence",
    )
    event.status = "action_taken"
    db_session.add_all([assessment, action])
    await db_session.commit()

    reloaded = (
        await db_session.execute(select(HealthEvent).where(HealthEvent.id == event.id))
    ).scalar_one()

    assert reloaded.status == "action_taken"
    assert len(reloaded.assessments) == 1
    assert reloaded.assessments[0].suspected_condition == "Pneumonie suspectée"
    assert len(reloaded.actions) == 1
    assert reloaded.actions[0].action_type == "referred_to_facility"


@pytest.mark.asyncio
async def test_cascade_delete_health_event_removes_sub_entities(db_session):
    """Verify that deleting a HealthEvent cascades to its symptoms, assessments and actions."""
    await seed_test_catalog(db_session)
    await seed_symptom_catalog(db_session)

    parent = User(display_name="Parent Cascade", status="active")
    db_session.add(parent)
    await db_session.flush()

    child = Person(
        pseudonym="#A-104",
        first_name="CascadeChild",
        birth_date=date(2023, 2, 2),
        sex="M",
        status="validated",
        created_by=parent.id,
    )
    db_session.add(child)
    await db_session.flush()

    event = HealthEvent(
        person_id=child.id,
        reported_by=parent.id,
        status="submitted",
        priority="normal",
    )
    db_session.add(event)
    await db_session.flush()

    symptom = HealthEventSymptom(
        health_event_id=event.id,
        symptom_code="cough",
        duration="today",
    )
    action = HealthEventAction(
        health_event_id=event.id,
        actor_id=parent.id,
        action_type="note_added",
        details="Précision transmise",
    )
    db_session.add_all([symptom, action])
    await db_session.commit()

    # Delete the health event
    await db_session.delete(event)
    await db_session.commit()

    symptoms = (
        await db_session.execute(
            select(HealthEventSymptom).where(HealthEventSymptom.health_event_id == event.id)
        )
    ).scalars().all()
    assert len(symptoms) == 0

    actions = (
        await db_session.execute(
            select(HealthEventAction).where(HealthEventAction.health_event_id == event.id)
        )
    ).scalars().all()
    assert len(actions) == 0
