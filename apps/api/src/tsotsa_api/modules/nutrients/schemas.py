"""Pydantic schemas for Domain D (Nutrients and Units)."""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class UnitRead(BaseModel):
    """Public representation of a measurement unit."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    kind: str
    name: str | None = None


class UnitConversionRead(BaseModel):
    """Public representation of a unit conversion factor."""

    model_config = ConfigDict(from_attributes=True)

    from_unit_code: str
    to_unit_code: str
    factor: Decimal


class NutrientRead(BaseModel):
    """Summary of a canonical nutrient."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name_fr: str
    name_en: str | None = None
    category: str
    reference_unit_code: str
    plausible_min: Decimal | None = None
    plausible_max: Decimal | None = None
    is_tracked: bool = True


class NutrientDetailRead(NutrientRead):
    """Detailed nutrient description with its known synonyms."""

    synonyms: list[str] = Field(default_factory=list)


class NormalizationReport(BaseModel):
    """Result of normalizing a raw nutrient observation."""

    recognized: bool
    nutrient_id: str | None = None
    canonical_code: str | None = None
    canonical_name: str | None = None
    raw_value: Decimal | None = None
    normalized_value: Decimal | None = None
    reference_unit: str | None = None
    is_plausible: bool = True
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
