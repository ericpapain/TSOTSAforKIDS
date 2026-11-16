"""SQLAlchemy 2 declarative models for Domain A (Identity and Access)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.modules.identity.models_roles import (
    Permission,
    PermissionGrant,
    Role,
    RolePermission,
    UserRole,
)
from tsotsa_api.modules.identity.models_staff import (
    CaregiverProfile,
    FieldAgentProfile,
    Invitation,
)
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class User(Base):
    """User account entity representing a person authenticating to the system."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    display_name: Mapped[str] = mapped_column(String(150), nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="fr", nullable=False)
    preferred_locale: Mapped[str] = mapped_column(
        Enum("fr", "en", name="user_preferred_locale_enum"),
        default="fr",
        server_default="fr",
        nullable=False,
    )
    preferred_region_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("regions.id"), nullable=True, index=True
    )
    locality: Mapped[str | None] = mapped_column(String(150), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    refusal_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[str | None] = mapped_column(
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

    identities: Mapped[list[UserIdentity]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    user_roles: Mapped[list[UserRole]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    caregiver_profile: Mapped[CaregiverProfile | None] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="CaregiverProfile.user_id",
    )
    field_agent_profile: Mapped[FieldAgentProfile | None] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="FieldAgentProfile.user_id",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'active', 'refused', 'suspended', 'deleted', 'invited')",
            name="ck_users_status",
        ),
    )


class UserIdentity(Base):
    """Authentication provider identity linked to a user account."""

    __tablename__ = "user_identities"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    provider_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    phone_e164: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    phone_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
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

    user: Mapped[User] = relationship(back_populates="identities")
    email_tokens: Mapped[list[EmailToken]] = relationship(
        back_populates="user_identity", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("provider", "provider_subject", name="uq_user_identities_provider_sub"),
        CheckConstraint("provider IN ('google', 'phone', 'email')", name="ck_user_identities_prov"),
    )


class OtpCode(Base):
    """SMS one-time password code records."""

    __tablename__ = "otp_codes"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    phone_e164: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    __table_args__ = (Index("ix_otp_codes_phone_expires", "phone_e164", "expires_at"),)


class EmailToken(Base):
    """Single-use email verification and password reset tokens."""

    __tablename__ = "email_tokens"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    user_identity_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("user_identities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    purpose: Mapped[str] = mapped_column(String(30), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    user_identity: Mapped[UserIdentity] = relationship(back_populates="email_tokens")

    __table_args__ = (
        CheckConstraint("purpose IN ('verify', 'reset')", name="ck_email_tokens_purpose"),
    )


class RefreshToken(Base):
    """Long-lived refresh token session records."""

    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    device_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="refresh_tokens")


__all__ = [
    "CaregiverProfile",
    "EmailToken",
    "FieldAgentProfile",
    "Invitation",
    "OtpCode",
    "Permission",
    "PermissionGrant",
    "RefreshToken",
    "Role",
    "RolePermission",
    "User",
    "UserIdentity",
    "UserRole",
]
