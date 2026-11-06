"""Pydantic schemas for Domain J: Intake Schedules and Times."""

from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ScheduleTimeCreate(BaseModel):
    """Payload to create or update an intake schedule time."""

    local_time: str = Field(..., description="Heure locale format HH:MM (ex. '08:00')")
    days_of_week: list[int] | None = Field(
        None, description="Jours de la semaine [1=Lundi, ..., 7=Dimanche]. Vide = tous les jours."
    )
    enabled: bool = True

    @field_validator("local_time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        if not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", v):
            raise ValueError("L'heure doit être au format HH:MM (00:00 à 23:59).")
        return v


class ScheduleTimeRead(BaseModel):
    """Public read model for an intake schedule time slot."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    local_time: str
    days_of_week: list[int] | None = None
    enabled: bool


class IntakeScheduleCreate(BaseModel):
    """Payload to prescribe a new intake schedule for a followed person."""

    person_id: str
    product_id: str | None = None
    food_id: str | None = None
    product_name: str | None = None
    quantity: Decimal = Field(..., gt=0, description="Quantité prescrite par prise")
    unit: str = Field(..., description="Unité (ex. 'sachet', 'g', 'ml')")
    start_date: date
    end_date: date | None = None
    times: list[ScheduleTimeCreate] = Field(
        ..., min_length=1, description="Au moins un horaire de prise requis"
    )
    origin: str = Field("manual", description="'manual' ou 'optimization'")
    timezone: str = Field(
        "Africa/Douala", description="Fuseau horaire de référence (par défaut Africa/Douala)"
    )

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in ("sachet", "g", "ml"):
            raise ValueError("L'unité doit être 'sachet', 'g' ou 'ml'.")
        return cleaned


class IntakeScheduleUpdate(BaseModel):
    """Payload to update an existing intake schedule."""

    product_name: str | None = None
    quantity: Decimal | None = Field(None, gt=0)
    unit: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = Field(None, description="'active', 'paused', 'cancelled'")
    timezone: str | None = None
    times: list[ScheduleTimeCreate] | None = None


class IntakeScheduleRead(BaseModel):
    """Public read model for an intake schedule summary."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    person_id: str
    created_by: str | None = None
    product_id: str | None = None
    food_id: str | None = None
    product_name: str | None = None
    quantity: Decimal
    unit: str
    start_date: date
    end_date: date | None = None
    status: str
    origin: str
    timezone: str
    created_at: datetime
    updated_at: datetime
    times_count: int = 0


class IntakeScheduleDetail(IntakeScheduleRead):
    """Full detail of an intake schedule including all time slots."""

    schedule_times: list[ScheduleTimeRead] = Field(default_factory=list)
