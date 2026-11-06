"""Pydantic schemas for food equivalence responses."""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class EquivalentFoodItem(BaseModel):
    """An equivalent food candidate with nutritional match scoring."""

    food_id: str
    food_name: str
    local_name: str | None = None
    category: str | None = None
    m: int = Field(description="Nombre de nutriments essentiels présents")
    e: int = Field(description="Nombre de nutriments en plus")
    distance: Decimal = Field(description="Moyenne des écarts relatifs sur N")
    is_in_target_region: bool
    common_nutrients: list[str] = Field(description="Nutriments de N présents")
    extra_nutrients: list[str] = Field(description="Nutriments suivis en plus")
    teneurs: dict[str, Decimal] = Field(description="Teneurs pour 100g")
    regions: list[str] = Field(default_factory=list)
    source: str | None = None


class EquivalenceResponse(BaseModel):
    """Response containing product info and ordered food equivalents."""

    product_id: str
    product_name: str
    essential_nutrients: list[str]
    target_region: str | None = None
    strict_region: bool = False
    threshold_pct: Decimal
    equivalents: list[EquivalentFoodItem]
