"""Repository layer for Domain E ORKG comparisons, snapshots, and recipes."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.orkg_sync.models import (
    OrkgComparison,
    OrkgSnapshot,
    Recipe,
    RecipeIngredient,
)


class OrkgSyncRepository:
    """Database access for ORKG comparisons registry, snapshots, and dish recipes."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_comparison(
        self,
        comparison_id: str,
        comp_type: str,
        nutrient_id: str | None,
        nutrient_label: str | None,
        region_id: str | None,
        region_label: str | None,
        basis: str | None,
        status: str,
        replaced_by: str | None,
        notes: str | None,
    ) -> OrkgComparison:
        stmt = select(OrkgComparison).where(OrkgComparison.comparison_id == comparison_id)
        existing = (await self.session.execute(stmt)).scalar_one_or_none()
        if existing:
            existing.type = comp_type
            existing.nutrient_id = nutrient_id
            existing.nutrient_label = nutrient_label
            existing.region_id = region_id
            existing.region_label = region_label
            existing.basis = basis
            existing.status = status
            existing.replaced_by = replaced_by
            existing.notes = notes
            await self.session.flush()
            return existing

        comp = OrkgComparison(
            comparison_id=comparison_id,
            type=comp_type,
            nutrient_id=nutrient_id,
            nutrient_label=nutrient_label,
            region_id=region_id,
            region_label=region_label,
            basis=basis,
            status=status,
            replaced_by=replaced_by,
            notes=notes,
        )
        self.session.add(comp)
        await self.session.flush()
        return comp

    async def list_comparisons(
        self, comparison_ids: list[str] | None = None, only_active: bool = True
    ) -> list[OrkgComparison]:
        stmt = select(OrkgComparison)
        if comparison_ids:
            stmt = stmt.where(OrkgComparison.comparison_id.in_(comparison_ids))
        elif only_active:
            stmt = stmt.where(OrkgComparison.status == "active")
        stmt = stmt.order_by(OrkgComparison.comparison_id.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def record_snapshot(
        self,
        comparison_id: str,
        method: str,
        checksum: str,
        raw_file: str,
        raw_payload: dict[str, Any] | None = None,
        batch_id: str | None = None,
        alert_message: str | None = None,
        fetched_at: datetime | None = None,
    ) -> OrkgSnapshot:
        snap = OrkgSnapshot(
            comparison_id=comparison_id,
            fetched_at=fetched_at or datetime.now(UTC),
            method=method,
            checksum=checksum,
            raw_file=raw_file,
            raw_payload=raw_payload,
            batch_id=batch_id,
            alert_message=alert_message,
        )
        self.session.add(snap)
        await self.session.flush()
        return snap

    async def get_latest_snapshot(self, comparison_id: str) -> OrkgSnapshot | None:
        stmt = (
            select(OrkgSnapshot)
            .where(
                OrkgSnapshot.comparison_id == comparison_id,
                OrkgSnapshot.raw_payload.is_not(None),
            )
            .order_by(OrkgSnapshot.fetched_at.desc())
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_snapshots(self, comparison_id: str | None = None) -> list[OrkgSnapshot]:
        stmt = select(OrkgSnapshot)
        if comparison_id:
            stmt = stmt.where(OrkgSnapshot.comparison_id == comparison_id)
        stmt = stmt.order_by(OrkgSnapshot.fetched_at.desc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_current_recipes(self) -> list[Recipe]:
        stmt = (
            select(Recipe)
            .options(selectinload(Recipe.ingredients))
            .where(Recipe.is_current.is_(True))
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def save_versioned_recipe(
        self,
        dish_food_id: str,
        region_id: str | None,
        source_id: str | None,
        batch_id: str,
        ingredients: list[dict[str, Any]],
    ) -> Recipe:
        stmt = (
            select(Recipe)
            .where(Recipe.dish_food_id == dish_food_id, Recipe.is_current.is_(True))
            .limit(1)
        )
        existing = (await self.session.execute(stmt)).scalar_one_or_none()
        new_version = 1
        if existing:
            await self.session.execute(
                update(Recipe).where(Recipe.id == existing.id).values(is_current=False)
            )
            new_version = existing.version + 1

        recipe = Recipe(
            dish_food_id=dish_food_id,
            region_id=region_id,
            source_id=source_id,
            batch_id=batch_id,
            status="to_review",
            version=new_version,
            is_current=True,
        )
        self.session.add(recipe)
        await self.session.flush()

        for idx, ing in enumerate(ingredients, start=1):
            self.session.add(
                RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_food_id=ing["ingredient_food_id"],
                    proportion_pct=Decimal(str(ing["proportion_pct"])),
                    importance=ing.get("importance"),
                    position=int(ing.get("position", idx)),
                )
            )
        await self.session.flush()
        return recipe
