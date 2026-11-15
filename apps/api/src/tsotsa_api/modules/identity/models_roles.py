"""SQLAlchemy 2 declarative models for Roles, Permissions, and Delegations."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7

if TYPE_CHECKING:
    from tsotsa_api.modules.identity.models import User


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
    role_permissions: Mapped[list[RolePermission]] = relationship(back_populates="role")

    __table_args__ = (
        CheckConstraint(
            "code IN ('admin', 'super_caregiver', 'caregiver', 'field_agent', 'parent', 'user')",
            name="ck_roles_code",
        ),
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

    user: Mapped[User] = relationship(back_populates="user_roles")  # noqa: F821
    role: Mapped[Role] = relationship(back_populates="user_roles")


class Permission(Base):
    """Granular system permission (stable string codes)."""

    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    role_permissions: Mapped[list[RolePermission]] = relationship(back_populates="permission")
    grants: Mapped[list[PermissionGrant]] = relationship(back_populates="permission")


class RolePermission(Base):
    """Default permissions associated with a role."""

    __tablename__ = "role_permissions"

    role_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    permission_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True
    )
    is_default: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    role: Mapped[Role] = relationship(back_populates="role_permissions")
    permission: Mapped[Permission] = relationship(back_populates="role_permissions")


class PermissionGrant(Base):
    """Delegated or custom permission grant per user with immutable audit trail."""

    __tablename__ = "permission_grants"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    permission_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    granted_by: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=False, index=True
    )
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    valid_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    valid_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    user: Mapped[User] = relationship("User", foreign_keys=[user_id])  # noqa: F821
    grantor: Mapped[User] = relationship("User", foreign_keys=[granted_by])  # noqa: F821
    permission: Mapped[Permission] = relationship(back_populates="grants")

    __table_args__ = (
        Index("ix_permission_grants_active", "user_id", "permission_id", "is_active"),
    )
