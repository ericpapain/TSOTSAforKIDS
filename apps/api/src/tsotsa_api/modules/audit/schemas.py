"""Pydantic schemas for Domain L (Audit log)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    """Representation of an audit log entry."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_user_id: str | None = None
    action: str
    entity: str
    entity_id: str | None = None
    organization_id: str | None = None
    at: datetime
    ip: str | None = None
    details: dict[str, Any] | None = None
