"""Repository layer for Domain D (Nutrients and Units)."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.nutrients.models import (
    Nutrient,
    NutrientSynonym,
    Unit,
    UnitConversion,
)


class NutrientsRepository:
    """Encapsulates database access for units and nutrients."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_unit_by_code(self, code: str) -> Unit | None:
        stmt = select(Unit).where(func.lower(Unit.code) == code.strip().lower())
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_units(self) -> list[Unit]:
        stmt = select(Unit).order_by(Unit.code)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save_unit(self, code: str, kind: str, name: str | None = None) -> Unit:
        existing = await self.get_unit_by_code(code)
        if existing:
            existing.kind = kind
            if name:
                existing.name = name
            return existing
        unit = Unit(code=code, kind=kind, name=name)
        self.session.add(unit)
        await self.session.flush()
        return unit

    async def save_unit_conversion(
        self, from_unit_id: str, to_unit_id: str, factor: Decimal
    ) -> UnitConversion:
        stmt = select(UnitConversion).where(
            UnitConversion.from_unit_id == from_unit_id,
            UnitConversion.to_unit_id == to_unit_id,
        )
        result = await self.session.execute(stmt)
        conv = result.scalar_one_or_none()
        if conv:
            conv.factor = factor
            return conv
        conv = UnitConversion(from_unit_id=from_unit_id, to_unit_id=to_unit_id, factor=factor)
        self.session.add(conv)
        await self.session.flush()
        return conv

    async def get_conversion_factor(self, from_unit_id: str, to_unit_id: str) -> Decimal | None:
        if from_unit_id == to_unit_id:
            return Decimal("1.0")
        stmt = select(UnitConversion.factor).where(
            UnitConversion.from_unit_id == from_unit_id,
            UnitConversion.to_unit_id == to_unit_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_nutrient_by_code(self, code: str) -> Nutrient | None:
        stmt = (
            select(Nutrient)
            .options(selectinload(Nutrient.reference_unit), selectinload(Nutrient.synonyms))
            .where(func.lower(Nutrient.code) == code.strip().lower())
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_nutrient_by_id(self, nutrient_id: str) -> Nutrient | None:
        stmt = (
            select(Nutrient)
            .options(selectinload(Nutrient.reference_unit), selectinload(Nutrient.synonyms))
            .where(Nutrient.id == nutrient_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_nutrient_by_label(self, label: str) -> Nutrient | None:
        cleaned = label.strip().lower()
        # 1. Match code
        direct = await self.get_nutrient_by_code(cleaned)
        if direct:
            return direct
        # 2. Match name_fr or name_en
        stmt_name = (
            select(Nutrient)
            .options(selectinload(Nutrient.reference_unit), selectinload(Nutrient.synonyms))
            .where(
                (func.lower(Nutrient.name_fr) == cleaned)
                | (func.lower(Nutrient.name_en) == cleaned)
            )
        )
        result_name = await self.session.execute(stmt_name)
        by_name = result_name.scalar_one_or_none()
        if by_name:
            return by_name
        # 3. Match synonyms
        stmt_syn = (
            select(Nutrient)
            .join(NutrientSynonym)
            .options(selectinload(Nutrient.reference_unit), selectinload(Nutrient.synonyms))
            .where(func.lower(NutrientSynonym.label) == cleaned)
        )
        result_syn = await self.session.execute(stmt_syn)
        return result_syn.scalar_one_or_none()

    async def get_all_nutrients(self, tracked_only: bool = False) -> list[Nutrient]:
        stmt = select(Nutrient).options(
            selectinload(Nutrient.reference_unit), selectinload(Nutrient.synonyms)
        )
        if tracked_only:
            stmt = stmt.where(Nutrient.is_tracked.is_(True))
        stmt = stmt.order_by(Nutrient.category, Nutrient.code)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save_nutrient(
        self,
        code: str,
        name_fr: str,
        category: str,
        reference_unit_id: str,
        plausible_min: Decimal | None = None,
        plausible_max: Decimal | None = None,
        name_en: str | None = None,
        is_tracked: bool = True,
    ) -> Nutrient:
        existing = await self.get_nutrient_by_code(code)
        if existing:
            existing.name_fr = name_fr
            existing.name_en = name_en
            existing.category = category
            existing.reference_unit_id = reference_unit_id
            existing.plausible_min = plausible_min
            existing.plausible_max = plausible_max
            existing.is_tracked = is_tracked
            return existing
        nutrient = Nutrient(
            code=code,
            name_fr=name_fr,
            name_en=name_en,
            category=category,
            reference_unit_id=reference_unit_id,
            plausible_min=plausible_min,
            plausible_max=plausible_max,
            is_tracked=is_tracked,
        )
        self.session.add(nutrient)
        await self.session.flush()
        return nutrient

    async def add_synonym(self, nutrient_id: str, label: str) -> NutrientSynonym:
        cleaned = label.strip()
        stmt = select(NutrientSynonym).where(
            NutrientSynonym.nutrient_id == nutrient_id,
            func.lower(NutrientSynonym.label) == cleaned.lower(),
        )
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            return existing
        synonym = NutrientSynonym(nutrient_id=nutrient_id, label=cleaned)
        self.session.add(synonym)
        await self.session.flush()
        return synonym
