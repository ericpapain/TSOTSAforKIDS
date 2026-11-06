"""Integration tests for Domain Monitoring: rules, alert events, priority sorting, isolation."""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
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
from tsotsa_api.modules.monitoring.service import MonitoringService
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


async def _seed_alert_rules(session: AsyncSession) -> None:
    now = datetime.now(UTC)
    for c, p, prms in [
        ("unconfirmed_intakes", "high", {"threshold_count": 3, "period_days": 2}),
        ("insufficient_weight_gain", "high", {"threshold_g_kg_day": 5.0}),
        ("weight_loss", "urgent", {"threshold_g_kg_day": 0.0}),
        ("severe_zone", "urgent", {"whz_threshold": -3.0, "muac_threshold_mm": 115}),
        ("edema", "urgent", {"trigger_on_edema": True}),
        ("late_evaluation", "normal", {"max_days_since_eval": 14}),
        ("reminders_disabled", "normal", {"require_reminders": True}),
    ]:
        session.add(
            AlertRule(
                id=str(uuid.uuid4()),
                code=c,
                name=c,
                description=c,
                parameters=prms,
                priority=p,
                is_active=True,
                created_at=now,
                updated_at=now,
            )
        )
    await session.commit()


async def _seed_test_standards(session: AsyncSession) -> None:
    repo = GrowthRepository(session)
    k = dict(l=Decimal("1"), m=Decimal("9"), s=Decimal("0.1"), sd3neg=Decimal("6"))
    k.update(sd2neg=Decimal("7"), sd0=Decimal("9"), sd2=Decimal("11"), sd3=Decimal("12"))
    for ind in ("wfl", "lhfa", "wfa"):
        await repo.upsert_row(indicator=ind, sex="M", x_value=Decimal("75.0"), **k)
    await session.commit()


@pytest.mark.asyncio
async def test_monitoring_alerts_and_caregiver_dashboard(db_session) -> None:
    await _seed_test_standards(db_session)
    await _seed_alert_rules(db_session)
    app = create_app()

    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db_session] = _get_test_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Admins and Caregivers
        admin_user, admin_headers = await _make_user(db_session, "Admin System", "admin")
        cg_user_a, cg_a_headers = await _make_user(db_session, "Dr Mballa", "caregiver")
        cg_user_b, cg_b_headers = await _make_user(db_session, "Dr Ndongo", "caregiver")

        # 2. Establishments A and B
        r_a = await client.post(
            "/v1/admin/organizations",
            json={"name": "Hôpital Yaoundé", "type": "hopital"},
            headers=admin_headers,
        )
        assert r_a.status_code == 201
        org_a_id = r_a.json()["id"]

        r_b = await client.post(
            "/v1/admin/organizations",
            json={"name": "CMA Douala", "type": "cma"},
            headers=admin_headers,
        )
        assert r_b.status_code == 201
        org_b_id = r_b.json()["id"]

        # Attach caregivers
        cg_payload_a = {"user_id": cg_user_a.id, "licence_number": "CAM-111", "approve": True}
        r_cg_a = await client.post(
            f"/v1/admin/organizations/{org_a_id}/caregivers",
            json=cg_payload_a,
            headers=admin_headers,
        )
        assert r_cg_a.status_code == 200

        cg_payload_b = {"user_id": cg_user_b.id, "licence_number": "CAM-222", "approve": True}
        r_cg_b = await client.post(
            f"/v1/admin/organizations/{org_b_id}/caregivers",
            json=cg_payload_b,
            headers=admin_headers,
        )
        assert r_cg_b.status_code == 200

        # 3. Test Admin Alert Rules Endpoints
        res_rules = await client.get("/v1/admin/alert-rules", headers=admin_headers)
        assert res_rules.status_code == 200
        rules = res_rules.json()
        assert len(rules) >= 7

        rule_gain = next(r for r in rules if r["code"] == "insufficient_weight_gain")
        res_update = await client.patch(
            f"/v1/admin/alert-rules/{rule_gain['id']}",
            headers=admin_headers,
            json={"priority": "urgente", "parameters": {"threshold_g_kg_day": 4.5}},
        )
        assert res_update.status_code == 200
        updated_rule = res_update.json()
        assert updated_rule["priority"] == "urgent"
        assert updated_rule["parameters"]["threshold_g_kg_day"] == 4.5

        # Caregiver cannot update rules
        res_forb = await client.patch(
            f"/v1/admin/alert-rules/{rule_gain['id']}",
            headers=cg_a_headers,
            json={"priority": "normal"},
        )
        assert res_forb.status_code == 403

        # 4. Enroll children in care (Persons A and B)
        persons_service = PersonsService(db_session)
        cs = persons_service.care_service
        p_a = await cs.register_person_in_care(
            org_id=org_a_id,
            pseudonym="#A-101",
            first_name="Kouam",
            birth_date=datetime(2025, 7, 1).date(),
            sex="M",
            actor_user_id=cg_user_a.id,
        )
        await cs.register_person_in_care(
            org_id=org_b_id,
            pseudonym="#B-202",
            first_name="Nadine",
            birth_date=datetime(2025, 4, 15).date(),
            sex="F",
            actor_user_id=cg_user_b.id,
        )
        await db_session.commit()

        # 5. Event-Driven Alert: Unconfirmed Intakes (post 3 refused intakes for Person A)
        for _ in range(3):
            res_it = await client.post(
                "/v1/intakes",
                headers=cg_a_headers,
                json={
                    "id": str(uuid.uuid4()),
                    "person_id": p_a.id,
                    "item_type": "product",
                    "item_id": str(uuid.uuid4()),
                    "quantity": 1.0,
                    "unit": "sachet",
                    "taken_at": datetime.now(UTC).isoformat(),
                    "consumption": "refused",
                },
            )
            assert res_it.status_code == 201

        # Check alert was created for unconfirmed intakes
        res_alerts = await client.get("/v1/alerts", headers=cg_a_headers)
        assert res_alerts.status_code == 200
        alerts_list = res_alerts.json()
        assert any(a["rule_code"] == "unconfirmed_intakes" for a in alerts_list)

        # 6. Event-Driven Alert: Clinical Evaluation with Edema and Severe Zone
        res_eval = await client.post(
            f"/v1/persons/{p_a.id}/evaluations",
            headers=cg_a_headers,
            json={
                "measured_at": datetime.now(UTC).isoformat(),
                "weight_kg": 7.500,
                "length_cm": 75.0,
                "position": "recumbent",
                "muac_mm": 110.0,
                "edema": "+",
            },
        )
        assert res_eval.status_code == 201

        res_alerts_eval = await client.get("/v1/alerts", headers=cg_a_headers)
        alerts_eval = res_alerts_eval.json()
        codes = [a["rule_code"] for a in alerts_eval]
        assert "edema" in codes
        assert "severe_zone" in codes

        # 7. Priority Sorting Verification (urgent first, then high, then normal)
        priorities = [a["priority"] for a in alerts_eval]
        priority_ranks = {"urgent": 1, "high": 2, "normal": 3}
        ranks = [priority_ranks.get(p, 4) for p in priorities]
        assert ranks == sorted(ranks), f"Alerts are not sorted by priority: {priorities}"

        # 8. Alert Handling
        edema_alert = next(a for a in alerts_eval if a["rule_code"] == "edema")
        res_handle = await client.post(
            f"/v1/alerts/{edema_alert['id']}/handle",
            headers=cg_a_headers,
            json={"notes": "Prise en charge pédiatrique hospitalière initiée."},
        )
        assert res_handle.status_code == 200
        assert res_handle.json()["status"] == "handled"

        # Handled alert does not appear in open alerts by default
        res_open = await client.get("/v1/alerts?status=open", headers=cg_a_headers)
        assert not any(a["id"] == edema_alert["id"] for a in res_open.json())

        # 9. Scheduled Daily Scan: Late Evaluation & Reminders Disabled
        # Disable reminders for Person A
        res_pref = await client.post(
            "/v1/notification-preferences",
            headers=cg_a_headers,
            json={"person_id": p_a.id, "notification_type": "reminders", "enabled": False},
        )
        assert res_pref.status_code == 201

        monitoring_srv = MonitoringService(db_session)
        scan_count = await monitoring_srv.run_daily_monitoring_check(organization_id=org_a_id)
        assert scan_count > 0
        await db_session.commit()

        res_after_scan = await client.get("/v1/alerts", headers=cg_a_headers)
        codes_after = [a["rule_code"] for a in res_after_scan.json()]
        assert "reminders_disabled" in codes_after

        # 10. Establishment Isolation Tests
        # Caregiver B tries to fetch Caregiver A's alerts or metrics
        res_b_alerts = await client.get("/v1/alerts", headers=cg_b_headers)
        assert res_b_alerts.status_code == 200
        # Caregiver B sees only org_b's alerts, none for p_a
        assert not any(a["person_id"] == p_a.id for a in res_b_alerts.json())

        # Caregiver B tries to handle an alert of Org A -> 403 Forbidden
        remaining_alert_a = alerts_eval[0]
        res_forb_handle = await client.post(
            f"/v1/alerts/{remaining_alert_a['id']}/handle",
            headers=cg_b_headers,
            json={"notes": "Tentative non autorisée"},
        )
        assert res_forb_handle.status_code == 403

        # Caregiver A tries to request Org B's metrics -> 403 Forbidden
        res_cross_org = await client.get(
            f"/v1/dashboard/metrics?organization_id={org_b_id}",
            headers=cg_a_headers,
        )
        assert res_cross_org.status_code == 403

        # 11. Dashboard Endpoints (metrics, scheduled evaluations, child register)
        res_metrics = await client.get("/v1/dashboard/metrics", headers=cg_a_headers)
        assert res_metrics.status_code == 200
        metrics = res_metrics.json()
        assert metrics["organization_id"] == org_a_id and metrics["total_persons_followed"] == 1

        res_sched = await client.get("/v1/dashboard/scheduled-evaluations", headers=cg_a_headers)
        assert res_sched.status_code == 200
        assert res_sched.json()[0]["pseudonym"] == "#A-101"

        res_persons = await client.get("/v1/dashboard/persons?search=Kouam", headers=cg_a_headers)
        assert res_persons.status_code == 200
        p_items = res_persons.json()
        assert len(p_items) == 1 and p_items[0]["first_name"] == "Kouam"
