"""Additional integration tests to achieve 100% endpoint coverage across TSOTSA Kids API."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.security import create_access_token
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.notifications.models import Notification, NotificationTemplate


async def make_test_user(
    db: AsyncSession, name: str, role: str = "user"
) -> tuple[User, dict[str, str]]:
    repo = IdentityRepository(db)
    user = await repo.create_user(name)
    await repo.assign_role(user.id, role)
    await db.commit()
    token = create_access_token(user.id, claims={"roles": [role]})
    return user, {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_root_v1_and_consents_endpoints(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    admin, h_admin = await make_test_user(db_session, "Admin Consent Auditor", role="admin")
    parent, h_parent = await make_test_user(db_session, "Parent Consent Auditor", role="user")

    # 1. Root V1 status
    res_root = await client.get("/v1/")
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "active"

    # 2. Admin creates legal consent text
    res_text = await client.post(
        "/v1/admin/consents/text",
        headers=h_admin,
        json={
            "language": "fr",
            "body": "Texte légal officiel sur la protection des données de santé pédiatriques.",
        },
    )
    assert res_text.status_code == 201
    assert res_text.json()["language"] == "fr"

    # 3. Create a person via API and query consent status
    res_person = await client.post(
        "/v1/family/members",
        headers=h_parent,
        json={
            "first_name": "Amina",
            "birth_date": "2025-02-01",
            "sex": "F",
            "relation": "child",
        },
    )
    assert res_person.status_code == 201
    person_id = res_person.json()["id"]

    # Query consent before giving consent -> 404 (no active consent)
    res_get_c = await client.get(f"/v1/persons/{person_id}/consent", headers=h_parent)
    assert res_get_c.status_code == 404

    # Give consent then query again
    res_post_c = await client.post(
        f"/v1/persons/{person_id}/consent",
        headers=h_parent,
        json={"legal_guardian": True},
    )
    assert res_post_c.status_code == 201
    res_get_c2 = await client.get(f"/v1/persons/{person_id}/consent", headers=h_parent)
    assert res_get_c2.status_code == 200
    assert res_get_c2.json()["is_active"] is True


@pytest.mark.asyncio
async def test_device_tokens_and_notification_preferences(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    user, h_user = await make_test_user(db_session, "Token User Auditor", role="user")

    # 1. Register device push token
    tok_val = "ExponentPushToken[audit-coverage-token-1234]"
    res_reg = await client.post(
        "/v1/device-tokens",
        headers=h_user,
        json={"expo_push_token": tok_val, "platform": "android"},
    )
    assert res_reg.status_code == 201
    assert res_reg.json()["expo_push_token"] == tok_val

    # 2. Revoke device token
    res_del = await client.delete(f"/v1/device-tokens/{tok_val}", headers=h_user)
    assert res_del.status_code == 204

    # 3. List notification preferences (GET)
    res_pref = await client.get("/v1/notification-preferences", headers=h_user)
    assert res_pref.status_code == 200
    assert isinstance(res_pref.json(), list)


@pytest.mark.asyncio
async def test_in_app_notifications_center(client: AsyncClient, db_session: AsyncSession) -> None:
    user, h_user = await make_test_user(db_session, "InApp User Auditor", role="user")

    # Insert an in-app notification in DB
    notif = Notification(
        user_id=user.id,
        channel="in_app",
        type="reminders",
        title="Rappel de prise",
        body="Il est l'heure de donner la bouillie enrichie.",
        scheduled_for=datetime.now(UTC),
        dedupe_key=f"test-in-app-{user.id}",
    )
    db_session.add(notif)
    await db_session.commit()

    # 1. List in-app notifications
    res_list = await client.get("/v1/in-app-notifications?unread_only=true", headers=h_user)
    assert res_list.status_code == 200
    items = res_list.json()
    assert len(items) >= 1
    notif_id = items[0]["id"]

    # 2. Snooze notification
    res_snooze = await client.post(
        f"/v1/in-app-notifications/{notif_id}/snooze?minutes=20", headers=h_user
    )
    assert res_snooze.status_code == 200

    # 3. Mark notification as read
    res_read = await client.post(f"/v1/in-app-notifications/{notif_id}/read", headers=h_user)
    assert res_read.status_code == 200
    assert res_read.json()["read_at"] is not None


@pytest.mark.asyncio
async def test_admin_notification_stats_logs_and_templates(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    admin, h_admin = await make_test_user(db_session, "Admin Notif Auditor", role="admin")

    # Seed at least one template in the database
    tpl = NotificationTemplate(
        type="reminder",
        language="fr",
        title="Rappel de prise de repas",
        body="Il est l'heure de donner la bouillie enrichie à votre enfant.",
    )
    db_session.add(tpl)
    await db_session.commit()

    # 1. Admin notifications stats
    res_stats = await client.get("/v1/admin/notifications/stats", headers=h_admin)
    assert res_stats.status_code == 200
    assert "total_sent" in res_stats.json()

    # 2. Admin notifications logs
    res_log = await client.get("/v1/admin/notifications/log?limit=10", headers=h_admin)
    assert res_log.status_code == 200
    assert isinstance(res_log.json(), list)

    # 3. Admin list notification templates (both routes)
    res_t1 = await client.get("/v1/admin/notification-templates", headers=h_admin)
    assert res_t1.status_code == 200
    templates = res_t1.json()
    assert len(templates) >= 1
    target_template_id = templates[0]["id"]

    # 4. Admin update template via /v1/admin/notification-templates/{id}
    res_up1 = await client.patch(
        f"/v1/admin/notification-templates/{target_template_id}",
        headers=h_admin,
        json={"title": "Rappel Prise Santé"},
    )
    assert res_up1.status_code == 200
    assert res_up1.json()["title"] == "Rappel Prise Santé"

    # 5. Admin update template via /v1/admin/notifications/templates/{template_id}
    res_up2 = await client.patch(
        f"/v1/admin/notifications/templates/{target_template_id}",
        headers=h_admin,
        json={"title": "Rappel Prise Confirmé"},
    )
    assert res_up2.status_code == 200
    assert res_up2.json()["title"] == "Rappel Prise Confirmé"
