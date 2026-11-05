"""SQLAlchemy 2 models for Domain F (Products) and Domain L (Audit Log)."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON as GenericJSON

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7

JSONType = JSON().with_variant(GenericJSON, "sqlite")


class Product(Base):
    """Reference therapeutic product or user-submitted custom product."""

    __tablename__ = "products"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    type: Mapped[str] = mapped_column(String(30), index=True, nullable=False)  # reference, custom
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    base: Mapped[str] = mapped_column(String(20), default="100g", nullable=False)  # 100g, 100ml
    usage: Mapped[str | None] = mapped_column(String(30), nullable=True)  # hospital, home
    owner_user_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), index=True, nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), index=True, nullable=False
    )  # reference: to_enter, to_validate, validated | custom: private, published
    source_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("sources.id"), nullable=True
    )
    source_reference: Mapped[str | None] = mapped_column(String(500), nullable=True)
    unit_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    label_photo_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    validated_by: Mapped[str | None] = mapped_column(
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

    nutrient_values: Mapped[list[ProductNutrientValue]] = relationship(
        "ProductNutrientValue", cascade="all, delete-orphan", back_populates="product"
    )
    essential_nutrients: Mapped[list[ProductEssentialNutrient]] = relationship(
        "ProductEssentialNutrient", cascade="all, delete-orphan", back_populates="product"
    )


class ProductNutrientValue(Base):
    """Nutrient specification (single value or range) per 100g/100ml of product."""

    __tablename__ = "product_nutrient_values"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    product_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nutrient_id: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("nutrients.id"), nullable=False)
    nutrient_code: Mapped[str] = mapped_column(String(50), nullable=False)
    nutrient_name: Mapped[str] = mapped_column(String(150), nullable=False)
    reference_unit: Mapped[str] = mapped_column(String(20), nullable=False)
    value_min: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    value_max: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    source_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("sources.id"), nullable=True
    )

    product: Mapped[Product] = relationship("Product", back_populates="nutrient_values")


class ProductEssentialNutrient(Base):
    """Default essential nutrient highlighted for equivalence comparison."""

    __tablename__ = "product_essential_nutrients"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    product_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nutrient_id: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("nutrients.id"), nullable=False)
    nutrient_code: Mapped[str] = mapped_column(String(50), nullable=False)

    product: Mapped[Product] = relationship("Product", back_populates="essential_nutrients")


class AuditLog(Base):
    """Immutable audit log entry tracing creations, modifications, and validations."""

    __tablename__ = "audit_log"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    actor_user_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), index=True, nullable=True
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    entity: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    entity_id: Mapped[str] = mapped_column(BinaryUUID, index=True, nullable=False)
    organization_id: Mapped[str | None] = mapped_column(BinaryUUID, nullable=True)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    details: Mapped[dict[str, Any] | None] = mapped_column(JSONType, nullable=True)
