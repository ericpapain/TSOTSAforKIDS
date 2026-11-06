"""Dedicated background worker running the per-minute notification scheduler loop."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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

    async def run_tick(self, now_utc: datetime | None = None) -> dict[str, int]:
        """Run a single execution tick of the scheduler."""
        now = now_utc or datetime.now(UTC)
        gen_count = await self.generate_lookahead(now)
        sent_count = await self.dispatch_due_notifications(now)
        followup_count = await self.check_and_trigger_followups(now)
        return {"generated": gen_count, "dispatched": sent_count, "followups": followup_count}

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

            links = (
                (
                    await self.session.execute(
                        select(PersonLink).where(PersonLink.person_id == person.id)
                    )
                )
                .scalars()
                .all()
            )
            target_user_ids = {link.user_id for link in links}

            # Also find caregiver if linked
            cares = (
                (
                    await self.session.execute(
                        select(PersonCare).where(
                            PersonCare.person_id == person.id, PersonCare.ended_at.is_(None)
                        )
                    )
                )
                .scalars()
                .all()
            )
            caregiver_ids = {c.primary_caregiver_id for c in cares if c.primary_caregiver_id}
            if sched.created_by:
                caregiver_ids.add(sched.created_by)

            occurrences = generate_schedule_slot_occurrences(sched, now, window_hours=window_hours)
            for slot, slot_utc, target_date in occurrences:
                # 1. Reminders for family guardians
                for guardian_id in target_user_ids:
                    d_key = compute_dedupe_key(slot.id, str(target_date), guardian_id, "reminder")
                    title = f"Rappel de prise pour {person.first_name}"
                    p_name = sched.product_name or "traitement"
                    body = (
                        f"Il est l'heure de donner la prise de {p_name} "
                        f"({sched.quantity} {sched.unit}) à {person.first_name}."
                    )
                    payload = {"slot_id": slot.id, "local_time": slot.local_time}

                    queued = await self.notif_repo.queue_notification(
                        user_id=guardian_id,
                        person_id=person.id,
                        schedule_id=sched.id,
                        type_str="reminder",
                        channel="push",
                        title=title,
                        body=body,
                        scheduled_for=slot_utc,
                        dedupe_key=d_key,
                        payload=payload,
                    )
                    if queued:
                        generated += 1

                # 2. Reminders for caregivers (if enabled in caregiver preferences)
                for cg_id in caregiver_ids:
                    enabled, _, _ = await self.notif_repo.get_preference_status(
                        cg_id, person.id, "reminder", "push"
                    )
                    if not enabled:
                        continue
                    cg_key = compute_dedupe_key(slot.id, str(target_date), cg_id, "reminder")
                    queued_cg = await self.notif_repo.queue_notification(
                        user_id=cg_id,
                        person_id=person.id,
                        schedule_id=sched.id,
                        type_str="reminder",
                        channel="push",
                        title=f"Rappel suivi : {person.first_name}",
                        body=f"Prise prévue à {slot.local_time} pour {person.first_name}.",
                        scheduled_for=slot_utc,
                        dedupe_key=cg_key,
                        payload={"slot_id": slot.id, "local_time": slot.local_time},
                    )
                    if queued_cg:
                        generated += 1

        return generated

    async def dispatch_due_notifications(self, now: datetime) -> int:
        """Step 3b: Send due notifications respecting preferences and quiet hours."""
        due_notifs = await self.notif_repo.get_queued_notifications(scheduled_before=now, limit=100)
        if not due_notifs:
            return 0

        # Group by channel
        by_channel: dict[str, list[Notification]] = {}
        dispatched_count = 0

        for notif in due_notifs:
            enabled, q_start, q_end = await self.notif_repo.get_preference_status(
                notif.user_id, notif.person_id, notif.type, notif.channel
            )
            if not enabled:
                await self.notif_repo.mark_cancelled(notif.id)
                continue

            local_hm = convert_utc_to_local_hm(now, "Africa/Douala")
            if is_in_quiet_hours(local_hm, q_start, q_end):
                # Notification deferred until quiet hours end or cancelled
                continue

            by_channel.setdefault(notif.channel, []).append(notif)

        for channel_name, batch in by_channel.items():
            channel_impl = self.channels.get(channel_name)
            if not channel_impl:
                continue

            # Load device tokens for users
            user_tokens: dict[str, list[str]] = {}
            for n in batch:
                if n.user_id not in user_tokens:
                    user_tokens[n.user_id] = await self.notif_repo.list_active_tokens_for_user(
                        n.user_id
                    )

            send_results = await channel_impl.send_batch(batch, user_tokens)
            for res in send_results:
                if res.success:
                    status_val = "delivered" if channel_name == "in_app" else "sent"
                    await self.notif_repo.mark_sent(
                        res.notification_id, ticket_id=res.ticket_id, status=status_val
                    )
                    dispatched_count += 1
                else:
                    await self.notif_repo.mark_failed(
                        res.notification_id, error_msg=res.error_message or "Erreur"
                    )
                    if res.invalid_tokens:
                        await self.notif_repo.revoke_tokens_by_push_tokens(res.invalid_tokens)

        return dispatched_count

    async def check_and_trigger_followups(
        self, now: datetime, followup_delay_minutes: int = 30
    ) -> int:
        """Step 3c: Trigger relance (followup) and caregiver alert if intake unconfirmed."""
        cutoff = now - timedelta(minutes=followup_delay_minutes)
        # Find sent reminders scheduled before cutoff without confirmed intake
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

            # Check if any intake was recorded for person around scheduled_for
            intake_stmt = select(Intake).where(
                Intake.person_id == r.person_id,
                Intake.taken_at >= r.scheduled_for - timedelta(minutes=15),
                Intake.taken_at <= r.scheduled_for + timedelta(minutes=followup_delay_minutes + 15),
            )
            intake = (await self.session.execute(intake_stmt)).scalar_one_or_none()
            if intake:
                continue  # Intake was recorded

            # 1. Send relance to legal guardian
            followup_key = f"followup:{r.id}"
            title = "Relance : prise de traitement"
            body = "La prise prévue n'a pas encore été confirmée."
            q1 = await self.notif_repo.queue_notification(
                user_id=r.user_id,
                person_id=r.person_id,
                schedule_id=r.schedule_id,
                type_str="reminder_followup",
                channel=r.channel,
                title=title,
                body=body,
                scheduled_for=now,
                dedupe_key=followup_key,
                payload=r.payload,
            )
            if q1:
                created_count += 1

            # 2. Notify caregiver if configured
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
                cg_key = f"unconfirmed:{care.primary_caregiver_id}:{r.id}"
                q2 = await self.notif_repo.queue_notification(
                    user_id=care.primary_caregiver_id,
                    person_id=r.person_id,
                    schedule_id=r.schedule_id,
                    type_str="intake_unconfirmed",
                    channel="push",
                    title="Alerte : prise non confirmée",
                    body="Un enfant suivi n'a pas pris son traitement dans les 30 minutes prévues.",
                    scheduled_for=now,
                    dedupe_key=cg_key,
                    payload=r.payload,
                )
                if q2:
                    created_count += 1

        return created_count
