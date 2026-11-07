"""Integration tests for Caregiver review, notification settings, and platform health."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.core.security import create_access_token
from tsotsa_api.main import create_app
from tsotsa_api.modules.audit.models import AuditLog
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.notifications.repository import NotificationsRepository
from tsotsa_api.modules.organizations.models import Organization
from tsotsa_api.modules.reference_products.models import Product


async def _create_user(session: AsyncSession, name: str, role: str) -> tuple[User, str]:
    repo = IdentityRepository(session)
    user = await repo.create_user(display_name=name)
    await repo.assign_role(user.id, role)
    await session.commit()
    token = create_access_token(user.id, claims={"roles": [role]})
    return user, token


@pytest.mark.asyncio
async def test_caregiver_review_workflow(db_session: AsyncSession) -> None:
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, admin_token = await _create_user(db_session, "Admin Eric", "admin")
    cg_user, _ = await _create_user(db_session, "Dr Pendulaire", "caregiver")

    # Attach caregiver with status pending
    id_repo = IdentityRepository(db_session)
    org = Organization(name="Hôpital Central", type="hopital", status="active")
    db_session.add(org)
    await db_session.flush()

    await id_repo.upsert_caregiver_organization(
        user_id=cg_user.id,
        organization_id=org.id,
        licence_number="DOC-1234",
        verification_status="pending",
    )
    await db_session.commit()

    h_admin = {"Authorization": f"Bearer {admin_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. List caregivers shows pending caregiver
        list_res = await client.get("/v1/admin/caregivers?status=pending", headers=h_admin)
        assert list_res.status_code == 200
        assert any(c["user_id"] == cg_user.id for c in list_res.json()["items"])

        # 2. Request document
        req_doc = await client.post(
            f"/v1/admin/caregivers/{cg_user.id}/request-document",
            json={"action": "request_document", "message": "Copie couleur requise"},
            headers=h_admin,
        )
        assert req_doc.status_code == 200
        assert "DOCUMENT_REQUESTED" in req_doc.json()["verification_notes"]

        # 3. Reject caregiver
        reject_res = await client.post(
            f"/v1/admin/caregivers/{cg_user.id}/reject",
            json={"action": "reject", "reason": "Diplôme invalide"},
            headers=h_admin,
        )
        assert reject_res.status_code == 200
        assert reject_res.json()["verification_status"] == "rejected"

        # 4. Approve caregiver
        approve_res = await client.post(
            f"/v1/admin/caregivers/{cg_user.id}/approve",
            headers=h_admin,
        )
        assert approve_res.status_code == 200
        assert approve_res.json()["verification_status"] == "approved"


@pytest.mark.asyncio
async def test_notification_settings_and_templates(db_session: AsyncSession) -> None:
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, admin_token = await _create_user(db_session, "Admin Eric", "admin")
    h_admin = {"Authorization": f"Bearer {admin_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Get default settings
        get_res = await client.get("/v1/admin/notifications/settings", headers=h_admin)
        assert get_res.status_code == 200
        settings_data = get_res.json()
        assert "channels_enabled" in settings_data

        # 2. Update global settings
        put_res = await client.put(
            "/v1/admin/notifications/settings",
            json={
                "channels_enabled": {"push": True, "sms": False, "email": True, "in_app": True},
                "followup_delay_minutes": 45,
                "max_attempts": 4,
                "quiet_start": "23:00",
                "quiet_end": "06:30",
            },
            headers=h_admin,
        )
        assert put_res.status_code == 200
        updated = put_res.json()
        assert updated["followup_delay_minutes"] == 45
        assert updated["channels_enabled"]["sms"] is False

        # 3. List templates
        tmpl_res = await client.get("/v1/admin/notifications/templates", headers=h_admin)
        assert tmpl_res.status_code == 200

    logs = (await db_session.execute(select(AuditLog))).scalars().all()
    actions = [log_entry.action for log_entry in logs]
    assert "update_notification_settings" in actions


@pytest.mark.asyncio
async def test_custom_products_review_and_health_metrics(db_session: AsyncSession) -> None:
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    admin_user, admin_token = await _create_user(db_session, "Admin Eric", "admin")
    h_admin = {"Authorization": f"Bearer {admin_token}"}

    # Setup a custom product
    prod = Product(
        type="custom",
        name="Bouillie Soja Locale",
        base="100g",
        status="private",
        owner_user_id=admin_user.id,
    )
    db_session.add(prod)

    # Setup a failed notification to test health metrics reporting of failed deliveries
    notif_repo = NotificationsRepository(db_session)
    await notif_repo.queue_notification(
        user_id=admin_user.id,
        person_id=None,
        schedule_id=None,
        type_str="reminder",
        channel="push",
        title="Test Echec",
        body="Corps test echec",
        scheduled_for=datetime.now(UTC),
        dedupe_key=f"fail-test-{datetime.now(UTC).timestamp()}",
    )
    # Mark as failed directly via repo
    await notif_repo.mark_failed(
        notification_id=(await notif_repo.list_logs(limit=1))[0].id,
        error_msg="Simulation failure in test",
    )
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Review custom product -> publish
        review_res = await client.post(
            f"/v1/admin/custom-products/{prod.id}/review",
            json={"decision": "publish", "name": "Bouillie Soja Validée"},
            headers=h_admin,
        )
        assert review_res.status_code == 200
        assert review_res.json()["status"] == "published"
        assert review_res.json()["name"] == "Bouillie Soja Validée"

        # 2. Get platform health metrics
        health_res = await client.get("/v1/admin/health-metrics", headers=h_admin)
        assert health_res.status_code == 200
        health_data = health_res.json()
        assert health_data["status"] == "healthy"
        assert "accounts" in health_data
        assert "notifications" in health_data
        assert (
            "failed" in health_data["notifications"]
            or "total_failed" in health_data["notifications"]
        )

    # Verify audit log traces exist
    logs = (await db_session.execute(select(AuditLog))).scalars().all()
    actions = [log_entry.action for log_entry in logs]
    assert any("custom_product" in a or "review" in a for a in actions)
