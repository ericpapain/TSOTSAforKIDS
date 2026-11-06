"""Pydantic schemas for food and product intakes."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator


def normalize_consumption(v: str) -> str:
    clean = v.strip().lower()
    mapping = {
        "all": "all",
        "tout": "all",
        "half": "half",
        "moitie": "half",
        "moitié": "half",
        "refused": "refused",
        "refuse": "refused",
        "refusé": "refused",
    }
    if clean not in mapping:
        raise ValueError(
            "Consommation invalide. Utilisez 'all' (tout), 'half' (moitié) ou 'refused' (refusé)."
        )
    return mapping[clean]


def normalize_origin(v: str) -> str:
    clean = v.strip().lower()
    mapping = {
        "app": "app",
        "application": "app",
        "late": "late",
        "confirmation tardive": "late",
        "tardif": "late",
        "tardive": "late",
    }
    if clean not in mapping:
        return "app"
    return mapping[clean]


class IntakeCreate(BaseModel):
    """Schema to record a food/product intake."""

    id: str | None = Field(
        default=None, description="UUID généré par le téléphone (évite les doublons)"
    )
    person_id: str
    item_type: Literal["product", "food"]
    item_id: str
    quantity: Decimal = Field(gt=0, description="Quantité consommée (ex: 1 sachet, 150 ml, 50 g)")
    unit: str = Field(min_length=1, max_length=50, description="Unité (sachet, g, ml...)")
    taken_at: datetime = Field(description="Date et heure réelles de la prise")
    consumption: str = Field(
        default="all", description="tout / moitié / refusé (all / half / refused)"
    )
    origin: str = Field(
        default="app", description="application / confirmation tardive (app / late)"
    )
    schedule_time_id: str | None = None
    notes: str | None = Field(default=None, max_length=255)

    @field_validator("consumption")
    @classmethod
    def check_consumption(cls, v: str) -> str:
        return normalize_consumption(v)

    @field_validator("origin")
    @classmethod
    def check_origin(cls, v: str) -> str:
        return normalize_origin(v)


class IntakeRead(BaseModel):
    """Full detail of a recorded intake."""

    id: str
    person_id: str
    item_type: str
    item_id: str
    quantity: Decimal
    unit: str
    taken_at: datetime
    consumption: str
    origin: str
    schedule_time_id: str | None = None
    notes: str | None = None
    recorded_by: str
    created_at: datetime


class IntakeSyncRequest(BaseModel):
    """Offline batch synchronization request from mobile app."""

    intakes: list[IntakeCreate] = Field(..., max_length=500)


class IntakeSyncResponse(BaseModel):
    """Result of batch offline synchronization."""

    received_count: int
    inserted_count: int
    duplicates_skipped: int
    intakes: list[IntakeRead]


class ComplianceRateResponse(BaseModel):
    """7-day intake compliance metrics for clinical dashboard."""

    person_id: str
    period_days: int = 7
    total_recorded: int
    confirmed_count: int = Field(description="Prises avec consommation 'all' ou 'half'")
    refused_count: int = Field(description="Prises avec consommation 'refused'")
    compliance_rate_pct: Decimal = Field(description="Pourcentage de prises confirmées")
    daily_distribution: dict[str, int] = Field(default_factory=dict)
