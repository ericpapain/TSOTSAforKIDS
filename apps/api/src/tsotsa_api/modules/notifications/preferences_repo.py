"""Repository for notification preferences."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.monitoring.models import NotificationPreference
from tsotsa_api.shared.types import generate_uuid7


class NotificationPreferencesRepository:
    """Manages notification channels and quiet hour preferences per user and child."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_preference_status(
        self, user_id: str, person_id: str | None, notification_type: str, channel: str
    ) -> tuple[bool, str | None, str | None]:
        """Return (is_enabled, quiet_start, quiet_end).

        Checks person-specific preference first, falling back to global preference.
        """
        if person_id:
            stmt = select(NotificationPreference).where(
                NotificationPreference.user_id == user_id,
                NotificationPreference.person_id == person_id,
                NotificationPreference.notification_type == notification_type,
                NotificationPreference.channel == channel,
            )
            pref = (await self.session.execute(stmt)).scalar_one_or_none()
            if pref:
                return (
                    pref.enabled,
                    getattr(pref, "quiet_start", None),
                    getattr(pref, "quiet_end", None),
                )

        stmt_global = select(NotificationPreference).where(
            NotificationPreference.user_id == user_id,
            NotificationPreference.person_id.is_(None),
            NotificationPreference.notification_type == notification_type,
            NotificationPreference.channel == channel,
        )
        pref_g = (await self.session.execute(stmt_global)).scalar_one_or_none()
        if pref_g:
            return (
                pref_g.enabled,
                getattr(pref_g, "quiet_start", None),
                getattr(pref_g, "quiet_end", None),
            )

        return (True, None, None)

    async def set_preference(
        self,
        user_id: str,
        person_id: str | None,
        notification_type: str,
        channel: str,
        enabled: bool,
        quiet_start: str | None = None,
        quiet_end: str | None = None,
    ) -> NotificationPreference:
        now = datetime.now(UTC)
        stmt = select(NotificationPreference).where(
            NotificationPreference.user_id == user_id,
            (
                NotificationPreference.person_id == person_id
                if person_id
                else NotificationPreference.person_id.is_(None)
            ),
            NotificationPreference.notification_type == notification_type,
            NotificationPreference.channel == channel,
        )
        pref = (await self.session.execute(stmt)).scalar_one_or_none()
        if pref:
            pref.enabled = enabled
            if hasattr(pref, "quiet_start"):
                pref.quiet_start = quiet_start
            if hasattr(pref, "quiet_end"):
                pref.quiet_end = quiet_end
            pref.updated_at = now
            await self.session.flush()
            return pref

        new_pref = NotificationPreference(
            id=generate_uuid7(),
            user_id=user_id,
            person_id=person_id,
            notification_type=notification_type,
            channel=channel,
            enabled=enabled,
            created_at=now,
            updated_at=now,
        )
        if hasattr(new_pref, "quiet_start"):
            new_pref.quiet_start = quiet_start
        if hasattr(new_pref, "quiet_end"):
            new_pref.quiet_end = quiet_end
        self.session.add(new_pref)
        await self.session.flush()
        return new_pref

    async def list_preferences(self, user_id: str) -> Sequence[NotificationPreference]:
        stmt = (
            select(NotificationPreference)
            .where(NotificationPreference.user_id == user_id)
            .order_by(NotificationPreference.created_at.desc())
        )
        return (await self.session.execute(stmt)).scalars().all()
