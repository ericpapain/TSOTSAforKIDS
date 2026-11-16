"""Schemas for Staff validation, permissions management, and patient care assignment."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field


class StaffValidationRequest(BaseModel):
    """Request payload to approve or reject a staff member account."""

    decision: Literal["approved", "rejected"]
    refusal_reason: Annotated[str | None, Field(max_length=255, default=None)] = None


class PermissionGrantRequest(BaseModel):
    """Request payload to delegate a permission to another user."""

    target_user_id: str
    permission_code: str
    reason: Annotated[str | None, Field(max_length=255, default=None)] = None
    valid_to: datetime | None = None


class PermissionRevokeRequest(BaseModel):
    """Request payload to revoke a delegated permission."""

    target_user_id: str
    permission_code: str


class PermissionGrantResponse(BaseModel):
    """Representation of an active or historical permission grant."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    permission_code: str
    granted_by: str
    reason: str | None = None
    valid_from: datetime
    valid_to: datetime | None = None
    is_active: bool


class PatientValidationRequest(BaseModel):
    """Request payload to validate or refuse a pending patient."""

    decision: Literal["validated", "refused"]
    refusal_reason: Annotated[str | None, Field(max_length=255, default=None)] = None


class PatientAssignRequest(BaseModel):
    """Request payload to assign a patient to a healthcare caregiver."""

    caregiver_id: str
    organization_id: str
    reason: Annotated[str | None, Field(max_length=255, default=None)] = None
