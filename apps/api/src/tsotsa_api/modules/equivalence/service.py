"""Service layer for nutritional equivalence matching."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import NotFoundError
from tsotsa_api.modules.equivalence.domain.ranking import (
    EquivalenceConfig,
    ProductProfile,
    rank_food_equivalents,
)
from tsotsa_api.modules.equivalence.schemas import EquivalenceResponse, EquivalentFoodItem
from tsotsa_api.modules.food_database.service import FoodDatabaseService
from tsotsa_api.modules.reference_products.service import ReferenceProductService


class EquivalenceService:
    """Orchestrates equivalence search by loading products, foods, and applying ranking rules."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.product_service = ReferenceProductService(session)
        self.food_service = FoodDatabaseService(session)

    async def get_equivalents_for_product(
        self,
        product_id: str,
        user_id: str | None = None,
        is_admin: bool = False,
        custom_nutrients: list[str] | None = None,
        region: str | None = None,
        strict: bool = False,
        threshold_pct: Decimal | None = None,
    ) -> EquivalenceResponse:
        """Find and rank local food equivalents for a reference or custom product."""
        product_detail = await self.product_service.get_product_detail(
            product_id=product_id, user_id=user_id, is_admin=is_admin
        )
        if not product_detail:
            raise NotFoundError(f"Produit '{product_id}' introuvable.")

        prod_nutrients: dict[str, Decimal] = {
            nv.nutrient_code: Decimal(str(nv.value)) for nv in product_detail.nutrients
        }

        product_profile = ProductProfile(
            id=product_detail.id,
            name=product_detail.name,
            essential_nutrients=product_detail.essential_nutrients,
            nutrients=prod_nutrients,
        )

        pct = threshold_pct if threshold_pct is not None else Decimal("10.0")
        config = EquivalenceConfig(default_threshold_pct=pct)

        candidates = await self.food_service.list_published_candidates()

        ranked = rank_food_equivalents(
            product=product_profile,
            candidates=candidates,
            custom_nutrients=custom_nutrients,
            target_region=region,
            strict_region=strict,
            config=config,
        )

        items = [
            EquivalentFoodItem(
                food_id=r.food_id,
                food_name=r.food_name,
                category=r.category,
                m=r.m,
                e=r.e,
                distance=r.distance,
                is_in_target_region=r.is_in_target_region,
                common_nutrients=r.common_nutrients,
                extra_nutrients=r.extra_nutrients,
                teneurs=r.food_nutrients,
                regions=sorted(r.regions),
                source=r.source,
            )
            for r in ranked
        ]

        active_n = (
            custom_nutrients
            if custom_nutrients is not None
            else product_profile.essential_nutrients
        )

        return EquivalenceResponse(
            product_id=product_detail.id,
            product_name=product_detail.name,
            essential_nutrients=active_n,
            target_region=region,
            strict_region=strict,
            threshold_pct=pct,
            equivalents=items,
        )
