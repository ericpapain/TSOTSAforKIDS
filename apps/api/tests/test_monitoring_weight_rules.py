"""Integration tests for clinical weight gain velocity alerts (weight loss & insufficient gain)."""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from tsotsa_api.core.database import Base, get_db_session
from tsotsa_api.core.security import create_access_token
from tsotsa_api.main import create_app
from tsotsa_api.modules.growth.repository import GrowthRepository
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.monitoring.models import AlertRule
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


async def _seed_standards_and_rules(session: AsyncSession) -> None:
    now = datetime.now(UTC)
    repo = GrowthRepository(session)
    for ind in ("wfl", "wfh", "lhfa", "wfa", "acfa", "bfa"):
        for sx in ("M", "F"):
            for x in (Decimal("70.0"), Decimal("75.0"), Decimal("365")):
                await repo.upsert_row(
                    indicator=ind,
                    sex=sx,
                    x_value=x,
                    l=Decimal("1.0"),
                    m=Decimal("9.0"),
                    s=Decimal("0.1"),
                    sd3neg=Decimal("6.0"),
                    sd2neg=Decimal("7.0"),
                    sd0=Decimal("9.0"),
                    sd2=Decimal("11.0"),
                    sd3=Decimal("12.0"),
                )
    rules = [
        ("insufficient_weight_gain", "Gain insuffisant", "high", {"threshold_g_kg_day": 5.0}),
        ("weight_loss", "Perte de poids", "urgent", {"threshold_g_kg_day": 0.0}),
    ]
    for code, name, priority, params in rules:
        session.add(
            AlertRule(
                id=str(uuid.uuid4()),
                code=code,
                name=name,
                description=name,
                parameters=params,
                priority=priority,
                is_active=True,
                created_at=now,
                updated_at=now,
            )
        )
    await session.commit()


@pytest.mark.asyncio
async def test_weight_loss_and_insufficient_gain_events(db_session) -> None:
    await _seed_standards_and_rules(db_session)
    app = create_app()

    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db_session] = _get_test_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        admin_user, admin_headers = await _make_user(db_session, "Admin Péd", "admin")
        cg_user, cg_headers = await _make_user(db_session, "Dr Essomba", "caregiver")

        res_org = await client.post(
            "/v1/admin/organizations",
            json={"name": "Hôpital Laquintinie", "type": "hopital"},
            headers=admin_headers,
        )
        assert res_org.status_code == 201
        org_id = res_org.json()["id"]

        await client.post(
            f"/v1/admin/organizations/{org_id}/caregivers",
            json={"user_id": cg_user.id, "licence_number": "MED-555", "approve": True},
            headers=admin_headers,
        )

        persons = PersonsService(db_session)
        child = await persons.care_service.register_person_in_care(
            org_id=org_id,
            pseudonym="#L-303",
            first_name="Fanny",
            birth_date=datetime(2025, 5, 1).date(),
            sex="F",
            actor_user_id=cg_user.id,
        )
        await db_session.commit()

        # 1. First consultation at J0
        dt0 = datetime.now(UTC) - timedelta(days=10)
        res_ev1 = await client.post(
            f"/v1/persons/{child.id}/evaluations",
            headers=cg_headers,
            json={
                "measured_at": dt0.isoformat(),
                "weight_kg": 8.000,
                "length_cm": 70.0,
                "position": "recumbent",
                "muac_mm": 130.0,
                "edema": "none",
            },
        )
        assert res_ev1.status_code == 201

        # 2. Second consultation at J10 with weight loss: 7.700 kg (loss of 300g in 10d)
        dt1 = datetime.now(UTC)
        res_ev2 = await client.post(
            f"/v1/persons/{child.id}/evaluations",
            headers=cg_headers,
            json={
                "measured_at": dt1.isoformat(),
                "weight_kg": 7.700,
                "length_cm": 70.5,
                "position": "recumbent",
                "muac_mm": 128.0,
                "edema": "none",
            },
        )
        assert res_ev2.status_code == 201
        assert float(res_ev2.json()["weight_gain_velocity"]) < 0

        # Verify weight_loss alert triggered
        res_alerts = await client.get("/v1/alerts", headers=cg_headers)
        assert res_alerts.status_code == 200
        codes = [a["rule_code"] for a in res_alerts.json()]
        assert "weight_loss" in codes

        # 3. Third consultation with insufficient gain (+150g in 10 days = ~1.9 g/kg/j < 5.0)
        dt2 = datetime.now(UTC) + timedelta(days=10)
        res_ev3 = await client.post(
            f"/v1/persons/{child.id}/evaluations",
            headers=cg_headers,
            json={
                "measured_at": dt2.isoformat(),
                "weight_kg": 7.850,
                "length_cm": 71.0,
                "position": "recumbent",
                "muac_mm": 129.0,
                "edema": "none",
            },
        )
        assert res_ev3.status_code == 201
        v3 = float(res_ev3.json()["weight_gain_velocity"])
        assert 0.0 <= v3 < 5.0

        res_alerts3 = await client.get("/v1/alerts", headers=cg_headers)
        codes3 = [a["rule_code"] for a in res_alerts3.json()]
        assert "insufficient_weight_gain" in codes3
