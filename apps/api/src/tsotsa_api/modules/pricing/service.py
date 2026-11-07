"""Business logic service for Domain H (Pricing)."""

from __future__ import annotations

from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import NotFoundError, ValidationError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.pricing.models import PriceRecord
from tsotsa_api.modules.pricing.repository import PricingRepository
from tsotsa_api.modules.pricing.schemas import (
    LatestPriceResponse,
    PriceRecordCreate,
    PriceRecordRead,
)


class PricingService:
    """Manages regional market prices, recording workflows, and latest price lookups."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = PricingRepository(session)
        self.audit = AuditService(session)

    async def record_price(
        self,
        admin_user_id: str,
        payload: PriceRecordCreate,
        ip: str | None = None,
    ) -> PriceRecordRead:
        """Record an observed market price from a cited source."""
        if not payload.source or not payload.source.strip():
            raise ValidationError("Source obligatoire pour tout relevé de prix.")

        if payload.price <= 0:
            raise ValidationError("Le prix doit être strictement positif.")

        record = await self.repo.create_record(
            region_id=payload.region_id,
            item_type=payload.item_type,
            item_id=payload.item_id,
            price=payload.price,
            currency=payload.currency.strip().upper(),
            unit=payload.unit.strip(),
            observed_at=payload.observed_at,
            source=payload.source.strip(),
            entered_by=admin_user_id,
            notes=payload.notes.strip() if payload.notes else None,
        )

        await self.audit.log(
            action="create",
            entity="price_record",
            entity_id=record.id,
            organization_id=None,
            actor_user_id=admin_user_id,
            ip=ip,
            details={
                "item_type": payload.item_type,
                "item_id": payload.item_id,
                "region_id": payload.region_id,
                "price": str(payload.price),
                "source": payload.source.strip(),
            },
        )

        return self._to_read(record)

    async def get_latest_price(
        self,
        region_id: str,
        item_type: Literal["food", "product"],
        item_id: str,
    ) -> LatestPriceResponse:
        """Retrieve most recent recorded price in a region, or 'non renseigné'."""
        record = await self.repo.get_latest_price(
            region_id=region_id, item_type=item_type, item_id=item_id
        )
        if not record:
            return LatestPriceResponse(
                item_type=item_type,
                item_id=item_id,
                region_id=region_id,
                status="unspecified",
                message="non renseigné",
                price=None,
                currency=None,
                unit=None,
                observed_at=None,
                source=None,
            )

        return LatestPriceResponse(
            item_type=item_type,
            item_id=item_id,
            region_id=region_id,
            status="available",
            price=record.price,
            currency=record.currency,
            unit=record.unit,
            observed_at=record.observed_at,
            source=record.source,
            message=None,
        )

    async def list_history(
        self,
        region_id: str | None = None,
        item_type: str | None = None,
        item_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[PriceRecordRead]:
        """List price observation history with optional filters."""
        records = await self.repo.list_records(
            region_id=region_id,
            item_type=item_type,
            item_id=item_id,
            limit=limit,
            offset=offset,
        )
        return [self._to_read(r) for r in records]

    async def get_record(self, record_id: str) -> PriceRecordRead:
        """Get single price record detail by ID."""
        record = await self.repo.get_record_by_id(record_id)
        if not record:
            raise NotFoundError("Relevé de prix introuvable.")
        return self._to_read(record)

    def _to_read(self, r: PriceRecord) -> PriceRecordRead:
        item_id = (r.food_id if r.item_type == "food" else r.product_id) or ""
        return PriceRecordRead(
            id=r.id,
            region_id=r.region_id,
            item_type=r.item_type,
            item_id=item_id,
            price=r.price,
            currency=r.currency,
            unit=r.unit,
            observed_at=r.observed_at,
            source=r.source,
            notes=r.notes,
            entered_by=r.entered_by,
            created_at=r.created_at,
        )
