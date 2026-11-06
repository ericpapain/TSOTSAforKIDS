"""High-level service orchestrating notifications, preferences, device tokens, and alerts."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import NotFoundError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.notifications.repository import NotificationsRepository
from tsotsa_api.modules.notifications.schemas import (
    DeviceTokenCreate,
    DeviceTokenRead,
    InAppNotificationRead,
    NotificationLogItem,
    NotificationPreferenceRead,
    NotificationPreferenceSetRequest,
    NotificationStatsResponse,
    NotificationTemplateRead,
    NotificationTemplateUpdate,
)
from tsotsa_api.modules.persons.models import Person, PersonCare


class NotificationsService:
    """Service handling notification preferences, push tokens, in-app center, and hooks."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = NotificationsRepository(session)
        self.audit = AuditService(session)

    # --- Preferences ---
    async def list_preferences(self, user_id: str) -> list[NotificationPreferenceRead]:
        prefs = await self.repo.list_preferences(user_id)
        return [NotificationPreferenceRead.model_validate(p) for p in prefs]

    async def set_preference(
        self, user_id: str, payload: NotificationPreferenceSetRequest
    ) -> NotificationPreferenceRead:
        pref = await self.repo.set_preference(
            user_id=user_id,
            person_id=payload.person_id,
            notification_type=payload.notification_type,
            channel=payload.channel,
            enabled=payload.enabled,
            quiet_start=payload.quiet_start,
            quiet_end=payload.quiet_end,
        )

        # Requirement 3d: If user disables reminders, trigger alert to caregiver
        if payload.notification_type == "reminder" and not payload.enabled and payload.person_id:
            await self._trigger_reminders_disabled_alert(user_id, payload.person_id)

        await self.audit.log(
            action="update",
            entity="notification_preferences",
            entity_id=pref.id,
            actor_user_id=user_id,
            details={"type": payload.notification_type, "enabled": payload.enabled},
        )
        return NotificationPreferenceRead.model_validate(pref)

    async def _trigger_reminders_disabled_alert(self, user_id: str, person_id: str) -> None:
        # Find active caregiver care relationship
        cares = (
            (
                await self.session.execute(
                    select(PersonCare).where(
                        PersonCare.person_id == person_id, PersonCare.ended_at.is_(None)
                    )
                )
            )
            .scalars()
            .all()
        )
        person = (
            await self.session.execute(select(Person).where(Person.id == person_id))
        ).scalar_one_or_none()
        p_name = person.first_name if person else "L'enfant suivi"

        for care in cares:
            if not care.primary_caregiver_id:
                continue
            cg_id = care.primary_caregiver_id
            ts = int(datetime.now(UTC).timestamp())
            dedupe = f"reminders_cut:{cg_id}:{person_id}:{ts}"
            await self.repo.queue_notification(
                user_id=care.primary_caregiver_id,
                person_id=person_id,
                schedule_id=None,
                type_str="clinical_alert",
                channel="push",
                title="Alerte : rappels désactivés",
                body=f"Le représentant légal de {p_name} a désactivé les rappels de prises.",
                scheduled_for=datetime.now(UTC),
                dedupe_key=dedupe,
                payload={"person_id": person_id, "alert_rule": "reminders_disabled"},
            )

    # --- Device Tokens ---
    async def register_device_token(
        self, user_id: str, payload: DeviceTokenCreate
    ) -> DeviceTokenRead:
        token_obj = await self.repo.upsert_device_token(
            user_id=user_id, platform=payload.platform, token=payload.expo_push_token
        )
        return DeviceTokenRead.model_validate(token_obj)

    async def revoke_device_token(self, user_id: str, token: str) -> bool:
        return await self.repo.tokens.revoke_user_token(user_id, token)

    # --- In-App Center ---
    async def list_in_app(
        self, user_id: str, unread_only: bool = False, limit: int = 50
    ) -> list[InAppNotificationRead]:
        items = await self.repo.list_in_app_notifications(
            user_id, unread_only=unread_only, limit=limit
        )
        return [InAppNotificationRead.model_validate(i) for i in items]

    async def mark_read(self, notification_id: str, user_id: str) -> InAppNotificationRead:
        notif = await self.repo.mark_in_app_read(notification_id, user_id)
        if not notif:
            raise NotFoundError("Notification introuvable.")
        return InAppNotificationRead.model_validate(notif)

    async def snooze(
        self, notification_id: str, user_id: str, minutes: int = 15
    ) -> InAppNotificationRead:
        snoozed = await self.repo.snooze_notification(notification_id, minutes=minutes)
        if not snoozed:
            raise NotFoundError("Notification introuvable.")
        return InAppNotificationRead.model_validate(snoozed)

    # --- Event Hook on Intake Confirmed ---
    async def on_intake_recorded(
        self, person_id: str, product_name: str, quantity: Any, unit: str
    ) -> None:
        """Called when an intake is confirmed: cancels relances and notifies caregiver."""
        # 1. Cancel pending relance
        await self.repo.cancel_pending_followup_for_person(person_id)

        # 2. Check if caregiver wants to be notified on confirmed intake
        cares = (
            (
                await self.session.execute(
                    select(PersonCare).where(
                        PersonCare.person_id == person_id, PersonCare.ended_at.is_(None)
                    )
                )
            )
            .scalars()
            .all()
        )
        person = (
            await self.session.execute(select(Person).where(Person.id == person_id))
        ).scalar_one_or_none()
        p_name = person.first_name if person else "L'enfant"

        for care in cares:
            if not care.primary_caregiver_id:
                continue
            enabled, _, _ = await self.repo.get_preference_status(
                care.primary_caregiver_id, person_id, "intake_confirmed", "push"
            )
            if not enabled:
                continue

            now = datetime.now(UTC)
            dedupe = f"confirmed:{care.primary_caregiver_id}:{person_id}:{int(now.timestamp())}"
            await self.repo.queue_notification(
                user_id=care.primary_caregiver_id,
                person_id=person_id,
                schedule_id=None,
                type_str="intake_confirmed",
                channel="push",
                title="Prise confirmée",
                body=f"Prise de {product_name} ({quantity} {unit}) confirmée pour {p_name}.",
                scheduled_for=now,
                dedupe_key=dedupe,
                payload={"person_id": person_id},
            )

    # --- Administration ---
    async def get_stats(self) -> NotificationStatsResponse:
        counts = await self.repo.get_stats()
        return NotificationStatsResponse(**counts)

    async def list_logs(
        self, limit: int = 100, status_filter: str | None = None
    ) -> list[NotificationLogItem]:
        items = await self.repo.list_logs(limit=limit, status_filter=status_filter)
        return [NotificationLogItem.model_validate(i) for i in items]

    async def list_templates(self) -> list[NotificationTemplateRead]:
        items = await self.repo.list_templates()
        return [NotificationTemplateRead.model_validate(t) for t in items]

    async def update_template(
        self, template_id: str, payload: NotificationTemplateUpdate, actor_user_id: str
    ) -> NotificationTemplateRead:
        tmpl = await self.repo.update_template(template_id, payload.title, payload.body)
        if not tmpl:
            raise NotFoundError("Gabarit de notification introuvable.")
        await self.audit.log(
            action="update",
            entity="notification_templates",
            entity_id=tmpl.id,
            actor_user_id=actor_user_id,
            details={"type": tmpl.type},
        )
        return NotificationTemplateRead.model_validate(tmpl)
