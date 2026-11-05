"""Data access layer for OTP, email verification, and refresh tokens."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.identity.models import EmailToken, OtpCode, RefreshToken


class TokenRepository:
    """Encapsulates database operations for authentication tokens and codes."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_otp(self, phone_e164: str, code_hash: str, expires_at: datetime) -> OtpCode:
        """Save a new phone OTP record."""
        otp = OtpCode(phone_e164=phone_e164, code_hash=code_hash, expires_at=expires_at)
        self.session.add(otp)
        await self.session.flush()
        return otp

    async def get_latest_active_otp(self, phone_e164: str) -> OtpCode | None:
        """Fetch latest active non-consumed OTP code for a phone number."""
        now = datetime.now(UTC)
        stmt = (
            select(OtpCode)
            .where(
                OtpCode.phone_e164 == phone_e164,
                OtpCode.consumed_at.is_(None),
                OtpCode.expires_at > now,
            )
            .order_by(OtpCode.created_at.desc())
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def increment_otp_attempts(self, otp_id: str) -> int:
        """Increment attempt counter for an OTP code and return new count."""
        otp = await self.session.get(OtpCode, otp_id)
        if otp:
            otp.attempts += 1
            await self.session.flush()
            return otp.attempts
        return 0

    async def mark_otp_consumed(self, otp_id: str) -> None:
        """Mark an OTP code as consumed."""
        stmt = update(OtpCode).where(OtpCode.id == otp_id).values(consumed_at=datetime.now(UTC))
        await self.session.execute(stmt)

    async def create_email_token(
        self, user_identity_id: str, purpose: str, token_hash: str, expires_at: datetime
    ) -> EmailToken:
        """Store an email verification or password reset token."""
        token = EmailToken(
            user_identity_id=user_identity_id,
            purpose=purpose,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.session.add(token)
        await self.session.flush()
        return token

    async def get_valid_email_token(self, token_hash: str, purpose: str) -> EmailToken | None:
        """Retrieve an unconsumed unexpired email token."""
        now = datetime.now(UTC)
        stmt = (
            select(EmailToken)
            .options(selectinload(EmailToken.user_identity))
            .where(
                EmailToken.token_hash == token_hash,
                EmailToken.purpose == purpose,
                EmailToken.used_at.is_(None),
                EmailToken.expires_at > now,
            )
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def mark_email_token_used(self, token_id: str) -> None:
        """Mark an email token as used."""
        stmt = update(EmailToken).where(EmailToken.id == token_id).values(used_at=datetime.now(UTC))
        await self.session.execute(stmt)

    async def create_refresh_token(
        self,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
        device_label: str | None = None,
    ) -> RefreshToken:
        """Create a refresh token session record."""
        rt = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            device_label=device_label,
        )
        self.session.add(rt)
        await self.session.flush()
        return rt

    async def get_active_refresh_token(self, token_hash: str) -> RefreshToken | None:
        """Retrieve an active non-revoked non-expired refresh token."""
        now = datetime.now(UTC)
        stmt = (
            select(RefreshToken)
            .options(selectinload(RefreshToken.user))
            .where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now,
            )
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def revoke_refresh_token(self, token_id: str) -> None:
        """Revoke a specific refresh token."""
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.id == token_id)
            .values(revoked_at=datetime.now(UTC))
        )
        await self.session.execute(stmt)

    async def revoke_all_user_refresh_tokens(self, user_id: str) -> None:
        """Revoke all refresh tokens for a user (e.g. on password reset)."""
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )
        await self.session.execute(stmt)
