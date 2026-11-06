"""Tests for Domain C & L: Consents, Caregiver Isolation, and Audit Trail."""

from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from tsotsa_api.core.database import Base, get_db_session
from tsotsa_api.core.security import create_access_token
from tsotsa_api.main import create_app
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as session:
        yield session
    await engine.dispose()


async def _make_user(session: AsyncSession, name: str, role: str) -> tuple[User, dict[str, str]]:
    repo = IdentityRepository(session)
    user = await repo.create_user(display_name=name)
    await repo.assign_role(user.id, role)
    await session.commit()
    token = create_access_token(user.id, claims={"roles": [role]})
    return user, {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_consents_caregiver_access_and_audit_trail(db_session: AsyncSession) -> None:
    """Verify medical care access cut without consent, caregiver isolation, and audit trail."""
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, headers_admin = await _make_user(db_session, "Admin Système", "admin")
    parent, headers_parent = await _make_user(db_session, "Maman Jeanne", "user")
    caregiver_a, headers_cg_a = await _make_user(db_session, "Dr Kamga (Yaoundé)", "caregiver")
    caregiver_b, headers_cg_b = await _make_user(db_session, "Dr Fopa (Douala)", "caregiver")
    cg_pending, headers_cg_pending = await _make_user(db_session, "Dr En Attente", "caregiver")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Admin creates Org A and Org B
        org_a = (
            await client.post(
                "/v1/admin/organizations",
                json={"name": "Hôpital Central de Yaoundé", "type": "hopital"},
                headers=headers_admin,
            )
        ).json()["id"]

        org_b = (
            await client.post(
                "/v1/admin/organizations",
                json={"name": "Hôpital Général de Douala", "type": "hopital"},
                headers=headers_admin,
            )
        ).json()["id"]

        # Attach caregivers: cg_a -> org_a (approved), cg_b -> org_b (approved),
        # cg_pending -> org_a (pending)
        await client.post(
            f"/v1/admin/organizations/{org_a}/caregivers",
            json={"user_id": caregiver_a.id, "licence_number": "MED-01", "approve": True},
            headers=headers_admin,
        )
        await client.post(
            f"/v1/admin/organizations/{org_b}/caregivers",
            json={"user_id": caregiver_b.id, "licence_number": "MED-02", "approve": True},
            headers=headers_admin,
        )
        await client.post(
            f"/v1/admin/organizations/{org_a}/caregivers",
            json={"user_id": cg_pending.id, "licence_number": "MED-99", "approve": False},
            headers=headers_admin,
        )

        # 2. Parent registers child and attaches child to Org A
        child = (
            await client.post(
                "/v1/family/members",
                json={"first_name": "Samuel", "birth_date": "2024-01-05", "sex": "M"},
                headers=headers_parent,
            )
        ).json()
        child_id = child["id"]

        attach_care = await client.post(
            f"/v1/family/members/{child_id}/care",
            json={"organization_id": org_a},
            headers=headers_parent,
        )
        assert attach_care.status_code == 201

        # 3. CONSENT CHECK: No consent given yet!
        # Caregiver A queries establishment persons -> child is NOT visible (list is empty)
        cg_list_no_consent = await client.get(
            f"/v1/caregiver/organizations/{org_a}/persons", headers=headers_cg_a
        )
        assert cg_list_no_consent.status_code == 200
        assert cg_list_no_consent.json() == []

        # Caregiver A queries child detail -> 403 Forbidden
        cg_get_no_consent = await client.get(
            f"/v1/caregiver/organizations/{org_a}/persons/{child_id}", headers=headers_cg_a
        )
        assert cg_get_no_consent.status_code == 403

        # 4. Caregiver B from Org B tries to access Org A -> 403 Forbidden (cross-establishment)
        cross_org = await client.get(
            f"/v1/caregiver/organizations/{org_a}/persons", headers=headers_cg_b
        )
        assert cross_org.status_code == 403

        # Unverified caregiver tries to access -> 403 Forbidden
        unverified_cg = await client.get(
            f"/v1/caregiver/organizations/{org_a}/persons", headers=headers_cg_pending
        )
        assert unverified_cg.status_code == 403

        # 5. Parent grants consent
        # First read legal text
        text_res = await client.get("/v1/consents/text")
        assert text_res.status_code == 200
        assert "données de santé" in text_res.json()["body"]

        give_res = await client.post(
            f"/v1/persons/{child_id}/consent",
            json={"legal_guardian": True},
            headers=headers_parent,
        )
        assert give_res.status_code == 201
        assert give_res.json()["is_active"] is True

        # Now Caregiver A CAN see child in establishment list
        cg_list_with_consent = await client.get(
            f"/v1/caregiver/organizations/{org_a}/persons", headers=headers_cg_a
        )
        assert cg_list_with_consent.status_code == 200
        assert len(cg_list_with_consent.json()) == 1
        assert cg_list_with_consent.json()[0]["pseudonym"] == child["pseudonym"]

        # Caregiver A CAN read child details
        cg_detail = await client.get(
            f"/v1/caregiver/organizations/{org_a}/persons/{child_id}", headers=headers_cg_a
        )
        assert cg_detail.status_code == 200
        assert cg_detail.json()["first_name"] == "Samuel"

        # 6. WITHDRAWAL: Parent withdraws consent -> caregiver access immediately CUT
        withdraw_res = await client.post(
            f"/v1/persons/{child_id}/consent/withdraw",
            headers=headers_parent,
        )
        assert withdraw_res.status_code == 200
        assert withdraw_res.json()["is_active"] is False

        # Caregiver A list is empty again
        cg_list_after_withdraw = await client.get(
            f"/v1/caregiver/organizations/{org_a}/persons", headers=headers_cg_a
        )
        assert cg_list_after_withdraw.status_code == 200
        assert cg_list_after_withdraw.json() == []

        # Caregiver A get detail fails with 403
        cg_detail_after_withdraw = await client.get(
            f"/v1/caregiver/organizations/{org_a}/persons/{child_id}", headers=headers_cg_a
        )
        assert cg_detail_after_withdraw.status_code == 403

        # 7. AUDIT TRAIL: Admin verifies immutable audit log records
        audit_res = await client.get("/v1/admin/audit-logs", headers=headers_admin)
        assert audit_res.status_code == 200
        logs = audit_res.json()
        actions = [item["action"] for item in logs]

        assert "create" in actions
        assert "consent_granted" in actions
        assert "consent_withdrawn" in actions
        assert "read" in actions

        # Check entity tags
        entities = {item["entity"] for item in logs}
        assert "person" in entities
        assert "consent" in entities
        assert "establishment_persons" in entities
