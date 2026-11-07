"""Root router assembling administration sub-routers."""

from __future__ import annotations

from fastapi import APIRouter

from tsotsa_api.modules.admin.invitations_router import invitations_public_router
from tsotsa_api.modules.admin.settings_router import admin_settings_router
from tsotsa_api.modules.admin.users_router import admin_users_router

admin_router = APIRouter(prefix="/admin", tags=["Administration"])
admin_router.include_router(admin_users_router)
admin_router.include_router(admin_settings_router)

__all__ = [
    "admin_router",
    "invitations_public_router",
]
