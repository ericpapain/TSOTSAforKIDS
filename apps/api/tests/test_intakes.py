"""Tests for Domain I: Intakes module, offline sync, compliance rate and permissions (Étape P07)."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from tsotsa_api.core.database import Base, get_db_session
from tsotsa_api.core.security import create_access_token
from tsotsa_api.main import create_app
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.shared.types import generate_uuid7


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
async def test_intakes_lifecycle_and_idempotence(db_session: AsyncSession) -> None:
    """Verify single intake creation, offline batch sync, and idempotence on client UUID."""
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db
    _, h_parent = await _make_user(db_session, "Maman Jeanne", "user")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Parent registers child
        child_res = await client.post(
            "/v1/family/members",
            json={"first_name": "Samuel", "birth_date": "2024-01-05", "sex": "M"},
            headers=h_parent,
        )
        child_id = child_res.json()["id"]

        # 2. Record single intake with phone-generated UUID
        uuid_1 = generate_uuid7()
        now_iso = datetime.now(UTC).isoformat()
        res_1 = await client.post(
            "/v1/intakes",
            json={
                "id": uuid_1,
                "person_id": child_id,
                "item_type": "product",
                "item_id": generate_uuid7(),
                "quantity": 1.0,
                "unit": "sachet",
                "taken_at": now_iso,
                "consumption": "tout",  # French synonym for "all"
                "origin": "application",  # French synonym for "app"
                "notes": "Pris au petit déjeuner sans difficulté",
            },
            headers=h_parent,
        )
        assert res_1.status_code == 201
        data_1 = res_1.json()
        assert data_1["id"] == uuid_1
        assert data_1["consumption"] == "all"
        assert data_1["origin"] == "app"

        # 3. Idempotence: replaying single intake with same UUID returns existing record
        res_dup = await client.post(
            "/v1/intakes",
            json={
                "id": uuid_1,
                "person_id": child_id,
                "item_type": "product",
                "item_id": data_1["item_id"],
                "quantity": 1.0,
                "unit": "sachet",
                "taken_at": now_iso,
                "consumption": "all",
            },
            headers=h_parent,
        )
        assert res_dup.status_code == 201
        assert res_dup.json()["id"] == uuid_1

        # 4. Offline batch sync: 1 existing duplicate + 2 new intakes
        uuid_2, uuid_3 = generate_uuid7(), generate_uuid7()
        batch_payload = {
            "intakes": [
                {
                    "id": uuid_1,
                    "person_id": child_id,
                    "item_type": "product",
                    "item_id": data_1["item_id"],
                    "quantity": 1.0,
                    "unit": "sachet",
                    "taken_at": now_iso,
                    "consumption": "all",
                },
                {
                    "id": uuid_2,
                    "person_id": child_id,
                    "item_type": "food",
                    "item_id": generate_uuid7(),
                    "quantity": 150.0,
                    "unit": "g",
                    "taken_at": (datetime.now(UTC) - timedelta(hours=2)).isoformat(),
                    "consumption": "moitié",
                    "origin": "confirmation tardive",
                },
                {
                    "id": uuid_3,
                    "person_id": child_id,
                    "item_type": "product",
                    "item_id": data_1["item_id"],
                    "quantity": 1.0,
                    "unit": "sachet",
                    "taken_at": (datetime.now(UTC) - timedelta(hours=4)).isoformat(),
                    "consumption": "refusé",
                },
            ]
        }
        res_sync = await client.post("/v1/sync/intakes", json=batch_payload, headers=h_parent)
        assert res_sync.status_code == 200
        sync_data = res_sync.json()
        assert sync_data["received_count"] == 3
        assert sync_data["inserted_count"] == 2
        assert sync_data["duplicates_skipped"] == 1

        # Re-syncing exact batch -> 0 inserted, 3 duplicates skipped
        res_re_sync = await client.post("/v1/sync/intakes", json=batch_payload, headers=h_parent)
        assert res_re_sync.status_code == 200
        assert res_re_sync.json()["inserted_count"] == 0
        assert res_re_sync.json()["duplicates_skipped"] == 3

        # 5. History and filters
        all_res = await client.get(f"/v1/persons/{child_id}/intakes", headers=h_parent)
        assert all_res.status_code == 200 and len(all_res.json()) == 3

        food_res = await client.get(
            f"/v1/persons/{child_id}/intakes", params={"item_type": "food"}, headers=h_parent
        )
        assert food_res.status_code == 200 and len(food_res.json()) == 1

        refused_res = await client.get(
            f"/v1/persons/{child_id}/intakes", params={"consumption": "refused"}, headers=h_parent
        )
        assert refused_res.status_code == 200 and len(refused_res.json()) == 1


@pytest.mark.asyncio
async def test_intakes_compliance_rate_and_access_isolation(db_session: AsyncSession) -> None:
    """Verify 7-day adherence rate calculation and caregiver consent/isolation enforcement."""
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db
    _, h_admin = await _make_user(db_session, "Admin Santé", "admin")
    _, h_parent = await _make_user(db_session, "Papa Paul", "user")
    _, h_stranger = await _make_user(db_session, "Autre Parent", "user")
    cg_yaounde, h_cg_yde = await _make_user(db_session, "Dr Kamga", "caregiver")
    cg_douala, h_cg_dla = await _make_user(db_session, "Dr Fopa", "caregiver")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create establishments and approve caregivers
        org_yde = (
            await client.post(
                "/v1/admin/organizations",
                json={"name": "Hôpital Central Yaoundé", "type": "hopital"},
                headers=h_admin,
            )
        ).json()["id"]
        org_dla = (
            await client.post(
                "/v1/admin/organizations",
                json={"name": "Hôpital Général Douala", "type": "hopital"},
                headers=h_admin,
            )
        ).json()["id"]

        await client.post(
            f"/v1/admin/organizations/{org_yde}/caregivers",
            json={"user_id": cg_yaounde.id, "licence_number": "YDE-101", "approve": True},
            headers=h_admin,
        )
        await client.post(
            f"/v1/admin/organizations/{org_dla}/caregivers",
            json={"user_id": cg_douala.id, "licence_number": "DLA-202", "approve": True},
            headers=h_admin,
        )

        # Parent registers child and attaches to Yaoundé
        child = (
            await client.post(
                "/v1/family/members",
                json={"first_name": "Amina", "birth_date": "2023-06-15", "sex": "F"},
                headers=h_parent,
            )
        ).json()
        child_id = child["id"]

        await client.post(
            f"/v1/family/members/{child_id}/care",
            json={"organization_id": org_yde},
            headers=h_parent,
        )

        # 6 intakes within 7 days (4 all, 1 half, 1 refused) + 1 intake 10 days ago (outside)
        now = datetime.now(UTC)
        prod_id = generate_uuid7()
        items = [
            ("all", now - timedelta(days=1)),
            ("all", now - timedelta(days=2)),
            ("all", now - timedelta(days=3)),
            ("all", now - timedelta(days=4)),
            ("half", now - timedelta(days=5)),
            ("refused", now - timedelta(days=6)),
            ("all", now - timedelta(days=10)),
        ]
        sync_payload = {
            "intakes": [
                {
                    "id": generate_uuid7(),
                    "person_id": child_id,
                    "item_type": "product",
                    "item_id": prod_id,
                    "quantity": 1.0,
                    "unit": "sachet",
                    "taken_at": dt.isoformat(),
                    "consumption": cons,
                }
                for cons, dt in items
            ]
        }
        res_sync = await client.post("/v1/sync/intakes", json=sync_payload, headers=h_parent)
        assert res_sync.status_code == 200 and res_sync.json()["inserted_count"] == 7

        # 1. 7-day rate: 5 confirmed / 6 in-window = 83.33%
        rate_res = await client.get(
            f"/v1/persons/{child_id}/intakes/compliance-rate",
            params={"reference_date": now.isoformat()},
            headers=h_parent,
        )
        assert rate_res.status_code == 200
        rate_data = rate_res.json()
        assert rate_data["total_recorded"] == 6
        assert rate_data["confirmed_count"] == 5
        assert rate_data["refused_count"] == 1
        assert float(rate_data["compliance_rate_pct"]) == 83.33

        # 2. Access control: stranger -> 403; Caregiver Yaoundé without consent -> 403
        assert (
            await client.get(f"/v1/persons/{child_id}/intakes", headers=h_stranger)
        ).status_code == 403
        assert (
            await client.get(f"/v1/persons/{child_id}/intakes/compliance-rate", headers=h_cg_yde)
        ).status_code == 403

        # 3. Parent gives consent -> Caregiver Yaoundé can access compliance rate
        consent_res = await client.post(
            f"/v1/persons/{child_id}/consent",
            json={"legal_guardian": True},
            headers=h_parent,
        )
        assert consent_res.status_code == 201
        cg_ok = await client.get(
            f"/v1/persons/{child_id}/intakes/compliance-rate",
            params={"reference_date": now.isoformat()},
            headers=h_cg_yde,
        )
        assert cg_ok.status_code == 200 and cg_ok.json()["confirmed_count"] == 5

        # 4. Caregiver Douala (different establishment) -> 403
        assert (
            await client.get(f"/v1/persons/{child_id}/intakes/compliance-rate", headers=h_cg_dla)
        ).status_code == 403
