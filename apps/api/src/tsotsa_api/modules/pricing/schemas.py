"""Pydantic schemas for pricing records and regional queries."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class PriceRecordCreate(BaseModel):
    """Admin request to record an observed market price."""

    region_id: str
    item_type: Literal["food", "product"]
    item_id: str
    price: Decimal = Field(gt=0, description="Prix positif")
    currency: str = Field(default="FCFA", max_length=10)
    unit: str = Field(min_length=1, max_length=50, description="Unité de vente (kg, sachet...)")
    observed_at: date
    source: str = Field(min_length=2, max_length=255, description="Source du relevé (marché...)")
    notes: str | None = Field(default=None, max_length=255)

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("La source du relevé de prix est obligatoire.")
        return clean


class PriceRecordRead(BaseModel):
    """Full detail of a recorded price entry."""

    id: str
    region_id: str
    item_type: str
    item_id: str
    price: Decimal
    currency: str
    unit: str
    observed_at: date
    source: str
    notes: str | None = None
    entered_by: str
    created_at: datetime


class LatestPriceResponse(BaseModel):
    """Response for user querying latest price in a region."""

    item_type: str
    item_id: str
    region_id: str
    status: Literal["available", "unspecified"]
    price: Decimal | None = None
    currency: str | None = None
    unit: str | None = None
    observed_at: date | None = None
    source: str | None = None
    message: str | None = None

