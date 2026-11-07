"""Database repository for Domain I (Intakes)."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.intakes.models import Intake
from tsotsa_api.shared.types import generate_uuid7


def _is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(val)
        return True
    except (ValueError, TypeError):
        return False


class IntakesRepository:
    """Handles persistence and idempotency for food and product intakes."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, intake_id: str) -> Intake | None:
        if not _is_valid_uuid(intake_id):
            return None
        stmt = select(Intake).where(Intake.id == intake_id)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_intake(
        self,
        intake_id: str | None,
        person_id: str,
        item_type: Literal["product", "food"],
        item_id: str,
        quantity: Decimal,
        unit: str,
        taken_at: datetime,
        consumption: str,
        origin: str,
        recorded_by: str,
        schedule_time_id: str | None = None,
        notes: str | None = None,
    ) -> Intake:
        chosen_id = intake_id if (intake_id and _is_valid_uuid(intake_id)) else generate_uuid7()
        record = Intake(
            id=chosen_id,
            person_id=person_id,
            item_type=item_type,
            product_id=item_id if item_type == "product" else None,
            food_id=item_id if item_type == "food" else None,
            quantity=quantity,
            unit=unit,
            taken_at=taken_at,
            consumption=consumption,
            origin=origin,
            schedule_time_id=schedule_time_id
            if (schedule_time_id and _is_valid_uuid(schedule_time_id))
            else None,
            notes=notes,
            recorded_by=recorded_by,
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def list_for_person(
        self,
        person_id: str,
        item_type: str | None = None,
        consumption: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Intake]:
        if not _is_valid_uuid(person_id):
            return []

        stmt = select(Intake).where(Intake.person_id == person_id)
        if item_type in ("product", "food"):
            stmt = stmt.where(Intake.item_type == item_type)
        if consumption:
            stmt = stmt.where(Intake.consumption == consumption)
        if start_date:
            stmt = stmt.where(Intake.taken_at >= start_date)
        if end_date:
            stmt = stmt.where(Intake.taken_at <= end_date)

        stmt = stmt.order_by(Intake.taken_at.desc()).offset(offset).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def count_for_person(
        self,
        person_id: str,
        item_type: str | None = None,
        consumption: str | None = None,
    ) -> int:
        if not _is_valid_uuid(person_id):
            return 0
        stmt = select(func.count(Intake.id)).where(Intake.person_id == person_id)
        if item_type in ("product", "food"):
            stmt = stmt.where(Intake.item_type == item_type)
        if consumption:
            stmt = stmt.where(Intake.consumption == consumption)
        res = await self.session.execute(stmt)
        return res.scalar_one() or 0

    async def get_intakes_in_range(
        self, person_id: str, start_dt: datetime, end_dt: datetime
    ) -> list[Intake]:
        if not _is_valid_uuid(person_id):
            return []
        stmt = (
            select(Intake)
            .where(
                Intake.person_id == person_id,
                Intake.taken_at >= start_dt,
                Intake.taken_at <= end_dt,
            )
            .order_by(Intake.taken_at.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
