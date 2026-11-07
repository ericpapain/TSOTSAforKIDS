"""SQLAlchemy 2 models for Domain E ORKG synchronization and recipes."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON as GenericJSON

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7

JSONType = JSON().with_variant(GenericJSON, "sqlite")


class Recipe(Base):
    """Dish recipe extracted from ORKG Type B comparisons."""

    __tablename__ = "recipes"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    dish_food_id: Mapped[str] = mapped_column(
        BinaryUUID,
        ForeignKey("foods.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    region_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("regions.id"), nullable=True
    )
    source_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("sources.id"), nullable=True
    )
    batch_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("import_batches.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(30), default="to_review", nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    ingredients: Mapped[list[RecipeIngredient]] = relationship(
        "RecipeIngredient", cascade="all, delete-orphan", back_populates="recipe"
    )


class RecipeIngredient(Base):
    """Single ingredient and proportion (%) inside a dish recipe."""

    __tablename__ = "recipe_ingredients"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    recipe_id: Mapped[str] = mapped_column(
        BinaryUUID,
        ForeignKey("recipes.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    ingredient_food_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("foods.id"), nullable=False
    )
    proportion_pct: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    importance: Mapped[str | None] = mapped_column(String(30), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    recipe: Mapped[Recipe] = relationship("Recipe", back_populates="ingredients")


class OrkgComparison(Base):
    """Registry entry for an ORKG comparison (composition or recipe)."""

    __tablename__ = "orkg_comparisons"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    comparison_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False)  # composition / recipe
    nutrient_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("nutrients.id"), nullable=True
    )
    nutrient_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    region_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("regions.id"), nullable=True
    )
    region_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    basis: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
    replaced_by: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class OrkgSnapshot(Base):
    """Recorded snapshot of an ORKG comparison fetch for traceability and fallback."""

    __tablename__ = "orkg_snapshots"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    comparison_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True, nullable=False
    )
    method: Mapped[str] = mapped_column(String(30), nullable=False)  # api / manual_csv / snapshot
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    raw_file: Mapped[str] = mapped_column(String(500), nullable=False)
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONType, nullable=True)
    batch_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("import_batches.id"), nullable=True
    )
    alert_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
