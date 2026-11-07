"""Pydantic schemas for Domain J: Notifications, Preferences, and Tokens."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class NotificationPreferenceRead(BaseModel):
    """Notification preference representation."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    person_id: str | None = None
    notification_type: str
    channel: str
    enabled: bool
    quiet_start: str | None = None
    quiet_end: str | None = None


class NotificationPreferenceSetRequest(BaseModel):
    """Request to configure a notification preference."""

    person_id: str | None = None
    notification_type: str = Field(
        ...,
        description="Type: reminder, reminder_followup, intake_confirmed, clinical_alert, etc.",
    )
    channel: str = Field("push", description="'push', 'sms', 'email', 'in_app'")
    enabled: bool = True
    quiet_start: str | None = Field(None, description="Début des heures calmes HH:MM (ex: '22:00')")
    quiet_end: str | None = Field(None, description="Fin des heures calmes HH:MM (ex: '07:00')")

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        valid = {"push", "sms", "email", "in_app"}
        if v.lower() not in valid:
            raise ValueError(f"Canal invalide : {v}. Valeurs autorisées : {sorted(valid)}")
        return v.lower()


class DeviceTokenCreate(BaseModel):
    """Payload to register an Expo push device token."""

    platform: str = Field(..., description="'android', 'ios', ou 'web'")
    expo_push_token: str = Field(..., description="Jeton Expo Push (ex. 'ExponentPushToken[...]')")

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        valid = {"android", "ios", "web"}
        if v.lower() not in valid:
            raise ValueError(f"Plateforme invalide : {v}. Valeurs autorisées : {sorted(valid)}")
        return v.lower()


class DeviceTokenRead(BaseModel):
    """Public read model for registered device tokens."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    platform: str
    expo_push_token: str
    last_seen_at: datetime
    revoked_at: datetime | None = None


class InAppNotificationRead(BaseModel):
    """Notification item displayed in the user notification center."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    person_id: str | None = None
    schedule_id: str | None = None
    type: str
    channel: str
    title: str
    body: str
    payload: dict[str, Any] | None = None
    scheduled_for: datetime
    sent_at: datetime | None = None
    read_at: datetime | None = None
    created_at: datetime


class NotificationTemplateRead(BaseModel):
    """Administered notification template."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    language: str
    title: str
    body: str
    updated_at: datetime


class NotificationTemplateUpdate(BaseModel):
    """Update payload for a notification template."""

    title: str | None = None
    body: str | None = None


class NotificationStatsResponse(BaseModel):
    """High-level metrics for notification deliveries."""

    total_sent: int = 0
    total_queued: int = 0
    total_failed: int = 0
    total_cancelled: int = 0
    total_delivered: int = 0


class NotificationLogItem(BaseModel):
    """Transmission log row for administrative auditing."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    person_id: str | None = None
    type: str
    channel: str
    status: str
    scheduled_for: datetime
    sent_at: datetime | None = None
    attempts: int
    dedupe_key: str
