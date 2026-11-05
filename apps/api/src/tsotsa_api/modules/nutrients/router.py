"""FastAPI router for Domain D (Nutrients)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.nutrients.repository import NutrientsRepository
from tsotsa_api.modules.nutrients.schemas import NutrientDetailRead, NutrientRead

router = APIRouter(prefix="/nutrients", tags=["Nutrients"])


@router.get("", response_model=list[NutrientRead])
async def list_nutrients(
    tracked_only: bool = Query(True, description="Filtrer uniquement les nutriments suivis"),
    db: AsyncSession = Depends(get_db_session),
) -> list[NutrientRead]:
    """Retrieve canonical nutrients."""
    repo = NutrientsRepository(db)
    nutrients = await repo.get_all_nutrients(tracked_only=tracked_only)
    return [
        NutrientRead(
            id=n.id,
            code=n.code,
            name_fr=n.name_fr,
            name_en=n.name_en,
            category=n.category,
            reference_unit_code=n.reference_unit.code,
            plausible_min=n.plausible_min,
            plausible_max=n.plausible_max,
            is_tracked=n.is_tracked,
        )
        for n in nutrients
    ]


@router.get("/{code}", response_model=NutrientDetailRead)
async def get_nutrient(
    code: str,
    db: AsyncSession = Depends(get_db_session),
) -> NutrientDetailRead:
    """Retrieve detailed description of a specific nutrient by its canonical code."""
    repo = NutrientsRepository(db)
    nutrient = await repo.get_nutrient_by_code(code)
    if not nutrient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nutriment avec le code '{code}' introuvable.",
        )
    return NutrientDetailRead(
        id=nutrient.id,
        code=nutrient.code,
        name_fr=nutrient.name_fr,
        name_en=nutrient.name_en,
        category=nutrient.category,
        reference_unit_code=nutrient.reference_unit.code,
        plausible_min=nutrient.plausible_min,
        plausible_max=nutrient.plausible_max,
        is_tracked=nutrient.is_tracked,
        synonyms=[s.label for s in nutrient.synonyms],
    )
