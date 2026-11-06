"""Pydantic schemas for Domain Monitoring, Alerts, and Caregiver Dashboard."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AlertPriority = Literal["urgent", "high", "normal"]
AlertStatus = Literal["open", "handled"]


def normalize_priority(val: str) -> AlertPriority:
    v = val.strip().lower()
    mapping: dict[str, AlertPriority] = {
        "urgent": "urgent",
        "urgente": "urgent",
        "high": "high",
        "elevee": "high",
        "élevée": "high",
        "normal": "normal",
        "normale": "normal",
    }
    if v not in mapping:
        raise ValueError(f"Priorité invalide : '{val}'. Attendu : urgente, élevée, normale.")
    return mapping[v]


class AlertRuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    description: str | None = None
    parameters: dict[str, Any]
    priority: AlertPriority
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AlertRuleUpdate(BaseModel):
    parameters: dict[str, Any] | None = None
    priority: str | None = None
    is_active: bool | None = None

    @field_validator("priority", mode="before")
    @classmethod
    def _validate_priority(cls, v: Any) -> str | None:
        if v is None:
            return None
        return normalize_priority(str(v))


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    person_id: str
    organization_id: str
    rule_id: str
    rule_code: str
    priority: AlertPriority
    status: AlertStatus
    message: str
    details: dict[str, Any] | None = None
    opened_at: datetime
    handled_at: datetime | None = None
    handled_by: str | None = None
    handling_notes: str | None = None


class AlertHandleRequest(BaseModel):
    notes: str | None = Field(default=None, max_length=500)


class DashboardMetricsResponse(BaseModel):
    organization_id: str
    total_persons_followed: int
    intakes_compliance_7d_pct: float
    priority_alerts_count: int  # urgent + high
    urgent_alerts_count: int
    late_evaluations_count: int
    open_alerts_count: int


class DashboardScheduledEvaluationItem(BaseModel):
    person_id: str
    pseudonym: str
    first_name: str
    last_evaluation_date: datetime | None = None
    days_since_last_evaluation: int | None = None
    status: str | None = None
    is_overdue: bool = False


class DashboardPersonItem(BaseModel):
    person_id: str
    pseudonym: str
    first_name: str
    birth_date: date
    age_months: int
    sex: str
    region_id: str | None = None
    current_nutritional_status: str | None = None
    last_evaluation_date: datetime | None = None
    last_weight_kg: float | None = None
    open_alerts_count: int = 0
    has_urgent_alert: bool = False
    intakes_compliance_7d_pct: float | None = None


class NotificationPreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    person_id: str | None = None
    notification_type: str
    channel: str
    enabled: bool


class NotificationPreferenceSetRequest(BaseModel):
    person_id: str | None = None
    notification_type: str = "reminders"
    channel: str = "in_app"
    enabled: bool = True
