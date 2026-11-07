"""SQLAlchemy models for Domain H (Pricing)."""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class PriceRecord(Base):
    """Recorded observation of food or product market price in a specific region."""

    __tablename__ = "price_records"
    __table_args__ = (
        Index(
            "ix_price_records_lookup",
            "region_id",
            "item_type",
            "food_id",
            "product_id",
            "observed_at",
        ),
    )

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    region_id: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("regions.id"), nullable=False)
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'food' or 'product'
    food_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("foods.id", ondelete="CASCADE"), nullable=True, index=True
    )
    product_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True
    )
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="FCFA", nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)  # kg, sachet, boîte, 100g
    observed_at: Mapped[date] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    entered_by: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
