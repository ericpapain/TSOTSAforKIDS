"""Manual food entry creation helper."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ValidationError
from tsotsa_api.modules.food_database.models import (
    Food,
    FoodName,
    FoodNutrientValue,
    FoodRegion,
    ImportBatch,
)
from tsotsa_api.modules.food_database.repository import FoodDatabaseRepository
from tsotsa_api.modules.food_database.schemas import ManualFoodCreate
from tsotsa_api.modules.food_database.validation import IngestionValidator
from tsotsa_api.modules.nutrients.service import NutrientService


async def create_manual_food_entry(
    session: AsyncSession,
    repo: FoodDatabaseRepository,
    nutrient_service: NutrientService,
    validator: IngestionValidator,
    user_id: str,
    payload: ManualFoodCreate,
) -> Food:
    """Validate and persist a manually keyed food item and composition."""
    rows = [
        {
            "food_name": payload.name,
            "category": payload.category or "",
            "state": payload.state or "",
            "nutrient": n.nutrient,
            "value": str(n.value),
            "unit": n.unit,
            "basis": n.basis,
            "article_reference": payload.source.article_reference or "",
            "doi": payload.source.doi or "",
            "orkg_comparison": payload.source.orkg_comparison_id or "",
        }
        for n in payload.nutrients
    ]
    mapping = {k: k for k in rows[0].keys()}
    report = await validator.validate_rows("manual", f"manual_{payload.name}", rows, mapping)
    if report.rows_error > 0:
        error_msgs = [
            f"Ligne {d.row_number}: {'; '.join(d.messages)}"
            for d in report.details
            if d.status == "error"
        ]
        raise ValidationError(f"Échec des contrôles : {', '.join(error_msgs)}")

    batch = ImportBatch(
        file_name=f"saisie_manuelle_{payload.name}",
        file_type="manual",
        status="to_review",
        created_by=user_id,
        rows_valid=report.rows_valid,
        control_report=report.model_dump(),
    )
    session.add(batch)
    await session.flush()

    category = await repo.get_or_create_category(payload.category) if payload.category else None
    food = Food(
        name=payload.name,
        kind=payload.kind,
        scientific_name=payload.scientific_name,
        category_id=category.id if category else None,
        state=payload.state,
        status="to_review",
        created_by=user_id,
    )
    session.add(food)
    await session.flush()

    for loc in payload.local_names:
        session.add(
            FoodName(
                food_id=food.id,
                language_or_dialect=loc.get("language", "local"),
                name=loc["name"],
            )
        )

    for reg_code in payload.regions:
        reg = await repo.get_or_create_region(reg_code)
        session.add(FoodRegion(food_id=food.id, region_id=reg.id))

    source = await repo.find_or_create_source(
        article_reference=payload.source.article_reference,
        doi=payload.source.doi,
        orkg_comparison_id=payload.source.orkg_comparison_id,
        paper_title=payload.source.paper_title,
        url=payload.source.url,
    )

    for n in payload.nutrients:
        norm = await nutrient_service.normalize_and_validate(
            raw_nutrient=n.nutrient,
            raw_value=n.value,
            raw_unit=n.unit,
            sample_basis_g=Decimal("100.0"),
        )
        val = FoodNutrientValue(
            food_id=food.id,
            nutrient_id=norm.nutrient_id or "",
            value_per_100g=norm.normalized_value or Decimal("0.0"),
            basis=n.basis,
            sample_label=n.sample_label,
            source_id=source.id,
            batch_id=batch.id,
            entered_by=user_id,
            version=1,
            is_current=True,
        )
        session.add(val)

    await session.flush()
    return food
