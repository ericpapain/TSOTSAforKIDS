"""FastAPI routers for custom_products module."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.custom_products.schemas import CustomProductCreate, CustomProductReview
from tsotsa_api.modules.custom_products.service import CustomProductService
from tsotsa_api.modules.identity import get_current_user, require_role
from tsotsa_api.modules.reference_products.schemas import ProductDetailRead, ProductSummaryRead

user_router = APIRouter(prefix="/custom-products", tags=["custom-products"])
admin_router = APIRouter(prefix="/admin/custom-products", tags=["admin-custom-products"])


@user_router.post("", response_model=ProductDetailRead, status_code=201)
async def create_custom_product(
    payload: CustomProductCreate,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ProductDetailRead:
    """Create a custom product owned by the authenticated user (status = private)."""
    service = CustomProductService(db)
    result = await service.create_custom_product(user.id, payload)
    await db.commit()
    return result


@admin_router.get("", response_model=list[ProductSummaryRead])
async def list_admin_custom_products(
    _admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> list[ProductSummaryRead]:
    """List all custom products for administrative verification."""
    service = CustomProductService(db)
    return await service.list_admin_custom_products()


@admin_router.post("/{product_id}/review", response_model=ProductDetailRead)
async def review_custom_product(
    product_id: str,
    payload: CustomProductReview,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ProductDetailRead:
    """Verify a custom product: publish, keep_private, or correct."""
    service = CustomProductService(db)
    result = await service.review_custom_product(product_id, admin.id, payload)
    await db.commit()
    return result
