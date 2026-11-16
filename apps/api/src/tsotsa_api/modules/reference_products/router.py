"""FastAPI routers for reference products and public product listing/details."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.i18n import resolve_request_locale
from tsotsa_api.modules.identity import get_optional_user, is_user_admin, require_role
from tsotsa_api.modules.reference_products.schemas import (
    ProductDetailRead,
    ProductSummaryRead,
    ReferenceProductCreate,
    ReferenceProductStatusUpdate,
    ReferenceProductUpdate,
)
from tsotsa_api.modules.reference_products.service import ReferenceProductService

public_router = APIRouter(prefix="/products", tags=["products"])
admin_router = APIRouter(prefix="/admin", tags=["admin-reference-products"])


@public_router.get("", response_model=list[ProductSummaryRead])
async def list_products(
    accept_language: str | None = Header(default=None, alias="Accept-Language"),
    user: Any = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[ProductSummaryRead]:
    """List validated reference products, published custom products, and user's custom products."""
    locale = resolve_request_locale(
        accept_language, getattr(user, "preferred_locale", None) if user else None
    )
    service = ReferenceProductService(db)
    user_id = user.id if user is not None else None
    return await service.list_visible_products(user_id=user_id, locale=locale)


@public_router.get("/{product_id}", response_model=ProductDetailRead)
async def get_product(
    product_id: str,
    accept_language: str | None = Header(default=None, alias="Accept-Language"),
    user: Any = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db_session),
) -> ProductDetailRead:
    """Retrieve product detail with read permission checks."""
    locale = resolve_request_locale(
        accept_language, getattr(user, "preferred_locale", None) if user else None
    )
    service = ReferenceProductService(db)
    user_id = user.id if user is not None else None
    admin_flag = await is_user_admin(user, db)
    return await service.get_product_detail(
        product_id=product_id, user_id=user_id, is_admin=admin_flag, locale=locale
    )


@admin_router.post(
    "/reference-products",
    response_model=ProductDetailRead,
    status_code=201,
)
async def create_reference_product(
    payload: ReferenceProductCreate,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ProductDetailRead:
    """Create a reference product (restricted to administration, requires source)."""
    service = ReferenceProductService(db)
    result = await service.create_reference_product(admin.id, payload)
    await db.commit()
    return result


@admin_router.get("/reference-products", response_model=list[ProductSummaryRead])
async def list_admin_reference_products(
    accept_language: str | None = Header(default=None, alias="Accept-Language"),
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> list[ProductSummaryRead]:
    """List all reference products (all statuses) for administration."""
    locale = resolve_request_locale(accept_language, getattr(admin, "preferred_locale", None))
    service = ReferenceProductService(db)
    return await service.list_admin_products(product_type="reference", locale=locale)


@admin_router.put("/reference-products/{product_id}", response_model=ProductDetailRead)
async def update_reference_product(
    product_id: str,
    payload: ReferenceProductUpdate,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ProductDetailRead:
    """Update a reference product and record an audit trail."""
    service = ReferenceProductService(db)
    result = await service.update_reference_product(product_id, admin.id, payload)
    await db.commit()
    return result


@admin_router.post(
    "/reference-products/{product_id}/status",
    response_model=ProductDetailRead,
)
async def update_reference_product_status(
    product_id: str,
    payload: ReferenceProductStatusUpdate,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ProductDetailRead:
    """Transition reference product status (to_enter / to_validate / validated)."""
    service = ReferenceProductService(db)
    result = await service.update_reference_product_status(product_id, admin.id, payload.status)
    await db.commit()
    return result
