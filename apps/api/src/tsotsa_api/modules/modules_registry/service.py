"""Service layer for Domain B modules registry and application settings."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import AppException, NotFoundError
from tsotsa_api.modules.modules_registry.models import AppSetting, ModuleRegistryItem
from tsotsa_api.modules.modules_registry.repository import ModulesRegistryRepository
from tsotsa_api.modules.modules_registry.schemas import ModuleCreate, ModuleUpdate

DEFAULT_PLATFORM_MODULES: tuple[tuple[str, str, str, int], ...] = (
    ("nutrition", "Nutrition infantile", "active", 1),
    ("hta", "Hypertension artérielle (HTA)", "coming_soon", 2),
    ("diabete", "Diabète", "coming_soon", 3),
)


class ModulesRegistryService:
    """Manages platform clinical modules (nutrition, hta, diabete) and settings."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ModulesRegistryRepository(session)

    async def ensure_default_modules(self) -> list[ModuleRegistryItem]:
        """Idempotently initialize the core platform modules if registry is empty."""
        existing = await self.repo.list_modules()
        if existing:
            return existing
        for code, name, status, sort_order in DEFAULT_PLATFORM_MODULES:
            await self.repo.create_module(
                code=code, name=name, status=status, sort_order=sort_order
            )
        return await self.repo.list_modules()

    async def list_modules(self) -> list[ModuleRegistryItem]:
        """Return all registered platform modules, initializing defaults if needed."""
        return await self.ensure_default_modules()

    async def create_module(self, payload: ModuleCreate, admin_user_id: str) -> ModuleRegistryItem:
        await self.ensure_default_modules()
        existing = await self.repo.get_module_by_code(payload.code)
        if existing:
            raise AppException(
                status_code=409,
                code="MODULE_ALREADY_EXISTS",
                message=f"Le module '{payload.code}' existe déjà.",
            )
        return await self.repo.create_module(
            code=payload.code,
            name=payload.name,
            status=payload.status,
            sort_order=payload.sort_order,
            updated_by=admin_user_id,
        )

    async def update_module(
        self, code: str, payload: ModuleUpdate, admin_user_id: str
    ) -> ModuleRegistryItem:
        await self.ensure_default_modules()
        mod = await self.repo.get_module_by_code(code)
        if not mod:
            raise NotFoundError(f"Module '{code}' introuvable.")
        return await self.repo.update_module(
            mod=mod,
            name=payload.name,
            status=payload.status,
            sort_order=payload.sort_order,
            updated_by=admin_user_id,
        )

    async def list_settings(self) -> list[AppSetting]:
        return await self.repo.list_settings()

    async def upsert_setting(
        self, key: str, value: dict[str, Any], admin_user_id: str
    ) -> AppSetting:
        return await self.repo.upsert_setting(key=key, value=value, updated_by=admin_user_id)
