"""Full day clock-advancing simulation for Domain J: Schedules and Notifications."""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import UTC, date, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.intakes.schemas import IntakeCreate
from tsotsa_api.modules.intakes.service import IntakesService
from tsotsa_api.modules.notifications.channels.base import ChannelSendResult, NotificationChannel
from tsotsa_api.modules.notifications.models import Notification
from tsotsa_api.modules.notifications.schemas import NotificationPreferenceSetRequest
from tsotsa_api.modules.notifications.service import NotificationsService
from tsotsa_api.modules.notifications.worker import NotificationWorker
from tsotsa_api.modules.organizations.schemas import CaregiverAttachmentRequest, OrganizationCreate
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.service import PersonsService
from tsotsa_api.modules.reference_products.models import Product
from tsotsa_api.modules.schedules.schemas import IntakeScheduleCreate, ScheduleTimeCreate
from tsotsa_api.modules.schedules.service import SchedulesService


class MockSimChannel(NotificationChannel):
    """Simulated delivery channel collecting all sent notifications."""

    def __init__(self) -> None:
        self.delivered: list[Notification] = []

    @property
    def name(self) -> str:
        return "push"

    async def send_batch(
        self,
        notifications: Sequence[Notification],
        user_tokens: dict[str, list[str]],
    ) -> list[ChannelSendResult]:
        self.delivered.extend(notifications)
        return [
            ChannelSendResult(notification_id=n.id, success=True, ticket_id=f"sim-{n.id[:8]}")
            for n in notifications
        ]


async def _create_child_with_parent(
    session: AsyncSession,
    first_name: str,
    pseudo: str,
    org_id: str,
    caregiver_id: str,
) -> tuple[User, str]:
    id_repo = IdentityRepository(session)
    parent = await id_repo.create_user(display_name=f"Parent {first_name}")
    await id_repo.assign_role(parent.id, "user")
    await session.commit()

    p_srv = PersonsService(session)
    child = await p_srv.care_service.register_person_in_care(
        org_id=org_id,
        pseudonym=pseudo,
        first_name=first_name,
        birth_date=date(2025, 2, 1),
        sex="M",
        actor_user_id=caregiver_id,
    )
    await p_srv.repo.create_person_link(
        person_id=child.id, user_id=parent.id, relation="child", is_primary=True
    )
    await session.commit()
    return parent, child.id


@pytest.mark.asyncio
async def test_full_day_simulation_three_children(db_session: AsyncSession) -> None:
    # 1. Setup Caregiver and Hospital
    id_repo = IdentityRepository(db_session)
    cg = await id_repo.create_user(display_name="Dr Mbarga")
    await id_repo.assign_role(cg.id, "caregiver")
    await db_session.commit()

    orgs_srv = OrganizationsService(db_session)
    org = await orgs_srv.create_organization(
        OrganizationCreate(name="Hôpital Central", type="hopital"),
        admin_user_id=cg.id,
    )
    await orgs_srv.attach_caregiver(
        org_id=org.id,
        payload=CaregiverAttachmentRequest(user_id=cg.id, licence_number="CAM-999", approve=True),
        admin_user_id=cg.id,
    )

    prod = Product(
        type="reference",
        name="PlumpyNut",
        base="100g",
        status="validated",
    )
    db_session.add(prod)
    await db_session.commit()

    # 2. Setup 3 children and their schedules (08:00, 12:00, 18:00 local Douala time)
    p1, c1_id = await _create_child_with_parent(db_session, "Samuel", "#A-001", org.id, cg.id)
    p2, c2_id = await _create_child_with_parent(db_session, "Marie", "#A-002", org.id, cg.id)
    p3, c3_id = await _create_child_with_parent(db_session, "David", "#A-003", org.id, cg.id)

    sched_srv = SchedulesService(db_session)
    daily_times = [
        ScheduleTimeCreate(local_time="08:00", enabled=True),
        ScheduleTimeCreate(local_time="12:00", enabled=True),
        ScheduleTimeCreate(local_time="18:00", enabled=True),
    ]
    for cid in [c1_id, c2_id, c3_id]:
        await sched_srv.create_schedule(
            IntakeScheduleCreate(
                person_id=cid,
                product_name="PlumpyNut",
                quantity="1.0",
                unit="sachet",
                start_date=date(2026, 11, 1),
                end_date=date(2026, 11, 30),
                timezone="Africa/Douala",
                times=daily_times,
            ),
            actor_user_id=cg.id,
            roles=["caregiver"],
        )
    await db_session.commit()

    sim_channel = MockSimChannel()
    worker = NotificationWorker(db_session, {"push": sim_channel})
    notif_srv = NotificationsService(db_session)
    intakes_srv = IntakesService(db_session)

    # T0 (05:00 UTC = 06:00 Douala) -> Worker lookahead generation
    t0 = datetime(2026, 11, 6, 5, 0, tzinfo=UTC)
    gen_count = await worker.generate_lookahead(t0, window_hours=24)
    assert gen_count > 0  # Slots generated for 3 children across the 24-hour horizon

    # T1 (07:05 UTC = 08:05 Douala) -> Morning dispatch (08:00 intake)
    t1 = datetime(2026, 11, 6, 7, 5, tzinfo=UTC)
    disp1 = await worker.dispatch_due_notifications(t1)
    assert disp1 > 0

    # Parents 1 & 2 confirm 08:00 intake
    await intakes_srv.record_single_intake(
        user_id=p1.id,
        is_admin=False,
        payload=IntakeCreate(
            id=str(uuid.uuid4()),
            person_id=c1_id,
            item_type="product",
            item_id=prod.id,
            quantity=1.0,
            unit="sachet",
            taken_at=datetime(2026, 11, 6, 7, 10, tzinfo=UTC),
        ),
    )
    await notif_srv.on_intake_recorded(c1_id, "PlumpyNut", 1.0, "sachet")

    await intakes_srv.record_single_intake(
        user_id=p2.id,
        is_admin=False,
        payload=IntakeCreate(
            id=str(uuid.uuid4()),
            person_id=c2_id,
            item_type="product",
            item_id=prod.id,
            quantity=1.0,
            unit="sachet",
            taken_at=datetime(2026, 11, 6, 7, 12, tzinfo=UTC),
        ),
    )
    await notif_srv.on_intake_recorded(c2_id, "PlumpyNut", 1.0, "sachet")
    await db_session.commit()

    # T2 (11:05 UTC = 12:05 Douala) -> Noon dispatch (12:00 intake)
    t2 = datetime(2026, 11, 6, 11, 5, tzinfo=UTC)
    disp2 = await worker.dispatch_due_notifications(t2)
    assert disp2 > 0

    # Only Parent 1 confirms noon intake. Parent 2 forgets!
    await intakes_srv.record_single_intake(
        user_id=p1.id,
        is_admin=False,
        payload=IntakeCreate(
            id=str(uuid.uuid4()),
            person_id=c1_id,
            item_type="product",
            item_id=prod.id,
            quantity=1.0,
            unit="sachet",
            taken_at=datetime(2026, 11, 6, 11, 10, tzinfo=UTC),
        ),
    )
    await notif_srv.on_intake_recorded(c1_id, "PlumpyNut", 1.0, "sachet")
    await db_session.commit()

    # T3 (11:40 UTC = 12:40 Douala) -> Check followups (+35 min after 12:00)
    t3 = datetime(2026, 11, 6, 11, 40, tzinfo=UTC)
    followup_count = await worker.check_and_trigger_followups(t3, followup_delay_minutes=30)
    assert followup_count >= 1  # Triggered relance for Child 2

    # Verify Child 2 got a reminder_followup notification queued for Parent 2
    c2_followups = (
        (
            await db_session.execute(
                select(Notification).where(
                    Notification.person_id == c2_id,
                    Notification.user_id == p2.id,
                    Notification.type == "reminder_followup",
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(c2_followups) >= 1

    # T4 (14:00 UTC) -> Parent 3 disables reminder notifications
    pref_set = await notif_srv.set_preference(
        user_id=p3.id,
        payload=NotificationPreferenceSetRequest(
            person_id=c3_id,
            notification_type="reminder",
            channel="push",
            enabled=False,
        ),
    )
    assert pref_set.enabled is False

    # Check alert was generated for Caregiver about Parent 3 cutting reminders
    cut_alerts = (
        (
            await db_session.execute(
                select(Notification).where(
                    Notification.user_id == cg.id,
                    Notification.type == "clinical_alert",
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(cut_alerts) >= 1
    assert any("désactivé les rappels" in a.body for a in cut_alerts)

    # T5 (17:05 UTC = 18:05 Douala) -> Evening dispatch (18:00 intake)
    t5 = datetime(2026, 11, 6, 17, 5, tzinfo=UTC)
    disp3 = await worker.dispatch_due_notifications(t5)
    assert disp3 > 0

    # Ensure total delivery log contains all transmissions
    assert len(sim_channel.delivered) > 0
