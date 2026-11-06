"""Domain Admin module public exports."""

from __future__ import annotations

from tsotsa_api.modules.admin.router import admin_router, invitations_public_router
from tsotsa_api.modules.admin.service import AdminService

__all__ = [
    "AdminService",
    "admin_router",
    "invitations_public_router",
]

