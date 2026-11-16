"""Repository layer for Permissions and Delegations."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.identity.models_roles import (
    Permission,
    PermissionGrant,
    Role,
    RolePermission,
    UserRole,
)


class PermissionsRepository:
    """Database interactions for Permissions and delegated Grants."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_user_permissions(self, user_id: str) -> set[str]:
        """Fetch all effective permission codes for a user (role defaults + active grants)."""
        now = datetime.now(UTC)

        # 1. Default permissions from assigned roles
        role_perm_stmt = (
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        )
        role_res = await self.session.execute(role_perm_stmt)
        role_perms = set(role_res.scalars().all())

        # 2. Directly granted delegated permissions
        grant_stmt = (
            select(Permission.code)
            .join(PermissionGrant, PermissionGrant.permission_id == Permission.id)
            .where(
                PermissionGrant.user_id == user_id,
                PermissionGrant.is_active.is_(True),
                PermissionGrant.valid_from <= now,
                (PermissionGrant.valid_to.is_(None) | (PermissionGrant.valid_to > now)),
            )
        )
        grant_res = await self.session.execute(grant_stmt)
        granted_perms = set(grant_res.scalars().all())

        return role_perms | granted_perms

    async def get_permission_by_code(self, code: str) -> Permission | None:
        """Fetch permission entity by stable string code."""
        stmt = select(Permission).where(Permission.code == code)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_permissions(self) -> list[Permission]:
        """List all canonical permissions."""
        stmt = select(Permission).order_by(Permission.code)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def grant_permission(
        self,
        user_id: str,
        permission_id: str,
        granted_by_id: str,
        reason: str | None = None,
        valid_to: datetime | None = None,
    ) -> PermissionGrant:
        """Create a new delegated permission grant record."""
        grant = PermissionGrant(
            user_id=user_id,
            permission_id=permission_id,
            granted_by=granted_by_id,
            reason=reason,
            valid_from=datetime.now(UTC),
            valid_to=valid_to,
            is_active=True,
        )
        self.session.add(grant)
        await self.session.flush()
        return grant

    async def revoke_permission(self, user_id: str, permission_id: str) -> int:
        """Deactivate all active grants for a user and permission."""
        stmt = (
            update(PermissionGrant)
            .where(
                PermissionGrant.user_id == user_id,
                PermissionGrant.permission_id == permission_id,
                PermissionGrant.is_active.is_(True),
            )
            .values(is_active=False)
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        count = getattr(res, "rowcount", 0)
        return int(count) if count is not None else 0

    async def list_user_grants(self, user_id: str) -> list[PermissionGrant]:
        """List active and historical permission grants for a specific user."""
        stmt = (
            select(PermissionGrant)
            .options(
                selectinload(PermissionGrant.permission),
                selectinload(PermissionGrant.grantor),
            )
            .where(PermissionGrant.user_id == user_id)
            .order_by(PermissionGrant.created_at.desc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
