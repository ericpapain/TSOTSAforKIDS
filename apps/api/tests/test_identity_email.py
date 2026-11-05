"""Tests for Email and Password authentication workflow."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.security import hash_token, verify_password
from tsotsa_api.modules.identity.models import EmailToken, UserIdentity
from tsotsa_api.modules.identity.rate_limit import RateLimiter


@pytest.mark.asyncio
async def test_email_register_password_bounds_and_storage(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Password constraints (<8 and >72) enforced, and bcrypt hash stored properly."""
    RateLimiter.clear()

    # Password too short (< 8)
    short_resp = await client.post(
        "/v1/auth/email/register",
        json={"email": "short@example.com", "password": "pass", "display_name": "Short"},
    )
    assert short_resp.status_code == 422

    # Password too long (> 72)
    long_resp = await client.post(
        "/v1/auth/email/register",
        json={
            "email": "long@example.com",
            "password": "a" * 73,
            "display_name": "Long",
        },
    )
    assert long_resp.status_code == 422

    # Valid registration
    clean_email = "valid.user@tsotsa-for-kids.com"
    plain_password = "SecurePassword123!"
    resp = await client.post(
        "/v1/auth/email/register",
        json={
            "email": clean_email,
            "password": plain_password,
            "display_name": "Valid User",
        },
    )
    assert resp.status_code == 201

    # Verify password is NOT stored in plain text, but as bcrypt hash
    res = await db_session.execute(
        select(UserIdentity).where(UserIdentity.email == clean_email)
    )
    identity = res.scalar_one_or_none()
    assert identity is not None
    assert identity.password_hash != plain_password
    assert identity.password_hash.startswith("$2b$")
    assert verify_password(plain_password, identity.password_hash)


@pytest.mark.asyncio
async def test_email_register_duplicate_conflict(client: AsyncClient) -> None:
    """Registering an existing email returns HTTP 409 conflict."""
    RateLimiter.clear()
    email = "duplicate@tsotsa-for-kids.com"
    payload = {"email": email, "password": "ValidPassword123!", "display_name": "Dup"}

    resp1 = await client.post("/v1/auth/email/register", json=payload)
    assert resp1.status_code == 201

    resp2 = await client.post("/v1/auth/email/register", json=payload)
    assert resp2.status_code == 409
    assert resp2.json()["error"]["code"] == "EMAIL_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_email_verify_token(client: AsyncClient, db_session: AsyncSession) -> None:
    """Confirming email verification token updates identity."""
    RateLimiter.clear()
    email = "to.verify@tsotsa-for-kids.com"
    await client.post(
        "/v1/auth/email/register",
        json={"email": email, "password": "ValidPassword123!", "display_name": "Verify Me"},
    )

    # Fetch generated verification token
    res = await db_session.execute(
        select(EmailToken)
        .join(UserIdentity)
        .where(UserIdentity.email == email, EmailToken.purpose == "verify")
    )
    token_rec = res.scalars().first()
    assert token_rec is not None

    # Replace hash with a known token for verification test
    known_token = "valid_verify_token_1234567890"
    token_rec.token_hash = hash_token(known_token)
    await db_session.commit()

    # Valid token
    v_resp = await client.post("/v1/auth/email/verify", json={"token": known_token})
    assert v_resp.status_code == 200

    # Repeating with same token returns 404 (already used)
    v_resp2 = await client.post("/v1/auth/email/verify", json={"token": known_token})
    assert v_resp2.status_code == 404


@pytest.mark.asyncio
async def test_email_login_success_and_failures(client: AsyncClient) -> None:
    """Login with valid, invalid password, or non-existent email."""
    RateLimiter.clear()
    email = "login.test@tsotsa-for-kids.com"
    password = "CorrectPassword123!"

    # Register
    await client.post(
        "/v1/auth/email/register",
        json={"email": email, "password": password, "display_name": "Login Tester"},
    )

    # Successful login
    ok_resp = await client.post(
        "/v1/auth/email/login", json={"email": email, "password": password}
    )
    assert ok_resp.status_code == 200
    assert "access_token" in ok_resp.json()

    # Wrong password
    wrong_resp = await client.post(
        "/v1/auth/email/login", json={"email": email, "password": "WrongPassword999!"}
    )
    assert wrong_resp.status_code == 401
    assert wrong_resp.json()["error"]["message"] == "Adresse e-mail ou mot de passe incorrect."

    # Unknown email (constant-time fallback check, identical error message)
    unknown_resp = await client.post(
        "/v1/auth/email/login",
        json={"email": "nonexistent@tsotsa-for-kids.com", "password": password},
    )
    assert unknown_resp.status_code == 401
    assert unknown_resp.json()["error"]["message"] == "Adresse e-mail ou mot de passe incorrect."


@pytest.mark.asyncio
async def test_password_forgot_and_reset(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Password reset changes password and revokes previous refresh tokens."""
    RateLimiter.clear()
    email = "reset.user@tsotsa-for-kids.com"
    old_pwd = "OldPassword123!"
    new_pwd = "NewPassword456!"

    # Register and log in to get a refresh token
    await client.post(
        "/v1/auth/email/register",
        json={"email": email, "password": old_pwd, "display_name": "Reset User"},
    )
    login_resp = await client.post(
        "/v1/auth/email/login", json={"email": email, "password": old_pwd}
    )
    refresh_token = login_resp.json()["refresh_token"]

    # Request reset
    forgot_resp = await client.post(
        "/v1/auth/password/forgot", json={"email": email}
    )
    assert forgot_resp.status_code == 200

    # Obtain reset token from DB
    res = await db_session.execute(
        select(EmailToken)
        .join(UserIdentity)
        .where(UserIdentity.email == email, EmailToken.purpose == "reset")
    )
    reset_rec = res.scalars().first()
    assert reset_rec is not None
    known_reset_token = "known_reset_token_secret_12345"
    reset_rec.token_hash = hash_token(known_reset_token)
    await db_session.commit()

    # Reset password
    reset_resp = await client.post(
        "/v1/auth/password/reset",
        json={"token": known_reset_token, "new_password": new_pwd},
    )
    assert reset_resp.status_code == 200

    # Old password no longer works
    fail_resp = await client.post(
        "/v1/auth/email/login", json={"email": email, "password": old_pwd}
    )
    assert fail_resp.status_code == 401

    RateLimiter.clear()

    # New password works
    new_login = await client.post(
        "/v1/auth/email/login", json={"email": email, "password": new_pwd}
    )
    assert new_login.status_code == 200

    # Old refresh token is revoked
    refresh_attempt = await client.post(
        "/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert refresh_attempt.status_code == 401
