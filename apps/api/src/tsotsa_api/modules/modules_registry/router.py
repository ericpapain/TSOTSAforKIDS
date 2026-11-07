"""FastAPI endpoints for Domain B modules registry and application settings."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity import require_role
from tsotsa_api.modules.modules_registry.schemas import (
    AppSettingRead,
    AppSettingUpdate,
    ModuleCreate,
    ModuleRead,
    ModuleUpdate,
)
from tsotsa_api.modules.modules_registry.service import ModulesRegistryService

public_router = APIRouter(prefix="/modules", tags=["Modules Registry"])
admin_router = APIRouter(prefix="/admin", tags=["Admin - Modules & Settings"])


@public_router.get("", response_model=list[ModuleRead])
async def list_platform_modules(
    db: AsyncSession = Depends(get_db_session),
) -> list[ModuleRead]:
    """Return the dynamic list of platform modules (read by mobile and web apps)."""
    service = ModulesRegistryService(db)
    modules = await service.list_modules()
    return [ModuleRead.model_validate(m) for m in modules]


@admin_router.post("/modules", response_model=ModuleRead, status_code=status.HTTP_201_CREATED)
async def create_platform_module(
    payload: ModuleCreate,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ModuleRead:
    """Register a new clinical module in the platform registry."""
    service = ModulesRegistryService(db)
    mod = await service.create_module(payload, admin_user_id=admin.id)
    return ModuleRead.model_validate(mod)


@admin_router.put("/modules/{code}", response_model=ModuleRead)
async def update_platform_module(
    code: str,
    payload: ModuleUpdate,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ModuleRead:
    """Activate, mark as coming_soon, or disable a platform module."""
    service = ModulesRegistryService(db)
    mod = await service.update_module(code, payload, admin_user_id=admin.id)
    return ModuleRead.model_validate(mod)


@admin_router.get("/settings", response_model=list[AppSettingRead])
async def list_application_settings(
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> list[AppSettingRead]:
    """List global application settings."""
    service = ModulesRegistryService(db)
    settings = await service.list_settings()
    return [AppSettingRead.model_validate(s) for s in settings]


@admin_router.put("/settings/{key}", response_model=AppSettingRead)
async def update_application_setting(
    key: str,
    payload: AppSettingUpdate,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> AppSettingRead:
    """Create or update a global application setting."""
    service = ModulesRegistryService(db)
    setting = await service.upsert_setting(key, payload.value, admin_user_id=admin.id)
    return AppSettingRead.model_validate(setting)
