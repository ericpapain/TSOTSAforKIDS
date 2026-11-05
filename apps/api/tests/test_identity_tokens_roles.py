"""Tests for token rotation, logout, roles, caregiver verification, and rate limiting."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.identity.dependencies import (
    require_role,
    require_verified_caregiver,
)
from tsotsa_api.modules.identity.rate_limit import RateLimiter
from tsotsa_api.modules.identity.repository import IdentityRepository


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_logout(client: AsyncClient) -> None:
    """Refresh token rotates on every use and gets revoked on logout."""
    RateLimiter.clear()
    email = "session.user@tsotsa-for-kids.com"
    pwd = "SessionPassword123!"

    # Register & Login
    await client.post(
        "/v1/auth/email/register",
        json={"email": email, "password": pwd, "display_name": "Session User"},
    )
    login_resp = await client.post("/v1/auth/email/login", json={"email": email, "password": pwd})
    initial_refresh = login_resp.json()["refresh_token"]

    # 1. First refresh rotation
    ref_resp1 = await client.post("/v1/auth/refresh", json={"refresh_token": initial_refresh})
    assert ref_resp1.status_code == 200
    new_refresh = ref_resp1.json()["refresh_token"]
    assert new_refresh != initial_refresh

    # Old refresh token is revoked
    replay_resp = await client.post("/v1/auth/refresh", json={"refresh_token": initial_refresh})
    assert replay_resp.status_code == 401

    # 2. Logout with current refresh token
    logout_resp = await client.post("/v1/auth/logout", json={"refresh_token": new_refresh})
    assert logout_resp.status_code == 200

    # Current refresh token is revoked
    post_logout_ref = await client.post("/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert post_logout_ref.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint_authentication(client: AsyncClient) -> None:
    """GET /v1/auth/me requires valid bearer token."""
    RateLimiter.clear()
    email = "me.user@tsotsa-for-kids.com"
    pwd = "MeUserPassword123!"

    # No token
    no_auth = await client.get("/v1/auth/me")
    assert no_auth.status_code == 401
    assert no_auth.json()["error"]["code"] == "UNAUTHORIZED"

    # Invalid token
    bad_auth = await client.get(
        "/v1/auth/me", headers={"Authorization": "Bearer invalid.jwt.string"}
    )
    assert bad_auth.status_code == 401

    # Valid login and profile access
    await client.post(
        "/v1/auth/email/register",
        json={"email": email, "password": pwd, "display_name": "Me User"},
    )
    login_resp = await client.post("/v1/auth/email/login", json={"email": email, "password": pwd})
    access_token = login_resp.json()["access_token"]

    ok_me = await client.get("/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert ok_me.status_code == 200
    assert ok_me.json()["display_name"] == "Me User"
    assert ok_me.json()["roles"] == ["user"]


@pytest.mark.asyncio
async def test_caregiver_and_role_access_control(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Unverified caregiver is strictly denied health data; approved caregiver is allowed."""
    RateLimiter.clear()
    repo = IdentityRepository(db_session)

    # 1. Standard user
    u1 = await repo.create_user("Normal Parent")
    await repo.assign_role(u1.id, "user")

    # 2. Unverified caregiver (pending)
    u2 = await repo.create_user("Pending Caregiver")
    await repo.assign_role(u2.id, "caregiver")
    await repo.create_caregiver_profile(u2.id, status="pending")

    # 3. Approved caregiver
    u3 = await repo.create_user("Doctor Approved")
    await repo.assign_role(u3.id, "caregiver")
    await repo.create_caregiver_profile(u3.id, status="approved")

    # 4. Admin
    u4 = await repo.create_user("System Admin")
    await repo.assign_role(u4.id, "admin")

    await db_session.commit()

    # Verify dependency require_verified_caregiver
    from tsotsa_api.core.errors import AppException, ForbiddenError

    # Standard user trying caregiver endpoint -> ForbiddenError
    with pytest.raises(ForbiddenError):
        await require_verified_caregiver(user=u1, db=db_session)

    # Unverified caregiver trying health data -> CARE_GIVER_NOT_VERIFIED
    with pytest.raises(AppException) as exc_info:
        await require_verified_caregiver(user=u2, db=db_session)
    assert exc_info.value.code == "CARE_GIVER_NOT_VERIFIED"
    assert exc_info.value.status_code == 403

    # Approved caregiver is accepted
    res3 = await require_verified_caregiver(user=u3, db=db_session)
    assert res3.id == u3.id

    # Admin is accepted
    res4 = await require_verified_caregiver(user=u4, db=db_session)
    assert res4.id == u4.id

    # Test require_role
    admin_checker = require_role("admin")
    with pytest.raises(ForbiddenError):
        await admin_checker(user=u1, db=db_session)
    allowed_admin = await admin_checker(user=u4, db=db_session)
    assert allowed_admin.id == u4.id


@pytest.mark.asyncio
async def test_rate_limiting_exceeded(client: AsyncClient) -> None:
    """Rate limiter raises 429 when threshold exceeded."""
    RateLimiter.clear()
    phone = "+237699999999"

    # Phone request limit is 3 per 120s for phone key
    for _ in range(3):
        resp = await client.post("/v1/auth/phone/request", json={"phone_e164": phone})
        assert resp.status_code == 200

    # 4th request exceeds limit
    blocked = await client.post("/v1/auth/phone/request", json={"phone_e164": phone})
    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
