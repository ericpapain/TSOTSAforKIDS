"""Service layer enforcing rules for permission grants and delegations."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import AppException, ForbiddenError, NotFoundError
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.models_roles import Permission, PermissionGrant
from tsotsa_api.modules.identity.permissions_repo import PermissionsRepository
from tsotsa_api.modules.identity.repository import IdentityRepository


class PermissionsService:
    """Business logic for permission checks and delegated grants."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.perm_repo = PermissionsRepository(session)
        self.id_repo = IdentityRepository(session)

    async def get_effective_permissions(self, user_id: str) -> set[str]:
        """Get set of all active permission codes for a user."""
        return await self.perm_repo.get_user_permissions(user_id)

    async def has_permission(self, user_id: str, permission_code: str) -> bool:
        """Check if user holds a specific permission code."""
        perms = await self.get_effective_permissions(user_id)
        return permission_code in perms

    async def list_permissions(self) -> list[Permission]:
        """List all canonical system permissions."""
        return await self.perm_repo.list_permissions()

    async def list_user_grants(self, user_id: str) -> list[PermissionGrant]:
        """List all delegated grants for a target user."""
        return await self.perm_repo.list_user_grants(user_id)

    async def grant_permission(
        self,
        actor: User,
        target_user_id: str,
        permission_code: str,
        reason: str | None = None,
        valid_to: datetime | None = None,
    ) -> PermissionGrant:
        """Delegate a permission from actor to target user following security rules."""
        if actor.id == target_user_id:
            raise AppException(
                status_code=400, code="SELF_GRANT_FORBIDDEN", message="Auto-attribution interdite."
            )

        # 1. Actor must have permissions.manage
        actor_perms = await self.get_effective_permissions(actor.id)
        if "permissions.manage" not in actor_perms:
            raise ForbiddenError("Droit 'permissions.manage' requis pour déléguer des droits.")

        # 2. Actor cannot grant a permission they don't hold themselves
        if permission_code not in actor_perms:
            raise ForbiddenError(
                f"Impossible d'attribuer un droit que vous ne possédez pas ('{permission_code}')."
            )

        # 3. Check target user exists
        target_user = await self.id_repo.get_user_by_id(target_user_id)
        if not target_user:
            raise NotFoundError("Utilisateur cible non trouvé.")

        # 4. Super soignant rule: can only delegate to caregivers
        actor_roles = await self.id_repo.get_user_role_codes(actor.id)
        is_admin = "admin" in actor_roles
        target_roles = await self.id_repo.get_user_role_codes(target_user.id)

        if not is_admin:
            if "caregiver" not in target_roles:
                raise ForbiddenError(
                    "Les super soignants peuvent déléguer des droits uniquement à des soignants."
                )

        # 5. Retrieve permission entity
        perm = await self.perm_repo.get_permission_by_code(permission_code)
        if not perm:
            raise NotFoundError(f"Permission inconnue : '{permission_code}'.")

        return await self.perm_repo.grant_permission(
            user_id=target_user_id,
            permission_id=perm.id,
            granted_by_id=actor.id,
            reason=reason,
            valid_to=valid_to,
        )

    async def revoke_permission(
        self,
        actor: User,
        target_user_id: str,
        permission_code: str,
    ) -> int:
        """Revoke a delegated permission grant."""
        actor_perms = await self.get_effective_permissions(actor.id)
        if "permissions.manage" not in actor_perms:
            raise ForbiddenError("Droit 'permissions.manage' requis pour retirer des droits.")

        if permission_code not in actor_perms:
            raise ForbiddenError(
                f"Impossible de retirer un droit que vous ne possédez pas ('{permission_code}')."
            )

        actor_roles = await self.id_repo.get_user_role_codes(actor.id)
        is_admin = "admin" in actor_roles
        if not is_admin:
            target_roles = await self.id_repo.get_user_role_codes(target_user_id)
            if "caregiver" not in target_roles:
                raise ForbiddenError("Vous ne pouvez modifier que les droits des soignants.")

        perm = await self.perm_repo.get_permission_by_code(permission_code)
        if not perm:
            raise NotFoundError(f"Permission inconnue : '{permission_code}'.")

        return await self.perm_repo.revoke_permission(target_user_id, perm.id)
