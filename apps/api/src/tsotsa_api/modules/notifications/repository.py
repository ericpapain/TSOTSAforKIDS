"""SQLAlchemy repository for Domain J: Notifications and Templates."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.monitoring.models import NotificationPreference
from tsotsa_api.modules.notifications.device_tokens_repo import DeviceTokensRepository
from tsotsa_api.modules.notifications.models import DeviceToken, Notification, NotificationTemplate
from tsotsa_api.modules.notifications.preferences_repo import NotificationPreferencesRepository
from tsotsa_api.shared.types import generate_uuid7


class NotificationsRepository:
    """Repository handling notification queues, transmissions, and template CRUD."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.tokens = DeviceTokensRepository(session)
        self.preferences = NotificationPreferencesRepository(session)

    # Delegated convenience methods
    async def upsert_device_token(self, user_id: str, platform: str, token: str) -> DeviceToken:
        return await self.tokens.upsert_device_token(user_id, platform, token)

    async def list_active_tokens_for_user(self, user_id: str) -> list[str]:
        return await self.tokens.list_active_tokens_for_user(user_id)

    async def revoke_tokens_by_push_tokens(self, tokens: list[str]) -> None:
        await self.tokens.revoke_tokens_by_push_tokens(tokens)

    async def get_preference_status(
        self, user_id: str, person_id: str | None, notification_type: str, channel: str
    ) -> tuple[bool, str | None, str | None]:
        return await self.preferences.get_preference_status(
            user_id, person_id, notification_type, channel
        )

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
        return await self.preferences.set_preference(
            user_id, person_id, notification_type, channel, enabled, quiet_start, quiet_end
        )

    async def list_preferences(self, user_id: str) -> Sequence[NotificationPreference]:
        return await self.preferences.list_preferences(user_id)

    # --- Templates ---
    async def get_template(
        self, type_str: str, language: str = "fr"
    ) -> NotificationTemplate | None:
        stmt = select(NotificationTemplate).where(
            NotificationTemplate.type == type_str, NotificationTemplate.language == language
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_templates(self) -> Sequence[NotificationTemplate]:
        return (await self.session.execute(select(NotificationTemplate))).scalars().all()

    async def update_template(
        self, template_id: str, title: str | None, body: str | None
    ) -> NotificationTemplate | None:
        tmpl = (
            await self.session.execute(
                select(NotificationTemplate).where(NotificationTemplate.id == template_id)
            )
        ).scalar_one_or_none()
        if not tmpl:
            return None
        if title is not None:
            tmpl.title = title
        if body is not None:
            tmpl.body = body
        tmpl.updated_at = datetime.now(UTC)
        await self.session.flush()
        return tmpl

    # --- Notifications Queue & Transmission ---
    async def queue_notification(
        self,
        user_id: str,
        person_id: str | None,
        schedule_id: str | None,
        type_str: str,
        channel: str,
        title: str,
        body: str,
        scheduled_for: datetime,
        dedupe_key: str,
        payload: dict[str, Any] | None = None,
    ) -> Notification | None:
        now = datetime.now(UTC)
        stmt = select(Notification).where(Notification.dedupe_key == dedupe_key)
        if (await self.session.execute(stmt)).scalar_one_or_none():
            return None

        notif = Notification(
            id=generate_uuid7(),
            user_id=user_id,
            person_id=person_id,
            schedule_id=schedule_id,
            type=type_str,
            channel=channel,
            title=title,
            body=body,
            payload=payload,
            scheduled_for=scheduled_for,
            status="queued",
            attempts=0,
            dedupe_key=dedupe_key,
            created_at=now,
        )
        try:
            self.session.add(notif)
            await self.session.flush()
            return notif
        except IntegrityError:
            return None

    async def get_notification_by_id(self, notification_id: str) -> Notification | None:
        stmt = select(Notification).where(Notification.id == notification_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_queued_notifications(
        self, scheduled_before: datetime, limit: int = 100
    ) -> Sequence[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.status == "queued", Notification.scheduled_for <= scheduled_before)
            .order_by(Notification.scheduled_for.asc())
            .limit(limit)
        )
        return (await self.session.execute(stmt)).scalars().all()

    async def mark_sent(
        self, notification_id: str, ticket_id: str | None = None, status: str = "sent"
    ) -> None:
        now = datetime.now(UTC)
        stmt = (
            update(Notification)
            .where(Notification.id == notification_id)
            .values(status=status, sent_at=now, provider_ticket_id=ticket_id)
        )
        await self.session.execute(stmt)
        await self.session.flush()

    async def mark_failed(
        self, notification_id: str, error_msg: str, max_attempts: int = 3
    ) -> None:
        stmt = select(Notification).where(Notification.id == notification_id)
        notif = (await self.session.execute(stmt)).scalar_one_or_none()
        if not notif:
            return
        notif.attempts += 1
        if notif.attempts >= max_attempts:
            notif.status = "failed"
            notif.provider_ticket_id = error_msg[:100]
        else:
            delay = 5 * (2 ** (notif.attempts - 1))
            notif.scheduled_for = datetime.now(UTC) + timedelta(minutes=delay)
        await self.session.flush()

    async def mark_cancelled(self, notification_id: str) -> None:
        stmt = (
            update(Notification)
            .where(Notification.id == notification_id)
            .values(status="cancelled")
        )
        await self.session.execute(stmt)
        await self.session.flush()

    async def cancel_pending_followup_for_person(self, person_id: str) -> int:
        stmt = (
            update(Notification)
            .where(
                Notification.person_id == person_id,
                Notification.type == "reminder_followup",
                Notification.status == "queued",
            )
            .values(status="cancelled")
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        return int(getattr(res, "rowcount", 0))

    async def cancel_upcoming_notifications_for_schedule(self, schedule_id: str) -> int:
        stmt = (
            update(Notification)
            .where(Notification.schedule_id == schedule_id, Notification.status == "queued")
            .values(status="cancelled")
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        return int(getattr(res, "rowcount", 0))

    # --- In-App Center & Admin Stats ---
    async def list_in_app_notifications(
        self, user_id: str, unread_only: bool = False, limit: int = 50
    ) -> Sequence[Notification]:
        stmt = select(Notification).where(
            Notification.user_id == user_id, Notification.channel == "in_app"
        )
        if unread_only:
            stmt = stmt.where(Notification.read_at.is_(None))
        stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
        return (await self.session.execute(stmt)).scalars().all()

    async def mark_in_app_read(self, notification_id: str, user_id: str) -> Notification | None:
        stmt = select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
        notif = (await self.session.execute(stmt)).scalar_one_or_none()
        if notif:
            notif.read_at = datetime.now(UTC)
            await self.session.flush()
        return notif

    async def snooze_notification(
        self, notification_id: str, minutes: int = 15
    ) -> Notification | None:
        stmt = select(Notification).where(Notification.id == notification_id)
        notif = (await self.session.execute(stmt)).scalar_one_or_none()
        if not notif:
            return None
        now = datetime.now(UTC)
        snoozed_notif = Notification(
            id=generate_uuid7(),
            user_id=notif.user_id,
            person_id=notif.person_id,
            schedule_id=notif.schedule_id,
            type=notif.type,
            channel=notif.channel,
            title=f"Rappel reporté : {notif.title}",
            body=notif.body,
            payload=notif.payload,
            scheduled_for=now + timedelta(minutes=minutes),
            status="queued",
            attempts=0,
            dedupe_key=f"snooze:{notif.id}:{int(now.timestamp())}",
            created_at=now,
        )
        self.session.add(snoozed_notif)
        await self.session.flush()
        return snoozed_notif

    async def get_stats(self) -> dict[str, int]:
        stmt = select(Notification.status, func.count(Notification.id)).group_by(
            Notification.status
        )
        rows = (await self.session.execute(stmt)).all()
        counts = {s: c for s, c in rows}
        return {
            "total_sent": counts.get("sent", 0),
            "total_delivered": counts.get("delivered", 0),
            "total_queued": counts.get("queued", 0),
            "total_failed": counts.get("failed", 0),
            "total_cancelled": counts.get("cancelled", 0),
        }

    async def list_logs(
        self, limit: int = 100, status_filter: str | None = None
    ) -> Sequence[Notification]:
        stmt = select(Notification)
        if status_filter:
            stmt = stmt.where(Notification.status == status_filter)
        stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
        return (await self.session.execute(stmt)).scalars().all()
