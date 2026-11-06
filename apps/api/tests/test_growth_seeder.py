"""Tests for WHO Growth standards idempotent database seeder and edge cases."""

from __future__ import annotations

import csv
import tempfile
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from tsotsa_api.core.database import Base
from tsotsa_api.modules.growth.service import GrowthService


@pytest.fixture
async def db_session() -> AsyncSession:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as session:
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_growth_seeder_idempotent(db_session: AsyncSession) -> None:
    """Verify seeding WHO reference data is idempotent and populates lookup table."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        csv_file = f"{tmp_dir}/test_wfl_f.csv"
        headers = [
            "indicator",
            "sex",
            "x_value",
            "L",
            "M",
            "S",
            "SD4neg",
            "SD3neg",
            "SD2neg",
            "SD1neg",
            "SD0",
            "SD1",
            "SD2",
            "SD3",
            "SD4",
        ]
        row = [
            "wfl",
            "F",
            "55.0",
            "-0.3833",
            "4.5",
            "0.09",
            "",
            "3.5",
            "3.8",
            "",
            "4.5",
            "",
            "5.2",
            "5.6",
            "",
        ]
        with open(csv_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerow(row)

        service = GrowthService(db_session)
        # First load
        count1 = await service.seed_from_directory(tmp_dir)
        assert count1 == 1

        # Second load (idempotent: replaying same file does not fail or duplicate)
        count2 = await service.seed_from_directory(tmp_dir)
        assert count2 == 1

        # Query loaded curve
        curves = await service.get_growth_curves("wfl", "F")
        assert len(curves.points) == 1
        assert curves.points[0].x_value == Decimal("55.0")
