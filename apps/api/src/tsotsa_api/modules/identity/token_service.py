"""Service responsible for JWT token generation, refresh rotation, and revocation."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from tsotsa_api.core.config import Settings, get_settings
from tsotsa_api.core.errors import UnauthorizedError
from tsotsa_api.core.security import (
    create_access_token,
    generate_random_token,
    hash_token,
)
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.identity.schemas import TokenResponse, UserProfileResponse


class TokenService:
    """Manages access and refresh token lifecycles."""

    def __init__(
        self,
        repository: IdentityRepository,
        settings: Settings | None = None,
    ) -> None:
        self.repository = repository
        self.settings = settings or get_settings()

    async def issue_tokens(self, user: User, device_label: str | None = None) -> TokenResponse:
        """Issue an access token and a rotating refresh token."""
        now = datetime.now(UTC)
        await self.repository.update_last_login(user.id)

        roles = await self.repository.get_user_role_codes(user.id)
        caregiver_profile = await self.repository.get_caregiver_profile(user.id)
        is_verified_caregiver = (
            caregiver_profile.verification_status == "approved" if caregiver_profile else False
        )

        claims = {
            "name": user.display_name,
            "roles": roles,
            "is_verified_caregiver": is_verified_caregiver,
        }
        access_token = create_access_token(subject=user.id, claims=claims, settings=self.settings)

        raw_refresh_token = generate_random_token(32)
        refresh_expires = now + timedelta(days=self.settings.JWT_REFRESH_TTL_DAYS)
        await self.repository.create_refresh_token(
            user_id=user.id,
            token_hash=hash_token(raw_refresh_token),
            expires_at=refresh_expires,
            device_label=device_label,
        )

        user_profile = UserProfileResponse(
            id=user.id,
            display_name=user.display_name,
            language=user.language,
            status=user.status,
            roles=roles,
            is_verified_caregiver=is_verified_caregiver,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh_token,
            token_type="Bearer",
            expires_in=self.settings.JWT_ACCESS_TTL_MINUTES * 60,
            user=user_profile,
        )

    async def refresh_access_token(self, refresh_token_str: str) -> TokenResponse:
        """Rotate refresh token and issue new access token."""
        token_hash = hash_token(refresh_token_str)
        token_record = await self.repository.get_active_refresh_token(token_hash)
        if not token_record:
            raise UnauthorizedError(
                message="Jeton de rafraîchissement invalide ou révoqué.",
                details={"reason": "invalid_refresh_token"},
            )

        # Rotate refresh token: revoke current and issue a new one
        await self.repository.revoke_refresh_token(token_record.id)
        user = await self.repository.get_user_by_id(token_record.user_id)
        if not user or user.status != "active":
            raise UnauthorizedError("Utilisateur non trouvé ou inactif.")

        return await self.issue_tokens(user, device_label=token_record.device_label)

    async def revoke_refresh_token(self, refresh_token_str: str) -> None:
        """Revoke a refresh token on user logout."""
        token_hash = hash_token(refresh_token_str)
        token_record = await self.repository.get_active_refresh_token(token_hash)
        if token_record:
            await self.repository.revoke_refresh_token(token_record.id)
