"""Dedicated background worker running the per-minute notification scheduler loop."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.i18n import render_template
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.intakes.models import Intake
from tsotsa_api.modules.notifications.channels.base import NotificationChannel
from tsotsa_api.modules.notifications.channels.email import EmailChannel
from tsotsa_api.modules.notifications.channels.expo import ExpoPushChannel
from tsotsa_api.modules.notifications.channels.in_app import InAppChannel
from tsotsa_api.modules.notifications.channels.sms import SmsChannel
from tsotsa_api.modules.notifications.models import Notification
from tsotsa_api.modules.notifications.planner import (
    compute_dedupe_key,
    convert_utc_to_local_hm,
    generate_schedule_slot_occurrences,
    is_in_quiet_hours,
)
from tsotsa_api.modules.notifications.repository import NotificationsRepository
from tsotsa_api.modules.persons.models import Person, PersonCare, PersonLink
from tsotsa_api.modules.schedules.repository import SchedulesRepository

logger = logging.getLogger(__name__)


class NotificationWorker:
    """Executes the periodic notification schedule ticks, separate from web requests."""

    def __init__(
        self,
        session: AsyncSession,
        channels: dict[str, NotificationChannel] | None = None,
    ) -> None:
        self.session = session
        self.notif_repo = NotificationsRepository(session)
        self.schedules_repo = SchedulesRepository(session)
        self.channels = channels or {
            "push": ExpoPushChannel(),
            "sms": SmsChannel(),
            "email": EmailChannel(),
            "in_app": InAppChannel(),
        }

    async def _get_recipient_locale(self, user_id: str) -> str:
        loc = (
            await self.session.execute(select(User.preferred_locale).where(User.id == user_id))
        ).scalar_one_or_none()
        return loc if loc in ("fr", "en") else "fr"

    async def run_tick(self, now_utc: datetime | None = None) -> dict[str, int]:
        """Run a single execution tick of the scheduler."""
        now = now_utc or datetime.now(UTC)
        gen_count = await self.generate_lookahead(now)
        sent_count = await self.dispatch_due_notifications(now)
        followup_count = await self.check_and_trigger_followups(now)
        return {"generated": gen_count, "dispatched": sent_count, "followups": followup_count}

    async def _get_person_recipients(
        self, person_id: str, created_by: str | None
    ) -> tuple[set[str], set[str]]:
        links = (
            (
                await self.session.execute(
                    select(PersonLink).where(PersonLink.person_id == person_id)
                )
            )
            .scalars()
            .all()
        )
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
        guardians = {link.user_id for link in links}
        caregivers = {c.primary_caregiver_id for c in cares if c.primary_caregiver_id}
        if created_by:
            caregivers.add(created_by)
        return guardians, caregivers

    async def _queue_guardian_slot(
        self,
        guardian_id: str,
        person: Person,
        sched: Any,
        slot: Any,
        slot_utc: datetime,
        target_date: Any,
    ) -> int:
        g_locale = await self._get_recipient_locale(guardian_id)
        d_key = compute_dedupe_key(slot.id, str(target_date), guardian_id, "reminder")
        p_name = sched.product_name or ("treatment" if g_locale == "en" else "traitement")
        tpl = render_template(
            "notifications",
            "reminder",
            locale=g_locale,
            first_name=person.first_name,
            product_name=p_name,
            quantity=sched.quantity,
            unit=sched.unit,
        )
        payload = {
            "slot_id": slot.id,
            "local_time": slot.local_time,
            "locale": g_locale,
            "actions": tpl.get("actions", []),
        }
        queued = await self.notif_repo.queue_notification(
            user_id=guardian_id,
            person_id=person.id,
            schedule_id=sched.id,
            type_str="reminder",
            channel="push",
            title=tpl["title"],
            body=tpl["body"],
            scheduled_for=slot_utc,
            dedupe_key=d_key,
            payload=payload,
        )
        return 1 if queued else 0

    async def _queue_caregiver_slot(
        self,
        cg_id: str,
        person: Person,
        sched: Any,
        slot: Any,
        slot_utc: datetime,
        target_date: Any,
    ) -> int:
        enabled, _, _ = await self.notif_repo.get_preference_status(
            cg_id, person.id, "reminder", "push"
        )
        if not enabled:
            return 0
        cg_locale = await self._get_recipient_locale(cg_id)
        cg_tpl = render_template(
            "notifications",
            "caregiver_reminder",
            locale=cg_locale,
            first_name=person.first_name,
            local_time=slot.local_time,
        )
        cg_key = compute_dedupe_key(slot.id, str(target_date), cg_id, "reminder")
        queued_cg = await self.notif_repo.queue_notification(
            user_id=cg_id,
            person_id=person.id,
            schedule_id=sched.id,
            type_str="reminder",
            channel="push",
            title=cg_tpl["title"],
            body=cg_tpl["body"],
            scheduled_for=slot_utc,
            dedupe_key=cg_key,
            payload={"slot_id": slot.id, "local_time": slot.local_time, "locale": cg_locale},
        )
        return 1 if queued_cg else 0

    async def generate_lookahead(self, now: datetime, window_hours: int = 24) -> int:
        """Step 3a: Generate reminders for upcoming 24 hours with unique dedupe_key."""
        schedules = await self.schedules_repo.list_active_schedules_all()
        generated = 0
        for sched in schedules:
            person = (
                await self.session.execute(select(Person).where(Person.id == sched.person_id))
            ).scalar_one_or_none()
            if not person:
                continue
            guardians, caregivers = await self._get_person_recipients(person.id, sched.created_by)
            occurrences = generate_schedule_slot_occurrences(sched, now, window_hours=window_hours)
            for slot, slot_utc, target_date in occurrences:
                for guardian_id in guardians:
                    generated += await self._queue_guardian_slot(
                        guardian_id, person, sched, slot, slot_utc, target_date
                    )
                for cg_id in caregivers:
                    generated += await self._queue_caregiver_slot(
                        cg_id, person, sched, slot, slot_utc, target_date
                    )
        return generated

    async def _send_channel_batch(self, channel_name: str, batch: list[Notification]) -> int:
        channel_impl = self.channels.get(channel_name)
        if not channel_impl:
            return 0
        user_tokens: dict[str, list[str]] = {}
        for n in batch:
            if n.user_id not in user_tokens:
                user_tokens[n.user_id] = await self.notif_repo.list_active_tokens_for_user(
                    n.user_id
                )
        dispatched = 0
        for res in await channel_impl.send_batch(batch, user_tokens):
            if res.success:
                status_val = "delivered" if channel_name == "in_app" else "sent"
                await self.notif_repo.mark_sent(
                    res.notification_id, ticket_id=res.ticket_id, status=status_val
                )
                dispatched += 1
            else:
                await self.notif_repo.mark_failed(
                    res.notification_id, error_msg=res.error_message or "Erreur"
                )
                if res.invalid_tokens:
                    await self.notif_repo.revoke_tokens_by_push_tokens(res.invalid_tokens)
        return dispatched

    async def dispatch_due_notifications(self, now: datetime) -> int:
        """Step 3b: Send due notifications respecting preferences and quiet hours."""
        due_notifs = await self.notif_repo.get_queued_notifications(scheduled_before=now, limit=100)
        if not due_notifs:
            return 0
        by_channel: dict[str, list[Notification]] = {}
        local_hm = convert_utc_to_local_hm(now, "Africa/Douala")
        for notif in due_notifs:
            enabled, q_start, q_end = await self.notif_repo.get_preference_status(
                notif.user_id, notif.person_id, notif.type, notif.channel
            )
            if not enabled:
                await self.notif_repo.mark_cancelled(notif.id)
                continue
            if not is_in_quiet_hours(local_hm, q_start, q_end):
                by_channel.setdefault(notif.channel, []).append(notif)
        dispatched_count = 0
        for channel_name, batch in by_channel.items():
            dispatched_count += await self._send_channel_batch(channel_name, batch)
        return dispatched_count

    async def _queue_followup_for_reminder(self, r: Notification, now: datetime) -> int:
        if not r.person_id:
            return 0
        g_locale = await self._get_recipient_locale(r.user_id)
        f_tpl = render_template("notifications", "reminder_followup", locale=g_locale)
        f_payload = {**(r.payload or {}), "locale": g_locale, "actions": f_tpl.get("actions", [])}
        q1 = await self.notif_repo.queue_notification(
            user_id=r.user_id,
            person_id=r.person_id,
            schedule_id=r.schedule_id,
            type_str="reminder_followup",
            channel=r.channel,
            title=f_tpl["title"],
            body=f_tpl["body"],
            scheduled_for=now,
            dedupe_key=f"followup:{r.id}",
            payload=f_payload,
        )
        created = 1 if q1 else 0
        cares = (
            (
                await self.session.execute(
                    select(PersonCare).where(
                        PersonCare.person_id == r.person_id, PersonCare.ended_at.is_(None)
                    )
                )
            )
            .scalars()
            .all()
        )
        for care in cares:
            if not care.primary_caregiver_id:
                continue
            cg_enabled, _, _ = await self.notif_repo.get_preference_status(
                care.primary_caregiver_id, r.person_id, "intake_unconfirmed", "push"
            )
            if not cg_enabled:
                continue
            cg_locale = await self._get_recipient_locale(care.primary_caregiver_id)
            cg_tpl = render_template("notifications", "intake_unconfirmed", locale=cg_locale)
            q2 = await self.notif_repo.queue_notification(
                user_id=care.primary_caregiver_id,
                person_id=r.person_id,
                schedule_id=r.schedule_id,
                type_str="intake_unconfirmed",
                channel="push",
                title=cg_tpl["title"],
                body=cg_tpl["body"],
                scheduled_for=now,
                dedupe_key=f"unconfirmed:{care.primary_caregiver_id}:{r.id}",
                payload=r.payload,
            )
            if q2:
                created += 1
        return created

    async def check_and_trigger_followups(
        self, now: datetime, followup_delay_minutes: int = 30
    ) -> int:
        """Step 3c: Trigger relance (followup) and caregiver alert if intake unconfirmed."""
        cutoff = now - timedelta(minutes=followup_delay_minutes)
        stmt = select(Notification).where(
            Notification.type == "reminder",
            Notification.status.in_(["sent", "delivered"]),
            Notification.scheduled_for <= cutoff,
            Notification.scheduled_for >= cutoff - timedelta(hours=2),
        )
        sent_reminders = (await self.session.execute(stmt)).scalars().all()
        created_count = 0
        for r in sent_reminders:
            if not r.person_id:
                continue
            intake_stmt = select(Intake).where(
                Intake.person_id == r.person_id,
                Intake.taken_at >= r.scheduled_for - timedelta(minutes=15),
                Intake.taken_at <= r.scheduled_for + timedelta(minutes=followup_delay_minutes + 15),
            )
            if (await self.session.execute(intake_stmt)).scalar_one_or_none():
                continue
            created_count += await self._queue_followup_for_reminder(r, now)
        return created_count
