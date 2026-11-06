"""Repository for Domain E (Food database and import batches)."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.food_database.models import (
    Food,
    FoodCategory,
    FoodNutrientValue,
    FoodRegion,
    ImportBatch,
    Region,
    Source,
)


class FoodDatabaseRepository:
    """Encapsulates database access for food entities and import batches."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_food_by_id(self, food_id: str) -> Food | None:
        stmt = (
            select(Food)
            .options(
                selectinload(Food.category),
                selectinload(Food.food_group),
                selectinload(Food.names),
                selectinload(Food.regions).selectinload(FoodRegion.region),
                selectinload(Food.nutrient_values).selectinload(FoodNutrientValue.source),
            )
            .where(Food.id == food_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_food_by_name(self, name: str, state: str | None = None) -> Food | None:
        stmt = select(Food).where(
            func.lower(Food.name) == name.strip().lower(),
            Food.is_current.is_(True),
        )
        if state:
            stmt = stmt.where(func.lower(Food.state) == state.strip().lower())
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def search_foods(
        self,
        query: str | None = None,
        category_code: str | None = None,
        region_code: str | None = None,
        offset: int = 0,
        limit: int = 20,
        only_published: bool = True,
    ) -> list[Food]:
        stmt = select(Food).options(selectinload(Food.category)).where(Food.is_current.is_(True))
        if only_published:
            stmt = stmt.where(Food.status == "published")
        if category_code:
            stmt = stmt.join(Food.category).where(
                func.lower(FoodCategory.code) == category_code.strip().lower()
            )
        if region_code:
            stmt = (
                stmt.join(Food.regions)
                .join(FoodRegion.region)
                .where(func.lower(Region.code) == region_code.strip().lower())
            )
        if query:
            clean_q = f"%{query.strip().lower()}%"
            stmt = stmt.where(func.lower(Food.name).like(clean_q))

        stmt = stmt.order_by(Food.name).offset(offset).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def count_foods(
        self,
        query: str | None = None,
        category_code: str | None = None,
        region_code: str | None = None,
        only_published: bool = True,
    ) -> int:
        stmt = select(func.count(func.distinct(Food.id))).where(Food.is_current.is_(True))
        if only_published:
            stmt = stmt.where(Food.status == "published")
        if category_code:
            stmt = stmt.join(Food.category).where(
                func.lower(FoodCategory.code) == category_code.strip().lower()
            )
        if region_code:
            stmt = (
                stmt.join(Food.regions)
                .join(FoodRegion.region)
                .where(func.lower(Region.code) == region_code.strip().lower())
            )
        if query:
            clean_q = f"%{query.strip().lower()}%"
            stmt = stmt.where(func.lower(Food.name).like(clean_q))
        res = await self.session.execute(stmt)
        return int(res.scalar() or 0)

    async def get_or_create_category(self, code: str, name: str | None = None) -> FoodCategory:
        clean = code.strip().lower()
        stmt = select(FoodCategory).where(func.lower(FoodCategory.code) == clean)
        res = await self.session.execute(stmt)
        cat = res.scalar_one_or_none()
        if cat:
            return cat
        cat = FoodCategory(code=clean, name=name or code.capitalize())
        self.session.add(cat)
        await self.session.flush()
        return cat

    async def get_or_create_region(self, code: str, name: str | None = None) -> Region:
        clean = code.strip().lower()
        stmt = select(Region).where(func.lower(Region.code) == clean)
        res = await self.session.execute(stmt)
        reg = res.scalar_one_or_none()
        if reg:
            return reg
        reg = Region(code=clean, name=name or code.capitalize())
        self.session.add(reg)
        await self.session.flush()
        return reg

    async def list_regions(self) -> list[Region]:
        stmt = select(Region).order_by(Region.name.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_region_by_id(self, region_id: str) -> Region | None:
        stmt = select(Region).where(Region.id == region_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_region_by_code(self, code: str) -> Region | None:
        clean = code.strip().lower()
        stmt = select(Region).where(func.lower(Region.code) == clean)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create_region(self, code: str, name: str, country_code: str = "CMR") -> Region:
        reg = Region(
            code=code.strip().lower(), name=name.strip(), country_code=country_code.strip().upper()
        )
        self.session.add(reg)
        await self.session.flush()
        return reg

    async def update_region(
        self,
        region_id: str,
        code: str | None = None,
        name: str | None = None,
        country_code: str | None = None,
    ) -> Region | None:
        reg = await self.get_region_by_id(region_id)
        if not reg:
            return None
        if code is not None:
            reg.code = code.strip().lower()
        if name is not None:
            reg.name = name.strip()
        if country_code is not None:
            reg.country_code = country_code.strip().upper()
        await self.session.flush()
        return reg

    async def find_or_create_source(
        self,
        article_reference: str | None = None,
        doi: str | None = None,
        orkg_comparison_id: str | None = None,
        orkg_contribution_label: str | None = None,
        paper_title: str | None = None,
        url: str | None = None,
    ) -> Source:
        stmt = select(Source)
        if doi:
            stmt = stmt.where(Source.doi == doi.strip())
        elif article_reference:
            stmt = stmt.where(Source.article_reference == article_reference.strip())
        elif orkg_comparison_id:
            stmt = stmt.where(Source.orkg_comparison_id == orkg_comparison_id.strip())
        else:
            stmt = stmt.where(Source.paper_title == paper_title)

        res = await self.session.execute(stmt)
        src = res.scalar_one_or_none()
        if src:
            return src

        src = Source(
            article_reference=article_reference.strip() if article_reference else None,
            doi=doi.strip() if doi else None,
            orkg_comparison_id=orkg_comparison_id.strip() if orkg_comparison_id else None,
            orkg_contribution_label=orkg_contribution_label.strip()
            if orkg_contribution_label
            else None,
            paper_title=paper_title.strip() if paper_title else None,
            url=url.strip() if url else None,
        )
        self.session.add(src)
        await self.session.flush()
        return src

    async def get_batch_by_id(self, batch_id: str) -> ImportBatch | None:
        stmt = (
            select(ImportBatch)
            .options(selectinload(ImportBatch.rows))
            .where(ImportBatch.id == batch_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def find_existing_nutrient_value(
        self, food_id: str, nutrient_id: str, basis: str
    ) -> FoodNutrientValue | None:
        stmt = select(FoodNutrientValue).where(
            FoodNutrientValue.food_id == food_id,
            FoodNutrientValue.nutrient_id == nutrient_id,
            FoodNutrientValue.basis == basis,
            FoodNutrientValue.is_current.is_(True),
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()
