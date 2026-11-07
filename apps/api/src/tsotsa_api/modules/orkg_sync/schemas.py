"""Pydantic schemas and data structures for ORKG synchronization (Étape D04)."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class FetchedComparisonData(BaseModel):
    """Raw comparison table retrieved from ORKG API, manual CSV, or snapshot."""

    comparison_id: str
    fetched_at: datetime
    method: str  # api, manual_csv, snapshot
    checksum: str
    raw_file: str
    headers: list[str]
    rows: list[list[str]]
    alert_message: str | None = None


class ParsedCompositionItem(BaseModel):
    """Parsed Type A contribution column before dictionary normalization."""

    comparison_id: str
    contribution_label: str
    dish_name: str
    sample_label: str
    label_nutrient: str
    component_name: str | None = None
    raw_value: str
    raw_unit: str
    paper_title: str | None = None
    doi: str | None = None
    parse_errors: list[str] = Field(default_factory=list)


class ParsedRecipeIngredient(BaseModel):
    """Parsed Type B recipe ingredient column."""

    contribution_label: str
    common_name: str
    scientific_name: str | None = None
    importance: str = "optional"  # basic / optional
    raw_proportion: str
    raw_unit: str
    position: int
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)


class ParsedRecipe(BaseModel):
    """Parsed Type B dish recipe with all ingredient columns."""

    comparison_id: str
    dish_name: str
    paper_title: str | None = None
    doi: str | None = None
    ingredients: list[ParsedRecipeIngredient] = Field(default_factory=list)


class NormalizedCompositionItem(BaseModel):
    """Normalized and quality-checked Type A composition item."""

    comparison_id: str
    contribution_label: str
    dish_name: str
    sample_label: str
    nutrient_id: str | None = None
    nutrient_code: str | None = None
    nutrient_name: str | None = None
    value_per_100g: Decimal | None = None
    reference_unit: str | None = None
    basis: str = "poids frais"
    region: str | None = None
    paper_title: str | None = None
    doi: str | None = None
    status: str = "valid"  # valid, warning, error
    messages: list[str] = Field(default_factory=list)
    is_outlier: bool = False


class NormalizedRecipe(BaseModel):
    """Normalized and quality-checked Type B dish recipe."""

    comparison_id: str
    dish_name: str
    region: str | None = None
    paper_title: str | None = None
    doi: str | None = None
    total_proportion_pct: Decimal = Decimal("0.0")
    ingredients: list[dict[str, Any]] = Field(default_factory=list)
    status: str = "valid"  # valid, warning, error
    messages: list[str] = Field(default_factory=list)


class DiffEntry(BaseModel):
    """Single diff item comparing ORKG extraction against current DB."""

    entity_type: str  # composition / recipe
    key: str
    status: str  # new / modified / unchanged / missing
    old_value: str | None = None
    new_value: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class DiffReport(BaseModel):
    """Summary of changes between extracted ORKG records and database state."""

    new_count: int = 0
    modified_count: int = 0
    unchanged_count: int = 0
    missing_count: int = 0
    entries: list[DiffEntry] = Field(default_factory=list)

    @property
    def has_changes(self) -> bool:
        return (self.new_count + self.modified_count) > 0


class OrkgSyncRequest(BaseModel):
    """Optional list of comparison IDs to synchronize."""

    comparison_ids: list[str] | None = None


class OrkgSyncComparisonResult(BaseModel):
    """Result summary for a single synchronized ORKG comparison."""

    comparison_id: str
    type: str
    method: str
    checksum: str
    raw_file: str
    diff_new: int = 0
    diff_modified: int = 0
    diff_unchanged: int = 0
    diff_missing: int = 0
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    alert: str | None = None


class OrkgSyncResponse(BaseModel):
    """Response returned by POST /v1/admin/orkg/sync."""

    batch_id: str | None = None
    status: str
    alerts: list[str] = Field(default_factory=list)
    comparisons: list[OrkgSyncComparisonResult] = Field(default_factory=list)


class OrkgComparisonRead(BaseModel):
    """Registry representation of an ORKG comparison."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    comparison_id: str
    type: str
    nutrient_label: str | None = None
    region_label: str | None = None
    basis: str | None = None
    status: str
    replaced_by: str | None = None
    notes: str | None = None


class OrkgSnapshotRead(BaseModel):
    """Snapshot record representation."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    comparison_id: str
    fetched_at: datetime
    method: str
    checksum: str
    raw_file: str
    batch_id: str | None = None
    alert_message: str | None = None
