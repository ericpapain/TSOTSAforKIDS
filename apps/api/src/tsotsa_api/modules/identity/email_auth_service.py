"""Service handling email registration, credential verification, and account lockout."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from tsotsa_api.core.config import Settings, get_settings
from tsotsa_api.core.errors import AppException, UnauthorizedError
from tsotsa_api.core.security import (
    generate_random_token,
    hash_password,
    hash_token,
    verify_password,
)
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.rate_limit import RateLimiter
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.identity.schemas import TokenResponse
from tsotsa_api.modules.identity.token_service import TokenService

FALLBACK_HASH = "$2b$12$e80yq7Kj4Q5hKfZv2Q9H.uO80EwU9sZt7X3L0K2b6D1E8V9T2M5aG"


class EmailAuthService:
    """Manages email registration, password login with lockout protection, and verification."""

    def __init__(
        self,
        repository: IdentityRepository,
        tokens: TokenService,
        settings: Settings | None = None,
    ) -> None:
        self.repository = repository
        self.tokens = tokens
        self.settings = settings or get_settings()

    async def register_email(
        self,
        email: str,
        password: str,
        display_name: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
        role: str = "parent",
        region_id: str | None = None,
        locality: str | None = None,
        phone: str | None = None,
        facility_id: str | None = None,
        speciality: str | None = None,
        order_number: str | None = None,
        structure_name: str | None = None,
        ip_address: str = "127.0.0.1",
    ) -> tuple[User, str]:
        """Register a new user account with role validation and profile creation."""
        RateLimiter.check_limit(f"ip:{ip_address}", max_attempts=5, window_seconds=60)
        clean_email = email.lower().strip()
        if await self.repository.get_identity_by_email(clean_email):
            raise AppException(
                status_code=409,
                code="EMAIL_ALREADY_EXISTS",
                message="Cette adresse e-mail est déjà utilisée.",
            )

        if role not in ("parent", "field_agent", "caregiver"):
            raise AppException(
                status_code=400,
                code="INVALID_ROLE",
                message=f"Rôle d'inscription non autorisé : '{role}'.",
            )

        if role == "caregiver":
            if not phone or not facility_id or not speciality:
                raise AppException(
                    status_code=400,
                    code="MISSING_FIELDS",
                    message=(
                        "Téléphone, établissement et spécialité sont obligatoires pour un soignant."
                    ),
                )
            user_status = "pending"
        elif role == "field_agent":
            if not phone:
                raise AppException(
                    status_code=400,
                    code="MISSING_FIELDS",
                    message="Le téléphone est obligatoire pour un agent de terrain.",
                )
            user_status = "pending"
        else:
            user_status = "active"

        d_name = display_name or f"{first_name or ''} {last_name or ''}".strip() or clean_email
        pwd_hash = hash_password(password, rounds=self.settings.BCRYPT_ROUNDS)

        resolved_region_id = await self.repository.resolve_region_id(region_id)
        user = await self.repository.create_user(
            display_name=d_name,
            first_name=first_name,
            last_name=last_name,
            preferred_region_id=resolved_region_id,
            locality=locality,
            status=user_status,
        )

        identity = await self.repository.create_identity(
            user_id=user.id,
            provider="email",
            provider_subject=clean_email,
            email=clean_email,
            phone_e164=phone,
            password_hash=pwd_hash,
            email_verified=False,
        )

        if role == "caregiver":
            resolved_org_id = await self.repository.resolve_organization_id(facility_id)
            await self.repository.create_caregiver_profile(
                user_id=user.id,
                organization_id=resolved_org_id,
                phone=phone,
                speciality=speciality,
                order_number=order_number,
                status="pending",
            )
        elif role == "field_agent":
            await self.repository.create_field_agent_profile(
                user_id=user.id,
                phone=phone or "",
                structure_name=structure_name,
                status="pending",
            )

        await self.repository.assign_role(user.id, role)

        raw_token = generate_random_token(32)
        await self.repository.create_email_token(
            user_identity_id=identity.id,
            purpose="verify",
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(minutes=30),
        )
        return user, raw_token

    async def login_email(
        self, email: str, password: str, ip_address: str = "127.0.0.1"
    ) -> TokenResponse:
        """Authenticate user with email and password, enforcing lockout after 5 failures."""
        clean_email = email.lower().strip()
        RateLimiter.check_limit(f"ip:{ip_address}", max_attempts=20, window_seconds=60)
        RateLimiter.check_limit(f"email:{clean_email}", max_attempts=20, window_seconds=60)

        identity = await self.repository.get_identity_by_email(clean_email)
        if not identity or not identity.password_hash:
            verify_password(password, FALLBACK_HASH)
            raise UnauthorizedError(
                message="Adresse e-mail ou mot de passe incorrect.",
                details={"reason": "invalid_credentials"},
            )

        user = await self.repository.get_user_by_id(identity.user_id)
        if not user:
            raise UnauthorizedError(message="Adresse e-mail ou mot de passe incorrect.")

        now = datetime.now(UTC)
        if user.locked_until and user.locked_until > now:
            remaining_mins = max(1, int((user.locked_until - now).total_seconds() / 60))
            msg = (
                f"Compte temporairement verrouillé suite à 5 échecs consécutifs. "
                f"Réessayez dans {remaining_mins} minute(s)."
            )
            raise AppException(
                code="ACCOUNT_LOCKED",
                message=msg,
                status_code=403,
                details={
                    "reason": "account_locked",
                    "locked_until": user.locked_until.isoformat(),
                },
            )

        if not verify_password(password, identity.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = now + timedelta(minutes=15)
                await self.repository.session.flush()
                lock_msg = (
                    "Compte temporairement verrouillé suite à 5 échecs consécutifs. "
                    "Réessayez dans 15 minutes."
                )
                raise AppException(
                    code="ACCOUNT_LOCKED",
                    message=lock_msg,
                    status_code=403,
                    details={
                        "reason": "account_locked",
                        "locked_until": user.locked_until.isoformat(),
                    },
                )
            await self.repository.session.flush()
            raise UnauthorizedError(
                message="Adresse e-mail ou mot de passe incorrect.",
                details={"reason": "invalid_credentials"},
            )

        # Successful authentication: reset failed attempts
        if user.failed_login_attempts > 0 or user.locked_until is not None:
            user.failed_login_attempts = 0
            user.locked_until = None
            await self.repository.session.flush()

        if user.status == "pending":
            pending_msg = (
                "Votre compte est en attente de validation par un administrateur "
                "ou un coordinateur médical."
            )
            raise AppException(
                status_code=403,
                code="ACCOUNT_PENDING_VALIDATION",
                message=pending_msg,
            )

        if user.status != "active":
            raise UnauthorizedError(
                message="Compte inactif ou suspendu.", details={"reason": "inactive_user"}
            )

        return await self.tokens.issue_tokens(user, device_label="Email Auth")
