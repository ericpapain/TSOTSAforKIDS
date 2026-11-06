"""Tests for Domain B: Modules registry (nutrition, hta, diabete) and application settings."""

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


async def _make_user(session: AsyncSession, name: str, role: str) -> tuple[User, str]:
    repo = IdentityRepository(session)
    user = await repo.create_user(display_name=name)
    await repo.assign_role(user.id, role)
    await session.commit()
    token = create_access_token(user.id, claims={"roles": [role]})
    return user, token


@pytest.mark.asyncio
async def test_modules_registry_lifecycle_and_permissions(db_session: AsyncSession) -> None:
    """Verify GET /v1/modules default states, admin activation/deactivation, and access control."""
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, admin_token = await _make_user(db_session, "Admin Plateforme", "admin")
    _, user_token = await _make_user(db_session, "Utilisateur Standard", "user")

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_user = {"Authorization": f"Bearer {user_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. GET /v1/modules returns nutrition (active), hta (coming_soon), diabete (coming_soon)
        res = await client.get("/v1/modules")
        assert res.status_code == 200
        modules = res.json()
        assert len(modules) == 3
        by_code = {m["code"]: m for m in modules}
        assert by_code["nutrition"]["status"] == "active"
        assert by_code["hta"]["status"] == "coming_soon"
        assert by_code["diabete"]["status"] == "coming_soon"

        # 2. Non-admin user cannot activate or modify modules (403 Forbidden)
        forbidden = await client.put(
            "/v1/admin/modules/hta",
            json={"status": "active"},
            headers=headers_user,
        )
        assert forbidden.status_code == 403

        forbidden_create = await client.post(
            "/v1/admin/modules",
            json={"code": "obesite", "name": "Obésité", "status": "coming_soon"},
            headers=headers_user,
        )
        assert forbidden_create.status_code == 403

        # 3. Admin activates 'hta' and disables 'diabete'
        act_hta = await client.put(
            "/v1/admin/modules/hta",
            json={"status": "active", "name": "Hypertension artérielle"},
            headers=headers_admin,
        )
        assert act_hta.status_code == 200
        assert act_hta.json()["status"] == "active"
        assert act_hta.json()["name"] == "Hypertension artérielle"

        dis_diab = await client.put(
            "/v1/admin/modules/diabete",
            json={"status": "disabled", "sort_order": 5},
            headers=headers_admin,
        )
        assert dis_diab.status_code == 200
        assert dis_diab.json()["status"] == "disabled"
        assert dis_diab.json()["sort_order"] == 5

        # 4. Admin registers a new future module without code changes
        new_mod = await client.post(
            "/v1/admin/modules",
            json={
                "code": "drepanocytose",
                "name": "Drépanocytose",
                "status": "coming_soon",
                "sort_order": 4,
            },
            headers=headers_admin,
        )
        assert new_mod.status_code == 201
        assert new_mod.json()["code"] == "drepanocytose"

        # Duplicate module code -> 409
        dup_mod = await client.post(
            "/v1/admin/modules",
            json={"code": "nutrition", "name": "Nutrition", "status": "active"},
            headers=headers_admin,
        )
        assert dup_mod.status_code == 409

        # Unknown module -> 404
        not_found = await client.put(
            "/v1/admin/modules/inconnu",
            json={"status": "active"},
            headers=headers_admin,
        )
        assert not_found.status_code == 404

        # 5. GET /v1/modules reflects updated statuses
        res_after = await client.get("/v1/modules")
        assert res_after.status_code == 200
        after_map = {m["code"]: m["status"] for m in res_after.json()}
        assert after_map == {
            "nutrition": "active",
            "hta": "active",
            "drepanocytose": "coming_soon",
            "diabete": "disabled",
        }

        # 6. Admin application settings CRUD
        put_set = await client.put(
            "/v1/admin/settings/reminder_delay_minutes",
            json={"value": {"minutes": 30}},
            headers=headers_admin,
        )
        assert put_set.status_code == 200
        assert put_set.json()["value"] == {"minutes": 30}

        upd_set = await client.put(
            "/v1/admin/settings/reminder_delay_minutes",
            json={"value": {"minutes": 45}},
            headers=headers_admin,
        )
        assert upd_set.status_code == 200
        assert upd_set.json()["value"] == {"minutes": 45}

        list_set = await client.get("/v1/admin/settings", headers=headers_admin)
        assert list_set.status_code == 200
        assert len(list_set.json()) == 1
