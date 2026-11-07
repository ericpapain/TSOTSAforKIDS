"""Modules registry module (Domain B)."""

from tsotsa_api.modules.modules_registry.models import AppSetting, ModuleRegistryItem
from tsotsa_api.modules.modules_registry.router import admin_router, public_router
from tsotsa_api.modules.modules_registry.service import ModulesRegistryService

__all__ = [
    "AppSetting",
    "ModuleRegistryItem",
    "ModulesRegistryService",
    "admin_router",
    "public_router",
]
