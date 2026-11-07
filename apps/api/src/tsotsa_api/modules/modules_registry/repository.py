"""Repository layer for Domain B modules registry and application settings."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.modules_registry.models import AppSetting, ModuleRegistryItem


class ModulesRegistryRepository:
    """Database access for platform modules and application settings."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_modules(self) -> list[ModuleRegistryItem]:
        stmt = select(ModuleRegistryItem).order_by(
            ModuleRegistryItem.sort_order.asc(), ModuleRegistryItem.code.asc()
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_module_by_code(self, code: str) -> ModuleRegistryItem | None:
        clean = code.strip().lower()
        stmt = select(ModuleRegistryItem).where(ModuleRegistryItem.code == clean)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create_module(
        self,
        code: str,
        name: str,
        status: str = "coming_soon",
        sort_order: int = 1,
        updated_by: str | None = None,
    ) -> ModuleRegistryItem:
        mod = ModuleRegistryItem(
            code=code.strip().lower(),
            name=name.strip(),
            status=status,
            sort_order=sort_order,
            updated_by=updated_by,
        )
        self.session.add(mod)
        await self.session.flush()
        return mod

    async def update_module(
        self,
        mod: ModuleRegistryItem,
        name: str | None = None,
        status: str | None = None,
        sort_order: int | None = None,
        updated_by: str | None = None,
    ) -> ModuleRegistryItem:
        if name is not None:
            mod.name = name.strip()
        if status is not None:
            mod.status = status
        if sort_order is not None:
            mod.sort_order = sort_order
        mod.updated_by = updated_by
        mod.updated_at = datetime.now(UTC)
        await self.session.flush()
        return mod

    async def list_settings(self) -> list[AppSetting]:
        stmt = select(AppSetting).order_by(AppSetting.key.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_setting(self, key: str) -> AppSetting | None:
        stmt = select(AppSetting).where(AppSetting.key == key.strip())
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def upsert_setting(
        self, key: str, value: dict[str, Any], updated_by: str | None = None
    ) -> AppSetting:
        clean_key = key.strip()
        setting = await self.get_setting(clean_key)
        now = datetime.now(UTC)
        if setting:
            setting.value = value
            setting.updated_by = updated_by
            setting.updated_at = now
            await self.session.flush()
            return setting

        setting = AppSetting(key=clean_key, value=value, updated_by=updated_by, updated_at=now)
        self.session.add(setting)
        await self.session.flush()
        return setting
