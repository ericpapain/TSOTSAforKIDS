"""SQLAlchemy 2 models for Domain L (Audit log)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON as GenericJSON

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7

JSONType = JSON().with_variant(GenericJSON, "sqlite")


class AuditLog(Base):
    """Immutable audit trail of accesses and modifications to health data."""

    __tablename__ = "audit_log"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    actor_user_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    entity: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    organization_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("organizations.id"), nullable=True, index=True
    )
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    details: Mapped[dict[str, Any] | None] = mapped_column(JSONType, nullable=True)

    __table_args__ = (
        Index("ix_audit_log_actor_at", "actor_user_id", "at"),
        Index("ix_audit_log_entity_id", "entity", "entity_id"),
        Index("ix_audit_log_org_at", "organization_id", "at"),
    )
