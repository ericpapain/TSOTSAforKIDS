"""SQLAlchemy 2 declarative models for Domain A (Identity and Access)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""


class User(Base):
    """User account entity representing a person authenticating to the system."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    display_name: Mapped[str] = mapped_column(String(150), nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="fr", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
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

    __table_args__ = (
        CheckConstraint("status IN ('active', 'invited', 'suspended')", name="ck_users_status"),
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


class Role(Base):
    """Role definition entity."""

    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    user_roles: Mapped[list[UserRole]] = relationship(back_populates="role")

    __table_args__ = (
        CheckConstraint("code IN ('user', 'caregiver', 'admin')", name="ck_roles_code"),
    )


class UserRole(Base):
    """Many-to-many relationship linking users to roles."""

    __tablename__ = "user_roles"

    user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="user_roles")
    role: Mapped[Role] = relationship(back_populates="user_roles")


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


class CaregiverProfile(Base):
    """Professional medical caregiver profile with verification state."""

    __tablename__ = "caregiver_profiles"

    user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    organization_id: Mapped[str | None] = mapped_column(BinaryUUID, nullable=True, index=True)
    licence_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    document_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
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

    user: Mapped[User] = relationship(back_populates="caregiver_profile", foreign_keys=[user_id])

    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('pending', 'approved', 'rejected')",
            name="ck_caregiver_status",
        ),
    )


class Invitation(Base):
    """Direct account invitation created by administration."""

    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    created_by: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    organization_id: Mapped[str | None] = mapped_column(BinaryUUID, nullable=True)
    phone_or_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
