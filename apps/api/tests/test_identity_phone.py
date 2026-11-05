"""Tests for Phone OTP authentication workflow."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.security import hash_token
from tsotsa_api.modules.identity.models import OtpCode
from tsotsa_api.modules.identity.rate_limit import RateLimiter

TEST_PHONE = "+237699000001"


@pytest.mark.asyncio
async def test_phone_otp_request_valid_and_invalid_formats(client: AsyncClient) -> None:
    """Requesting OTP verifies E.164 format and returns confirmation."""
    RateLimiter.clear()

    # Valid E.164 format
    resp = await client.post("/v1/auth/phone/request", json={"phone_e164": TEST_PHONE})
    assert resp.status_code == 200
    data = resp.json()
    assert "SMS" in data["message"]
    assert data["expires_in_seconds"] == 600

    # Invalid phone format
    bad_resp = await client.post("/v1/auth/phone/request", json={"phone_e164": "0699000001"})
    assert bad_resp.status_code == 422


@pytest.mark.asyncio
async def test_phone_otp_verify_success(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Correct OTP code creates user account and issues tokens."""
    RateLimiter.clear()
    phone = "+237699000002"

    # Request code
    await client.post("/v1/auth/phone/request", json={"phone_e164": phone})

    # Find the generated code in database
    res = await db_session.execute(
        select(OtpCode)
        .where(OtpCode.phone_e164 == phone, OtpCode.consumed_at.is_(None))
        .order_by(OtpCode.created_at.desc())
    )
    otp_record = res.scalars().first()
    assert otp_record is not None

    # Simulate knowing code by setting known hash
    known_code = "123456"
    otp_record.code_hash = hash_token(known_code)
    await db_session.commit()

    # Verify code
    verify_resp = await client.post(
        "/v1/auth/phone/verify",
        json={
            "phone_e164": phone,
            "code": known_code,
            "display_name": "Paul Maman",
        },
    )
    assert verify_resp.status_code == 200
    body = verify_resp.json()
    assert "access_token" in body
    assert body["user"]["display_name"] == "Paul Maman"

    # Confirm OTP marked consumed
    await db_session.refresh(otp_record)
    assert otp_record.consumed_at is not None


@pytest.mark.asyncio
async def test_phone_otp_wrong_code_and_max_attempts(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Wrong OTP increments attempts and rejects after 5 attempts."""
    RateLimiter.clear()
    phone = "+237699000003"

    # Insert an OTP record with known code
    real_code = "654321"
    otp = OtpCode(
        phone_e164=phone,
        code_hash=hash_token(real_code),
        expires_at=datetime.now(UTC) + timedelta(minutes=10),
        attempts=0,
    )
    db_session.add(otp)
    await db_session.commit()

    # Attempt with wrong code 4 times
    for i in range(1, 5):
        resp = await client.post(
            "/v1/auth/phone/verify",
            json={"phone_e164": phone, "code": "000000"},
        )
        assert resp.status_code == 401
        await db_session.refresh(otp)
        assert otp.attempts == i

    # 5th attempt with wrong code
    resp5 = await client.post(
        "/v1/auth/phone/verify",
        json={"phone_e164": phone, "code": "000000"},
    )
    assert resp5.status_code == 401
    await db_session.refresh(otp)
    assert otp.attempts == 5

    # 6th attempt: max attempts exceeded
    resp6 = await client.post(
        "/v1/auth/phone/verify",
        json={"phone_e164": phone, "code": real_code},
    )
    assert resp6.status_code == 400
    assert resp6.json()["error"]["code"] == "OTP_MAX_ATTEMPTS_EXCEEDED"


@pytest.mark.asyncio
async def test_phone_otp_expired_code(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Expired OTP code is rejected."""
    RateLimiter.clear()
    phone = "+237699000004"
    code = "112233"

    # Insert already expired OTP
    otp = OtpCode(
        phone_e164=phone,
        code_hash=hash_token(code),
        expires_at=datetime.now(UTC) - timedelta(minutes=1),
    )
    db_session.add(otp)
    await db_session.commit()

    resp = await client.post(
        "/v1/auth/phone/verify",
        json={"phone_e164": phone, "code": code},
    )
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHORIZED"
