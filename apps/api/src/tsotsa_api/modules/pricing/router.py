"""FastAPI routers for Domain H (Pricing queries and Admin recording)."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity import require_role
from tsotsa_api.modules.pricing.schemas import (
    LatestPriceResponse,
    PriceRecordCreate,
    PriceRecordRead,
)
from tsotsa_api.modules.pricing.service import PricingService

pricing_router = APIRouter(prefix="/pricing", tags=["Pricing"])
admin_pricing_router = APIRouter(prefix="/admin/pricing", tags=["Admin - Pricing"])


@pricing_router.get("/latest", response_model=LatestPriceResponse)
async def get_latest_price(
    region_id: str = Query(..., description="Identifiant de la région"),
    item_type: Literal["food", "product"] = Query(..., description="'food' ou 'product'"),
    item_id: str = Query(..., description="Identifiant de l'aliment ou du produit"),
    db: AsyncSession = Depends(get_db_session),
) -> LatestPriceResponse:
    """Retrieve the latest observed price in a region. Returns 'non renseigné' if none."""
    service = PricingService(db)
    return await service.get_latest_price(region_id=region_id, item_type=item_type, item_id=item_id)


@pricing_router.get("/foods/{food_id}/latest", response_model=LatestPriceResponse)
async def get_latest_food_price(
    food_id: str,
    region_id: str = Query(..., description="Identifiant de la région"),
    db: AsyncSession = Depends(get_db_session),
) -> LatestPriceResponse:
    """Retrieve the latest observed price of a food in a region."""
    service = PricingService(db)
    return await service.get_latest_price(region_id=region_id, item_type="food", item_id=food_id)


@pricing_router.get("/products/{product_id}/latest", response_model=LatestPriceResponse)
async def get_latest_product_price(
    product_id: str,
    region_id: str = Query(..., description="Identifiant de la région"),
    db: AsyncSession = Depends(get_db_session),
) -> LatestPriceResponse:
    """Retrieve the latest observed price of a product in a region."""
    service = PricingService(db)
    return await service.get_latest_price(
        region_id=region_id, item_type="product", item_id=product_id
    )


@admin_pricing_router.post(
    "/records",
    response_model=PriceRecordRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_price_record(
    payload: PriceRecordCreate,
    request: Request,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> PriceRecordRead:
    """Record an observed market price for an aliment or product."""
    ip = request.client.host if request.client else None
    service = PricingService(db)
    result = await service.record_price(admin_user_id=admin.id, payload=payload, ip=ip)
    await db.commit()
    return result


@admin_pricing_router.get("/records", response_model=list[PriceRecordRead])
async def list_price_records(
    region_id: str | None = Query(None, description="Filtrer par région"),
    item_type: str | None = Query(None, description="Filtrer par type (food/product)"),
    item_id: str | None = Query(None, description="Filtrer par aliment ou produit"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> list[PriceRecordRead]:
    """Retrieve price observation history with filters."""
    service = PricingService(db)
    return await service.list_history(
        region_id=region_id,
        item_type=item_type,
        item_id=item_id,
        limit=limit,
        offset=offset,
    )


@admin_pricing_router.get("/records/{record_id}", response_model=PriceRecordRead)
async def get_price_record(
    record_id: str,
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> PriceRecordRead:
    """Retrieve single price record details."""
    service = PricingService(db)
    return await service.get_record(record_id)
