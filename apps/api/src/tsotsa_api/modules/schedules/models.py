"""SQLAlchemy models for Domain J: Intake Schedules and Times."""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class IntakeSchedule(Base):
    """Prescribed intake schedule created by a verified caregiver."""

    __tablename__ = "intake_schedules"
    __table_args__ = (Index("ix_intake_schedules_person", "person_id", "status"),)

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    person_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    product_id: Mapped[str | None] = mapped_column(BinaryUUID, nullable=True)
    food_id: Mapped[str | None] = mapped_column(BinaryUUID, nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)  # sachet, g, ml
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False
    )  # active, paused, cancelled
    origin: Mapped[str] = mapped_column(
        String(30), default="manual", nullable=False
    )  # manual, optimization
    timezone: Mapped[str] = mapped_column(String(50), default="Africa/Douala", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    schedule_times: Mapped[list[ScheduleTime]] = relationship(
        "ScheduleTime",
        back_populates="schedule",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ScheduleTime(Base):
    """Specific local time slot for an intake schedule."""

    __tablename__ = "schedule_times"
    __table_args__ = (Index("ix_schedule_times_schedule", "schedule_id", "enabled"),)

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    schedule_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("intake_schedules.id", ondelete="CASCADE"), nullable=False
    )
    local_time: Mapped[str] = mapped_column(String(5), nullable=False)  # HH:MM
    days_of_week: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    schedule: Mapped[IntakeSchedule] = relationship(
        "IntakeSchedule", back_populates="schedule_times"
    )
