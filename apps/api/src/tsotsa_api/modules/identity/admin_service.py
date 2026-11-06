"""Service for Identity Administration: User management, Invitations, and Caregiver review."""

from __future__ import annotations

import secrets
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.config import get_settings
from tsotsa_api.core.errors import AppException, NotFoundError, ValidationError
from tsotsa_api.core.security import hash_password, hash_token
from tsotsa_api.modules.identity.admin_repo import IdentityAdminRepository
from tsotsa_api.modules.identity.models import CaregiverProfile, Invitation, User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.identity.schemas import TokenResponse
from tsotsa_api.modules.identity.token_service import TokenService


class IdentityAdminService:
    """Handles admin user creation, single-use invitations, and caregiver verification."""

    def __init__(self, session: AsyncSession) -> None:
        from tsotsa_api.modules.audit.service import AuditService

        self.session = session
        self.repo = IdentityRepository(session)
        self.admin_repo = IdentityAdminRepository(session)
        self.tokens = TokenService(self.repo)
        self.audit = AuditService(session)
        self.settings = get_settings()

    async def list_users(
        self,
        role: str | None = None,
        status: str | None = None,
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[Sequence[User], int]:
        return await self.admin_repo.list_users(
            role=role, status=status, search=search, limit=limit, offset=offset
        )

    async def create_invited_user(
        self,
        created_by: str,
        display_name: str,
        role: str,
        phone_or_email: str,
        organization_id: str | None = None,
        is_verified_caregiver: bool = False,
        licence_number: str | None = None,
    ) -> tuple[User, Invitation, str]:
        """Admin creates user with 'invited' status and generates 7-day single-use token."""
        clean_target = phone_or_email.strip()
        is_email = "@" in clean_target

        if is_email:
            existing = await self.repo.get_identity_by_email(clean_target)
            if existing:
                raise AppException(
                    status_code=409,
                    code="ACCOUNT_ALREADY_EXISTS",
                    message="Un compte avec cette adresse e-mail existe déjà.",
                )
        else:
            existing_phone = await self.repo.get_identity("phone", clean_target)
            if existing_phone:
                raise AppException(
                    status_code=409,
                    code="ACCOUNT_ALREADY_EXISTS",
                    message="Un compte avec ce numéro de téléphone existe déjà.",
                )

        user = await self.repo.create_user(
            display_name=display_name.strip(),
            status="invited",
        )
        await self.repo.assign_role(user.id, role)

        if role == "caregiver":
            cg_status = "approved" if is_verified_caregiver else "pending"
            await self.repo.upsert_caregiver_organization(
                user_id=user.id,
                organization_id=organization_id,
                licence_number=licence_number,
                verification_status=cg_status,
                verified_by=created_by if is_verified_caregiver else None,
            )

        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_token(raw_token)
        expires_at = datetime.now(UTC) + timedelta(days=7)

        inv = await self.admin_repo.create_invitation(
            created_by=created_by,
            user_id=user.id,
            role=role,
            phone_or_email=clean_target,
            token_hash=token_hash,
            expires_at=expires_at,
            organization_id=organization_id,
        )

        await self.audit.log(
            action="admin_create_user_invitation",
            entity="user",
            actor_user_id=created_by,
            entity_id=user.id,
            details={"role": role, "target": clean_target, "is_verified": is_verified_caregiver},
        )
        return user, inv, raw_token

    async def verify_invitation(self, raw_token: str) -> dict[str, Any]:
        """Check invitation validity and return public metadata."""
        inv = await self.admin_repo.get_invitation_by_token_hash(hash_token(raw_token))
        if not inv or inv.accepted_at is not None:
            return {"valid": False, "reason": "invalid_or_used"}
        exp = (
            inv.expires_at.replace(tzinfo=UTC)
            if inv.expires_at.tzinfo is None
            else inv.expires_at
        )
        if exp < datetime.now(UTC):
            return {"valid": False, "reason": "expired"}
        return {
            "valid": True,
            "role": inv.role,
            "phone_or_email": inv.phone_or_email,
            "expires_at": inv.expires_at,
        }

    async def accept_invitation(
        self,
        raw_token: str,
        method: str,
        email: str | None = None,
        password: str | None = None,
        phone: str | None = None,
        google_sub: str | None = None,
        google_email: str | None = None,
    ) -> tuple[User, TokenResponse]:
        """Activate invited account with chosen login provider and issue access tokens."""
        inv = await self.admin_repo.get_invitation_by_token_hash(hash_token(raw_token))
        if not inv or inv.accepted_at is not None:
            raise NotFoundError(message="Invitation introuvable ou déjà utilisée.")
        exp = (
            inv.expires_at.replace(tzinfo=UTC)
            if inv.expires_at.tzinfo is None
            else inv.expires_at
        )
        if exp < datetime.now(UTC):
            raise ValidationError("Cette invitation a expiré (délai de 7 jours dépassé).")

        user = await self.repo.get_user_by_id(inv.user_id) if inv.user_id else None
        if not user:
            raise NotFoundError(message="Compte invité introuvable.")

        if method == "email":
            if not email or not password or len(password) < 8:
                raise ValidationError("Adresse e-mail et mot de passe (min. 8 car.) requis.")
            clean_email = email.lower().strip()
            pwd_hash = hash_password(password, rounds=self.settings.BCRYPT_ROUNDS)
            await self.repo.create_identity(
                user_id=user.id,
                provider="email",
                provider_subject=clean_email,
                email=clean_email,
                password_hash=pwd_hash,
                email_verified=True,
            )
        elif method == "phone":
            if not phone:
                raise ValidationError("Numéro de téléphone requis.")
            clean_phone = phone.strip()
            await self.repo.create_identity(
                user_id=user.id,
                provider="phone",
                provider_subject=clean_phone,
                phone_e164=clean_phone,
                phone_verified=True,
            )
        elif method == "google":
            if not google_sub:
                raise ValidationError("Identifiant Google requis.")
            await self.repo.create_identity(
                user_id=user.id,
                provider="google",
                provider_subject=google_sub,
                email=google_email.lower().strip() if google_email else None,
                email_verified=True,
            )
        else:
            raise ValidationError(f"Méthode d'authentification inconnue : '{method}'.")

        await self.admin_repo.set_user_status(user.id, "active")
        await self.admin_repo.mark_invitation_accepted(inv.id)

        await self.audit.log(
            action="accept_invitation",
            entity="user",
            actor_user_id=user.id,
            entity_id=user.id,
            details={"method": method},
        )
        tokens = await self.tokens.issue_tokens(user, device_label=f"Invitation ({method})")
        return user, tokens

    async def suspend_user(
        self, user_id: str, admin_user_id: str, reason: str | None = None
    ) -> User:
        user = await self.admin_repo.set_user_status(user_id, "suspended")
        if not user:
            raise NotFoundError("Utilisateur introuvable.")
        await self.repo.revoke_all_user_refresh_tokens(user_id)
        await self.audit.log(
            action="suspend_user",
            entity="user",
            actor_user_id=admin_user_id,
            entity_id=user.id,
            details={"reason": reason},
        )
        return user

    async def reactivate_user(self, user_id: str, admin_user_id: str) -> User:
        user = await self.admin_repo.set_user_status(user_id, "active")
        if not user:
            raise NotFoundError("Utilisateur introuvable.")
        await self.audit.log(
            action="reactivate_user",
            entity="user",
            actor_user_id=admin_user_id,
            entity_id=user.id,
        )
        return user

    async def list_caregivers(
        self,
        status: str | None = None,
        organization_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[Sequence[CaregiverProfile], int]:
        return await self.admin_repo.list_caregivers(
            status=status, organization_id=organization_id, limit=limit, offset=offset
        )

    async def review_caregiver(
        self,
        user_id: str,
        admin_user_id: str,
        action: str,
        reason: str | None = None,
        message: str | None = None,
    ) -> CaregiverProfile:
        if action == "approve":
            profile = await self.admin_repo.update_caregiver_verification(
                user_id=user_id, status="approved", verified_by=admin_user_id
            )
        elif action == "reject":
            profile = await self.admin_repo.update_caregiver_verification(
                user_id=user_id, status="rejected", notes=reason
            )
        elif action == "request_document":
            notes = f"DOCUMENT_REQUESTED: {message or 'Document requis'}"
            profile = await self.admin_repo.update_caregiver_verification(
                user_id=user_id, status="pending", notes=notes
            )
        else:
            raise ValidationError(f"Action de vérification non reconnue : '{action}'.")

        if not profile:
            raise NotFoundError("Profil soignant introuvable.")

        await self.audit.log(
            action=f"caregiver_{action}",
            entity="caregiver_profile",
            actor_user_id=admin_user_id,
            entity_id=user_id,
            details={"reason": reason, "message": message},
        )
        return profile
