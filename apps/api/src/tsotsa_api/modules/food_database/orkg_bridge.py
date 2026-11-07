"""Bridge helpers in food_database for ORKG synchronization batches and versioning."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.food_database.models import (
    Food,
    FoodNutrientValue,
    FoodRegion,
    ImportBatch,
    ImportBatchRow,
)
from tsotsa_api.modules.food_database.repository import FoodDatabaseRepository


async def get_current_nutrient_values_map(
    session: AsyncSession,
) -> dict[tuple[str, str, str], tuple[str, Decimal, int]]:
    """Return {(food_name_lower, nutrient_id, sample_label): (fnv_id, value_per_100g, version)}."""
    stmt = (
        select(
            Food.name,
            FoodNutrientValue.nutrient_id,
            FoodNutrientValue.sample_label,
            FoodNutrientValue.id,
            FoodNutrientValue.value_per_100g,
            FoodNutrientValue.version,
        )
        .join(Food, Food.id == FoodNutrientValue.food_id)
        .where(FoodNutrientValue.is_current.is_(True), Food.is_current.is_(True))
    )
    rows = (await session.execute(stmt)).all()
    result: dict[tuple[str, str, str], tuple[str, Decimal, int]] = {}
    for food_name, nutrient_id, sample_label, fnv_id, val, ver in rows:
        key = (food_name.strip().lower(), nutrient_id, (sample_label or "").strip())
        result[key] = (fnv_id, Decimal(str(val)), int(ver))
    return result


async def ensure_dish_or_ingredient_food(
    session: AsyncSession,
    repo: FoodDatabaseRepository,
    name: str,
    kind: str,
    scientific_name: str | None = None,
    region_name: str | None = None,
    user_id: str | None = None,
) -> str:
    """Find or create a Food entity (dish or ingredient) and return its ID."""
    clean_name = name.strip()
    food = await repo.get_food_by_name(clean_name, None)
    if not food:
        food = Food(
            name=clean_name,
            kind=kind,
            scientific_name=scientific_name.strip() if scientific_name else None,
            status="to_review",
            created_by=user_id,
        )
        session.add(food)
        await session.flush()
    elif scientific_name and not food.scientific_name:
        food.scientific_name = scientific_name.strip()

    if region_name:
        reg = await repo.get_or_create_region(region_name.strip())
        existing_reg = await session.execute(
            select(FoodRegion).where(FoodRegion.food_id == food.id, FoodRegion.region_id == reg.id)
        )
        if not existing_reg.scalars().first():
            session.add(FoodRegion(food_id=food.id, region_id=reg.id))
            await session.flush()

    return food.id


async def get_food_names_map(session: AsyncSession, food_ids: list[str]) -> dict[str, str]:
    """Return {food_id: food_name} for a list of food IDs."""
    if not food_ids:
        return {}
    stmt = select(Food.id, Food.name).where(Food.id.in_(food_ids))
    rows = (await session.execute(stmt)).all()
    return {fid: fname for fid, fname in rows}


async def persist_orkg_sync_batch(
    session: AsyncSession,
    repo: FoodDatabaseRepository,
    user_id: str,
    file_name: str,
    control_report: dict[str, Any],
    batch_rows: list[dict[str, Any]],
    composition_changes: list[dict[str, Any]],
) -> str:
    """Create an ImportBatch (file_type='orkg', status='to_review') and versioned values."""
    rows_valid = sum(1 for r in batch_rows if r.get("status") == "valid")
    rows_warning = sum(1 for r in batch_rows if r.get("status") == "warning")
    rows_error = sum(1 for r in batch_rows if r.get("status") == "error")

    batch = ImportBatch(
        file_name=file_name,
        file_type="orkg",
        status="to_review",
        created_by=user_id,
        control_report=control_report,
        rows_valid=rows_valid,
        rows_warning=rows_warning,
        rows_error=rows_error,
    )
    session.add(batch)
    await session.flush()

    for idx, r in enumerate(batch_rows, start=1):
        session.add(
            ImportBatchRow(
                batch_id=batch.id,
                row_number=idx,
                raw_data=r.get("raw_data", {}),
                status=r.get("status", "valid"),
                messages=r.get("messages", []),
            )
        )

    for item in composition_changes:
        await _persist_single_orkg_composition(session, repo, batch.id, user_id, item)

    await session.flush()
    return batch.id


async def _persist_single_orkg_composition(
    session: AsyncSession,
    repo: FoodDatabaseRepository,
    batch_id: str,
    user_id: str,
    item: dict[str, Any],
) -> None:
    food_id = await ensure_dish_or_ingredient_food(
        session=session,
        repo=repo,
        name=item["food_name"],
        kind="dish",
        region_name=item.get("region"),
        user_id=user_id,
    )
    source = await repo.find_or_create_source(
        article_reference=item.get("paper_title"),
        doi=item.get("doi"),
        orkg_comparison_id=item.get("comparison_id"),
        orkg_contribution_label=item.get("contribution_label"),
    )
    if item.get("paper_title") and not source.paper_title:
        source.paper_title = item["paper_title"]

    new_version = 1
    if item.get("previous_fnv_id"):
        await session.execute(
            update(FoodNutrientValue)
            .where(FoodNutrientValue.id == item["previous_fnv_id"])
            .values(is_current=False)
        )
        new_version = int(item.get("previous_version", 1)) + 1

    session.add(
        FoodNutrientValue(
            food_id=food_id,
            nutrient_id=item["nutrient_id"],
            value_per_100g=Decimal(str(item["value_per_100g"])),
            basis=item.get("basis") or "poids frais",
            sample_label=item.get("sample_label"),
            is_estimated=bool(item.get("is_estimated", False)),
            source_id=source.id,
            batch_id=batch_id,
            version=new_version,
            is_current=True,
            entered_by=user_id,
        )
    )
