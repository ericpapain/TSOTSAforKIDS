"""Pydantic schemas for the child health and well-being module."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SymptomCatalogOut(BaseModel):
    """Symptom catalogue entry presentation."""

    model_config = ConfigDict(from_attributes=True)

    code: str
    category: str
    label_fr: str
    label_en: str
    is_danger_sign: bool
    conditional_questions: list[dict[str, Any]] | None = None
    display_order: int
    is_active: bool


class HealthEventSymptomCreate(BaseModel):
    """Symptom input when reporting a health event."""

    symptom_code: str = Field(min_length=2, max_length=64)
    duration: str = Field(default="less_than_24h", max_length=64)
    duration_days: int | None = Field(default=None, ge=0, le=365)
    recurrence_count: int | None = Field(default=None, ge=0, le=100)
    specific_metrics: dict[str, Any] = Field(default_factory=dict)


class HealthEventSymptomOut(BaseModel):
    """Symptom output model."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    symptom_code: str
    duration: str
    duration_days: int | None = None
    recurrence_count: int | None = None
    specific_metrics: dict[str, Any] = Field(default_factory=dict)


class HealthEventCreate(BaseModel):
    """Payload to declare a new child health event."""

    person_id: str
    intake_id: str | None = None
    declaration_context: str = Field(default="standalone", pattern="^(standalone|during_meal)$")
    meal_interrupted: bool | None = None
    intake_quantity_consumed: str | None = Field(default=None, max_length=64)
    symptoms: list[HealthEventSymptomCreate] = Field(min_length=1)
    temperature_celsius: float | None = Field(default=None, ge=34.0, le=44.0)
    stools_frequency_per_day: int | None = Field(default=None, ge=0, le=50)
    vomiting_frequency_per_day: int | None = Field(default=None, ge=0, le=50)
    comment: str | None = Field(default=None, max_length=1000)


class ClinicalAssessmentCreate(BaseModel):
    """Medical assessment submitted by an authorized caregiver."""

    clinical_notes: str = Field(min_length=5, max_length=4000)
    suspected_condition: str | None = Field(default=None, max_length=128)
    requires_investigation: bool = False
    investigation_type: str | None = Field(default=None, max_length=128)


class ClinicalAssessmentOut(BaseModel):
    """Caregiver assessment view."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    caregiver_id: str
    clinical_notes: str
    suspected_condition: str | None = None
    requires_investigation: bool
    investigation_type: str | None = None
    created_at: datetime


class HealthEventActionCreate(BaseModel):
    """Action recorded by a healthcare professional."""

    action_type: str = Field(
        min_length=2,
        max_length=64,
        pattern="^(clarification_requested|scheduled_followup|referral_specialist|treatment_advised|emergency_transfer|closed)$",
    )
    details: str = Field(min_length=3, max_length=1000)


class HealthEventActionOut(BaseModel):
    """Medical action output."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_id: str
    action_type: str
    details: str
    created_at: datetime


class HealthEventParentOut(BaseModel):
    """Reassuring and safe health event view for parents."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    person_id: str
    reported_by: str
    created_at: datetime
    declaration_context: str
    status: str
    priority: str
    has_danger_sign: bool = False
    parent_guidance_message: str = ""
    comment: str | None = None
    intake_id: str | None = None
    symptoms: list[HealthEventSymptomOut] = Field(default_factory=list)


class HealthEventCaregiverOut(HealthEventParentOut):
    """Comprehensive clinical view reserved for authorized caregivers."""

    organization_id: str | None = None
    caregiver_guidance_notes: list[str] = Field(default_factory=list)
    suggested_conditions: list[str] = Field(default_factory=list)
    assessments: list[ClinicalAssessmentOut] = Field(default_factory=list)
    actions: list[HealthEventActionOut] = Field(default_factory=list)


class HealthAlertSummary(BaseModel):
    """Summary item displayed in the central Alerts & Notifications center."""

    event_id: str
    person_id: str
    person_code: str | None = None
    created_at: datetime
    priority: str
    status: str
    symptoms_summary: list[str] = Field(default_factory=list)
    has_danger_sign: bool
    requires_urgent_transfer: bool
