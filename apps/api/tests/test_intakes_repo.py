"""Direct unit tests for IntakesRepository and Schema normalizers."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from tsotsa_api.core.database import Base
from tsotsa_api.modules.intakes.repository import IntakesRepository
from tsotsa_api.modules.intakes.schemas import normalize_consumption, normalize_origin
from tsotsa_api.shared.types import generate_uuid7


@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as session:
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_intakes_repository_edge_cases(db_session: AsyncSession) -> None:
    repo = IntakesRepository(db_session)

    # 1. Invalid UUID handling
    assert await repo.get_by_id("invalid-uuid") is None
    assert await repo.list_for_person("not-a-uuid") == []
    assert await repo.count_for_person("not-a-uuid") == 0
    now = datetime.now(UTC)
    assert await repo.get_intakes_in_range("not-a-uuid", now, now) == []

    # 2. Schema validators
    assert normalize_consumption("TOUT") == "all"
    assert normalize_consumption("moitie") == "half"
    assert normalize_origin("inconnue") == "app"
    with pytest.raises(ValueError, match="Consommation invalide"):
        normalize_consumption("inconnu")

    # 3. Create and count with filters
    person_id = generate_uuid7()
    user_id = generate_uuid7()
    item_id = generate_uuid7()
    it = await repo.create_intake(
        intake_id=None,
        person_id=person_id,
        item_type="food",
        item_id=item_id,
        quantity=Decimal("120"),
        unit="g",
        taken_at=now,
        consumption="all",
        origin="app",
        recorded_by=user_id,
    )
    assert it.id is not None
    assert await repo.count_for_person(person_id, item_type="food", consumption="all") == 1
    assert await repo.count_for_person(person_id, item_type="product") == 0

    # 4. List with date ranges
    range_res = await repo.list_for_person(
        person_id=person_id,
        start_date=now - timedelta(minutes=1),
        end_date=now + timedelta(minutes=1),
    )
    assert len(range_res) == 1
