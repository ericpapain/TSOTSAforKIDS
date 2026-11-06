"""Catalog service for retrieving published foods and their candidate representation."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.equivalence.domain.ranking import FoodCandidate
from tsotsa_api.modules.food_database.models import Food, FoodNutrientValue, FoodRegion
from tsotsa_api.modules.nutrients.models import Nutrient


class FoodCatalogService:
    """Provides access to published foods for search, catalog, and equivalence matching."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_published_candidates(self) -> list[FoodCandidate]:
        """Load all published foods with current nutrient values for equivalence ranking."""
        nutrients_res = await self.session.execute(select(Nutrient.id, Nutrient.code))
        nutrient_map: dict[str, str] = {row[0]: row[1] for row in nutrients_res.all()}

        stmt = (
            select(Food)
            .options(
                selectinload(Food.category),
                selectinload(Food.regions).selectinload(FoodRegion.region),
                selectinload(Food.nutrient_values).selectinload(FoodNutrientValue.source),
            )
            .where(Food.status == "published", Food.is_current.is_(True))
        )
        res = await self.session.execute(stmt)
        foods = list(res.scalars().all())

        candidates: list[FoodCandidate] = []
        for food in foods:
            nutrients: dict[str, Decimal] = {}
            source_ref: str | None = None

            for nv in food.nutrient_values:
                if not nv.is_current:
                    continue
                code = nutrient_map.get(nv.nutrient_id, "unknown")
                nutrients[code] = Decimal(str(nv.value_per_100g))
                if nv.source and not source_ref:
                    source_ref = nv.source.article_reference or nv.source.doi

            regions: set[str] = set()
            for r in food.regions:
                if r.region:
                    regions.add(r.region.name)
                    regions.add(r.region.code)

            candidates.append(
                FoodCandidate(
                    id=food.id,
                    name=food.name,
                    nutrients=nutrients,
                    regions=regions,
                    source=source_ref,
                    category=food.category.name if food.category else None,
                )
            )

        return candidates
