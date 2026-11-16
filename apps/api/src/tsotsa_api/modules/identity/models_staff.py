"""SQLAlchemy 2 declarative models for Staff profiles (Caregivers, Field Agents, Invitations)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7

if TYPE_CHECKING:
    from tsotsa_api.modules.identity.models import User


class CaregiverProfile(Base):
    """Professional medical caregiver profile with verification state and facility link."""

    __tablename__ = "caregiver_profiles"

    user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    organization_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("organizations.id"), nullable=True, index=True
    )
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    speciality: Mapped[str | None] = mapped_column(String(150), nullable=True)
    order_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    licence_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    document_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    verification_notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    refusal_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verified_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    user: Mapped[User] = relationship(  # noqa: F821
        "User", back_populates="caregiver_profile", foreign_keys=[user_id]
    )

    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('pending', 'approved', 'rejected')",
            name="ck_caregiver_status",
        ),
    )


class FieldAgentProfile(Base):
    """Field agent profile for community workers registering families."""

    __tablename__ = "field_agent_profiles"

    user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    structure_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    verification_notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    refusal_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verified_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    user: Mapped[User] = relationship(  # noqa: F821
        "User", back_populates="field_agent_profile", foreign_keys=[user_id]
    )

    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('pending', 'approved', 'rejected')",
            name="ck_field_agent_status",
        ),
    )


class Invitation(Base):
    """Direct account invitation created by administration or staff."""

    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    created_by: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("users.id"), nullable=False)
    user_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    organization_id: Mapped[str | None] = mapped_column(BinaryUUID, nullable=True)
    phone_or_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    creator: Mapped[User] = relationship("User", foreign_keys=[created_by])  # noqa: F821
