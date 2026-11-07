"""SQLAlchemy 2 models for Domain D (Nutrients and Units)."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class Unit(Base):
    """Measurement unit representation (g, mg, kcal, etc.)."""

    __tablename__ = "units"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    kind: Mapped[str] = mapped_column(String(30), nullable=False)  # mass, energy, volume, portion
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    outgoing_conversions: Mapped[list[UnitConversion]] = relationship(
        "UnitConversion",
        foreign_keys="[UnitConversion.from_unit_id]",
        cascade="all, delete-orphan",
        back_populates="from_unit",
    )


class UnitConversion(Base):
    """Conversion factor between two measurement units."""

    __tablename__ = "unit_conversions"
    __table_args__ = (
        UniqueConstraint("from_unit_id", "to_unit_id", name="uq_unit_conversion_pair"),
    )

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    from_unit_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("units.id", ondelete="CASCADE"), nullable=False
    )
    to_unit_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("units.id", ondelete="CASCADE"), nullable=False
    )
    factor: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)

    from_unit: Mapped[Unit] = relationship("Unit", foreign_keys=[from_unit_id])
    to_unit: Mapped[Unit] = relationship("Unit", foreign_keys=[to_unit_id])


class Nutrient(Base):
    """Canonical nutrient or anti-nutrient definition."""

    __tablename__ = "nutrients"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name_fr: Mapped[str] = mapped_column(String(150), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(150), nullable=True)
    category: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # macro, mineral, vitamin, antinutrient
    reference_unit_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("units.id"), nullable=False
    )
    plausible_min: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    plausible_max: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    is_tracked: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    reference_unit: Mapped[Unit] = relationship("Unit")
    synonyms: Mapped[list[NutrientSynonym]] = relationship(
        "NutrientSynonym", cascade="all, delete-orphan", back_populates="nutrient"
    )


class NutrientSynonym(Base):
    """Alternative label or spelling for a canonical nutrient."""

    __tablename__ = "nutrient_synonyms"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    nutrient_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("nutrients.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(150), index=True, nullable=False)

    nutrient: Mapped[Nutrient] = relationship("Nutrient", back_populates="synonyms")
