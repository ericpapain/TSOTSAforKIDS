"""Unit tests for IdentityService, TokenService, and OtpSender."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.config import Settings
from tsotsa_api.core.errors import AppException, NotFoundError, UnauthorizedError
from tsotsa_api.core.security import hash_token
from tsotsa_api.modules.identity.otp import (
    ConsoleOtpSender,
    SmsOtpSender,
    get_otp_sender,
)
from tsotsa_api.modules.identity.rate_limit import RateLimiter
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.identity.service import IdentityService


@pytest.fixture
def identity_service(db_session: AsyncSession) -> IdentityService:
    repo = IdentityRepository(db_session)
    settings = Settings(
        APP_ENV="test",
        BCRYPT_ROUNDS=4,
        GOOGLE_CLIENT_IDS="client-1,client-2",
        DATABASE_URL="sqlite+aiosqlite:///:memory:",
        DATABASE_MIGRATIONS_URL="sqlite+aiosqlite:///:memory:",
    )
    return IdentityService(repository=repo, settings=settings)


@pytest.mark.asyncio
async def test_otp_senders() -> None:
    """Test console and sms OTP senders."""
    console_sender = ConsoleOtpSender()
    await console_sender.send_otp("+237699000010", "123456")

    sms_sender = SmsOtpSender(api_key="test-api-key")
    await sms_sender.send_otp("+237699000010", "123456")

    settings_console = Settings(SMS_PROVIDER="console", APP_ENV="test")
    assert isinstance(get_otp_sender(settings_console), ConsoleOtpSender)

    settings_sms = Settings(SMS_PROVIDER="sms", SMS_API_KEY="key", APP_ENV="test")
    assert isinstance(get_otp_sender(settings_sms), SmsOtpSender)


@pytest.mark.asyncio
async def test_service_google_auth_flows(
    identity_service: IdentityService, db_session: AsyncSession
) -> None:
    """Test Google authentication with new user, existing user, and errors."""
    RateLimiter.clear()
    payload = {
        "sub": "google-user-99",
        "email": "guser@tsotsa-for-kids.com",
        "name": "Google User",
        "email_verified": True,
        "aud": "client-1",
    }

    # 1. New user registration via Google
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=payload):
        res1 = await identity_service.authenticate_google("dummy-token", ip_address="10.0.0.1")
        assert res1.user.display_name == "Google User"

    await db_session.commit()

    # 2. Existing user login via Google
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=payload):
        res2 = await identity_service.authenticate_google("dummy-token", ip_address="10.0.0.2")
        assert res2.user.id == res1.user.id

    # 3. Audience mismatch when multiple audiences are configured
    bad_aud_payload = dict(payload, aud="unknown-client")
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=bad_aud_payload):
        with pytest.raises(UnauthorizedError):
            await identity_service.authenticate_google("dummy-token", ip_address="10.0.0.3")


@pytest.mark.asyncio
async def test_service_phone_otp_flows(
    identity_service: IdentityService, db_session: AsyncSession
) -> None:
    """Test phone OTP request, verify, wrong attempts, and repeat login."""
    RateLimiter.clear()
    phone = "+237699000020"

    # Request OTP
    req_res = await identity_service.request_phone_otp(phone, ip_address="10.0.0.4")
    assert req_res.expires_in_seconds == 600

    # Retrieve created OTP
    otp = await identity_service.repository.get_latest_active_otp(phone)
    assert otp is not None
    real_code = "987654"
    otp.code_hash = hash_token(real_code)
    await db_session.commit()

    # Wrong code
    with pytest.raises(UnauthorizedError):
        await identity_service.verify_phone_otp(phone, "000000", ip_address="10.0.0.5")

    # Correct code creates user
    res1 = await identity_service.verify_phone_otp(
        phone, real_code, display_name="Phone User", ip_address="10.0.0.6"
    )
    assert res1.user.display_name == "Phone User"
    await db_session.commit()

    # Request and login again with existing phone
    RateLimiter.clear()
    await identity_service.request_phone_otp(phone, ip_address="10.0.0.7")
    otp2 = await identity_service.repository.get_latest_active_otp(phone)
    assert otp2 is not None
    otp2.code_hash = hash_token("654321")
    await db_session.commit()

    res2 = await identity_service.verify_phone_otp(phone, "654321", ip_address="10.0.0.8")
    assert res2.user.id == res1.user.id


@pytest.mark.asyncio
async def test_service_email_verification_and_reset_flows(
    identity_service: IdentityService, db_session: AsyncSession
) -> None:
    """Test email registration, verification token, forgot, and reset flows."""
    RateLimiter.clear()
    email = "service.test@tsotsa-for-kids.com"
    pwd = "ServicePassword123!"

    # 1. Register email
    user, raw_token = await identity_service.register_email(
        email, pwd, "Service User", ip_address="10.0.0.9"
    )
    assert user.display_name == "Service User"
    await db_session.commit()

    # 2. Duplicate registration raises 409
    with pytest.raises(AppException) as exc:
        await identity_service.register_email(email, pwd, "Service User", ip_address="10.0.0.10")
    assert exc.value.status_code == 409

    # 3. Verify email token
    await identity_service.verify_email_token(raw_token)
    await db_session.commit()

    # Invalid token raises 404
    with pytest.raises(NotFoundError):
        await identity_service.verify_email_token("invalid_token_123456")

    # 4. Login
    tokens = await identity_service.login_email(email, pwd, ip_address="10.0.0.11")
    assert tokens.user.id == user.id

    # Inactive user login
    user.status = "suspended"
    await db_session.commit()
    with pytest.raises(UnauthorizedError):
        await identity_service.login_email(email, pwd, ip_address="10.0.0.12")
    user.status = "active"
    await db_session.commit()

    # 5. Forgot password
    RateLimiter.clear()
    reset_token = await identity_service.request_password_reset(email, ip_address="10.0.0.13")
    assert reset_token is not None
    # Unknown email returns None
    assert (
        await identity_service.request_password_reset(
            "unknown@tsotsa-for-kids.com", ip_address="10.0.0.14"
        )
        is None
    )

    # 6. Reset password
    await identity_service.reset_password(reset_token, "NewPassword789!", ip_address="10.0.0.15")
    with pytest.raises(NotFoundError):
        await identity_service.reset_password(
            "invalid_token", "NewPassword789!", ip_address="10.0.0.16"
        )


@pytest.mark.asyncio
async def test_token_service_flows(
    identity_service: IdentityService, db_session: AsyncSession
) -> None:
    """Directly test token service rotation and revocation."""
    u = await identity_service.repository.create_user("Token User")
    await identity_service.repository.assign_role(u.id, "user")
    await db_session.commit()

    tokens = await identity_service.tokens.issue_tokens(u)
    assert tokens.access_token is not None

    # Rotate
    rotated = await identity_service.tokens.refresh_access_token(tokens.refresh_token)
    assert rotated.refresh_token != tokens.refresh_token

    # Reusing rotated token fails
    with pytest.raises(UnauthorizedError):
        await identity_service.tokens.refresh_access_token(tokens.refresh_token)

    # Inactive user refresh fails
    u.status = "suspended"
    await db_session.commit()
    with pytest.raises(UnauthorizedError):
        await identity_service.tokens.refresh_access_token(rotated.refresh_token)

    u.status = "active"
    await db_session.commit()
    await identity_service.tokens.revoke_refresh_token(rotated.refresh_token)
    with pytest.raises(UnauthorizedError):
        await identity_service.tokens.refresh_access_token(rotated.refresh_token)
