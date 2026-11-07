"""Schemas for WHO Growth Standards curves and z-score evaluations."""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class CurvePointRead(BaseModel):
    """Reference standard points for graph plotting."""

    x_value: Decimal = Field(description="Âge en jours ou taille/longueur en cm")
    sd3neg: Decimal = Field(description="-3 Z-score")
    sd2neg: Decimal = Field(description="-2 Z-score")
    sd0: Decimal = Field(description="Médiane (0 Z-score)")
    sd2: Decimal = Field(description="+2 Z-score")
    sd3: Decimal = Field(description="+3 Z-score")


class GrowthCurvesResponse(BaseModel):
    """Official WHO curve data for an indicator and sex."""

    indicator: str
    sex: Literal["F", "M"]
    unit_x: str
    points: list[CurvePointRead]
