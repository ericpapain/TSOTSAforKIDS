"""Pydantic schemas for Domain Admin endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from tsotsa_api.modules.reference_products.schemas import ProductNutrientInput


class AdminCustomProductReviewRequest(BaseModel):
    decision: str = Field(pattern="^(publish|keep_private|correct)$")
    updated_name: str | None = None
    updated_nutrients: list[ProductNutrientInput] | None = None


class AdminUserIdentityItem(BaseModel):
    provider: str
    email: str | None = None
    phone: str | None = None


class AdminUserListItem(BaseModel):
    id: str
    display_name: str
    status: str
    roles: list[str] = Field(default_factory=list)
    identities: list[AdminUserIdentityItem] = Field(default_factory=list)
    preferred_region_id: str | None = None
    caregiver_status: str | None = None
    caregiver_org_id: str | None = None
    created_at: datetime
    last_login_at: datetime | None = None


class AdminUserListResponse(BaseModel):
    items: list[AdminUserListItem]
    total: int


class AdminUserCreateRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=150)
    role: str = Field(default="user", pattern="^(user|caregiver|admin)$")
    phone_or_email: str = Field(min_length=3, max_length=255)
    organization_id: str | None = None
    is_verified_caregiver: bool = False
    licence_number: str | None = None


class AdminUserCreateResponse(BaseModel):
    user_id: str
    display_name: str
    role: str
    status: str
    phone_or_email: str
    invitation_token: str
    invitation_url: str
    expires_at: datetime


class AdminUserSuspendRequest(BaseModel):
    reason: str | None = None


class AdminCaregiverListItem(BaseModel):
    user_id: str
    display_name: str
    organization_id: str | None = None
    licence_number: str | None = None
    document_file: str | None = None
    verification_status: str
    verification_notes: str | None = None
    verified_by: str | None = None
    verified_at: datetime | None = None
    created_at: datetime


class AdminCaregiverListResponse(BaseModel):
    items: list[AdminCaregiverListItem]
    total: int


class AdminCaregiverReviewRequest(BaseModel):
    action: str = Field(pattern="^(approve|reject|request_document)$")
    reason: str | None = None
    message: str | None = None


class InvitationVerifyResponse(BaseModel):
    valid: bool
    role: str | None = None
    phone_or_email: str | None = None
    expires_at: datetime | None = None
    reason: str | None = None


class InvitationAcceptRequest(BaseModel):
    token: str
    method: str = Field(pattern="^(email|phone|google)$")
    email: str | None = None
    password: str | None = None
    phone: str | None = None
    otp_code: str | None = None
    id_token: str | None = None


class NotificationSettingsUpdate(BaseModel):
    channels_enabled: dict[str, bool] = Field(
        default_factory=lambda: {"push": True, "sms": True, "email": True, "in_app": True}
    )
    followup_delay_minutes: int = Field(default=30, ge=5, le=1440)
    max_attempts: int = Field(default=3, ge=1, le=10)
    quiet_start: str = Field(default="22:00", pattern=r"^\d{2}:\d{2}$")
    quiet_end: str = Field(default="07:00", pattern=r"^\d{2}:\d{2}$")


class NotificationSettingsRead(NotificationSettingsUpdate):
    updated_at: datetime | None = None


class PlatformHealthResponse(BaseModel):
    status: str = "healthy"
    accounts: dict[str, Any]
    notifications: dict[str, Any]
    clinical: dict[str, Any]
    timestamp: datetime
