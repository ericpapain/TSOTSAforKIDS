"""Tests for Domain H: Pricing module (Étape P06)."""

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


async def _make_user(session: AsyncSession, name: str, role: str) -> tuple[User, dict[str, str]]:
    repo = IdentityRepository(session)
    user = await repo.create_user(display_name=name)
    await repo.assign_role(user.id, role)
    await session.commit()
    token = create_access_token(user.id, claims={"roles": [role]})
    return user, {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_pricing_latest_and_unspecified(db_session: AsyncSession) -> None:
    """Verify absence of price returns 'non renseigné', then newest record is returned."""
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, admin_headers = await _make_user(db_session, "Admin Prix", "admin")
    _, user_headers = await _make_user(db_session, "Utilisateur Standard", "user")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create regions via admin endpoint
        r_ce = await client.post(
            "/v1/admin/regions",
            json={"code": "centre", "name": "Centre"},
            headers=admin_headers,
        )
        assert r_ce.status_code == 201
        centre_id = r_ce.json()["id"]

        r_lt = await client.post(
            "/v1/admin/regions",
            json={"code": "littoral", "name": "Littoral"},
            headers=admin_headers,
        )
        assert r_lt.status_code == 201
        littoral_id = r_lt.json()["id"]
        fake_food_id = "01a1b05e-a484-720b-a687-2e20095f1d4f"
        fake_product_id = "01a1b05f-e220-72b6-a427-8595c5e18f94"

        # 1. Absence of price in Centre -> returns 'non renseigné'
        no_price_res = await client.get(
            "/v1/pricing/latest",
            params={"region_id": centre_id, "item_type": "food", "item_id": fake_food_id},
            headers=user_headers,
        )
        assert no_price_res.status_code == 200
        data = no_price_res.json()
        assert data["status"] == "unspecified" and data["message"] == "non renseigné"
        assert data["price"] is None

        # 2. Admin records older observation (500 FCFA on 2026-10-15)
        r1 = await client.post(
            "/v1/admin/pricing/records",
            headers=admin_headers,
            json={
                "region_id": centre_id,
                "item_type": "food",
                "item_id": fake_food_id,
                "price": 500.0,
                "currency": "FCFA",
                "unit": "kg",
                "observed_at": "2026-10-15",
                "source": "Marché Mfoundi",
            },
        )
        assert r1.status_code == 201

        # Now latest price in Centre is 500 FCFA
        latest1 = await client.get(
            f"/v1/pricing/foods/{fake_food_id}/latest",
            params={"region_id": centre_id},
            headers=user_headers,
        )
        assert latest1.status_code == 200 and float(latest1.json()["price"]) == 500.0
        assert latest1.json()["source"] == "Marché Mfoundi"

        # Littoral still has no price
        lit = await client.get(
            f"/v1/pricing/foods/{fake_food_id}/latest",
            params={"region_id": littoral_id},
            headers=user_headers,
        )
        assert lit.json()["status"] == "unspecified" and lit.json()["message"] == "non renseigné"

        # 3. Admin records newer observation (650 FCFA on 2026-11-02)
        r2 = await client.post(
            "/v1/admin/pricing/records",
            headers=admin_headers,
            json={
                "region_id": centre_id,
                "item_type": "food",
                "item_id": fake_food_id,
                "price": 650.0,
                "currency": "FCFA",
                "unit": "kg",
                "observed_at": "2026-11-02",
                "source": "Marché Mokolo",
            },
        )
        assert r2.status_code == 201

        # Latest price updated to 650 FCFA
        latest2 = await client.get(
            f"/v1/pricing/foods/{fake_food_id}/latest",
            params={"region_id": centre_id},
            headers=user_headers,
        )
        assert (
            float(latest2.json()["price"]) == 650.0
            and latest2.json()["observed_at"] == "2026-11-02"
        )

        # Product latest check
        prod_rec = await client.post(
            "/v1/admin/pricing/records",
            headers=admin_headers,
            json={
                "region_id": centre_id,
                "item_type": "product",
                "item_id": fake_product_id,
                "price": 12000.0,
                "currency": "FCFA",
                "unit": "carton",
                "observed_at": "2026-11-05",
                "source": "Pharmacie du Centre",
            },
        )
        assert prod_rec.status_code == 201
        prod_lat = await client.get(
            f"/v1/pricing/products/{fake_product_id}/latest",
            params={"region_id": centre_id},
        )
        assert prod_lat.status_code == 200 and float(prod_lat.json()["price"]) == 12000.0


@pytest.mark.asyncio
async def test_pricing_permissions_and_history(db_session: AsyncSession) -> None:
    """Verify access controls (admin only for entry and history) and full audit history."""
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, admin_headers = await _make_user(db_session, "Admin Prix", "admin")
    _, user_headers = await _make_user(db_session, "Parent User", "user")

    fake_id = "01a1b05e-a484-720b-a687-2e20095f1d4f"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create region via admin endpoint
        r_ou = await client.post(
            "/v1/admin/regions",
            json={"code": "ouest", "name": "Ouest"},
            headers=admin_headers,
        )
        assert r_ou.status_code == 201
        reg_id = r_ou.json()["id"]

        # Non-admin cannot record prices
        post_bad = await client.post(
            "/v1/admin/pricing/records",
            headers=user_headers,
            json={
                "region_id": reg_id,
                "item_type": "food",
                "item_id": fake_id,
                "price": 400.0,
                "unit": "kg",
                "observed_at": "2026-11-01",
                "source": "Marché Bafoussam",
            },
        )
        assert post_bad.status_code == 403

        # Non-admin cannot access admin history
        hist_bad = await client.get("/v1/admin/pricing/records", headers=user_headers)
        assert hist_bad.status_code == 403

        # Admin creates two price records
        await client.post(
            "/v1/admin/pricing/records",
            headers=admin_headers,
            json={
                "region_id": reg_id,
                "item_type": "food",
                "item_id": fake_id,
                "price": 400.0,
                "unit": "kg",
                "observed_at": "2026-10-01",
                "source": "Marché Bafoussam",
            },
        )
        rec2 = (
            await client.post(
                "/v1/admin/pricing/records",
                headers=admin_headers,
                json={
                    "region_id": reg_id,
                    "item_type": "food",
                    "item_id": fake_id,
                    "price": 450.0,
                    "unit": "kg",
                    "observed_at": "2026-11-01",
                    "source": "Marché Bafoussam",
                },
            )
        ).json()

        # Admin lists history
        hist = await client.get(
            "/v1/admin/pricing/records",
            params={"region_id": reg_id, "item_type": "food"},
            headers=admin_headers,
        )
        assert hist.status_code == 200
        items = hist.json()
        assert len(items) == 2
        assert float(items[0]["price"]) == 450.0 and float(items[1]["price"]) == 400.0

        # Admin gets single record by ID
        get_res = await client.get(
            f"/v1/admin/pricing/records/{rec2['id']}",
            headers=admin_headers,
        )
        assert get_res.status_code == 200 and get_res.json()["source"] == "Marché Bafoussam"

        # Record not found returns 404
        not_found = await client.get(
            "/v1/admin/pricing/records/00000000-0000-0000-0000-000000000000",
            headers=admin_headers,
        )
        assert not_found.status_code == 404

        # Validation: missing or empty source rejected
        src_err = await client.post(
            "/v1/admin/pricing/records",
            headers=admin_headers,
            json={
                "region_id": reg_id,
                "item_type": "food",
                "item_id": fake_id,
                "price": 400.0,
                "unit": "kg",
                "observed_at": "2026-11-01",
                "source": "   ",
            },
        )
        assert src_err.status_code == 422

        # Validation: non-positive price rejected
        price_err = await client.post(
            "/v1/admin/pricing/records",
            headers=admin_headers,
            json={
                "region_id": reg_id,
                "item_type": "food",
                "item_id": fake_id,
                "price": -10.0,
                "unit": "kg",
                "observed_at": "2026-11-01",
                "source": "Relevé",
            },
        )
        assert price_err.status_code == 422
