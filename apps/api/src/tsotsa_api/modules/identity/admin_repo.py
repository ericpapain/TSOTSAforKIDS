"""Repository layer for identity administration: users, invitations, and caregivers."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.identity.models import (
    CaregiverProfile,
    Invitation,
    Role,
    User,
    UserIdentity,
    UserRole,
)


class IdentityAdminRepository:
    """SQLAlchemy access for administrative user management and invitations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_users(
        self,
        role: str | None = None,
        status: str | None = None,
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[Sequence[User], int]:
        stmt = (
            select(User)
            .options(
                selectinload(User.identities),
                selectinload(User.user_roles).selectinload(UserRole.role),
                selectinload(User.caregiver_profile),
            )
            .order_by(User.created_at.desc())
        )
        count_stmt = select(func.count(User.id))

        if role:
            stmt = stmt.join(User.user_roles).join(UserRole.role).where(Role.code == role)
            count_stmt = (
                count_stmt.join(User.user_roles).join(UserRole.role).where(Role.code == role)
            )
        if status:
            stmt = stmt.where(User.status == status)
            count_stmt = count_stmt.where(User.status == status)
        if search and search.strip():
            pat = f"%{search.strip().lower()}%"
            cond = or_(
                func.lower(User.display_name).like(pat),
                User.id.in_(
                    select(UserIdentity.user_id).where(
                        or_(
                            func.lower(UserIdentity.email).like(pat),
                            func.lower(UserIdentity.phone_e164).like(pat),
                        )
                    )
                ),
            )
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

        total_res = await self.session.execute(count_stmt)
        total = int(total_res.scalar_one() or 0)

        res = await self.session.execute(stmt.offset(offset).limit(limit))
        return res.scalars().all(), total

    async def set_user_status(self, user_id: str, new_status: str) -> User | None:
        stmt = select(User).where(User.id == user_id)
        res = await self.session.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            return None
        user.status = new_status
        user.updated_at = datetime.now(UTC)
        await self.session.flush()
        return user

    async def create_invitation(
        self,
        created_by: str,
        user_id: str,
        role: str,
        phone_or_email: str,
        token_hash: str,
        expires_at: datetime,
        organization_id: str | None = None,
    ) -> Invitation:
        inv = Invitation(
            created_by=created_by,
            user_id=user_id,
            role=role,
            phone_or_email=phone_or_email,
            token_hash=token_hash,
            expires_at=expires_at,
            organization_id=organization_id,
        )
        self.session.add(inv)
        await self.session.flush()
        return inv

    async def get_invitation_by_token_hash(self, token_hash: str) -> Invitation | None:
        stmt = select(Invitation).where(Invitation.token_hash == token_hash)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def mark_invitation_accepted(self, invitation_id: str) -> None:
        now = datetime.now(UTC)
        stmt = update(Invitation).where(Invitation.id == invitation_id).values(accepted_at=now)
        await self.session.execute(stmt)

    async def list_caregivers(
        self,
        status: str | None = None,
        organization_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[Sequence[CaregiverProfile], int]:
        stmt = (
            select(CaregiverProfile)
            .options(selectinload(CaregiverProfile.user))
            .order_by(CaregiverProfile.created_at.desc())
        )
        count_stmt = select(func.count(CaregiverProfile.user_id))
        if status:
            stmt = stmt.where(CaregiverProfile.verification_status == status)
            count_stmt = count_stmt.where(CaregiverProfile.verification_status == status)
        if organization_id:
            stmt = stmt.where(CaregiverProfile.organization_id == organization_id)
            count_stmt = count_stmt.where(CaregiverProfile.organization_id == organization_id)

        total_res = await self.session.execute(count_stmt)
        total = int(total_res.scalar_one() or 0)
        res = await self.session.execute(stmt.offset(offset).limit(limit))
        return res.scalars().all(), total

    async def update_caregiver_verification(
        self,
        user_id: str,
        status: str,
        verified_by: str | None = None,
        notes: str | None = None,
    ) -> CaregiverProfile | None:
        stmt = select(CaregiverProfile).where(CaregiverProfile.user_id == user_id)
        res = await self.session.execute(stmt)
        profile = res.scalar_one_or_none()
        if not profile:
            return None
        now = datetime.now(UTC)
        profile.verification_status = status
        if notes is not None:
            profile.verification_notes = notes
        if status == "approved":
            profile.verified_by = verified_by
            profile.verified_at = now
        profile.updated_at = now
        await self.session.flush()
        return profile

    async def get_user_stats(self) -> dict[str, Any]:
        """Aggregate total accounts by status and role."""
        total_users = int(
            (await self.session.execute(select(func.count(User.id)))).scalar_one() or 0
        )
        active_count = int(
            (
                await self.session.execute(
                    select(func.count(User.id)).where(User.status == "active")
                )
            ).scalar_one()
            or 0
        )
        invited_count = int(
            (
                await self.session.execute(
                    select(func.count(User.id)).where(User.status == "invited")
                )
            ).scalar_one()
            or 0
        )
        suspended_count = int(
            (
                await self.session.execute(
                    select(func.count(User.id)).where(User.status == "suspended")
                )
            ).scalar_one()
            or 0
        )
        pending_cg = int(
            (
                await self.session.execute(
                    select(func.count(CaregiverProfile.user_id)).where(
                        CaregiverProfile.verification_status == "pending"
                    )
                )
            ).scalar_one()
            or 0
        )
        return {
            "total_users": total_users,
            "active_users": active_count,
            "invited_users": invited_count,
            "suspended_users": suspended_count,
            "pending_caregivers": pending_cg,
        }
