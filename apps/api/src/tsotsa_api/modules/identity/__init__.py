"""Identity module public exports.

Provides authentication, user management, and authorization dependencies.
"""

from tsotsa_api.modules.identity.admin_service import IdentityAdminService
from tsotsa_api.modules.identity.dependencies import (
    get_current_user,
    get_optional_user,
    is_user_admin,
    require_role,
    require_verified_caregiver,
)
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.identity.router import router as auth_router
from tsotsa_api.modules.identity.service import IdentityService

__all__ = [
    "IdentityAdminService",
    "IdentityRepository",
    "IdentityService",
    "auth_router",
    "get_current_user",
    "get_optional_user",
    "is_user_admin",
    "require_role",
    "require_verified_caregiver",
]
