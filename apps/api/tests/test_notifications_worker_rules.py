"""Integration tests for Domain J: Notifications Worker Rules and Delivery Lifecycle."""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.notifications.channels.base import ChannelSendResult, NotificationChannel
from tsotsa_api.modules.notifications.models import Notification
from tsotsa_api.modules.notifications.repository import NotificationsRepository
from tsotsa_api.modules.notifications.service import NotificationsService
from tsotsa_api.modules.notifications.worker import NotificationWorker
from tsotsa_api.modules.organizations.schemas import CaregiverAttachmentRequest, OrganizationCreate
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.service import PersonsService
from tsotsa_api.modules.schedules.schemas import IntakeScheduleCreate, ScheduleTimeCreate
from tsotsa_api.modules.schedules.service import SchedulesService


class RecordingChannel(NotificationChannel):
    """Real test channel capturing sends without external network I/O."""

    def __init__(self, fail_first_n: int = 0, invalid_tokens: list[str] | None = None) -> None:
        self.sent_batches: list[list[Notification]] = []
        self.call_count = 0
        self.fail_first_n = fail_first_n
        self.invalid_tokens = invalid_tokens or []

    @property
    def name(self) -> str:
        return "push"

    async def send_batch(
        self,
        notifications: list[Notification],
        user_tokens: dict[str, list[str]],
    ) -> list[ChannelSendResult]:
        self.call_count += 1
        self.sent_batches.append(notifications)
        results: list[ChannelSendResult] = []
        for n in notifications:
            if self.call_count <= self.fail_first_n:
                results.append(
                    ChannelSendResult(
                        notification_id=n.id,
                        success=False,
                        error_message="Simulation transmission failure",
                        invalid_tokens=self.invalid_tokens,
                    )
                )
            else:
                results.append(
                    ChannelSendResult(
                        notification_id=n.id,
                        success=True,
                        ticket_id=f"tick-{uuid.uuid4()}",
                        invalid_tokens=self.invalid_tokens,
                    )
                )
        return results


async def _setup_family_and_caregiver(
    session: AsyncSession,
) -> tuple[User, User, str, str]:
    """Helper setting up Parent, Caregiver, Hospital Org, and Followed Child."""
    id_repo = IdentityRepository(session)
    parent = await id_repo.create_user(display_name="Jeanne")
    await id_repo.assign_role(parent.id, "user")

    caregiver = await id_repo.create_user(display_name="Dr Mbarga")
    await id_repo.assign_role(caregiver.id, "caregiver")
    await session.commit()

    orgs_srv = OrganizationsService(session)
    org = await orgs_srv.create_organization(
        OrganizationCreate(name="Hôpital Central", type="hopital"),
        admin_user_id=caregiver.id,
    )
    await orgs_srv.attach_caregiver(
        org_id=org.id,
        payload=CaregiverAttachmentRequest(
            user_id=caregiver.id, licence_number="CAM-999", approve=True
        ),
        admin_user_id=caregiver.id,
    )

    persons_srv = PersonsService(session)
    child = await persons_srv.care_service.register_person_in_care(
        org_id=org.id,
        pseudonym=f"#A-{uuid.uuid4().hex[:3]}",
        first_name="Paul",
        birth_date=date(2025, 3, 1),
        sex="M",
        actor_user_id=caregiver.id,
    )
    await persons_srv.repo.create_person_link(
        person_id=child.id, user_id=parent.id, relation="child", is_primary=True
    )
    await session.commit()
    return parent, caregiver, org.id, child.id


@pytest.mark.asyncio
async def test_parallel_worker_deduplication(db_session: AsyncSession) -> None:
    parent, cg, _, child_id = await _setup_family_and_caregiver(db_session)
    sched_srv = SchedulesService(db_session)
    await sched_srv.create_schedule(
        IntakeScheduleCreate(
            person_id=child_id,
            product_name="PlumpyNut",
            quantity="1.0",
            unit="sachet",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
            timezone="Africa/Douala",
            times=[ScheduleTimeCreate(local_time="08:00", enabled=True)],
        ),
        actor_user_id=cg.id,
        roles=["caregiver"],
    )
    await db_session.commit()

    # Two distinct workers running on the exact same tick
    chan1 = RecordingChannel()
    chan2 = RecordingChannel()
    w1 = NotificationWorker(db_session, {"push": chan1})
    w2 = NotificationWorker(db_session, {"push": chan2})

    now = datetime(2026, 11, 6, 6, 0, tzinfo=UTC)
    res1 = await w1.generate_lookahead(now)
    res2 = await w2.generate_lookahead(now)

    # First worker generates for parent and caregiver; second worker generates 0 (deduped)
    assert res1 == 2
    assert res2 == 0

    all_notifs = (await db_session.execute(select(Notification))).scalars().all()
    assert len(all_notifs) == 2


@pytest.mark.asyncio
async def test_quiet_hours_and_preferences(db_session: AsyncSession) -> None:
    parent, cg, _, child_id = await _setup_family_and_caregiver(db_session)
    notif_repo = NotificationsRepository(db_session)

    # Set quiet hours from 22:00 to 07:00
    await notif_repo.set_preference(
        user_id=parent.id,
        person_id=child_id,
        notification_type="reminder",
        channel="push",
        enabled=True,
        quiet_start="22:00",
        quiet_end="07:00",
    )
    await db_session.commit()

    # Queue a notification at 23:00 (inside quiet hours)
    notif = await notif_repo.queue_notification(
        user_id=parent.id,
        person_id=child_id,
        schedule_id=None,
        type_str="reminder",
        channel="push",
        title="Rappel nuit",
        body="Prise de nuit",
        scheduled_for=datetime(2026, 11, 6, 22, 0, tzinfo=UTC),  # 23:00 Douala time
        dedupe_key=f"quiet-{uuid.uuid4()}",
    )
    assert notif is not None

    chan = RecordingChannel()
    worker = NotificationWorker(db_session, {"push": chan})

    # Dispatch during quiet hours -> should not send
    dispatched = await worker.dispatch_due_notifications(
        now=datetime(2026, 11, 6, 22, 10, tzinfo=UTC)
    )
    assert dispatched == 0
    assert len(chan.sent_batches) == 0

    # Disable preference -> should cancel on next dispatch attempt
    await notif_repo.set_preference(
        user_id=parent.id,
        person_id=child_id,
        notification_type="reminder",
        channel="push",
        enabled=False,
    )
    await db_session.commit()

    await worker.dispatch_due_notifications(now=datetime(2026, 11, 7, 8, 0, tzinfo=UTC))
    updated_notif = await notif_repo.get_notification_by_id(notif.id)
    assert updated_notif.status == "cancelled"


@pytest.mark.asyncio
async def test_relance_and_intake_cancellation(db_session: AsyncSession) -> None:
    parent, cg, _, child_id = await _setup_family_and_caregiver(db_session)
    notif_repo = NotificationsRepository(db_session)

    scheduled_time = datetime(2026, 11, 6, 7, 0, tzinfo=UTC)
    reminder = await notif_repo.queue_notification(
        user_id=parent.id,
        person_id=child_id,
        schedule_id=None,
        type_str="reminder",
        channel="push",
        title="Rappel 08:00",
        body="Prendre le produit",
        scheduled_for=scheduled_time,
        dedupe_key=f"rem-{uuid.uuid4()}",
    )
    await notif_repo.mark_sent(reminder.id, ticket_id="tick-01")
    await db_session.commit()

    # 35 minutes after scheduled time, intake is unconfirmed -> trigger followup (relance)
    worker = NotificationWorker(db_session)
    f_count = await worker.check_and_trigger_followups(now=scheduled_time + timedelta(minutes=35))
    assert f_count >= 1

    followups = (
        (
            await db_session.execute(
                select(Notification).where(
                    Notification.person_id == child_id,
                    Notification.type == "reminder_followup",
                    Notification.status == "queued",
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(followups) == 1

    # Now confirm intake -> relance must be cancelled
    notif_srv = NotificationsService(db_session)
    await notif_srv.on_intake_recorded(
        person_id=child_id,
        product_name="PlumpyNut",
        quantity="1.0",
        unit="sachet",
    )
    await db_session.commit()

    cancelled_f = await notif_repo.get_notification_by_id(followups[0].id)
    assert cancelled_f.status == "cancelled"


@pytest.mark.asyncio
async def test_device_not_registered_revocation_and_retries(db_session: AsyncSession) -> None:
    parent, _, _, child_id = await _setup_family_and_caregiver(db_session)
    notif_repo = NotificationsRepository(db_session)

    bad_token = "ExponentPushToken[unregistered-device-123]"
    await notif_repo.upsert_device_token(
        user_id=parent.id,
        platform="android",
        token=bad_token,
    )
    await db_session.commit()

    tokens = await notif_repo.list_active_tokens_for_user(parent.id)
    assert bad_token in tokens

    notif = await notif_repo.queue_notification(
        user_id=parent.id,
        person_id=child_id,
        schedule_id=None,
        type_str="reminder",
        channel="push",
        title="Test Revoke",
        body="Testing DeviceNotRegistered",
        scheduled_for=datetime(2026, 11, 6, 8, 0, tzinfo=UTC),
        dedupe_key=f"revoke-{uuid.uuid4()}",
    )

    # Worker configured with invalid token returning DeviceNotRegistered
    chan = RecordingChannel(fail_first_n=1, invalid_tokens=[bad_token])
    worker = NotificationWorker(db_session, {"push": chan})

    await worker.dispatch_due_notifications(now=datetime(2026, 11, 6, 8, 5, tzinfo=UTC))
    await db_session.commit()

    # The unregistered device token must have been revoked
    remaining_tokens = await notif_repo.list_active_tokens_for_user(parent.id)
    assert bad_token not in remaining_tokens

    # Verify notification attempts incremented
    failed_notif = await notif_repo.get_notification_by_id(notif.id)
    assert failed_notif.attempts == 1
    assert failed_notif.status == "queued"  # Will retry since attempts < 3
