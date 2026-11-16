"""Identity module public exports.

Provides authentication, user management, and authorization dependencies.
"""

from tsotsa_api.modules.identity.admin_service import IdentityAdminService
from tsotsa_api.modules.identity.dependencies import (
    get_current_user,
    get_optional_user,
    is_user_admin,
    require_permission,
    require_role,
    require_verified_caregiver,
)
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.identity.router import profile_router
from tsotsa_api.modules.identity.router import router as auth_router
from tsotsa_api.modules.identity.service import IdentityService
from tsotsa_api.modules.identity.staff_router import permissions_router, staff_router

__all__ = [
    "IdentityAdminService",
    "IdentityRepository",
    "IdentityService",
    "auth_router",
    "get_current_user",
    "get_optional_user",
    "is_user_admin",
    "permissions_router",
    "profile_router",
    "require_permission",
    "require_role",
    "require_verified_caregiver",
    "staff_router",
]
