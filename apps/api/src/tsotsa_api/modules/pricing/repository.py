"""Database repository for Domain H (Pricing)."""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.pricing.models import PriceRecord


def _is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(val)
        return True
    except (ValueError, TypeError):
        return False


class PricingRepository:
    """Manages database access for observed price records and history."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_record(
        self,
        region_id: str,
        item_type: Literal["food", "product"],
        item_id: str,
        price: Decimal,
        currency: str,
        unit: str,
        observed_at: date,
        source: str,
        entered_by: str,
        notes: str | None = None,
    ) -> PriceRecord:
        record = PriceRecord(
            region_id=region_id,
            item_type=item_type,
            food_id=item_id if item_type == "food" else None,
            product_id=item_id if item_type == "product" else None,
            price=price,
            currency=currency,
            unit=unit,
            observed_at=observed_at,
            source=source,
            notes=notes,
            entered_by=entered_by,
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def get_latest_price(
        self,
        region_id: str,
        item_type: Literal["food", "product"],
        item_id: str,
    ) -> PriceRecord | None:
        if not _is_valid_uuid(region_id) or not _is_valid_uuid(item_id):
            return None

        stmt = select(PriceRecord).where(
            PriceRecord.region_id == region_id,
            PriceRecord.item_type == item_type,
        )
        if item_type == "food":
            stmt = stmt.where(PriceRecord.food_id == item_id)
        else:
            stmt = stmt.where(PriceRecord.product_id == item_id)

        stmt = stmt.order_by(PriceRecord.observed_at.desc(), PriceRecord.created_at.desc()).limit(1)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_records(
        self,
        region_id: str | None = None,
        item_type: str | None = None,
        item_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[PriceRecord]:
        stmt = select(PriceRecord)
        if region_id and _is_valid_uuid(region_id):
            stmt = stmt.where(PriceRecord.region_id == region_id)
        if item_type in ("food", "product"):
            stmt = stmt.where(PriceRecord.item_type == item_type)
        if item_id and _is_valid_uuid(item_id):
            if item_type == "food":
                stmt = stmt.where(PriceRecord.food_id == item_id)
            elif item_type == "product":
                stmt = stmt.where(PriceRecord.product_id == item_id)
            else:
                stmt = stmt.where(
                    (PriceRecord.food_id == item_id) | (PriceRecord.product_id == item_id)
                )

        stmt = stmt.order_by(PriceRecord.observed_at.desc(), PriceRecord.created_at.desc())
        stmt = stmt.offset(offset).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def count_records(
        self,
        region_id: str | None = None,
        item_type: str | None = None,
        item_id: str | None = None,
    ) -> int:
        stmt = select(func.count(PriceRecord.id))
        if region_id and _is_valid_uuid(region_id):
            stmt = stmt.where(PriceRecord.region_id == region_id)
        if item_type in ("food", "product"):
            stmt = stmt.where(PriceRecord.item_type == item_type)
        if item_id and _is_valid_uuid(item_id):
            if item_type == "food":
                stmt = stmt.where(PriceRecord.food_id == item_id)
            elif item_type == "product":
                stmt = stmt.where(PriceRecord.product_id == item_id)
        res = await self.session.execute(stmt)
        return res.scalar_one() or 0

    async def get_record_by_id(self, record_id: str) -> PriceRecord | None:
        if not _is_valid_uuid(record_id):
            return None
        stmt = select(PriceRecord).where(PriceRecord.id == record_id)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

