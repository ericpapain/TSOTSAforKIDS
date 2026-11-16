"""Tests for Google Identity authentication workflow."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.identity.models import UserIdentity
from tsotsa_api.modules.identity.rate_limit import RateLimiter


@pytest.mark.asyncio
async def test_google_login_success_and_subsequent_login(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """A valid Google token creates an account and logs in on repeat."""
    RateLimiter.clear()
    google_payload = {
        "sub": "google-sub-1001",
        "email": "parent.test@tsotsa-for-kids.com",
        "name": "Jeanne Parent",
        "email_verified": True,
        "aud": "tsotsa-mobile-client-id.apps.googleusercontent.com",
    }

    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=google_payload):
        resp = await client.post("/v1/auth/google", json={"id_token": "valid.google.jwt.token"})
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["user"]["display_name"] == "Jeanne Parent"
        assert any(r in body["user"]["roles"] for r in ("parent", "user"))
        first_user_id = body["user"]["id"]

        # Verify DB records
        res = await db_session.execute(
            select(UserIdentity).where(
                UserIdentity.provider == "google",
                UserIdentity.provider_subject == "google-sub-1001",
            )
        )
        identity = res.scalar_one_or_none()
        assert identity is not None
        assert identity.email == "parent.test@tsotsa-for-kids.com"

        # Subsequent login with same Google account
        resp2 = await client.post("/v1/auth/google", json={"id_token": "valid.google.jwt.token"})
        assert resp2.status_code == 200
        body2 = resp2.json()
        assert body2["user"]["id"] == first_user_id


@pytest.mark.asyncio
async def test_google_login_invalid_signature_fails(client: AsyncClient) -> None:
    """An invalid Google token signature returns HTTP 401."""
    RateLimiter.clear()
    with patch(
        "google.oauth2.id_token.verify_oauth2_token",
        side_effect=ValueError("Invalid cryptographic signature"),
    ):
        resp = await client.post("/v1/auth/google", json={"id_token": "invalid.signature.token"})
        assert resp.status_code == 401
        err = resp.json()["error"]
        assert err["code"] == "UNAUTHORIZED"
        assert "invalid_google_token" in str(err["details"])


@pytest.mark.asyncio
async def test_google_login_unverified_email_fails(client: AsyncClient) -> None:
    """A Google account with unverified email returns HTTP 401."""
    RateLimiter.clear()
    google_payload = {
        "sub": "google-sub-unverified",
        "email": "unverified@tsotsa-for-kids.com",
        "name": "Unverified User",
        "email_verified": False,
    }

    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=google_payload):
        resp = await client.post("/v1/auth/google", json={"id_token": "unverified.email.token"})
        assert resp.status_code == 401
        err = resp.json()["error"]
        assert err["code"] == "UNAUTHORIZED"
        assert err["details"]["reason"] == "unverified_google_email"


@pytest.mark.asyncio
async def test_google_login_audience_mismatch_fails(client: AsyncClient) -> None:
    """Google token with mismatched audience is rejected."""
    RateLimiter.clear()
    with patch(
        "google.oauth2.id_token.verify_oauth2_token",
        side_effect=ValueError("Audience mismatch"),
    ):
        resp = await client.post("/v1/auth/google", json={"id_token": "wrong.audience.token"})
        assert resp.status_code == 401
        assert resp.json()["error"]["code"] == "UNAUTHORIZED"
