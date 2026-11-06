"""SQLAlchemy 2 models for Domain B (Organizations)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class Organization(Base):
    """Health facility or partner organization entity (hospital, CMA, health center, NGO)."""

    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    region_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("regions.id"), nullable=True, index=True
    )
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
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

    __table_args__ = (
        CheckConstraint(
            "type IN ('hopital', 'cma', 'centre_de_sante', 'ong')",
            name="ck_organizations_type",
        ),
        CheckConstraint(
            "status IN ('active', 'inactive')",
            name="ck_organizations_status",
        ),
    )
