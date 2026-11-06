"""SQLAlchemy models for Domain Monitoring, Alerts, and Preferences."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class AlertRule(Base):
    """Configurable alert rules administered centrally."""

    __tablename__ = "alert_rules"
    __table_args__ = (Index("ix_alert_rules_code", "code"),)

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parameters: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False)  # urgent, high, normal
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class Alert(Base):
    """Generated clinical alert for a followed child within an establishment."""

    __tablename__ = "alerts"
    __table_args__ = (
        Index("ix_alerts_org_status_priority", "organization_id", "status", "priority"),
        Index("ix_alerts_person_rule_status", "person_id", "rule_code", "status"),
        Index("ix_alerts_opened_at", "opened_at"),
    )

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    person_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False
    )
    organization_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    rule_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False
    )
    rule_code: Mapped[str] = mapped_column(String(50), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False)  # urgent, high, normal
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)  # open, handled
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    opened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    handled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    handled_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    handling_notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    rule: Mapped[AlertRule] = relationship("AlertRule", lazy="joined")


class NotificationPreference(Base):
    """Notification and reminder preferences configured per user or person."""

    __tablename__ = "notification_preferences"
    __table_args__ = (
        Index("ix_notif_pref_user_person", "user_id", "person_id", "notification_type"),
    )

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    person_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=True
    )
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)  # reminders, alerts
    channel: Mapped[str] = mapped_column(String(20), nullable=False)  # in_app, push, sms, email
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
