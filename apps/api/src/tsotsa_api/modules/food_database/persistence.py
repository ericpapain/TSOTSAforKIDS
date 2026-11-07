"""Persistence helper for food and nutrient value insertions."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.food_database.models import (
    Food,
    FoodName,
    FoodNutrientValue,
    FoodRegion,
    ImportBatch,
)
from tsotsa_api.modules.food_database.repository import FoodDatabaseRepository
from tsotsa_api.modules.nutrients.service import NutrientService


async def persist_imported_row(
    session: AsyncSession,
    repo: FoodDatabaseRepository,
    nutrient_service: NutrientService,
    batch: ImportBatch,
    mapped: dict[str, Any],
) -> None:
    """Create or update food entities from a validated imported row."""
    food_name = mapped["food_name"]
    cat_code = mapped.get("category")
    category = await repo.get_or_create_category(cat_code) if cat_code else None

    food = await repo.get_food_by_name(food_name, mapped.get("state"))
    if not food:
        food = Food(
            name=food_name,
            kind="dish",
            category_id=category.id if category else None,
            state=mapped.get("state"),
            status="to_review",
            created_by=batch.created_by,
        )
        session.add(food)
        await session.flush()

    if mapped.get("local_name"):
        session.add(
            FoodName(food_id=food.id, language_or_dialect="local", name=mapped["local_name"])
        )

    if mapped.get("region"):
        reg = await repo.get_or_create_region(mapped["region"])
        session.add(FoodRegion(food_id=food.id, region_id=reg.id))

    source = await repo.find_or_create_source(
        article_reference=mapped.get("article_reference"),
        doi=mapped.get("doi"),
        orkg_comparison_id=mapped.get("orkg_comparison"),
        orkg_contribution_label=mapped.get("orkg_contribution"),
    )

    norm = await nutrient_service.normalize_and_validate(
        raw_nutrient=mapped["nutrient"],
        raw_value=mapped["value"],
        raw_unit=mapped["unit"],
        sample_basis_g=Decimal("100.0"),
    )
    if norm.recognized and norm.normalized_value is not None:
        val = FoodNutrientValue(
            food_id=food.id,
            nutrient_id=norm.nutrient_id or "",
            value_per_100g=norm.normalized_value,
            basis=mapped.get("basis", "poids frais"),
            source_id=source.id,
            batch_id=batch.id,
            entered_by=batch.created_by,
            version=1,
            is_current=True,
        )
        session.add(val)
