"""Integration tests for i18n API support."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.security import create_access_token
from tsotsa_api.i18n import render_template
from tsotsa_api.modules.food_database.models import Food, FoodTranslation
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.notifications.models import Notification
from tsotsa_api.modules.notifications.worker import NotificationWorker
from tsotsa_api.modules.nutrients.service import NutrientService
from tsotsa_api.modules.organizations.models import Organization
from tsotsa_api.modules.persons.models import Person, PersonCare, PersonLink
from tsotsa_api.modules.schedules.models import IntakeSchedule, ScheduleTime


async def make_test_user(
    db: AsyncSession, name: str, role: str = "user", preferred_locale: str = "fr"
) -> tuple[User, dict[str, str]]:
    repo = IdentityRepository(db)
    user = await repo.create_user(name, preferred_locale=preferred_locale)
    await repo.assign_role(user.id, role)
    await db.commit()
    token = create_access_token(user.id, claims={"roles": [role]})
    return user, {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_preferred_locale_crud_and_validation(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Test reading and updating preferred_locale via GET /me and PATCH /me."""
    user, headers = await make_test_user(
        db_session, "Test Locale User", role="user", preferred_locale="fr"
    )

    # 1. GET /v1/me returns default 'fr'
    resp_get = await client.get("/v1/me", headers=headers)
    assert resp_get.status_code == 200
    data_get = resp_get.json()
    assert data_get["preferred_locale"] == "fr"

    # 2. PATCH /v1/me updates preferred_locale to 'en'
    resp_patch = await client.patch(
        "/v1/me",
        headers=headers,
        json={"preferred_locale": "en"},
    )
    assert resp_patch.status_code == 200
    data_patch = resp_patch.json()
    assert data_patch["preferred_locale"] == "en"

    # 3. GET /v1/me confirms persistence of 'en'
    resp_get2 = await client.get("/v1/me", headers=headers)
    assert resp_get2.status_code == 200
    assert resp_get2.json()["preferred_locale"] == "en"

    # 4. PATCH with invalid locale (e.g. 'es') returns 422
    resp_invalid = await client.patch(
        "/v1/me",
        headers=headers,
        json={"preferred_locale": "es"},
    )
    assert resp_invalid.status_code == 422
    err_payload = resp_invalid.json()
    assert err_payload["code"] == "common.validation_error"


@pytest.mark.asyncio
async def test_standardized_error_format(client: AsyncClient) -> None:
    """Test that errors return canonical {code, params, detail, error} structure."""
    # 401 on protected endpoint without token
    resp_401 = await client.get("/v1/me")
    assert resp_401.status_code == 401
    data_401 = resp_401.json()
    assert "code" in data_401
    assert "params" in data_401
    assert "detail" in data_401
    assert data_401["code"] == "auth.unauthorized"

    # 404 on non-existent resource
    resp_404 = await client.get("/v1/nutrients/code_introuvable_xyz")
    assert resp_404.status_code == 404
    data_404 = resp_404.json()
    assert data_404["code"] == "common.not_found"


@pytest.mark.asyncio
async def test_notifications_recipient_locale_differentiation(db_session: AsyncSession) -> None:
    """Test notifications are generated in recipient's language (parent in FR, caregiver in EN)."""
    org = Organization(name="CMA Démo", type="cma", status="active")
    parent = User(display_name="Parent FR", status="active", preferred_locale="fr")
    caregiver = User(display_name="Dr EN", status="active", preferred_locale="en")
    child = Person(
        pseudonym="A-099",
        first_name="Anicet",
        birth_date=datetime(2023, 1, 1).date(),
        sex="M",
    )
    db_session.add_all([org, parent, caregiver, child])
    await db_session.flush()

    link = PersonLink(user_id=parent.id, person_id=child.id, relation="child", is_primary=True)
    care = PersonCare(person_id=child.id, organization_id=org.id, primary_caregiver_id=caregiver.id)
    sched = IntakeSchedule(
        person_id=child.id,
        product_name="Plumpy'Nut",
        quantity=Decimal("1.0"),
        unit="sachet",
        start_date=datetime(2026, 11, 1).date(),
        status="active",
        created_by=caregiver.id,
    )
    db_session.add_all([link, care, sched])
    await db_session.flush()

    slot = ScheduleTime(schedule_id=sched.id, local_time="08:00", enabled=True)
    db_session.add(slot)
    await db_session.commit()

    worker = NotificationWorker(db_session)
    now = datetime(2026, 11, 10, 7, 0, tzinfo=UTC)
    gen_count = await worker.generate_lookahead(now, window_hours=24)
    assert gen_count >= 2

    # Verify parent got FR reminder with action buttons
    stmt_parent = select(Notification).where(Notification.user_id == parent.id)
    parent_notifs = (await db_session.execute(stmt_parent)).scalars().all()
    assert len(parent_notifs) >= 1
    p_notif = parent_notifs[0]
    assert "rappel" in p_notif.title.lower() and "anicet" in p_notif.title.lower()
    p_actions = p_notif.payload.get("actions", [])
    assert any("C'est donné" in str(a.get("label")) for a in p_actions)

    # Verify caregiver got EN reminder
    stmt_cg = select(Notification).where(Notification.user_id == caregiver.id)
    cg_notifs = (await db_session.execute(stmt_cg)).scalars().all()
    assert len(cg_notifs) >= 1
    cg_notif = cg_notifs[0]
    assert "Follow-up reminder" in cg_notif.title and "Anicet" in cg_notif.title


@pytest.mark.asyncio
async def test_i18n_template_fallback_to_fr() -> None:
    """Test fallback to 'fr' when a key or language template is absent."""
    tpl_fr = render_template("sms", "otp", locale="fr", code="123456", ttl_minutes=10)
    assert "123456" in tpl_fr
    assert "confirmation" in tpl_fr

    # When requesting an unsupported or unrendered locale (e.g. 'de'), falls back cleanly to 'fr'
    tpl_fallback = render_template("sms", "otp", locale="de", code="999888", ttl_minutes=5)
    assert "999888" in tpl_fallback
    assert "confirmation" in tpl_fallback


@pytest.mark.asyncio
async def test_nutrients_and_foods_name_localization(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Test nutrient and food names localization and fallback."""
    svc = NutrientService(db_session)
    await svc.seed_from_csv()

    food = Food(
        name="Arachide grillée",
        kind="dish",
        status="published",
        is_current=True,
    )
    db_session.add(food)
    await db_session.flush()

    trans = FoodTranslation(food_id=food.id, locale="en", name="Roasted peanut")
    db_session.add(trans)
    await db_session.commit()

    # 1. Nutrient query in French (default)
    resp_nut_fr = await client.get("/v1/nutrients/energy")
    assert resp_nut_fr.status_code == 200
    data_nut_fr = resp_nut_fr.json()
    assert data_nut_fr["name"] == "Énergie"
    assert data_nut_fr["original_name"] == "Énergie"
    assert data_nut_fr["name_en"] == "Energy"

    # 2. Nutrient query in English (Accept-Language: en)
    resp_nut_en = await client.get("/v1/nutrients/energy", headers={"Accept-Language": "en"})
    assert resp_nut_en.status_code == 200
    data_nut_en = resp_nut_en.json()
    assert data_nut_en["name"] == "Energy"
    assert data_nut_en["original_name"] == "Énergie"

    # 3. Food item query in French (default)
    resp_food_fr = await client.get(f"/v1/foods/{food.id}")
    assert resp_food_fr.status_code == 200
    data_food_fr = resp_food_fr.json()
    assert data_food_fr["name"] == "Arachide grillée"
    assert data_food_fr["original_name"] == "Arachide grillée"
    assert data_food_fr["name_en"] == "Roasted peanut"

    # 4. Food item query in English (Accept-Language: en)
    resp_food_en = await client.get(f"/v1/foods/{food.id}", headers={"Accept-Language": "en"})
    assert resp_food_en.status_code == 200
    data_food_en = resp_food_en.json()
    assert data_food_en["name"] == "Roasted peanut"
    assert data_food_en["original_name"] == "Arachide grillée"
