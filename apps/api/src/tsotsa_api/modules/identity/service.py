"""Business logic and orchestrations for identity and authentication."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from tsotsa_api.core.config import Settings, get_settings
from tsotsa_api.core.errors import AppException, NotFoundError, UnauthorizedError
from tsotsa_api.core.security import (
    generate_numeric_otp,
    generate_random_token,
    hash_password,
    hash_token,
    verify_password,
)
from tsotsa_api.modules.identity.models import CaregiverProfile, User
from tsotsa_api.modules.identity.otp import OtpSender, get_otp_sender
from tsotsa_api.modules.identity.rate_limit import RateLimiter
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.identity.schemas import OtpRequestResponse, TokenResponse
from tsotsa_api.modules.identity.token_service import TokenService

# Precomputed bcrypt hash used for constant-time comparison when user is not found
FALLBACK_HASH = "$2b$12$e80yq7Kj4Q5hKfZv2Q9H.uO80EwU9sZt7X3L0K2b6D1E8V9T2M5aG"


class IdentityService:
    """Provides authentication workflows across Google, Phone OTP, and Email."""

    def __init__(
        self,
        repository: IdentityRepository,
        otp_sender: OtpSender | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.repository = repository
        self.settings = settings or get_settings()
        self.otp_sender = otp_sender or get_otp_sender(self.settings)
        self.tokens = TokenService(repository=self.repository, settings=self.settings)

    async def authenticate_google(
        self, id_token_str: str, ip_address: str = "127.0.0.1"
    ) -> TokenResponse:
        """Verify Google Identity token and authenticate or create account."""
        RateLimiter.check_limit(f"ip:{ip_address}", max_attempts=10, window_seconds=60)
        allowed_audiences = self.settings.google_client_ids_list

        try:
            request = google_requests.Request()
            audience = allowed_audiences[0] if len(allowed_audiences) == 1 else None
            payload = google_id_token.verify_oauth2_token(  # type: ignore[no-untyped-call]
                id_token_str, request, audience=audience
            )
            if len(allowed_audiences) > 1 and payload.get("aud") not in allowed_audiences:
                raise ValueError("Audience mismatch")
        except Exception as err:
            raise UnauthorizedError(
                message=f"Google authentication failed: {err}",
                details={"reason": "invalid_google_token"},
            ) from err

        if not payload.get("email_verified", False):
            raise UnauthorizedError(
                message="Google email address must be verified.",
                details={"reason": "unverified_google_email"},
            )

        google_sub = payload["sub"]
        email = payload.get("email")
        display_name = payload.get("name") or (email.split("@")[0] if email else "Utilisateur")

        identity = await self.repository.get_identity("google", google_sub)
        if identity:
            user = await self.repository.get_user_by_id(identity.user_id)
            if not user:
                raise UnauthorizedError("User record not found")
        else:
            user = await self.repository.create_user(display_name=display_name)
            await self.repository.create_identity(
                user_id=user.id,
                provider="google",
                provider_subject=google_sub,
                email=email,
                email_verified=True,
            )
            await self.repository.assign_role(user.id, "user")

        return await self.tokens.issue_tokens(user, device_label="Google Auth")

    async def request_phone_otp(
        self, phone_e164: str, ip_address: str = "127.0.0.1"
    ) -> OtpRequestResponse:
        """Rate limit, generate 6-digit OTP code, and dispatch SMS."""
        RateLimiter.check_limit(f"ip:{ip_address}", max_attempts=5, window_seconds=60)
        RateLimiter.check_limit(f"phone:{phone_e164}", max_attempts=3, window_seconds=120)

        code = generate_numeric_otp(6)
        expires_at = datetime.now(UTC) + timedelta(minutes=self.settings.OTP_TTL_MINUTES)
        await self.repository.create_otp(phone_e164, hash_token(code), expires_at)
        await self.otp_sender.send_otp(phone_e164, code)

        return OtpRequestResponse(
            message="Un code de confirmation a été envoyé par SMS.",
            expires_in_seconds=self.settings.OTP_TTL_MINUTES * 60,
        )

    async def verify_phone_otp(
        self,
        phone_e164: str,
        code: str,
        display_name: str | None = None,
        ip_address: str = "127.0.0.1",
    ) -> TokenResponse:
        """Verify phone OTP code and log in or create user."""
        RateLimiter.check_limit(f"ip:{ip_address}", max_attempts=10, window_seconds=60)
        RateLimiter.check_limit(f"phone_v:{phone_e164}", max_attempts=10, window_seconds=60)

        otp = await self.repository.get_latest_active_otp(phone_e164)
        if not otp:
            raise UnauthorizedError(
                message="Code de confirmation invalide ou expiré.",
                details={"reason": "otp_expired_or_absent"},
            )
        if otp.attempts >= self.settings.OTP_MAX_ATTEMPTS:
            raise AppException(
                status_code=400,
                code="OTP_MAX_ATTEMPTS_EXCEEDED",
                message="Nombre maximal de tentatives dépassé. Veuillez demander un nouveau code.",
            )
        if hash_token(code) != otp.code_hash:
            await self.repository.increment_otp_attempts(otp.id)
            raise UnauthorizedError(
                message="Code de confirmation incorrect.", details={"reason": "invalid_code"}
            )

        await self.repository.mark_otp_consumed(otp.id)
        identity = await self.repository.get_identity("phone", phone_e164)
        if identity:
            user = await self.repository.get_user_by_id(identity.user_id)
            if not user:
                raise UnauthorizedError("User record not found")
        else:
            user = await self.repository.create_user(display_name=display_name or phone_e164)
            await self.repository.create_identity(
                user_id=user.id,
                provider="phone",
                provider_subject=phone_e164,
                phone_e164=phone_e164,
                phone_verified=True,
            )
            await self.repository.assign_role(user.id, "user")

        return await self.tokens.issue_tokens(user, device_label="Phone Auth")

    async def register_email(
        self, email: str, password: str, display_name: str, ip_address: str = "127.0.0.1"
    ) -> tuple[User, str]:
        """Register a new user account with email and password."""
        RateLimiter.check_limit(f"ip:{ip_address}", max_attempts=5, window_seconds=60)
        clean_email = email.lower().strip()
        if await self.repository.get_identity_by_email(clean_email):
            raise AppException(
                status_code=409,
                code="EMAIL_ALREADY_EXISTS",
                message="Cette adresse e-mail est déjà utilisée.",
            )

        pwd_hash = hash_password(password, rounds=self.settings.BCRYPT_ROUNDS)
        user = await self.repository.create_user(display_name=display_name)
        identity = await self.repository.create_identity(
            user_id=user.id,
            provider="email",
            provider_subject=clean_email,
            email=clean_email,
            password_hash=pwd_hash,
            email_verified=False,
        )
        await self.repository.assign_role(user.id, "user")

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
        """Authenticate user with email and password."""
        clean_email = email.lower().strip()
        RateLimiter.check_limit(f"ip:{ip_address}", max_attempts=5, window_seconds=60)
        RateLimiter.check_limit(f"email:{clean_email}", max_attempts=5, window_seconds=60)

        identity = await self.repository.get_identity_by_email(clean_email)
        if not identity or not identity.password_hash:
            verify_password(password, FALLBACK_HASH)
            raise UnauthorizedError(
                message="Adresse e-mail ou mot de passe incorrect.",
                details={"reason": "invalid_credentials"},
            )
        if not verify_password(password, identity.password_hash):
            raise UnauthorizedError(
                message="Adresse e-mail ou mot de passe incorrect.",
                details={"reason": "invalid_credentials"},
            )

        user = await self.repository.get_user_by_id(identity.user_id)
        if not user or user.status != "active":
            raise UnauthorizedError(
                message="Compte inactif ou suspendu.", details={"reason": "inactive_user"}
            )
        return await self.tokens.issue_tokens(user, device_label="Email Auth")

    async def verify_email_token(self, token_str: str) -> None:
        """Verify an email verification token."""
        token = await self.repository.get_valid_email_token(hash_token(token_str), "verify")
        if not token:
            raise NotFoundError(
                message="Lien de vérification invalide ou expiré.",
                details={"reason": "invalid_token"},
            )
        await self.repository.mark_email_token_used(token.id)
        await self.repository.mark_email_verified(token.user_identity_id)

    async def request_password_reset(self, email: str, ip_address: str = "127.0.0.1") -> str | None:
        """Generate a password reset token if account exists."""
        clean_email = email.lower().strip()
        RateLimiter.check_limit(f"ip:{ip_address}", max_attempts=5, window_seconds=60)
        RateLimiter.check_limit(f"email:{clean_email}", max_attempts=3, window_seconds=60)
        identity = await self.repository.get_identity_by_email(clean_email)
        if not identity:
            return None
        raw_token = generate_random_token(32)
        await self.repository.create_email_token(
            user_identity_id=identity.id,
            purpose="reset",
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(minutes=30),
        )
        return raw_token

    async def reset_password(
        self, token_str: str, new_password: str, ip_address: str = "127.0.0.1"
    ) -> None:
        """Reset password using a valid reset token."""
        RateLimiter.check_limit(f"ip:{ip_address}", max_attempts=5, window_seconds=60)
        token = await self.repository.get_valid_email_token(hash_token(token_str), "reset")
        if not token:
            raise NotFoundError(
                message="Lien de réinitialisation invalide ou expiré.",
                details={"reason": "invalid_token"},
            )
        new_hash = hash_password(new_password, rounds=self.settings.BCRYPT_ROUNDS)
        await self.repository.update_password_hash(token.user_identity_id, new_hash)
        await self.repository.mark_email_token_used(token.id)
        if token.user_identity:
            await self.repository.revoke_all_user_refresh_tokens(token.user_identity.user_id)

    async def refresh_access_token(self, refresh_token_str: str) -> TokenResponse:
        """Rotate refresh token and issue new access token."""
        return await self.tokens.refresh_access_token(refresh_token_str)

    async def revoke_refresh_token(self, refresh_token_str: str) -> None:
        """Revoke a refresh token on user logout."""
        await self.tokens.revoke_refresh_token(refresh_token_str)

    async def attach_caregiver_to_organization(
        self,
        user_id: str,
        organization_id: str,
        licence_number: str | None = None,
        verification_status: str | None = None,
        verified_by: str | None = None,
    ) -> CaregiverProfile:
        if not await self.repository.get_user_by_id(user_id):
            raise NotFoundError(message="Compte utilisateur introuvable.")
        await self.repository.assign_role(user_id, "caregiver")
        return await self.repository.upsert_caregiver_organization(
            user_id, organization_id, licence_number, verification_status, verified_by
        )

    async def get_caregiver_organization_id(self, user_id: str) -> str | None:
        p = await self.repository.get_caregiver_profile(user_id)
        return p.organization_id if p and p.verification_status == "approved" else None

    async def set_preferred_region(self, user_id: str, region_id: str | None) -> User:
        user = await self.repository.set_preferred_region(user_id, region_id)
        if not user:
            raise NotFoundError(message="Utilisateur introuvable.")
        return user
