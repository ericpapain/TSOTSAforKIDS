"""SQLAlchemy repository for Domain J: Intake Schedules and Schedule Times."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.schedules.models import IntakeSchedule, ScheduleTime
from tsotsa_api.modules.schedules.schemas import (
    IntakeScheduleCreate,
    IntakeScheduleUpdate,
)
from tsotsa_api.shared.types import generate_uuid7


class SchedulesRepository:
    """Repository handling CRUD operations for intake schedules and schedule times."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_schedule(
        self, payload: IntakeScheduleCreate, created_by: str | None = None
    ) -> IntakeSchedule:
        now = datetime.now(UTC)
        schedule = IntakeSchedule(
            id=generate_uuid7(),
            person_id=payload.person_id,
            created_by=created_by,
            product_id=payload.product_id,
            food_id=payload.food_id,
            product_name=payload.product_name,
            quantity=payload.quantity,
            unit=payload.unit,
            start_date=payload.start_date,
            end_date=payload.end_date,
            status="active",
            origin=payload.origin,
            timezone=payload.timezone,
            created_at=now,
            updated_at=now,
        )
        self.session.add(schedule)
        await self.session.flush()

        for slot in payload.times:
            st = ScheduleTime(
                id=generate_uuid7(),
                schedule_id=schedule.id,
                local_time=slot.local_time,
                days_of_week=slot.days_of_week,
                enabled=slot.enabled,
            )
            self.session.add(st)

        await self.session.flush()
        return await self.get_schedule(schedule.id) or schedule

    async def get_schedule(self, schedule_id: str) -> IntakeSchedule | None:
        stmt = (
            select(IntakeSchedule)
            .options(selectinload(IntakeSchedule.schedule_times))
            .where(IntakeSchedule.id == schedule_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_schedules_for_person(
        self, person_id: str, status: str | None = None
    ) -> Sequence[IntakeSchedule]:
        stmt = (
            select(IntakeSchedule)
            .options(selectinload(IntakeSchedule.schedule_times))
            .where(IntakeSchedule.person_id == person_id)
        )
        if status:
            stmt = stmt.where(IntakeSchedule.status == status)
        stmt = stmt.order_by(IntakeSchedule.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_active_schedules_all(self) -> Sequence[IntakeSchedule]:
        """Fetch all currently active schedules for notification lookahead generator."""
        stmt = (
            select(IntakeSchedule)
            .options(selectinload(IntakeSchedule.schedule_times))
            .where(IntakeSchedule.status == "active")
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update_schedule(
        self, schedule: IntakeSchedule, payload: IntakeScheduleUpdate
    ) -> IntakeSchedule:
        now = datetime.now(UTC)
        if payload.product_name is not None:
            schedule.product_name = payload.product_name
        if payload.quantity is not None:
            schedule.quantity = payload.quantity
        if payload.unit is not None:
            schedule.unit = payload.unit
        if payload.start_date is not None:
            schedule.start_date = payload.start_date
        if payload.end_date is not None:
            schedule.end_date = payload.end_date
        if payload.status is not None:
            schedule.status = payload.status
        if payload.timezone is not None:
            schedule.timezone = payload.timezone

        if payload.times is not None:
            # Replace existing times with new ones
            await self.session.execute(
                delete(ScheduleTime).where(ScheduleTime.schedule_id == schedule.id)
            )
            new_times: list[ScheduleTime] = []
            for slot in payload.times:
                st = ScheduleTime(
                    id=generate_uuid7(),
                    schedule_id=schedule.id,
                    local_time=slot.local_time,
                    days_of_week=slot.days_of_week,
                    enabled=slot.enabled,
                )
                self.session.add(st)
                new_times.append(st)
            schedule.schedule_times = new_times

        schedule.updated_at = now
        await self.session.flush()
        return schedule

    async def delete_schedule(self, schedule: IntakeSchedule) -> None:
        """Mark schedule as cancelled instead of physical deletion."""
        schedule.status = "cancelled"
        schedule.updated_at = datetime.now(UTC)
        await self.session.flush()
