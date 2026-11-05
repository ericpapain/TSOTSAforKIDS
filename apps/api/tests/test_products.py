"""Tests for reference_products and custom_products modules (Étape D03)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.security import create_access_token
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.nutrients.service import NutrientService


async def make_user(db: AsyncSession, name: str, role: str = "user") -> tuple[User, dict[str, str]]:
    repo = IdentityRepository(db)
    user = await repo.create_user(name)
    await repo.assign_role(user.id, role)
    await db.commit()
    token = create_access_token(user.id, claims={"roles": [role]})
    return user, {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
async def setup_nutrients(db_session: AsyncSession) -> None:
    service = NutrientService(db_session)
    await service.seed_from_csv()


@pytest.mark.asyncio
async def test_reference_product_rejects_missing_source(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    _, admin_headers = await make_user(db_session, "Admin Source Check", role="admin")
    nutrients = [{"nutrient": "Proteines", "value": "0.9", "unit": "g"}]

    res_empty = await client.post(
        "/v1/admin/reference-products",
        headers=admin_headers,
        json={"name": "F-75", "base": "100ml", "usage": "hopital", "source_reference": "   ", "nutrients": nutrients},
    )
    assert res_empty.status_code == 422

    res_missing = await client.post(
        "/v1/admin/reference-products",
        headers=admin_headers,
        json={"name": "F-75", "base": "100ml", "usage": "hopital", "nutrients": nutrients},
    )
    assert res_missing.status_code == 422


@pytest.mark.asyncio
async def test_reference_product_lifecycle_units_and_audit(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    _, admin_headers = await make_user(db_session, "Admin Ref", role="admin")
    _, user_headers = await make_user(db_session, "Standard User", role="user")

    create_res = await client.post(
        "/v1/admin/reference-products",
        headers=admin_headers,
        json={
            "name": "F-100 Lait Thérapeutique",
            "base": "100 ml",
            "usage": "hôpital",
            "status": "à saisir",
            "source_reference": "Directives OMS / UNICEF 2007 - Annexe F-100",
            "unit_label": "sachet",
            "nutrients": [
                {"nutrient": "Proteines", "value": "2900", "unit": "mg"},
                {"nutrient": "Fer", "value": "0.5", "value_min": "0.2", "value_max": "0.8", "unit": "mg"},
            ],
            "essential_nutrients": ["Proteines", "Fer", "protein"],
        },
    )
    assert create_res.status_code == 201
    prod = create_res.json()
    prod_id = prod["id"]
    assert prod["status"] == "to_enter" and prod["base"] == "100ml" and prod["usage"] == "hospital"
    assert set(prod["essential_nutrients"]) == {"protein", "iron"}
    prot_nv = next(n for n in prod["nutrients"] if n["nutrient_code"] == "protein")
    assert float(prot_nv["value"]) == pytest.approx(2.9) and prot_nv["unit_code"] == "g"

    admin_refs = await client.get("/v1/admin/reference-products", headers=admin_headers)
    assert any(p["id"] == prod_id for p in admin_refs.json())
    assert all(p["id"] != prod_id for p in (await client.get("/v1/products")).json())
    assert (await client.get(f"/v1/products/{prod_id}", headers=user_headers)).status_code == 403
    assert (await client.get(f"/v1/products/{prod_id}", headers=admin_headers)).status_code == 200

    upd_res = await client.put(
        f"/v1/admin/reference-products/{prod_id}",
        headers=admin_headers,
        json={
            "name": "F-100 OMS Validé",
            "base": "100ml",
            "usage": "domicile",
            "source_reference": "Directives OMS / UNICEF 2007 - Révisées",
            "unit_label": "boîte",
            "status": "a_valider",
            "nutrients": [{"nutrient": "Proteines", "value": "3.0", "unit": "g"}],
            "essential_nutrients": ["Proteines"],
        },
    )
    assert upd_res.status_code == 200 and upd_res.json()["status"] == "to_validate"

    val_res = await client.post(
        f"/v1/admin/reference-products/{prod_id}/status",
        headers=admin_headers,
        json={"status": "validé"},
    )
    assert val_res.status_code == 200 and val_res.json()["status"] == "validated"
    assert any(p["id"] == prod_id for p in (await client.get("/v1/products")).json())
    assert (await client.get(f"/v1/products/{prod_id}")).status_code == 200

    logs_res = await client.get(
        "/v1/admin/audit-logs",
        params={"entity": "reference_product", "entity_id": prod_id},
        headers=admin_headers,
    )
    actions = [entry["action"] for entry in logs_res.json()]
    assert {"create", "update", "status_change"}.issubset(set(actions))


@pytest.mark.asyncio
async def test_custom_product_permissions_and_review_workflow(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    _, admin_headers = await make_user(db_session, "Admin Reviewer", role="admin")
    _, author_headers = await make_user(db_session, "Author User", role="user")
    _, other_headers = await make_user(db_session, "Other User", role="user")

    create_res = await client.post(
        "/v1/custom-products",
        headers=author_headers,
        json={
            "name": "Bouillie Locale Enrichie",
            "base": "100g",
            "label_photo_file": "etiquette_bouillie.jpg",
            "nutrients": [
                {"nutrient": "Proteines", "value": "12.5", "unit": "g"},
                {"nutrient": "Zinc", "value": "4.2", "unit": "mg"},
            ],
        },
    )
    assert create_res.status_code == 201
    cprod = create_res.json()
    cprod_id = cprod["id"]
    assert cprod["status"] == "private" and cprod["type"] == "custom"

    assert any(p["id"] == cprod_id for p in (await client.get("/v1/products", headers=author_headers)).json())
    assert all(p["id"] != cprod_id for p in (await client.get("/v1/products", headers=other_headers)).json())
    assert (await client.get(f"/v1/products/{cprod_id}", headers=author_headers)).status_code == 200
    assert (await client.get(f"/v1/products/{cprod_id}", headers=other_headers)).status_code == 403
    assert (await client.get(f"/v1/products/{cprod_id}")).status_code == 403

    admin_list = await client.get("/v1/admin/custom-products", headers=admin_headers)
    assert any(p["id"] == cprod_id for p in admin_list.json())

    corr_res = await client.post(
        f"/v1/admin/custom-products/{cprod_id}/review",
        headers=admin_headers,
        json={
            "decision": "correct",
            "name": "Bouillie Locale Enrichie (Corrigée)",
            "nutrients": [{"nutrient": "Proteines", "value": "13.0", "unit": "g"}],
        },
    )
    assert corr_res.status_code == 200 and corr_res.json()["status"] == "private"

    keep_res = await client.post(
        f"/v1/admin/custom-products/{cprod_id}/review",
        headers=admin_headers,
        json={"decision": "keep_private"},
    )
    assert keep_res.status_code == 200 and keep_res.json()["status"] == "private"

    pub_res = await client.post(
        f"/v1/admin/custom-products/{cprod_id}/review",
        headers=admin_headers,
        json={"decision": "publish"},
    )
    assert pub_res.status_code == 200 and pub_res.json()["status"] == "published"
    assert (await client.get(f"/v1/products/{cprod_id}", headers=other_headers)).status_code == 200
    assert (await client.get(f"/v1/products/{cprod_id}")).status_code == 200

    logs = await client.get(
        "/v1/admin/audit-logs",
        params={"entity": "custom_product", "entity_id": cprod_id},
        headers=admin_headers,
    )
    actions = {entry["action"] for entry in logs.json()}
    assert {"create", "review_correct", "review_keep_private", "review_publish"}.issubset(actions)


@pytest.mark.asyncio
async def test_product_validation_and_error_cases(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    _, admin_headers = await make_user(db_session, "Admin Err", role="admin")

    for bad_payload in [
        {"base": "500g", "usage": "hospital", "status": "validated"},
        {"base": "100g", "usage": "ecole", "status": "validated"},
        {"base": "100g", "usage": "hospital", "status": "brouillon"},
        {"base": "100g", "usage": "hospital", "status": "validated", "nutrients": [{"nutrient": "Proteines", "unit": "g"}]},
        {"base": "100g", "usage": "hospital", "status": "validated", "nutrients": [{"nutrient": "Inconnu", "value": "10", "unit": "g"}]},
        {"base": "100g", "usage": "hospital", "status": "validated", "nutrients": [{"nutrient": "Fer", "value_min": "5.0", "value_max": "2.0", "unit": "mg"}]},
        {"base": "100g", "usage": "hospital", "status": "validated", "essential_nutrients": ["NutrimentInexistant"]},
    ]:
        payload = {"name": "Test Invalid", "source_reference": "OMS", **bad_payload}
        res = await client.post("/v1/admin/reference-products", headers=admin_headers, json=payload)
        assert res.status_code == 422

    assert (await client.get("/v1/products/non-existent-id")).status_code == 404
    assert (await client.put("/v1/admin/reference-products/non-existent-id", headers=admin_headers, json={"name": "Nope"})).status_code == 404
    assert (await client.post("/v1/admin/reference-products/non-existent-id/status", headers=admin_headers, json={"status": "validated"})).status_code == 404
    assert (await client.post("/v1/admin/custom-products/non-existent-id/review", headers=admin_headers, json={"decision": "correct"})).status_code == 422
    assert (await client.post("/v1/admin/custom-products/non-existent-id/review", headers=admin_headers, json={"decision": "publish"})).status_code == 404
