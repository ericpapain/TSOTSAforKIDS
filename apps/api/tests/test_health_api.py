"""API integration tests for Child Health & Well-being module (routes, triage, roles)."""

from __future__ import annotations

from datetime import UTC, date, datetime

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.seed_helpers import seed_symptom_catalog
from tsotsa_api.core.database import get_db_session
from tsotsa_api.main import create_app
from tsotsa_api.modules.identity.models import Role, User
from tsotsa_api.modules.intakes.models import Intake
from tsotsa_api.modules.organizations.models import Organization
from tsotsa_api.modules.persons.models import Person, PersonCare, PersonLink
from tsotsa_api.shared.types import generate_uuid7 as uuid7


@pytest.fixture
async def health_test_setup(db_session: AsyncSession) -> dict[str, str]:
    """Seed users, permissions, care relationships, and child profile for health tests."""
    await seed_symptom_catalog(db_session)

    # 1. Roles
    r_parent = Role(id=uuid7(), code="parent", name="Parent", description="Parent")
    r_caregiver = Role(id=uuid7(), code="caregiver", name="Soignant", description="Soignant")
    db_session.add_all([r_parent, r_caregiver])
    await db_session.flush()

    # 2. Users
    u_parent = User(
        id=uuid7(),
        display_name="Maman Aïcha",
        status="active",
        preferred_locale="fr",
    )
    u_other_parent = User(
        id=uuid7(),
        display_name="Papa Paul",
        status="active",
        preferred_locale="fr",
    )
    u_doctor = User(
        id=uuid7(),
        display_name="Dr Mbarga",
        status="active",
        preferred_locale="fr",
    )
    db_session.add_all([u_parent, u_other_parent, u_doctor])
    await db_session.flush()

    from tsotsa_api.modules.identity.models_roles import Permission, RolePermission, UserRole

    p_manage = Permission(
        id=uuid7(),
        code="patients.manage",
        name="Gérer patients",
        description="Dossiers",
    )
    db_session.add(p_manage)
    await db_session.flush()

    rp_doc = RolePermission(role_id=r_caregiver.id, permission_id=p_manage.id, is_default=True)
    ur_parent = UserRole(user_id=u_parent.id, role_id=r_parent.id)
    ur_doc = UserRole(user_id=u_doctor.id, role_id=r_caregiver.id)
    db_session.add_all([rp_doc, ur_parent, ur_doc])
    await db_session.flush()

    # 3. Organization & Child
    org = Organization(
        id=uuid7(),
        name="Hôpital Pédiatrique Yaoundé",
        type="hopital",
        status="active",
    )
    db_session.add(org)
    await db_session.flush()

    child = Person(
        id=uuid7(),
        first_name="Amina",
        birth_date=date(2024, 6, 15),
        sex="F",
        pseudonym="#P-HLT-001",
        status="validated",
        created_by=str(u_parent.id),
    )
    db_session.add(child)
    await db_session.flush()

    # 4. Links & Care
    p_link = PersonLink(
        id=uuid7(),
        person_id=str(child.id),
        user_id=str(u_parent.id),
        relation="child",
        is_primary=True,
    )
    p_care = PersonCare(
        id=uuid7(),
        person_id=str(child.id),
        organization_id=str(org.id),
        primary_caregiver_id=str(u_doctor.id),
    )
    db_session.add_all([p_link, p_care])
    await db_session.flush()

    return {
        "parent_id": str(u_parent.id),
        "other_parent_id": str(u_other_parent.id),
        "doctor_id": str(u_doctor.id),
        "child_id": str(child.id),
        "org_id": str(org.id),
    }


def _get_test_app(db_session: AsyncSession):
    app = create_app()

    async def _override_db():
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db
    return app


def _auth_headers_for(user_id: str, role: str = "parent") -> dict[str, str]:
    from tsotsa_api.core.security import create_access_token

    token = create_access_token(user_id, claims={"roles": [role]})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_symptom_catalog(
    db_session: AsyncSession,
    health_test_setup: dict[str, str],
) -> None:
    """Check symptom catalog retrieves all active symptoms with questions."""
    app = _get_test_app(db_session)
    headers = _auth_headers_for(health_test_setup["parent_id"])
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/v1/health/symptoms/catalog", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 19
        danger_codes = [s["code"] for s in data if s["is_danger_sign"]]
        assert "convulsions" in danger_codes
        assert "vomits_everything" in danger_codes


@pytest.mark.asyncio
async def test_report_danger_sign_urgent_triage(
    db_session: AsyncSession, health_test_setup: dict[str, str]
) -> None:
    """Check danger sign triggers urgent priority and immediate transfer advice."""
    app = _get_test_app(db_session)
    headers = _auth_headers_for(health_test_setup["parent_id"])
    payload = {
        "person_id": health_test_setup["child_id"],
        "declaration_context": "standalone",
        "symptoms": [{"symptom_code": "convulsions", "duration": "recent"}],
        "comment": "L'enfant a eu des secousses.",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/v1/health/events", json=payload, headers=headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["priority"] == "urgent"
        assert data["has_danger_sign"] is True
        assert "centre de santé" in data["parent_guidance_message"].lower()


@pytest.mark.asyncio
async def test_report_during_meal_association(
    db_session: AsyncSession, health_test_setup: dict[str, str]
) -> None:
    """Check event during meal links to intake without breaking intake record."""
    from decimal import Decimal

    intake = Intake(
        id=uuid7(),
        person_id=health_test_setup["child_id"],
        recorded_by=health_test_setup["parent_id"],
        item_type="food",
        quantity=Decimal("150.0"),
        unit="g",
        consumption="half",
        origin="app",
        taken_at=datetime.now(UTC),
    )
    db_session.add(intake)
    await db_session.flush()

    app = _get_test_app(db_session)
    headers = _auth_headers_for(health_test_setup["parent_id"])
    payload = {
        "person_id": health_test_setup["child_id"],
        "intake_id": str(intake.id),
        "declaration_context": "during_meal",
        "meal_interrupted": True,
        "intake_quantity_consumed": "half",
        "symptoms": [{"symptom_code": "vomiting", "duration": "pendant repas"}],
        "vomiting_frequency_per_day": 2,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/v1/health/events", json=payload, headers=headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["intake_id"] == str(intake.id)
        assert data["declaration_context"] == "during_meal"


@pytest.mark.asyncio
async def test_fever_and_cough_prolonged_triggers_high_priority(
    db_session: AsyncSession, health_test_setup: dict[str, str]
) -> None:
    """Check fever >= 3 days or cough >= 14 days flags clinical investigation."""
    app = _get_test_app(db_session)
    headers_parent = _auth_headers_for(health_test_setup["parent_id"], role="parent")
    headers_doc = _auth_headers_for(health_test_setup["doctor_id"], role="caregiver")

    payload = {
        "person_id": health_test_setup["child_id"],
        "declaration_context": "standalone",
        "symptoms": [
            {"symptom_code": "fever", "duration_days": 3},
            {"symptom_code": "cough", "duration_days": 15},
        ],
        "temperature_celsius": 39.0,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/v1/health/events", json=payload, headers=headers_parent)
        assert resp.status_code == 201
        ev_id = resp.json()["id"]

        # Doctor reads details
        resp_doc = await ac.get(f"/v1/health/events/{ev_id}", headers=headers_doc)
        assert resp_doc.status_code == 200
        doc_data = resp_doc.json()
        assert doc_data["priority"] == "high"
        assert "PaludismePossible" in doc_data["suggested_conditions"]
        assert "TuberculosePossible" in doc_data["suggested_conditions"]


@pytest.mark.asyncio
async def test_isolation_and_role_based_filtering(
    db_session: AsyncSession, health_test_setup: dict[str, str]
) -> None:
    """Check other parent cannot view child health, parent gets sanitized view."""
    app = _get_test_app(db_session)
    headers_other = _auth_headers_for(health_test_setup["other_parent_id"])
    headers_parent = _auth_headers_for(health_test_setup["parent_id"])

    # Unauthorized access check
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get(
            f"/v1/health/events/person/{health_test_setup['child_id']}",
            headers=headers_other,
        )
        assert resp.status_code == 403

        # Parent reports normal event
        payload = {
            "person_id": health_test_setup["child_id"],
            "symptoms": [{"symptom_code": "fatigue"}],
        }
        create_resp = await ac.post("/v1/health/events", json=payload, headers=headers_parent)
        assert create_resp.status_code == 201
        parent_view = create_resp.json()
        assert "suggested_conditions" not in parent_view
        assert "caregiver_guidance_notes" not in parent_view


@pytest.mark.asyncio
async def test_caregiver_assessment_and_action_workflow(
    db_session: AsyncSession, health_test_setup: dict[str, str]
) -> None:
    """Check clinical assessment and medical action lifecycle."""
    app = _get_test_app(db_session)
    headers_parent = _auth_headers_for(health_test_setup["parent_id"], role="parent")
    headers_doc = _auth_headers_for(health_test_setup["doctor_id"], role="caregiver")

    # 1. Parent reports
    payload = {
        "person_id": health_test_setup["child_id"],
        "symptoms": [{"symptom_code": "diarrhea", "duration_days": 2}],
        "stools_frequency_per_day": 3,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        c_resp = await ac.post("/v1/health/events", json=payload, headers=headers_parent)
        ev_id = c_resp.json()["id"]

        # 2. Parent attempts assessment -> forbidden
        bad_ass = {"clinical_notes": "Diagnostic personnel"}
        bad_resp = await ac.post(
            f"/v1/health/events/{ev_id}/assessments",
            json=bad_ass,
            headers=headers_parent,
        )
        assert bad_resp.status_code == 403

        # 3. Doctor adds assessment -> moves to under_review
        doc_ass = {
            "clinical_notes": "Signes légers de déshydratation, prescription SRO.",
            "suspected_condition": "Gastro-entérite aiguë",
            "requires_investigation": False,
        }
        ass_resp = await ac.post(
            f"/v1/health/events/{ev_id}/assessments",
            json=doc_ass,
            headers=headers_doc,
        )
        assert ass_resp.status_code == 201
        assert ass_resp.json()["status"] == "under_review"

        # 4. Doctor records action to close -> moves to resolved
        act_payload = {
            "action_type": "closed",
            "details": "Résolu après réhydratation et contrôle à J+2.",
        }
        act_resp = await ac.post(
            f"/v1/health/events/{ev_id}/actions",
            json=act_payload,
            headers=headers_doc,
        )
        assert act_resp.status_code == 201
        assert act_resp.json()["status"] == "resolved"

        # 5. Doctor checks alerts
        alerts_resp = await ac.get("/v1/health/alerts", headers=headers_doc)
        assert alerts_resp.status_code == 200
