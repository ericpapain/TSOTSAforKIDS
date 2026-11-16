"""Pydantic schemas for patient validation and caregiver assignment."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PatientDecision = Literal["validated", "refused"]


class PatientValidationRequest(BaseModel):
    """Payload to validate or refuse a pending patient registration."""

    decision: PatientDecision
    refusal_reason: str | None = Field(default=None, max_length=500)


class PatientAssignRequest(BaseModel):
    """Payload to assign a patient to a healthcare caregiver in an organization."""

    caregiver_id: str
    organization_id: str
    reason: str | None = Field(default=None, max_length=255)


class PendingPatientRead(BaseModel):
    """Detailed representation of a patient pending validation."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    pseudonym: str
    first_name: str
    birth_date: date
    sex: str
    region_id: str | None = None
    status: str
    created_at: datetime
    validated_at: datetime | None = None
    refusal_reason: str | None = None

