"""Service layer for staff lifecycle (validation, suspension, deletion, and management)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.core.errors import AppException, ForbiddenError, NotFoundError
from tsotsa_api.modules.identity.models import (
    Role,
    User,
    UserRole,
)
from tsotsa_api.modules.identity.permissions_service import PermissionsService


class StaffService:
    """Business logic for Staff validation, status updates, and soft deletion."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.permissions = PermissionsService(session)

    async def _require_perm(self, actor: User, perm: str) -> None:
        perms = await self.permissions.get_effective_permissions(actor.id)
        if perm not in perms:
            raise ForbiddenError(f"Droit insuffisant : '{perm}' requis pour cette action.")

    async def list_pending_staff(self, actor: User) -> list[User]:
        """List all pending caregivers and field agents awaiting validation."""
        await self._require_perm(actor, "staff.validate")
        stmt = (
            select(User)
            .options(
                selectinload(User.user_roles).selectinload(UserRole.role),
                selectinload(User.caregiver_profile),
                selectinload(User.field_agent_profile),
            )
            .where(User.status == "pending", User.deleted_at.is_(None))
            .order_by(User.created_at.desc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def validate_staff(
        self,
        actor: User,
        target_user_id: str,
        decision: str,
        refusal_reason: str | None = None,
    ) -> User:
        """Approve or reject a pending caregiver or field agent."""
        await self._require_perm(actor, "staff.validate")

        if decision not in ("approved", "rejected"):
            raise AppException(
                status_code=400,
                code="INVALID_DECISION",
                message="Décision invalide ('approved' ou 'rejected').",
            )

        if decision == "rejected" and not refusal_reason:
            raise AppException(
                status_code=400,
                code="REASON_REQUIRED",
                message="Le motif de refus est obligatoire.",
            )

        stmt = (
            select(User)
            .options(
                selectinload(User.caregiver_profile),
                selectinload(User.field_agent_profile),
            )
            .where(User.id == target_user_id, User.deleted_at.is_(None))
        )
        res = await self.session.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            raise NotFoundError("Compte utilisateur introuvable.")

        now = datetime.now(UTC)
        if decision == "approved":
            user.status = "active"
            user.refusal_reason = None
            if user.caregiver_profile:
                user.caregiver_profile.verification_status = "approved"
                user.caregiver_profile.verified_by = actor.id
                user.caregiver_profile.verified_at = now
            if user.field_agent_profile:
                user.field_agent_profile.verification_status = "approved"
                user.field_agent_profile.verified_by = actor.id
                user.field_agent_profile.verified_at = now
        else:
            user.status = "refused"
            user.refusal_reason = refusal_reason
            if user.caregiver_profile:
                user.caregiver_profile.verification_status = "rejected"
                user.caregiver_profile.refusal_reason = refusal_reason
                user.caregiver_profile.verified_by = actor.id
                user.caregiver_profile.verified_at = now
            if user.field_agent_profile:
                user.field_agent_profile.verification_status = "rejected"
                user.field_agent_profile.refusal_reason = refusal_reason
                user.field_agent_profile.verified_by = actor.id
                user.field_agent_profile.verified_at = now

        user.updated_at = now
        await self.session.flush()
        return user

    async def _count_active_admins(self) -> int:
        stmt = (
            select(func.count(User.id))
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                Role.code == "admin",
                User.status == "active",
                User.deleted_at.is_(None),
            )
        )
        res = await self.session.execute(stmt)
        return res.scalar_one() or 0

    async def suspend_user(
        self, actor: User, target_user_id: str, reason: str | None = None
    ) -> User:
        """Suspend a user account while prohibiting suspension of the last admin."""
        await self._require_perm(actor, "accounts.delete")
        user = await self.session.get(User, target_user_id)
        if not user or user.deleted_at is not None:
            raise NotFoundError("Compte utilisateur introuvable.")

        # Check if target is admin
        roles_stmt = select(Role.code).join(UserRole).where(UserRole.user_id == target_user_id)
        res = await self.session.execute(roles_stmt)
        target_roles = list(res.scalars().all())

        if "admin" in target_roles and user.status == "active":
            if await self._count_active_admins() <= 1:
                raise AppException(
                    code="CANNOT_DELETE_LAST_ADMIN",
                    message="Impossible de suspendre le dernier administrateur actif.",
                    status_code=400,
                )

        user.status = "suspended"
        user.refusal_reason = reason
        user.updated_at = datetime.now(UTC)
        await self.session.flush()
        return user

    async def soft_delete_user(
        self, actor: User, target_user_id: str, reason: str | None = None
    ) -> User:
        """Soft-delete a user account while prohibiting deletion of the last admin."""
        await self._require_perm(actor, "accounts.delete")
        user = await self.session.get(User, target_user_id)
        if not user or user.deleted_at is not None:
            raise NotFoundError("Compte utilisateur introuvable.")

        roles_stmt = select(Role.code).join(UserRole).where(UserRole.user_id == target_user_id)
        res = await self.session.execute(roles_stmt)
        target_roles = list(res.scalars().all())

        if "admin" in target_roles and user.status == "active":
            if await self._count_active_admins() <= 1:
                raise AppException(
                    code="CANNOT_DELETE_LAST_ADMIN",
                    message="Impossible de supprimer le dernier administrateur actif.",
                    status_code=400,
                )

        now = datetime.now(UTC)
        user.status = "deleted"
        user.deleted_at = now
        user.deleted_by = actor.id
        user.refusal_reason = reason
        user.updated_at = now
        await self.session.flush()
        return user
