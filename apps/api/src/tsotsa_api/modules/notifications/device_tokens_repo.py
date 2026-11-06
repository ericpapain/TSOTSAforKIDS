"""Repository for device push tokens."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.notifications.models import DeviceToken
from tsotsa_api.shared.types import generate_uuid7


class DeviceTokensRepository:
    """Manages physical device push notification tokens."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_device_token(self, user_id: str, platform: str, token: str) -> DeviceToken:
        now = datetime.now(UTC)
        stmt = select(DeviceToken).where(DeviceToken.expo_push_token == token)
        existing = (await self.session.execute(stmt)).scalar_one_or_none()
        if existing:
            existing.user_id = user_id
            existing.platform = platform
            existing.last_seen_at = now
            existing.revoked_at = None
            await self.session.flush()
            return existing

        new_token = DeviceToken(
            id=generate_uuid7(),
            user_id=user_id,
            platform=platform,
            expo_push_token=token,
            last_seen_at=now,
        )
        self.session.add(new_token)
        await self.session.flush()
        return new_token

    async def list_active_tokens_for_user(self, user_id: str) -> list[str]:
        stmt = select(DeviceToken.expo_push_token).where(
            DeviceToken.user_id == user_id, DeviceToken.revoked_at.is_(None)
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def revoke_tokens_by_push_tokens(self, tokens: list[str]) -> None:
        if not tokens:
            return
        now = datetime.now(UTC)
        stmt = (
            update(DeviceToken)
            .where(DeviceToken.expo_push_token.in_(tokens))
            .values(revoked_at=now)
        )
        await self.session.execute(stmt)
        await self.session.flush()

    async def revoke_user_token(self, user_id: str, token: str) -> bool:
        now = datetime.now(UTC)
        stmt = (
            update(DeviceToken)
            .where(DeviceToken.user_id == user_id, DeviceToken.expo_push_token == token)
            .values(revoked_at=now)
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        return bool(getattr(res, "rowcount", 0) > 0)
