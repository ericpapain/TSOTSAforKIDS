"""Integration tests for Domain Clinical & Growth: evaluations, z-scores, velocity, triage."""

from __future__ import annotations

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


async def _seed_test_standards(session: AsyncSession) -> None:
    """Seed sample WHO reference standards for tests."""
    repo = GrowthRepository(session)
    # WFL Girls at 74.0 cm
    await repo.upsert_row(
        indicator="wfl",
        sex="F",
        x_value=Decimal("74.0"),
        l=Decimal("-0.3833"),
        m=Decimal("9.1234"),
        s=Decimal("0.0889"),
        sd3neg=Decimal("7.0"),
        sd2neg=Decimal("7.6"),
        sd0=Decimal("9.1234"),
        sd2=Decimal("11.0"),
        sd3=Decimal("12.2"),
    )
    # LHFA Girls at 365 days
    await repo.upsert_row(
        indicator="lhfa",
        sex="F",
        x_value=Decimal("365"),
        l=Decimal("1.0"),
        m=Decimal("74.0"),
        s=Decimal("0.0348"),
        sd3neg=Decimal("66.2"),
        sd2neg=Decimal("68.8"),
        sd0=Decimal("74.0"),
        sd2=Decimal("79.1"),
        sd3=Decimal("81.7"),
    )
    # WFA Girls at 365 days
    await repo.upsert_row(
        indicator="wfa",
        sex="F",
        x_value=Decimal("365"),
        l=Decimal("-0.2022"),
        m=Decimal("8.946"),
        s=Decimal("0.1226"),
        sd3neg=Decimal("6.27"),
        sd2neg=Decimal("7.04"),
        sd0=Decimal("8.946"),
        sd2=Decimal("11.5"),
        sd3=Decimal("13.1"),
    )
    # ACFA Girls at 365 days
    await repo.upsert_row(
        indicator="acfa",
        sex="F",
        x_value=Decimal("365"),
        l=Decimal("-0.1733"),
        m=Decimal("14.2"),
        s=Decimal("0.0828"),
        sd3neg=Decimal("11.1"),
        sd2neg=Decimal("12.0"),
        sd0=Decimal("14.2"),
        sd2=Decimal("16.8"),
        sd3=Decimal("18.3"),
    )
    # BFA Girls at 365 days
    await repo.upsert_row(
        indicator="bfa",
        sex="F",
        x_value=Decimal("365"),
        l=Decimal("-0.4113"),
        m=Decimal("16.3"),
        s=Decimal("0.0801"),
        sd3neg=Decimal("13.0"),
        sd2neg=Decimal("14.0"),
        sd0=Decimal("16.3"),
        sd2=Decimal("19.2"),
        sd3=Decimal("21.0"),
    )
    await session.commit()


@pytest.mark.asyncio
async def test_clinical_evaluations_workflow(db_session: AsyncSession) -> None:
    """Verify evaluation creation, consent gate, velocity, z-scores, and curve querying."""
    await _seed_test_standards(db_session)

    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, h_admin = await _make_user(db_session, "Admin Santé", "admin")
    _, h_parent = await _make_user(db_session, "Maman Jeanne", "user")
    cg_a, h_cg_a = await _make_user(db_session, "Dr Kamga (Yaoundé)", "caregiver")
    cg_b, h_cg_b = await _make_user(db_session, "Dr Fopa (Douala)", "caregiver")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Establishments & Caregivers
        org_a = (
            await client.post(
                "/v1/admin/organizations",
                json={"name": "Hôpital Central Yaoundé", "type": "hopital"},
                headers=h_admin,
            )
        ).json()["id"]
        org_b = (
            await client.post(
                "/v1/admin/organizations",
                json={"name": "Hôpital Général Douala", "type": "hopital"},
                headers=h_admin,
            )
        ).json()["id"]

        await client.post(
            f"/v1/admin/organizations/{org_a}/caregivers",
            json={"user_id": cg_a.id, "licence_number": "MED-YDE", "approve": True},
            headers=h_admin,
        )
        await client.post(
            f"/v1/admin/organizations/{org_b}/caregivers",
            json={"user_id": cg_b.id, "licence_number": "MED-DLA", "approve": True},
            headers=h_admin,
        )

        # 2. Child registration
        child = (
            await client.post(
                "/v1/family/members",
                json={"first_name": "Amina", "birth_date": "2024-01-01", "sex": "F"},
                headers=h_parent,
            )
        ).json()
        child_id = child["id"]

        await client.post(
            f"/v1/family/members/{child_id}/care",
            json={"organization_id": org_a},
            headers=h_parent,
        )

        # 3. Access gate: No consent -> 403
        t1 = datetime(2025, 1, 1, 9, 0, tzinfo=UTC)
        res_no_consent = await client.post(
            f"/v1/persons/{child_id}/evaluations",
            json={
                "measured_at": t1.isoformat(),
                "weight_kg": 8.946,
                "length_cm": 74.0,
                "position": "recumbent",
                "muac_mm": 142.0,
                "edema": "none",
            },
            headers=h_cg_a,
        )
        assert res_no_consent.status_code == 403

        # Parent grants consent
        give_consent = await client.post(
            f"/v1/persons/{child_id}/consent",
            json={"legal_guardian": True},
            headers=h_parent,
        )
        assert give_consent.status_code == 201

        # Caregiver B from Douala tries to record -> 403 (wrong org)
        res_cross_org = await client.post(
            f"/v1/persons/{child_id}/evaluations",
            json={
                "measured_at": t1.isoformat(),
                "weight_kg": 8.946,
                "length_cm": 74.0,
            },
            headers=h_cg_b,
        )
        assert res_cross_org.status_code == 403

        # 4. Caregiver A records Consultation 1
        res_c1 = await client.post(
            f"/v1/persons/{child_id}/evaluations",
            json={
                "measured_at": t1.isoformat(),
                "weight_kg": 8.946,
                "length_cm": 74.0,
                "position": "recumbent",
                "muac_mm": 142.0,
                "edema": "none",
                "notes": "Consultation initiale, bonne vitalité",
            },
            headers=h_cg_a,
        )
        assert res_c1.status_code == 201
        data_c1 = res_c1.json()
        assert data_c1["proposed_status"] == "normal"
        assert data_c1["weight_gain_velocity"] is None
        assert len(data_c1["scores"]) >= 3

        # 5. Caregiver A records Consultation 2 (10 days later: 9.300 kg)
        # Gain = (9300 - 8946) / (8.946 * 10) = 354 / 89.46 = 3.96 g/kg/d
        t2 = t1 + timedelta(days=10)
        res_c2 = await client.post(
            f"/v1/persons/{child_id}/evaluations",
            json={
                "measured_at": t2.isoformat(),
                "weight_kg": 9.300,
                "length_cm": 74.0,
                "position": "recumbent",
                "muac_mm": 145.0,
                "edema": "none",
            },
            headers=h_cg_a,
        )
        assert res_c2.status_code == 201
        data_c2 = res_c2.json()
        assert float(data_c2["weight_gain_velocity"]) == 3.96

        # 6. Consultation 3 with Edema: weight-based z-scores suppressed & MAS proposed
        t3 = t2 + timedelta(days=7)
        res_c3 = await client.post(
            f"/v1/persons/{child_id}/evaluations",
            json={
                "measured_at": t3.isoformat(),
                "weight_kg": 9.500,
                "length_cm": 74.0,
                "position": "recumbent",
                "muac_mm": 140.0,
                "edema": "plus_1",
            },
            headers=h_cg_a,
        )
        assert res_c3.status_code == 201
        data_c3 = res_c3.json()
        assert data_c3["proposed_status"] == "MAS"
        wfl_score = next((s for s in data_c3["scores"] if s["indicator"] == "wfl"), None)
        assert wfl_score is not None
        assert wfl_score["z_score"] is None
        assert wfl_score["flag"] == "oedema"

        # 7. Parent reads history and latest
        history = await client.get(f"/v1/persons/{child_id}/evaluations", headers=h_parent)
        assert history.status_code == 200
        assert len(history.json()) == 3

        latest = await client.get(f"/v1/persons/{child_id}/evaluations/latest", headers=h_parent)
        assert latest.status_code == 200
        assert latest.json()["id"] == data_c3["id"]

        # 8. Curves overlay
        curves = await client.get(
            f"/v1/persons/{child_id}/evaluations/curves",
            params={"indicator": "wfl"},
            headers=h_cg_a,
        )
        assert curves.status_code == 200
        curves_data = curves.json()
        assert curves_data["indicator"] == "wfl"
        assert len(curves_data["child_observations"]) == 3
