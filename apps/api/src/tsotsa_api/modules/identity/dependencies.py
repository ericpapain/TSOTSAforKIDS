"""Authentication and authorization dependencies for FastAPI endpoints."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.core.errors import AppException, ForbiddenError, UnauthorizedError
from tsotsa_api.core.security import decode_access_token
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """Validate bearer token and resolve authenticated user entity."""
    if not credentials:
        raise UnauthorizedError(
            message="Jeton d'authentification manquant.",
            details={"reason": "missing_bearer_token"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
    except Exception as err:
        raise UnauthorizedError(
            message="Jeton d'authentification invalide ou expiré.",
            details={"reason": "invalid_token", "error": str(err)},
        ) from err

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Jeton invalide : sujet absent.")

    repo = IdentityRepository(db)
    user = await repo.get_user_by_id(user_id)
    if not user or user.status != "active":
        raise UnauthorizedError(
            message="Utilisateur non trouvé ou compte inactif.",
            details={"reason": "inactive_or_missing_user"},
        )

    return user


def require_role(*allowed_roles: str) -> Callable[..., Any]:
    """Dependency factory checking user has one of the specified roles."""

    async def _role_checker(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db_session),
    ) -> User:
        repo = IdentityRepository(db)
        roles = await repo.get_user_role_codes(user.id)
        if "admin" in roles:
            return user
        if not any(r in roles for r in allowed_roles):
            raise ForbiddenError(
                message="Privilèges insuffisants pour cette ressource.",
                details={"required_roles": list(allowed_roles), "user_roles": roles},
            )
        return user

    return _role_checker


async def require_verified_caregiver(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """Ensure caregiver is approved. Unverified caregivers are denied health data."""
    repo = IdentityRepository(db)
    roles = await repo.get_user_role_codes(user.id)

    if "admin" in roles:
        return user

    if "caregiver" not in roles:
        raise ForbiddenError(
            message="Rôle soignant requis.",
            details={"reason": "missing_caregiver_role"},
        )

    profile = await repo.get_caregiver_profile(user.id)
    if not profile or profile.verification_status != "approved":
        raise AppException(
            status_code=403,
            code="CARE_GIVER_NOT_VERIFIED",
            message="Profil soignant non vérifié. Accès aux données de santé refusé.",
            details={
                "verification_status": (profile.verification_status if profile else "missing")
            },
        )

    return user
