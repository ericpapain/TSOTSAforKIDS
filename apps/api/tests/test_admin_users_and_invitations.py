"""Integration tests for Domain Admin: User management, Invitations, 3 Auth Methods, Suspension."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.core.security import create_access_token
from tsotsa_api.main import create_app
from tsotsa_api.modules.audit.models import AuditLog
from tsotsa_api.modules.identity.admin_service import IdentityAdminService
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository


async def _create_user(session: AsyncSession, name: str, role: str) -> tuple[User, str]:
    repo = IdentityRepository(session)
    user = await repo.create_user(display_name=name)
    await repo.assign_role(user.id, role)
    await session.commit()
    token = create_access_token(user.id, claims={"roles": [role]})
    return user, token


@pytest.mark.asyncio
async def test_admin_rights_and_user_creation_with_invitation(db_session: AsyncSession) -> None:
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, admin_token = await _create_user(db_session, "Admin Eric", "admin")
    _, regular_token = await _create_user(db_session, "User Paul", "user")
    _, cg_token = await _create_user(db_session, "Dr Mbarga", "caregiver")

    h_admin = {"Authorization": f"Bearer {admin_token}"}
    h_user = {"Authorization": f"Bearer {regular_token}"}
    h_cg = {"Authorization": f"Bearer {cg_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Access control: Anonymous -> 401, User -> 403, Caregiver -> 403, Admin -> 200
        res_anon = await client.get("/v1/admin/users")
        assert res_anon.status_code == 401

        res_user = await client.get("/v1/admin/users", headers=h_user)
        assert res_user.status_code == 403

        res_cg = await client.get("/v1/admin/users", headers=h_cg)
        assert res_cg.status_code == 403

        res_admin = await client.get("/v1/admin/users", headers=h_admin)
        assert res_admin.status_code == 200
        assert res_admin.json()["total"] >= 3

        # 2. Direct user creation by admin with invitation
        create_res = await client.post(
            "/v1/admin/users",
            json={
                "display_name": "Nouveau Soignant Yaoundé",
                "role": "caregiver",
                "phone_or_email": "soignant.yaounde@tsotsa.cm",
                "is_verified_caregiver": True,
                "licence_number": "MED-YDE-001",
            },
            headers=h_admin,
        )
        assert create_res.status_code == 201
        data = create_res.json()
        assert data["role"] == "caregiver"
        assert data["status"] == "invited"
        raw_token = data["invitation_token"]
        assert len(raw_token) > 20

        # Verify invitation endpoint
        verify_res = await client.get(f"/v1/auth/invitations/verify?token={raw_token}")
        assert verify_res.status_code == 200
        assert verify_res.json()["valid"] is True
        assert verify_res.json()["role"] == "caregiver"


@pytest.mark.asyncio
async def test_invitation_acceptance_three_methods(db_session: AsyncSession) -> None:
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    admin_user, _ = await _create_user(db_session, "Admin Eric", "admin")
    admin_srv = IdentityAdminService(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # --- Connection 1: Email + Password ---
        _, _, tok_email = await admin_srv.create_invited_user(
            created_by=admin_user.id,
            display_name="Parent Un",
            role="user",
            phone_or_email="parent1@example.com",
        )
        await db_session.commit()

        accept_email = await client.post(
            "/v1/auth/invitations/accept",
            json={
                "token": tok_email,
                "method": "email",
                "email": "parent1@example.com",
                "password": "Password123!",
            },
        )
        assert accept_email.status_code == 200
        tokens_email = accept_email.json()
        assert "access_token" in tokens_email

        # --- Connection 2: Phone ---
        _, _, tok_phone = await admin_srv.create_invited_user(
            created_by=admin_user.id,
            display_name="Parent Deux",
            role="user",
            phone_or_email="+237699112233",
        )
        await db_session.commit()

        accept_phone = await client.post(
            "/v1/auth/invitations/accept",
            json={
                "token": tok_phone,
                "method": "phone",
                "phone": "+237699112233",
            },
        )
        assert accept_phone.status_code == 200
        assert "access_token" in accept_phone.json()

        # --- Connection 3: Google ---
        _, _, tok_google = await admin_srv.create_invited_user(
            created_by=admin_user.id,
            display_name="Parent Trois",
            role="user",
            phone_or_email="google.user@example.com",
        )
        await db_session.commit()

        accept_google = await client.post(
            "/v1/auth/invitations/accept",
            json={
                "token": tok_google,
                "method": "google",
                "email": "google.user@example.com",
                "id_token": "valid-simulated-token-sub-12345",
            },
        )
        assert accept_google.status_code == 200
        assert "access_token" in accept_google.json()


@pytest.mark.asyncio
async def test_invitation_expiry_and_replay_rejection(db_session: AsyncSession) -> None:
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    admin_user, _ = await _create_user(db_session, "Admin Eric", "admin")
    admin_srv = IdentityAdminService(db_session)

    # 1. Expired invitation (> 7 days)
    u_exp, inv_exp, tok_exp = await admin_srv.create_invited_user(
        created_by=admin_user.id,
        display_name="Invité Expiré",
        role="user",
        phone_or_email="expire@example.com",
    )
    # Artificially age the invitation past 7 days
    inv_exp.expires_at = datetime.now(UTC) - timedelta(days=8)
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Verify check shows invalid
        v_res = await client.get(f"/v1/auth/invitations/verify?token={tok_exp}")
        assert v_res.json()["valid"] is False

        # Attempt accept -> 422 Unprocessable Content
        acc_exp = await client.post(
            "/v1/auth/invitations/accept",
            json={
                "token": tok_exp,
                "method": "email",
                "email": "expire@example.com",
                "password": "Password123!",
            },
        )
        assert acc_exp.status_code in (400, 422)

        # 2. Replay of an already accepted invitation
        _, _, tok_valid = await admin_srv.create_invited_user(
            created_by=admin_user.id,
            display_name="Invité Valide",
            role="user",
            phone_or_email="valide@example.com",
        )
        await db_session.commit()

        # First acceptance -> 200
        acc_1 = await client.post(
            "/v1/auth/invitations/accept",
            json={
                "token": tok_valid,
                "method": "email",
                "email": "valide@example.com",
                "password": "Password123!",
            },
        )
        assert acc_1.status_code == 200

        # Second acceptance attempt with same token -> 404 (already used)
        acc_2 = await client.post(
            "/v1/auth/invitations/accept",
            json={
                "token": tok_valid,
                "method": "email",
                "email": "valide@example.com",
                "password": "Password123!",
            },
        )
        assert acc_2.status_code == 404


@pytest.mark.asyncio
async def test_user_suspension_reactivation_and_audit(db_session: AsyncSession) -> None:
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, admin_token = await _create_user(db_session, "Admin Eric", "admin")
    target_user, target_token = await _create_user(db_session, "User Suspended", "user")

    h_admin = {"Authorization": f"Bearer {admin_token}"}
    h_target = {"Authorization": f"Bearer {target_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Target user can access their profile before suspension
        res_before = await client.get("/v1/users/me/region", headers=h_target)
        assert res_before.status_code == 200

        # Admin suspends target user
        susp_res = await client.post(
            f"/v1/admin/users/{target_user.id}/suspend",
            json={"reason": "Suspicion de fraude"},
            headers=h_admin,
        )
        assert susp_res.status_code == 200
        assert susp_res.json()["status"] == "suspended"

        # Suspended user is blocked from making authenticated requests (403 Compte suspendu)
        res_after = await client.get("/v1/users/me/region", headers=h_target)
        assert res_after.status_code == 403
        error_msg = res_after.json().get("error", {}).get("message", "")
        assert "suspendu" in error_msg.lower()

        # Admin reactivates target user
        react_res = await client.post(
            f"/v1/admin/users/{target_user.id}/reactivate",
            headers=h_admin,
        )
        assert react_res.status_code == 200
        assert react_res.json()["status"] == "active"

        # Reactivated user can access endpoints again
        res_restored = await client.get("/v1/users/me/region", headers=h_target)
        assert res_restored.status_code == 200

    # Verify audit log traces exist
    logs = (await db_session.execute(select(AuditLog))).scalars().all()
    actions = [entry.action for entry in logs]
    assert "suspend_user" in actions
    assert "reactivate_user" in actions
