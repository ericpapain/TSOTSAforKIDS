"""Integration tests for nutritional equivalence and optimization endpoints (Étape P05)."""

from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from tsotsa_api.core.database import Base, get_db_session
from tsotsa_api.core.security import create_access_token
from tsotsa_api.main import create_app
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as session:
        yield session
    await engine.dispose()


async def _make_admin(session: AsyncSession) -> tuple[User, dict[str, str]]:
    repo = IdentityRepository(session)
    user = await repo.create_user(display_name="Admin Nutri")
    await repo.assign_role(user.id, "admin")
    await session.commit()
    token = create_access_token(user.id, claims={"roles": ["admin"]})
    return user, {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_equivalence_api_workflow_and_optimization_stub(
    db_session: AsyncSession,
) -> None:
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db
    from tsotsa_api.modules.nutrients.service import NutrientService

    await NutrientService(db_session).seed_from_csv()
    _, admin_headers = await _make_admin(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Admin creates validated reference product F-75
        prod_res = await client.post(
            "/v1/admin/reference-products",
            headers=admin_headers,
            json={
                "name": "F-75 Therapeutic Milk",
                "base": "100ml",
                "usage": "hôpital",
                "status": "validé",
                "source_reference": "WHO Specifications 2007",
                "unit_label": "sachet",
                "nutrients": [
                    {"nutrient": "Proteines", "value": "10.0", "unit": "g"},
                    {"nutrient": "Fer", "value": "2.0", "unit": "mg"},
                    {"nutrient": "Zinc", "value": "2.0", "unit": "mg"},
                ],
                "essential_nutrients": ["Proteines", "Fer", "Zinc"],
            },
        )
        assert prod_res.status_code == 201
        prod_id = prod_res.json()["id"]

        # 2. Query equivalents for F-75
        equiv_res = await client.get(f"/v1/products/{prod_id}/equivalents")
        assert equiv_res.status_code == 200
        data = equiv_res.json()
        assert data["product_id"] == prod_id
        assert data["product_name"] == "F-75 Therapeutic Milk"
        assert "protein" in data["essential_nutrients"]
        assert isinstance(data["equivalents"], list)

        # 3. Query with custom user nutrients
        custom_res = await client.get(
            f"/v1/products/{prod_id}/equivalents",
            params={"nutrients": "protein,iron", "region": "Centre", "strict": "false"},
        )
        assert custom_res.status_code == 200
        assert custom_res.json()["essential_nutrients"] == ["protein", "iron"]
        assert custom_res.json()["target_region"] == "Centre"

        # 4. Unknown product returns 404
        not_found = await client.get(
            "/v1/products/00000000-0000-0000-0000-000000000000/equivalents"
        )
        assert not_found.status_code == 404

        # 5. Future optimization engine endpoint returns 501 Not Implemented
        opt_res = await client.post(
            "/v1/optimization/solve",
            json={
                "target_product_id": prod_id,
                "portion_target_grams": 100.0,
                "region": "Centre",
            },
        )
        assert opt_res.status_code == 501
        res_data = opt_res.json()
        err_msg = res_data.get("detail") or res_data.get("error", {}).get("message", "")
        assert "réservé pour une version ultérieure" in err_msg
