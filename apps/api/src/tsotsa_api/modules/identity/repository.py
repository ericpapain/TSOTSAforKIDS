"""Repository layer for identity and access entities."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.identity.models import (
    CaregiverProfile,
    FieldAgentProfile,
    Role,
    User,
    UserIdentity,
    UserRole,
)
from tsotsa_api.modules.identity.token_repository import TokenRepository


class IdentityRepository(TokenRepository):
    """Encapsulates SQLAlchemy database interactions for the identity module."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_user_by_id(self, user_id: str) -> User | None:
        """Fetch a user by primary key with relations preloaded."""
        stmt = (
            select(User)
            .options(
                selectinload(User.identities),
                selectinload(User.user_roles).selectinload(UserRole.role),
                selectinload(User.caregiver_profile),
            )
            .where(User.id == user_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_user(
        self,
        display_name: str,
        language: str = "fr",
        preferred_locale: str | None = None,
        status: str = "active",
        first_name: str | None = None,
        last_name: str | None = None,
        preferred_region_id: str | None = None,
        locality: str | None = None,
    ) -> User:
        """Create a new user entity."""
        loc = (
            preferred_locale
            if preferred_locale in ("fr", "en")
            else (language if language in ("fr", "en") else "fr")
        )
        user = User(
            display_name=display_name,
            language=loc,
            preferred_locale=loc,
            status=status,
            first_name=first_name,
            last_name=last_name,
            preferred_region_id=preferred_region_id,
            locality=locality,
        )
        self.session.add(user)
        await self.session.flush()
        return user

    async def update_user_profile(
        self,
        user_id: str,
        preferred_locale: str | None = None,
        display_name: str | None = None,
    ) -> User | None:
        """Update user preferred_locale and/or display_name."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
        if preferred_locale is not None:
            user.preferred_locale = preferred_locale
            user.language = preferred_locale
        if display_name is not None:
            user.display_name = display_name.strip()
        user.updated_at = datetime.now(UTC)
        await self.session.flush()
        return user

    async def update_last_login(self, user_id: str) -> None:
        """Update user last login timestamp."""
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.now(UTC), updated_at=datetime.now(UTC))
        )
        await self.session.execute(stmt)

    async def get_identity(self, provider: str, provider_subject: str) -> UserIdentity | None:
        """Find an identity by provider and subject."""
        stmt = (
            select(UserIdentity)
            .options(selectinload(UserIdentity.user))
            .where(
                UserIdentity.provider == provider,
                UserIdentity.provider_subject == provider_subject,
            )
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_identity_by_email(self, email: str) -> UserIdentity | None:
        """Find an identity by email for email provider."""
        stmt = (
            select(UserIdentity)
            .options(selectinload(UserIdentity.user))
            .where(
                UserIdentity.provider == "email",
                UserIdentity.email == email.lower().strip(),
            )
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_identity(
        self,
        user_id: str,
        provider: str,
        provider_subject: str,
        email: str | None = None,
        phone_e164: str | None = None,
        password_hash: str | None = None,
        email_verified: bool = False,
        phone_verified: bool = False,
    ) -> UserIdentity:
        """Create a new identity linked to a user."""
        now = datetime.now(UTC)
        identity = UserIdentity(
            user_id=user_id,
            provider=provider,
            provider_subject=provider_subject,
            email=email.lower().strip() if email else None,
            phone_e164=phone_e164,
            password_hash=password_hash,
            email_verified_at=now if email_verified else None,
            phone_verified_at=now if phone_verified else None,
        )
        self.session.add(identity)
        await self.session.flush()
        return identity

    async def mark_email_verified(self, identity_id: str) -> None:
        """Mark an email identity as verified."""
        now = datetime.now(UTC)
        stmt = (
            update(UserIdentity)
            .where(UserIdentity.id == identity_id)
            .values(email_verified_at=now, updated_at=now)
        )
        await self.session.execute(stmt)

    async def update_password_hash(self, identity_id: str, password_hash: str) -> None:
        """Update the bcrypt password hash of an identity."""
        now = datetime.now(UTC)
        stmt = (
            update(UserIdentity)
            .where(UserIdentity.id == identity_id)
            .values(password_hash=password_hash, updated_at=now)
        )
        await self.session.execute(stmt)

    async def get_or_create_role(self, code: str, name: str) -> Role:
        """Get role by code or insert it if not found."""
        stmt = select(Role).where(Role.code == code)
        res = await self.session.execute(stmt)
        role = res.scalar_one_or_none()
        if not role:
            role = Role(code=code, name=name)
            self.session.add(role)
            await self.session.flush()
        return role

    async def assign_role(self, user_id: str, role_code: str) -> None:
        """Assign role code to a user if not already assigned."""
        role = await self.get_or_create_role(role_code, role_code.capitalize())
        stmt = select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role.id)
        res = await self.session.execute(stmt)
        if not res.scalar_one_or_none():
            ur = UserRole(user_id=user_id, role_id=role.id)
            self.session.add(ur)
            await self.session.flush()

    async def get_user_role_codes(self, user_id: str) -> list[str]:
        """Fetch list of active role codes assigned to a user."""
        stmt = select(Role.code).join(UserRole).where(UserRole.user_id == user_id)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_caregiver_profile(self, user_id: str) -> CaregiverProfile | None:
        """Fetch caregiver profile for a user."""
        stmt = select(CaregiverProfile).where(CaregiverProfile.user_id == user_id)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_caregiver_profile(
        self,
        user_id: str,
        organization_id: str | None = None,
        licence_number: str | None = None,
        document_file: str | None = None,
        status: str = "pending",
        phone: str | None = None,
        speciality: str | None = None,
        order_number: str | None = None,
    ) -> CaregiverProfile:
        """Create caregiver profile."""
        profile = CaregiverProfile(
            user_id=user_id,
            organization_id=organization_id,
            licence_number=licence_number or order_number,
            order_number=order_number,
            speciality=speciality,
            phone=phone,
            document_file=document_file,
            verification_status=status,
        )
        self.session.add(profile)
        await self.session.flush()
        return profile

    async def create_field_agent_profile(
        self,
        user_id: str,
        phone: str,
        structure_name: str | None = None,
        status: str = "pending",
    ) -> FieldAgentProfile:
        """Create field agent profile."""
        profile = FieldAgentProfile(
            user_id=user_id,
            phone=phone,
            structure_name=structure_name,
            verification_status=status,
        )
        self.session.add(profile)
        await self.session.flush()
        return profile

    async def upsert_caregiver_organization(
        self,
        user_id: str,
        organization_id: str | None = None,
        licence_number: str | None = None,
        verification_status: str | None = None,
        verified_by: str | None = None,
    ) -> CaregiverProfile:
        """Attach or update a caregiver profile's organization and verification state."""
        profile = await self.get_caregiver_profile(user_id)
        now = datetime.now(UTC)
        if profile:
            profile.organization_id = organization_id
            if licence_number is not None:
                profile.licence_number = licence_number
            if verification_status is not None:
                profile.verification_status = verification_status
                if verification_status == "approved":
                    profile.verified_by = verified_by
                    profile.verified_at = now
            profile.updated_at = now
            await self.session.flush()
            return profile

        status = verification_status or "pending"
        profile = CaregiverProfile(
            user_id=user_id,
            organization_id=organization_id,
            licence_number=licence_number,
            verification_status=status,
            verified_by=verified_by if status == "approved" else None,
            verified_at=now if status == "approved" else None,
        )
        self.session.add(profile)
        await self.session.flush()
        return profile

    async def set_preferred_region(self, user_id: str, region_id: str | None) -> User | None:
        """Update a user's preferred region."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
        user.preferred_region_id = region_id
        user.updated_at = datetime.now(UTC)
        await self.session.flush()
        return user
