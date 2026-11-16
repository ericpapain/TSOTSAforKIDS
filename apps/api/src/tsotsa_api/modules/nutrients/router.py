"""FastAPI router for Domain D (Nutrients)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.i18n import resolve_request_locale
from tsotsa_api.modules.identity import get_optional_user
from tsotsa_api.modules.nutrients.repository import NutrientsRepository
from tsotsa_api.modules.nutrients.schemas import NutrientDetailRead, NutrientRead

router = APIRouter(prefix="/nutrients", tags=["Nutrients"])


def _localized_nutrient_name(name_fr: str, name_en: str | None, locale: str) -> str:
    if locale == "en" and name_en:
        return name_en
    return name_fr


@router.get("", response_model=list[NutrientRead])
async def list_nutrients(
    tracked_only: bool = Query(True, description="Filtrer uniquement les nutriments suivis"),
    accept_language: str | None = Header(default=None, alias="Accept-Language"),
    user: Any = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[NutrientRead]:
    """Retrieve canonical nutrients."""
    locale = resolve_request_locale(
        accept_language, getattr(user, "preferred_locale", None) if user else None
    )
    repo = NutrientsRepository(db)
    nutrients = await repo.get_all_nutrients(tracked_only=tracked_only)
    return [
        NutrientRead(
            id=n.id,
            code=n.code,
            name=_localized_nutrient_name(n.name_fr, n.name_en, locale),
            original_name=n.name_fr,
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
    accept_language: str | None = Header(default=None, alias="Accept-Language"),
    user: Any = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db_session),
) -> NutrientDetailRead:
    """Retrieve detailed description of a specific nutrient by its canonical code."""
    locale = resolve_request_locale(
        accept_language, getattr(user, "preferred_locale", None) if user else None
    )
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
        name=_localized_nutrient_name(nutrient.name_fr, nutrient.name_en, locale),
        original_name=nutrient.name_fr,
        name_fr=nutrient.name_fr,
        name_en=nutrient.name_en,
        category=nutrient.category,
        reference_unit_code=nutrient.reference_unit.code,
        plausible_min=nutrient.plausible_min,
        plausible_max=nutrient.plausible_max,
        is_tracked=nutrient.is_tracked,
        synonyms=[s.label for s in nutrient.synonyms],
    )
