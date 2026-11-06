"""SQLAlchemy models for Domain I (Intakes / Prises de nourriture)."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class Intake(Base):
    """Record of a nutrient/food intake taken by a followed person.

    Uses a client/phone generated UUID for offline sync idempotence.
    """

    __tablename__ = "intakes"
    __table_args__ = (Index("ix_intakes_person_taken_at", "person_id", "taken_at"),)

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    person_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'product' or 'food'
    product_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True
    )
    food_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("foods.id", ondelete="CASCADE"), nullable=True, index=True
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)  # sachet, g, ml
    taken_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumption: Mapped[str] = mapped_column(String(20), nullable=False)  # all, half, refused
    origin: Mapped[str] = mapped_column(String(20), default="app", nullable=False)  # app, late
    schedule_time_id: Mapped[str | None] = mapped_column(BinaryUUID, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    recorded_by: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
