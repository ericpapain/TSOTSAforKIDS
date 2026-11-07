"""Pydantic schemas for Domain B modules registry and application settings."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

ModuleStatus = Literal["active", "coming_soon", "disabled"]


class ModuleRead(BaseModel):
    """Public representation of a platform module read by mobile and web apps."""

    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    status: ModuleStatus
    sort_order: int
    updated_at: datetime


class ModuleCreate(BaseModel):
    """Payload to register a new module in the platform registry."""

    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=150)
    status: ModuleStatus = "coming_soon"
    sort_order: int = Field(default=10, ge=1)


class ModuleUpdate(BaseModel):
    """Payload for administration to activate, mark coming_soon, or disable a module."""

    name: str | None = Field(default=None, min_length=2, max_length=150)
    status: ModuleStatus | None = None
    sort_order: int | None = Field(default=None, ge=1)


class AppSettingRead(BaseModel):
    """Representation of an application setting."""

    model_config = ConfigDict(from_attributes=True)

    key: str
    value: dict[str, Any]
    updated_by: str | None = None
    updated_at: datetime


class AppSettingUpdate(BaseModel):
    """Payload to update an application setting."""

    value: dict[str, Any]
