"""Pydantic schemas for clinical evaluations and anthropometric scores."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


def normalize_position(v: str) -> str:
    clean = v.strip().lower()
    if clean in ("standing", "debout"):
        return "standing"
    return "recumbent"


def normalize_edema(v: str) -> str:
    clean = v.strip().lower()
    mapping = {
        "none": "none",
        "non": "none",
        "0": "none",
        "+": "plus_1",
        "plus_1": "plus_1",
        "++": "plus_2",
        "plus_2": "plus_2",
        "+++": "plus_3",
        "plus_3": "plus_3",
    }
    return mapping.get(clean, "none")


class EvaluationCreate(BaseModel):
    """Payload to record a clinical evaluation by a caregiver."""

    measured_at: datetime = Field(description="Date et heure de la consultation")
    weight_kg: Decimal = Field(gt=0, le=100, description="Poids en kilogrammes")
    length_cm: Decimal = Field(gt=30, le=150, description="Longueur couchée ou taille debout en cm")
    position: str = Field(default="recumbent", description="Position: 'recumbent' ou 'standing'")
    muac_mm: Decimal | None = Field(
        default=None, gt=50, le=300, description="Périmètre brachial en millimètres (PB / MUAC)"
    )
    edema: str = Field(
        default="none",
        description="Œdèmes bilatéraux: 'none' (non), 'plus_1' (+), 'plus_2' (++), 'plus_3' (+++)",
    )
    notes: str | None = Field(default=None, max_length=500, description="Observations cliniques")

    @field_validator("position")
    @classmethod
    def check_position(cls, v: str) -> str:
        return normalize_position(v)

    @field_validator("edema")
    @classmethod
    def check_edema(cls, v: str) -> str:
        return normalize_edema(v)


class EvaluationScoreRead(BaseModel):
    """Z-score detail for an individual indicator."""

    indicator: str = Field(description="Indicateur: wfl, lhfa, wfa, acfa, bfa")
    z_score: Decimal | None = Field(
        default=None, description="Valeur du Z-score (None en cas d'œdème)"
    )
    flag: str | None = Field(default=None, description="Flag: extreme, oedema")


class EvaluationRead(BaseModel):
    """Full detail of a recorded clinical evaluation."""

    id: str
    person_id: str
    organization_id: str
    caregiver_id: str
    measured_at: datetime
    weight_kg: Decimal
    length_cm: Decimal
    position: str
    muac_mm: Decimal | None
    edema: str
    notes: str | None
    weight_gain_velocity: Decimal | None = Field(
        default=None, description="Vitesse de gain de poids en g/kg/jour"
    )
    proposed_status: str | None = Field(
        default=None, description="Classification proposée: MAS, MAM, normal"
    )
    proposed_criteria: str | None = Field(
        default=None, description="Critères médicaux justifiant la proposition"
    )
    scores: list[EvaluationScoreRead]
    created_at: datetime
