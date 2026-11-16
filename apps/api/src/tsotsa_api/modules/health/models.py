"""SQLAlchemy models for Health and Well-Being Module."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class SymptomCatalog(Base):
    """Configurable catalog of symptoms, conditional questions, and danger signs."""

    __tablename__ = "symptom_catalog"
    __table_args__ = (
        Index("ix_symptom_catalog_category", "category"),
        Index("ix_symptom_catalog_danger", "is_danger_sign"),
    )

    code: Mapped[str] = mapped_column(String(50), primary_key=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    label_fr: Mapped[str] = mapped_column(String(150), nullable=False)
    label_en: Mapped[str] = mapped_column(String(150), nullable=False)
    is_danger_sign: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    conditional_questions: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class HealthEvent(Base):
    """Longitudinal health event and problem declaration for a followed child."""

    __tablename__ = "health_events"
    __table_args__ = (
        Index("ix_health_events_person_created", "person_id", "created_at"),
        Index("ix_health_events_org_status", "organization_id", "status"),
        Index("ix_health_events_priority", "priority"),
    )

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    person_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reported_by: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    organization_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    intake_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("intakes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    declaration_context: Mapped[str] = mapped_column(
        String(30), default="standalone", nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), default="submitted", nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)
    comment: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    symptoms: Mapped[list[HealthEventSymptom]] = relationship(
        "HealthEventSymptom",
        back_populates="health_event",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    assessments: Mapped[list[ClinicalAssessment]] = relationship(
        "ClinicalAssessment",
        back_populates="health_event",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    actions: Mapped[list[HealthEventAction]] = relationship(
        "HealthEventAction",
        back_populates="health_event",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class HealthEventSymptom(Base):
    """Detailed observed symptom associated with a health event."""

    __tablename__ = "health_event_symptoms"
    __table_args__ = (
        Index("ix_event_symptoms_event", "health_event_id"),
        Index("ix_event_symptoms_code", "symptom_code"),
    )

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    health_event_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("health_events.id", ondelete="CASCADE"), nullable=False
    )
    symptom_code: Mapped[str] = mapped_column(
        String(50), ForeignKey("symptom_catalog.code", ondelete="RESTRICT"), nullable=False
    )
    duration: Mapped[str] = mapped_column(String(30), nullable=False)
    duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recurrence_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    specific_metrics: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    health_event: Mapped[HealthEvent] = relationship("HealthEvent", back_populates="symptoms")
    catalog_item: Mapped[SymptomCatalog] = relationship("SymptomCatalog", lazy="joined")


class ClinicalAssessment(Base):
    """Healthcare professional evaluation and documentation on a child health event."""

    __tablename__ = "clinical_assessments"
    __table_args__ = (Index("ix_assessments_event", "health_event_id"),)

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    health_event_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("health_events.id", ondelete="CASCADE"), nullable=False
    )
    caregiver_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    clinical_notes: Mapped[str] = mapped_column(String(2000), nullable=False)
    suspected_condition: Mapped[str | None] = mapped_column(String(100), nullable=True)
    requires_investigation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    investigation_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    assessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    health_event: Mapped[HealthEvent] = relationship("HealthEvent", back_populates="assessments")


class HealthEventAction(Base):
    """Audit action trace and workflow milestones performed on a health event."""

    __tablename__ = "health_event_actions"
    __table_args__ = (Index("ix_actions_event", "health_event_id"),)

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    health_event_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("health_events.id", ondelete="CASCADE"), nullable=False
    )
    actor_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    details: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    health_event: Mapped[HealthEvent] = relationship("HealthEvent", back_populates="actions")
