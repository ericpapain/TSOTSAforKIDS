"""Pydantic schemas for custom_products module."""

from __future__ import annotations

from pydantic import BaseModel, Field

from tsotsa_api.modules.reference_products.schemas import ProductNutrientInput


class CustomProductCreate(BaseModel):
    """Payload for a user creating a custom product."""

    name: str = Field(..., min_length=1, max_length=255)
    base: str = Field(default="100g")
    label_photo_file: str | None = Field(default=None, max_length=255)
    nutrients: list[ProductNutrientInput] = Field(..., min_length=1)


class CustomProductReview(BaseModel):
    """Admin review decision for a custom product (publish / keep_private / correct)."""

    decision: str = Field(..., pattern="^(publish|keep_private|correct)$")
    name: str | None = Field(default=None, min_length=1, max_length=255)
    nutrients: list[ProductNutrientInput] | None = None
