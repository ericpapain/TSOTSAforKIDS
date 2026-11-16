"""Unit tests for role registration, account status, lockout and login gates."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tests.seed_helpers import seed_test_catalog
from tsotsa_api.modules.food_database.models import Region
from tsotsa_api.modules.identity.models import CaregiverProfile, FieldAgentProfile, User
from tsotsa_api.modules.organizations.models import Organization


@pytest.mark.asyncio
async def test_parent_registration_is_active(client: AsyncClient, db_session: AsyncSession) -> None:
    """Registering a parent account directly sets status to active."""
    await seed_test_catalog(db_session)

    res = await client.post(
        "/v1/auth/email/register",
        json={
            "email": "maman.awa.new@tsotsa-for-kids.com",
            "password": "SecurePassword123!",
            "first_name": "Awa",
            "last_name": "Bakary",
            "role": "parent",
            "locality": "Garoua",
        },
    )
    assert res.status_code == 201

    # Verify directly in database
    stmt = select(User).where(User.first_name == "Awa")
    user = (await db_session.execute(stmt)).scalar_one_or_none()
    assert user is not None
    assert user.status == "active"
    assert user.first_name == "Awa"

    # Verify login succeeds and contains patients.register permission
    login_res = await client.post(
        "/v1/auth/email/login",
        json={
            "email": "maman.awa.new@tsotsa-for-kids.com",
            "password": "SecurePassword123!",
        },
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["user"]["first_name"] == "Awa"
    assert "patients.register" in login_data["user"]["permissions"]


@pytest.mark.asyncio
async def test_caregiver_registration_is_pending_and_login_blocked(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Registering a caregiver sets status to pending and blocks immediate login."""
    await seed_test_catalog(db_session)

    region = Region(code="LT", name="Littoral")
    db_session.add(region)
    await db_session.flush()

    org = Organization(
        name="Hôpital Laquintinie de Douala",
        type="hopital",
        region_id=region.id,
        status="active",
    )
    db_session.add(org)
    await db_session.flush()

    res = await client.post(
        "/v1/auth/email/register",
        json={
            "email": "dr.kamga.pediatre@tsotsa-for-kids.com",
            "password": "DoctorSecurePass123!",
            "first_name": "Samuel",
            "last_name": "Kamga",
            "role": "caregiver",
            "locality": "Douala",
            "phone": "+237699000120",
            "facility_id": org.id,
            "speciality": "Pédiatre",
            "order_number": "ONMC-8874",
        },
    )
    assert res.status_code == 201

    # Verify pending state and caregiver profile
    stmt = select(User).where(User.first_name == "Samuel")
    user = (await db_session.execute(stmt)).scalar_one_or_none()
    assert user is not None
    assert user.status == "pending"

    cg = await db_session.get(CaregiverProfile, user.id)
    assert cg is not None
    assert cg.verification_status == "pending"
    assert cg.speciality == "Pédiatre"

    # Attempt login while pending: must return 403 ACCOUNT_PENDING_VALIDATION
    login_res = await client.post(
        "/v1/auth/email/login",
        json={
            "email": "dr.kamga.pediatre@tsotsa-for-kids.com",
            "password": "DoctorSecurePass123!",
        },
    )
    assert login_res.status_code == 403
    login_data = login_res.json()
    err_code = login_data.get("error", {}).get("code") or login_data.get("code")
    assert err_code in ("ACCOUNT_PENDING_VALIDATION", "errors.account_pending_validation")


@pytest.mark.asyncio
async def test_field_agent_registration_is_pending(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Registering a field agent creates a pending profile."""
    await seed_test_catalog(db_session)

    res = await client.post(
        "/v1/auth/email/register",
        json={
            "email": "agent.terrain.centre@tsotsa-for-kids.com",
            "password": "FieldAgentPass123!",
            "first_name": "Marie",
            "last_name": "Nguemo",
            "role": "field_agent",
            "locality": "Obala",
            "phone": "+237699000130",
            "structure_name": "Croix-Rouge Camerounaise",
        },
    )
    assert res.status_code == 201

    stmt = select(User).where(User.first_name == "Marie")
    user = (await db_session.execute(stmt)).scalar_one_or_none()
    assert user is not None
    assert user.status == "pending"

    profile = await db_session.get(FieldAgentProfile, user.id)
    assert profile is not None
    assert profile.verification_status == "pending"
    assert profile.structure_name == "Croix-Rouge Camerounaise"


@pytest.mark.asyncio
async def test_account_temporary_lockout_after_five_failed_attempts(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """5 consecutive invalid password attempts lock the account for 15 minutes."""
    await seed_test_catalog(db_session)

    # Register an active parent account
    reg = await client.post(
        "/v1/auth/email/register",
        json={
            "email": "lockout.target@tsotsa-for-kids.com",
            "password": "GoodPassword123!",
            "first_name": "Jean",
            "last_name": "Cible",
            "role": "parent",
        },
    )
    assert reg.status_code == 201

    stmt = select(User).where(User.first_name == "Jean")
    user = (await db_session.execute(stmt)).scalar_one_or_none()
    assert user is not None

    # 4 bad attempts: status 401 CredentialInvalid
    for attempt_idx in range(1, 5):
        fail_res = await client.post(
            "/v1/auth/email/login",
            json={
                "email": "lockout.target@tsotsa-for-kids.com",
                "password": f"WrongPass{attempt_idx}!",
            },
        )
        assert fail_res.status_code == 401

    await db_session.refresh(user)
    assert user.failed_login_attempts == 4
    assert user.locked_until is None

    # 5th bad attempt: must trigger account lockout
    fifth_res = await client.post(
        "/v1/auth/email/login",
        json={
            "email": "lockout.target@tsotsa-for-kids.com",
            "password": "WrongPass5!",
        },
    )
    assert fifth_res.status_code == 403
    fifth_code = fifth_res.json().get("error", {}).get("code") or fifth_res.json().get("code")
    assert fifth_code in ("ACCOUNT_LOCKED", "errors.account_locked")

    # Even with the right password, login must be blocked while locked
    locked_res = await client.post(
        "/v1/auth/email/login",
        json={
            "email": "lockout.target@tsotsa-for-kids.com",
            "password": "GoodPassword123!",
        },
    )
    assert locked_res.status_code == 403
    locked_code = locked_res.json().get("error", {}).get("code") or locked_res.json().get("code")
    assert locked_code in ("ACCOUNT_LOCKED", "errors.account_locked")
