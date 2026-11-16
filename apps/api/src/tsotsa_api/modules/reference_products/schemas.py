"""Pydantic schemas for Domain F (Products) and Domain L (Audit Log)."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ProductNutrientInput(BaseModel):
    """Input specification for a nutrient in a reference or custom product."""

    nutrient: str
    value: Decimal | None = None
    value_min: Decimal | None = None
    value_max: Decimal | None = None
    unit: str


class ProductNutrientRead(BaseModel):
    """Normalized nutrient specification for 100g/100ml of product."""

    model_config = ConfigDict(from_attributes=True)

    nutrient_code: str
    nutrient_name: str
    value: Decimal
    value_min: Decimal
    value_max: Decimal | None = None
    unit: str
    unit_code: str


class ProductSummaryRead(BaseModel):
    """Summary representation of a reference or custom product."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    name: str
    original_name: str = ""
    name_en: str | None = None
    base: str
    usage: str | None = None
    owner_user_id: str | None = None
    status: str
    unit_label: str | None = None
    label_photo_file: str | None = None
    source_reference: str | None = None


class ProductDetailRead(ProductSummaryRead):
    """Detailed representation of a product with composition and essential nutrients."""

    nutrients: list[ProductNutrientRead] = Field(default_factory=list)
    essential_nutrients: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ReferenceProductCreate(BaseModel):
    """Admin payload for creating a reference product."""

    name: str = Field(..., min_length=1, max_length=200)
    name_en: str | None = None
    base: str = "100g"
    usage: str = "hospital"
    source_reference: str | None = None
    unit_label: str | None = None
    status: str = "to_validate"
    nutrients: list[ProductNutrientInput] = Field(default_factory=list)
    essential_nutrients: list[str] = Field(default_factory=list)


class ReferenceProductUpdate(BaseModel):
    """Admin payload for updating a reference product."""

    name: str | None = None
    name_en: str | None = None
    base: str | None = None
    usage: str | None = None
    source_reference: str | None = None
    unit_label: str | None = None
    status: str | None = None
    nutrients: list[ProductNutrientInput] | None = None
    essential_nutrients: list[str] | None = None


class ReferenceProductStatusUpdate(BaseModel):
    """Admin payload for transitioning the status of a reference product."""

    status: str


class AuditLogRead(BaseModel):
    """Audit log entry representation."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_user_id: str | None = None
    action: str
    entity: str
    entity_id: str
    at: datetime
    details: dict[str, Any] | None = None
