"""Database repository for Domain Growth (WHO Growth Standards)."""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

from sqlalchemy import select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.growth.engine import WHOReferenceRow
from tsotsa_api.modules.growth.models import GrowthReference
from tsotsa_api.shared.types import generate_uuid7


class GrowthRepository:
    """Provides querying and seeding of official WHO Growth Reference standards."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_reference_row(
        self,
        indicator: str,
        sex: Literal["F", "M"],
        x_value: float | Decimal,
    ) -> WHOReferenceRow | None:
        """Find the nearest or exact WHO reference row for an indicator and x value."""
        # Find exact or closest x_value
        stmt = (
            select(GrowthReference)
            .where(GrowthReference.indicator == indicator, GrowthReference.sex == sex)
            .order_by(
                (GrowthReference.x_value - Decimal(str(x_value)))
                * (GrowthReference.x_value - Decimal(str(x_value)))
            )
            .limit(1)
        )
        res = await self.session.execute(stmt)
        record = res.scalar_one_or_none()
        if not record:
            return None

        return WHOReferenceRow(
            indicator=record.indicator,
            sex=record.sex,
            x_value=float(record.x_value),
            L=float(record.l),
            M=float(record.m),
            S=float(record.s),
            SD3neg=float(record.sd3neg),
            SD2neg=float(record.sd2neg),
            SD0=float(record.sd0),
            SD2=float(record.sd2),
            SD3=float(record.sd3),
            SD4neg=float(record.sd4neg or 0.0),
            SD1neg=float(record.sd1neg or 0.0),
            SD1=float(record.sd1 or 0.0),
            SD4=float(record.sd4 or 0.0),
        )

    async def get_reference_curve(
        self,
        indicator: str,
        sex: Literal["F", "M"],
    ) -> list[GrowthReference]:
        """Retrieve full curve reference points for clinical plotting."""
        stmt = (
            select(GrowthReference)
            .where(GrowthReference.indicator == indicator, GrowthReference.sex == sex)
            .order_by(GrowthReference.x_value.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def upsert_row(
        self,
        indicator: str,
        sex: Literal["F", "M"],
        x_value: Decimal,
        l: Decimal,  # noqa: E741
        m: Decimal,
        s: Decimal,
        sd3neg: Decimal,
        sd2neg: Decimal,
        sd0: Decimal,
        sd2: Decimal,
        sd3: Decimal,
        sd4neg: Decimal | None = None,
        sd1neg: Decimal | None = None,
        sd1: Decimal | None = None,
        sd4: Decimal | None = None,
    ) -> None:
        """Insert or update a single reference row idempotently."""
        dialect_name = self.session.bind.dialect.name if self.session.bind else "sqlite"
        values = {
            "id": generate_uuid7(),
            "indicator": indicator,
            "sex": sex,
            "x_value": x_value,
            "l": l,
            "m": m,
            "s": s,
            "sd4neg": sd4neg,
            "sd3neg": sd3neg,
            "sd2neg": sd2neg,
            "sd1neg": sd1neg,
            "sd0": sd0,
            "sd1": sd1,
            "sd2": sd2,
            "sd3": sd3,
            "sd4": sd4,
        }
        if dialect_name == "mysql":
            stmt_mysql = mysql_insert(GrowthReference).values(**values)
            update_mysql = {
                "l": stmt_mysql.inserted.l,
                "m": stmt_mysql.inserted.m,
                "s": stmt_mysql.inserted.s,
                "sd3neg": stmt_mysql.inserted.sd3neg,
                "sd2neg": stmt_mysql.inserted.sd2neg,
                "sd0": stmt_mysql.inserted.sd0,
                "sd2": stmt_mysql.inserted.sd2,
                "sd3": stmt_mysql.inserted.sd3,
            }
            await self.session.execute(stmt_mysql.on_duplicate_key_update(**update_mysql))
        else:
            stmt_sqlite = sqlite_insert(GrowthReference).values(**values)
            update_sqlite = {
                "l": stmt_sqlite.excluded.l,
                "m": stmt_sqlite.excluded.m,
                "s": stmt_sqlite.excluded.s,
                "sd3neg": stmt_sqlite.excluded.sd3neg,
                "sd2neg": stmt_sqlite.excluded.sd2neg,
                "sd0": stmt_sqlite.excluded.sd0,
                "sd2": stmt_sqlite.excluded.sd2,
                "sd3": stmt_sqlite.excluded.sd3,
            }
            await self.session.execute(
                stmt_sqlite.on_conflict_do_update(
                    index_elements=["indicator", "sex", "x_value"],
                    set_=update_sqlite,
                )
            )
