"""Pydantic schemas for Domain E (Food Database and Imports)."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SourceRead(BaseModel):
    """Source reference metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    article_reference: str | None = None
    doi: str | None = None
    orkg_comparison_id: str | None = None
    orkg_contribution_label: str | None = None
    paper_title: str | None = None
    url: str | None = None


class FoodNameRead(BaseModel):
    """Local dialect food name."""

    model_config = ConfigDict(from_attributes=True)

    language_or_dialect: str
    name: str


class FoodRegionRead(BaseModel):
    """Region availability description."""

    model_config = ConfigDict(from_attributes=True)

    region_code: str
    region_name: str
    availability: str
    season_months: str | None = None


class FoodNutrientValueRead(BaseModel):
    """Individual nutrient value for a food."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    nutrient_code: str
    nutrient_name: str
    value_per_100g: Decimal
    unit: str
    basis: str
    sample_label: str | None = None
    is_estimated: bool = False
    source: SourceRead | None = None


class FoodSummaryRead(BaseModel):
    """Concise representation of a food for catalog search."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    kind: str
    category: str | None = None
    state: str | None = None
    status: str
    version: int


class FoodDetailRead(BaseModel):
    """Complete food representation with composition, local names and sources."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    kind: str
    scientific_name: str | None = None
    category: str | None = None
    food_group: str | None = None
    state: str | None = None
    status: str
    version: int
    is_current: bool
    created_at: datetime
    local_names: list[FoodNameRead] = Field(default_factory=list)
    regions: list[FoodRegionRead] = Field(default_factory=list)
    nutrients: list[FoodNutrientValueRead] = Field(default_factory=list)


class ColumnMappingUpdate(BaseModel):
    """Admin column mapping correction."""

    mapping: dict[str, str] = Field(
        ...,
        description="Dictionnaire des correspondances entre colonnes du fichier et champs cibles",
    )


class BatchRowMessage(BaseModel):
    """Row level check message."""

    row_number: int
    status: str
    messages: list[str] = Field(default_factory=list)


class BatchValidationReport(BaseModel):
    """Dry-run and execution control report."""

    batch_id: str
    file_name: str
    status: str
    rows_valid: int
    rows_warning: int
    rows_error: int
    can_execute: bool
    details: list[BatchRowMessage] = Field(default_factory=list)


class ImportBatchRead(BaseModel):
    """Import batch overview."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    file_name: str
    file_type: str
    status: str
    created_by: str
    reviewed_by: str | None = None
    column_mapping: dict[str, str] | None = None
    rows_valid: int = 0
    rows_error: int = 0
    rows_warning: int = 0
    created_at: datetime
    control_report: dict[str, Any] | None = None


class ManualSourceEntry(BaseModel):
    """Source input during manual entry."""

    article_reference: str | None = None
    doi: str | None = None
    orkg_comparison_id: str | None = None
    paper_title: str | None = None
    url: str | None = None


class ManualNutrientEntry(BaseModel):
    """Nutrient composition row in manual entry."""

    nutrient: str
    value: Decimal
    unit: str
    basis: str = "poids frais"
    sample_label: str | None = None


class ManualFoodCreate(BaseModel):
    """Payload for manual food and composition creation."""

    name: str
    kind: str = "dish"
    scientific_name: str | None = None
    category: str | None = None
    state: str | None = None
    local_names: list[dict[str, str]] = Field(default_factory=list)
    regions: list[str] = Field(default_factory=list)
    source: ManualSourceEntry
    nutrients: list[ManualNutrientEntry] = Field(..., min_length=1)


class BatchReviewDecision(BaseModel):
    """Admin review decision for an import batch."""

    decision: str = Field(..., pattern="^(publish|reject)$")
    comment: str | None = None
