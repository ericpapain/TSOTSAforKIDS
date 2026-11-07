"""Integration tests for Domain J: Intake Schedules API and caregiver permissions."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import date

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from tsotsa_api.core.database import Base, get_db_session
from tsotsa_api.core.security import create_access_token
from tsotsa_api.main import create_app
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.persons.service import PersonsService


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
async def test_intake_schedules_lifecycle_and_permissions(db_session: AsyncSession) -> None:
    app = create_app()

    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db_session] = _get_test_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Setup Admin, Caregiver A (Org A), Caregiver B (Org B), Parent
        admin, admin_headers = await _make_user(db_session, "Admin System", "admin")
        cg_a, cg_a_headers = await _make_user(db_session, "Dr Mbarga", "caregiver")
        cg_b, cg_b_headers = await _make_user(db_session, "Dr Ndongo", "caregiver")
        parent, parent_headers = await _make_user(db_session, "Maman Jeanne", "user")

        # 2. Establishments A & B
        r_org_a = await client.post(
            "/v1/admin/organizations",
            json={"name": "Hôpital Pédiatrique Yaoundé", "type": "hopital"},
            headers=admin_headers,
        )
        assert r_org_a.status_code == 201
        org_a_id = r_org_a.json()["id"]

        r_org_b = await client.post(
            "/v1/admin/organizations",
            json={"name": "CMA Bonamoussadi Douala", "type": "cma"},
            headers=admin_headers,
        )
        assert r_org_b.status_code == 201
        org_b_id = r_org_b.json()["id"]

        # Attach caregivers
        await client.post(
            f"/v1/admin/organizations/{org_a_id}/caregivers",
            json={"user_id": cg_a.id, "licence_number": "CAM-101", "approve": True},
            headers=admin_headers,
        )
        await client.post(
            f"/v1/admin/organizations/{org_b_id}/caregivers",
            json={"user_id": cg_b.id, "licence_number": "CAM-202", "approve": True},
            headers=admin_headers,
        )

        # 3. Create Child with family link to parent and care at Org A
        persons_srv = PersonsService(db_session)
        child = await persons_srv.care_service.register_person_in_care(
            org_id=org_a_id,
            pseudonym="#A-505",
            first_name="Samuel",
            birth_date=date(2025, 4, 1),
            sex="M",
            actor_user_id=cg_a.id,
        )
        await persons_srv.repo.create_person_link(
            person_id=child.id,
            user_id=parent.id,
            relation="child",
            is_primary=True,
        )
        await db_session.commit()

        # 4. Caregiver B (from Org B) tries to prescribe -> 403 Forbidden
        sched_payload = {
            "person_id": child.id,
            "product_name": "F-75 Lait Thérapeutique",
            "quantity": "1.0",
            "unit": "sachet",
            "start_date": "2026-11-06",
            "end_date": "2026-11-20",
            "timezone": "Africa/Douala",
            "times": [
                {"local_time": "08:00", "enabled": True},
                {"local_time": "12:00", "enabled": True},
                {"local_time": "18:00", "enabled": True},
            ],
        }
        res_forb = await client.post("/v1/schedules", json=sched_payload, headers=cg_b_headers)
        assert res_forb.status_code == 403

        # 5. Caregiver A (from Org A) prescribes successfully -> 201 Created
        res_create = await client.post("/v1/schedules", json=sched_payload, headers=cg_a_headers)
        assert res_create.status_code == 201
        created_sched = res_create.json()
        schedule_id = created_sched["id"]
        assert created_sched["person_id"] == child.id
        assert len(created_sched["schedule_times"]) == 3
        assert created_sched["status"] == "active"

        # 6. Parent and Caregiver A can view the schedule
        res_view_parent = await client.get(f"/v1/schedules/{schedule_id}", headers=parent_headers)
        assert res_view_parent.status_code == 200
        assert res_view_parent.json()["product_name"] == "F-75 Lait Thérapeutique"

        res_list_cg = await client.get(f"/v1/persons/{child.id}/schedules", headers=cg_a_headers)
        assert res_list_cg.status_code == 200
        assert len(res_list_cg.json()) == 1

        # 7. Update schedule (modify quantity and times)
        update_payload = {
            "quantity": "1.5",
            "times": [
                {"local_time": "09:00", "enabled": True},
                {"local_time": "15:00", "enabled": True},
            ],
        }
        res_update = await client.patch(
            f"/v1/schedules/{schedule_id}", json=update_payload, headers=cg_a_headers
        )
        assert res_update.status_code == 200
        updated_data = res_update.json()
        assert float(updated_data["quantity"]) == 1.5
        assert len(updated_data["schedule_times"]) == 2

        # 8. Cancel schedule
        res_cancel = await client.delete(f"/v1/schedules/{schedule_id}", headers=cg_a_headers)
        assert res_cancel.status_code == 204

        res_after_cancel = await client.get(f"/v1/schedules/{schedule_id}", headers=cg_a_headers)
        assert res_after_cancel.status_code == 200
        assert res_after_cancel.json()["status"] == "cancelled"
