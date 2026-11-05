"""SQLAlchemy 2 models for Domain E (Food Database) and Domain B (Regions)."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
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


class Region(Base):
    """Geographical region entity for food provenance and availability."""

    __tablename__ = "regions"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country_code: Mapped[str] = mapped_column(String(10), default="CMR", nullable=False)


class FoodCategory(Base):
    """Category classification for foods (cereale, legumineuse, etc.)."""

    __tablename__ = "food_categories"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)


class FoodGroup(Base):
    """Nutritional diversity group classification."""

    __tablename__ = "food_groups"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)


class Food(Base):
    """Food item entity (prepared dish, ingredient, or raw item)."""

    __tablename__ = "foods"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    kind: Mapped[str] = mapped_column(String(30), default="dish", nullable=False)
    scientific_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    category_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("food_categories.id"), nullable=True
    )
    food_group_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("food_groups.id"), nullable=True
    )
    state: Mapped[str | None] = mapped_column(String(50), nullable=True)  # cru, cuit, séché
    status: Mapped[str] = mapped_column(
        String(30), default="draft", nullable=False
    )  # draft, to_review, published, rejected
    photo_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    root_food_id: Mapped[str | None] = mapped_column(BinaryUUID, nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    category: Mapped[FoodCategory | None] = relationship("FoodCategory")
    food_group: Mapped[FoodGroup | None] = relationship("FoodGroup")
    names: Mapped[list[FoodName]] = relationship(
        "FoodName", cascade="all, delete-orphan", back_populates="food"
    )
    regions: Mapped[list[FoodRegion]] = relationship(
        "FoodRegion", cascade="all, delete-orphan", back_populates="food"
    )
    nutrient_values: Mapped[list[FoodNutrientValue]] = relationship(
        "FoodNutrientValue", cascade="all, delete-orphan", back_populates="food"
    )


class FoodName(Base):
    """Local or vernacular name for a food."""

    __tablename__ = "food_names"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    food_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False
    )
    language_or_dialect: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    food: Mapped[Food] = relationship("Food", back_populates="names")


class FoodRegion(Base):
    """Association of a food item with a geographic availability region."""

    __tablename__ = "food_regions"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    food_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False
    )
    region_id: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("regions.id"), nullable=False)
    availability: Mapped[str] = mapped_column(String(50), default="toute l'année", nullable=False)
    season_months: Mapped[str | None] = mapped_column(String(50), nullable=True)

    food: Mapped[Food] = relationship("Food", back_populates="regions")
    region: Mapped[Region] = relationship("Region")


class Source(Base):
    """Bibliographic or ORKG provenance source record."""

    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    orkg_comparison_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    orkg_comparison_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    orkg_contribution_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    orkg_contribution_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    paper_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    article_reference: Mapped[str | None] = mapped_column(String(500), nullable=True)
    doi: Mapped[str | None] = mapped_column(String(150), nullable=True)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    licence: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class ImportBatch(Base):
    """Batch container for ingested foods and nutrient compositions."""

    __tablename__ = "import_batches"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(30), nullable=False)  # xlsx, csv, manual, orkg
    status: Mapped[str] = mapped_column(
        String(30), default="draft", nullable=False
    )  # draft, to_review, published, rejected
    created_by: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("users.id"), nullable=False)
    reviewed_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    control_report: Mapped[dict[str, Any] | None] = mapped_column(JSONType, nullable=True)
    column_mapping: Mapped[dict[str, str] | None] = mapped_column(JSONType, nullable=True)
    rows_valid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rows_error: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rows_warning: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    rows: Mapped[list[ImportBatchRow]] = relationship(
        "ImportBatchRow", cascade="all, delete-orphan", back_populates="batch"
    )


class ImportBatchRow(Base):
    """Raw data row captured during batch file ingestion."""

    __tablename__ = "import_batch_rows"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    batch_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False
    )
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_data: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="valid", nullable=False
    )  # valid, error, warning
    messages: Mapped[list[str] | None] = mapped_column(JSONType, nullable=True)

    batch: Mapped[ImportBatch] = relationship("ImportBatch", back_populates="rows")


class FoodNutrientValue(Base):
    """Measured or estimated nutrient composition per 100g."""

    __tablename__ = "food_nutrient_values"
    __table_args__ = (
        Index("ix_food_nutrient_lookup", "nutrient_id", "is_current", "value_per_100g"),
    )

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    food_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False
    )
    nutrient_id: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("nutrients.id"), nullable=False)
    value_per_100g: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    basis: Mapped[str] = mapped_column(
        String(50), default="poids frais", nullable=False
    )  # poids frais, matière sèche
    sample_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_estimated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    source_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("sources.id"), nullable=True
    )
    batch_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("import_batches.id"), nullable=True
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    entered_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    reviewed_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    food: Mapped[Food] = relationship("Food", back_populates="nutrient_values")
    source: Mapped[Source | None] = relationship("Source")
