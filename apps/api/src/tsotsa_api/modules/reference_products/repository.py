"""Repository layer for Domain F (Products) and Domain L (Audit Log)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.reference_products.models import (
    AuditLog,
    Product,
    ProductEssentialNutrient,
    ProductNutrientValue,
)


def _is_valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except (ValueError, TypeError):
        return False


class ProductsRepository:
    """Encapsulates database access for reference/custom products and audit logs."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_product_by_id(self, product_id: str) -> Product | None:
        if not _is_valid_uuid(product_id):
            return None
        stmt = (
            select(Product)
            .options(
                selectinload(Product.nutrient_values),
                selectinload(Product.essential_nutrients),
            )
            .where(Product.id == product_id)
            .execution_options(populate_existing=True)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_visible_products(self, user_id: str | None = None) -> list[Product]:
        conditions = [
            (Product.type == "reference") & (Product.status == "validated"),
            (Product.type == "custom") & (Product.status == "published"),
        ]
        if user_id and _is_valid_uuid(user_id):
            conditions.append((Product.type == "custom") & (Product.owner_user_id == user_id))

        stmt = (
            select(Product)
            .options(
                selectinload(Product.nutrient_values),
                selectinload(Product.essential_nutrients),
            )
            .where(or_(*conditions))
            .order_by(Product.type.desc(), Product.name.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def list_admin_products(self, product_type: str | None = None) -> list[Product]:
        stmt = select(Product).options(
            selectinload(Product.nutrient_values),
            selectinload(Product.essential_nutrients),
        )
        if product_type:
            stmt = stmt.where(Product.type == product_type)
        stmt = stmt.order_by(Product.created_at.desc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def clear_product_nutrients(self, product_id: str) -> None:
        await self.session.execute(
            delete(ProductNutrientValue).where(ProductNutrientValue.product_id == product_id)
        )

    async def clear_product_essential_nutrients(self, product_id: str) -> None:
        await self.session.execute(
            delete(ProductEssentialNutrient).where(
                ProductEssentialNutrient.product_id == product_id
            )
        )

    async def record_audit_log(
        self,
        actor_user_id: str | None,
        action: str,
        entity: str,
        entity_id: str,
        details: dict[str, Any] | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            details=details,
        )
        self.session.add(entry)
        await self.session.flush()
        return entry

    async def list_audit_logs(
        self, entity: str | None = None, entity_id: str | None = None
    ) -> list[AuditLog]:
        stmt = select(AuditLog)
        if entity:
            stmt = stmt.where(AuditLog.entity == entity)
        if entity_id:
            if not _is_valid_uuid(entity_id):
                return []
            stmt = stmt.where(AuditLog.entity_id == entity_id)
        stmt = stmt.order_by(AuditLog.at.desc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
