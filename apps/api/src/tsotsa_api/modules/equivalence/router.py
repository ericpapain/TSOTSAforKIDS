"""FastAPI router for nutritional equivalence search."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.equivalence.schemas import EquivalenceResponse
from tsotsa_api.modules.equivalence.service import EquivalenceService
from tsotsa_api.modules.identity import get_optional_user, is_user_admin

equivalence_router = APIRouter(prefix="/products", tags=["Nutrition - Equivalence"])


@equivalence_router.get("/{id}/equivalents", response_model=EquivalenceResponse)
async def get_product_equivalents(
    id: str,
    nutrients: str | None = Query(
        None, description="Liste de nutriments essentiels séparés par des virgules"
    ),
    region: str | None = Query(None, description="Nom ou code de région cible"),
    strict: bool = Query(False, description="Filtre strict (seulement la région spécifiée)"),
    threshold_pct: Decimal | None = Query(
        None, description="Pourcentage seuil (ex: 10 pour 10%)", ge=1, le=100
    ),
    user: Any = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db_session),
) -> EquivalenceResponse:
    """Retrieve ranked local food equivalents for a reference or custom product."""
    service = EquivalenceService(db)
    user_id = user.id if user else None
    admin_flag = await is_user_admin(user, db)

    custom_n = (
        [item.strip() for item in nutrients.split(",") if item.strip()] if nutrients else None
    )

    return await service.get_equivalents_for_product(
        product_id=id,
        user_id=user_id,
        is_admin=admin_flag,
        custom_nutrients=custom_n,
        region=region.strip() if region else None,
        strict=strict,
        threshold_pct=threshold_pct,
    )
