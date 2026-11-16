"""Integration tests for staff validation, permission delegation, and patient care workflows."""

from __future__ import annotations

from datetime import UTC, date, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from tests.seed_helpers import seed_test_catalog
except ImportError:
    from seed_helpers import seed_test_catalog
from tsotsa_api.core.security import hash_password
from tsotsa_api.modules.food_database.models import Region
from tsotsa_api.modules.identity.models import (
    CaregiverProfile,
    FieldAgentProfile,
    Role,
    User,
    UserIdentity,
    UserRole,
)
from tsotsa_api.modules.identity.token_service import TokenService
from tsotsa_api.modules.organizations.models import Organization
from tsotsa_api.modules.persons.models import Person


async def _create_test_user(
    session: AsyncSession,
    email: str,
    role_code: str,
    status: str = "active",
    first_name: str = "Test",
    last_name: str = "User",
) -> tuple[User, str]:
    """Helper creating a test user with assigned role and bearer token."""
    user = User(
        display_name=f"{first_name} {last_name}",
        first_name=first_name,
        last_name=last_name,
        status=status,
    )
    session.add(user)
    await session.flush()

    ident = UserIdentity(
        user_id=user.id,
        provider="email",
        provider_subject=email,
        email=email,
        password_hash=hash_password("ValidPassword123!"),
        email_verified_at=datetime.now(UTC) if status == "active" else None,
    )
    session.add(ident)

    stmt = select(Role).where(Role.code == role_code)
    role = (await session.execute(stmt)).scalar_one()
    ur = UserRole(user_id=user.id, role_id=role.id)
    session.add(ur)

    if role_code in ("caregiver", "super_caregiver"):
        cg = CaregiverProfile(
            user_id=user.id,
            verification_status="approved" if status == "active" else "pending",
            speciality="Médecin Pédiatre",
        )
        session.add(cg)
    elif role_code == "field_agent":
        fa = FieldAgentProfile(
            user_id=user.id,
            phone="+237699000199",
            verification_status="approved" if status == "active" else "pending",
            structure_name="ONG Santé Locale",
        )
        session.add(fa)

    await session.flush()

    from tsotsa_api.modules.identity.repository import IdentityRepository

    repo = IdentityRepository(session)
    token_svc = TokenService(repository=repo)
    token_res = await token_svc.issue_tokens(user)
    return user, token_res.access_token


@pytest.mark.asyncio
async def test_staff_validation_approve_and_reject(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Super caregiver or admin can approve or reject pending staff."""
    await seed_test_catalog(db_session)
    admin_user, admin_token = await _create_test_user(
        db_session, "admin.validator@tsotsa-for-kids.com", "admin"
    )
    pending_cg, _ = await _create_test_user(
        db_session,
        "dr.pending.val@tsotsa-for-kids.com",
        "caregiver",
        status="pending",
        first_name="Paul",
    )

    # 1. Approve caregiver
    res = await client.post(
        f"/v1/staff/{pending_cg.id}/validate",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"decision": "approved"},
    )
    assert res.status_code == 200
    assert "validé" in res.json()["message"]

    reloaded_cg = await db_session.get(User, pending_cg.id)
    assert reloaded_cg is not None
    assert reloaded_cg.status == "active"

    # 2. Reject another staff without reason -> 400
    pending_fa, _ = await _create_test_user(
        db_session,
        "fa.pending.val@tsotsa-for-kids.com",
        "field_agent",
        status="pending",
        first_name="Alice",
    )
    fail_res = await client.post(
        f"/v1/staff/{pending_fa.id}/validate",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"decision": "rejected"},
    )
    assert fail_res.status_code == 400

    # 3. Reject with reason -> 200
    rej_res = await client.post(
        f"/v1/staff/{pending_fa.id}/validate",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"decision": "rejected", "refusal_reason": "Justificatif manquant"},
    )
    assert rej_res.status_code == 200
    assert "refusé" in rej_res.json()["message"]


@pytest.mark.asyncio
async def test_cannot_delete_last_active_admin(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Admin cannot delete or suspend the sole remaining active admin."""
    await seed_test_catalog(db_session)
    admin_user, admin_token = await _create_test_user(
        db_session, "sole.admin@tsotsa-for-kids.com", "admin"
    )

    res = await client.delete(
        f"/v1/staff/{admin_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400
    err_code = res.json().get("error", {}).get("code") or res.json().get("code")
    assert err_code in ("CANNOT_DELETE_LAST_ADMIN", "errors.cannot_delete_last_admin")


@pytest.mark.asyncio
async def test_permission_delegation_rules(client: AsyncClient, db_session: AsyncSession) -> None:
    """Super caregiver delegates own rights to caregivers, but cannot delegate unheld rights."""
    await seed_test_catalog(db_session)
    super_doc, sdoc_token = await _create_test_user(
        db_session, "super.doc@tsotsa-for-kids.com", "super_caregiver", first_name="SuperDoc"
    )
    caregiver, _ = await _create_test_user(
        db_session, "sub.doc@tsotsa-for-kids.com", "caregiver", first_name="SubDoc"
    )
    parent_user, _ = await _create_test_user(
        db_session, "simple.parent@tsotsa-for-kids.com", "parent", first_name="Parent"
    )

    # 1. Super caregiver delegates patients.assign (held) to caregiver -> SUCCESS
    grant_res = await client.post(
        "/v1/permissions/grant",
        headers={"Authorization": f"Bearer {sdoc_token}"},
        json={
            "target_user_id": caregiver.id,
            "permission_code": "patients.assign",
            "reason": "Co-super soignant intérimaire",
        },
    )
    assert grant_res.status_code == 200
    assert "accordé" in grant_res.json()["message"]

    # 2. Super caregiver attempts to delegate accounts.create (NOT held) -> FORBIDDEN
    bad_perm_res = await client.post(
        "/v1/permissions/grant",
        headers={"Authorization": f"Bearer {sdoc_token}"},
        json={
            "target_user_id": caregiver.id,
            "permission_code": "accounts.create",
            "reason": "Tentative invalide",
        },
    )
    assert bad_perm_res.status_code == 403

    # 3. Super caregiver attempts to delegate to a parent -> FORBIDDEN
    bad_target_res = await client.post(
        "/v1/permissions/grant",
        headers={"Authorization": f"Bearer {sdoc_token}"},
        json={
            "target_user_id": parent_user.id,
            "permission_code": "patients.assign",
            "reason": "Tentative invalide",
        },
    )
    assert bad_target_res.status_code == 403

    # 4. Revoke grant -> SUCCESS
    revoke_res = await client.post(
        "/v1/permissions/revoke",
        headers={"Authorization": f"Bearer {sdoc_token}"},
        json={
            "target_user_id": caregiver.id,
            "permission_code": "patients.assign",
        },
    )
    assert revoke_res.status_code == 200
    assert "révoqué" in revoke_res.json()["message"]


@pytest.mark.asyncio
async def test_patient_validation_and_assignment(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Patients registered by parents can be validated and assigned to active caregivers."""
    await seed_test_catalog(db_session)
    super_doc, sdoc_token = await _create_test_user(
        db_session, "sdoc.patients@tsotsa-for-kids.com", "super_caregiver"
    )
    caregiver, _ = await _create_test_user(
        db_session, "doctor.assigned@tsotsa-for-kids.com", "caregiver"
    )

    region = Region(code="CE", name="Centre")
    db_session.add(region)
    await db_session.flush()

    org = Organization(
        name="Hôpital Central de Yaoundé",
        type="hopital",
        region_id=region.id,
        status="active",
    )
    db_session.add(org)
    await db_session.flush()

    # Create a patient in pending status
    patient = Person(
        pseudonym="#P-001",
        first_name="Junior",
        birth_date=date(2024, 3, 1),
        sex="M",
        region_id=region.id,
        status="pending",
    )
    db_session.add(patient)
    await db_session.flush()

    # 1. Super doc lists pending patients
    list_res = await client.get(
        "/v1/patients/pending",
        headers={"Authorization": f"Bearer {sdoc_token}"},
    )
    assert list_res.status_code == 200
    pending_list = list_res.json()
    assert any(p["id"] == patient.id for p in pending_list)

    # 2. Super doc validates patient
    val_res = await client.post(
        f"/v1/patients/{patient.id}/validate",
        headers={"Authorization": f"Bearer {sdoc_token}"},
        json={"decision": "validated"},
    )
    assert val_res.status_code == 200
    assert val_res.json()["status"] == "validated"

    # 3. Super doc assigns patient to caregiver
    assign_res = await client.post(
        f"/v1/patients/{patient.id}/assign",
        headers={"Authorization": f"Bearer {sdoc_token}"},
        json={
            "caregiver_id": caregiver.id,
            "organization_id": org.id,
            "reason": "Prise en charge pédiatrique",
        },
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "assigned"
