"""Integration tests for food imports 4-step workflow, manual entry, review, and search."""

from __future__ import annotations

from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.security import create_access_token
from tsotsa_api.modules.food_database.models import Food
from tsotsa_api.modules.food_database.service import FoodDatabaseService
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.nutrients.service import NutrientService


async def make_admin(db: AsyncSession, name: str) -> tuple[User, dict[str, str]]:
    repo = IdentityRepository(db)
    user = await repo.create_user(name)
    await repo.assign_role(user.id, "admin")
    await db.commit()
    token = create_access_token(user.id, claims={"roles": ["admin"]})
    return user, {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
async def setup_nutrients(db_session: AsyncSession) -> None:
    service = NutrientService(db_session)
    await service.seed_from_csv()


@pytest.mark.asyncio
async def test_download_template(client: AsyncClient, db_session: AsyncSession) -> None:
    _, headers = await make_admin(db_session, "Admin Downloader")
    res = await client.get("/v1/admin/food-imports/template", headers=headers)
    assert res.status_code == 200
    assert (
        res.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@pytest.mark.asyncio
async def test_full_food_import_4_steps(client: AsyncClient, db_session: AsyncSession) -> None:
    admin1, headers1 = await make_admin(db_session, "Admin Creator")
    _, headers2 = await make_admin(db_session, "Admin Reviewer")

    fixture_path = Path("tests/fixtures/food_import_valid.csv")
    if not fixture_path.exists():
        fixture_path = Path("apps/api/tests/fixtures/food_import_valid.csv")

    # Step a: Upload
    files = {"file": ("food_import_valid.csv", fixture_path.read_bytes(), "text/csv")}
    res_upload = await client.post("/v1/admin/food-imports", files=files, headers=headers1)
    assert res_upload.status_code == 201
    batch_data = res_upload.json()
    batch_id = batch_data["id"]
    assert batch_data["status"] == "draft"
    assert batch_data["column_mapping"]["aliment"] == "food_name"

    # Step b: Update mapping
    mapping = batch_data["column_mapping"]
    res_map = await client.put(
        f"/v1/admin/food-imports/{batch_id}/mapping",
        json={"mapping": mapping},
        headers=headers1,
    )
    assert res_map.status_code == 200

    # Step c: Dry-run validation (verifies NO records written to final foods table)
    res_val = await client.post(f"/v1/admin/food-imports/{batch_id}/validate", headers=headers1)
    assert res_val.status_code == 200
    val_report = res_val.json()
    assert val_report["rows_valid"] == 3
    assert val_report["rows_error"] == 0

    food_count = (await db_session.execute(select(func.count(Food.id)))).scalar()
    assert food_count == 0  # Dry-run wrote nothing!

    # Step d: Execute import
    res_exec = await client.post(f"/v1/admin/food-imports/{batch_id}/execute", headers=headers1)
    assert res_exec.status_code == 200
    assert res_exec.json()["status"] == "to_review"

    # Review Rule: Self-validation is strictly forbidden
    res_self = await client.post(
        f"/v1/admin/food-imports/{batch_id}/review",
        json={"decision": "publish"},
        headers=headers1,
    )
    assert res_self.status_code == 403
    assert "autre personne" in res_self.json()["error"]["message"]

    # Review Rule: Second admin can review and publish
    res_pub = await client.post(
        f"/v1/admin/food-imports/{batch_id}/review",
        json={"decision": "publish"},
        headers=headers2,
    )
    assert res_pub.status_code == 200
    assert res_pub.json()["status"] == "published"

    # Public Read: Published foods are now visible in catalog
    res_pub_foods = await client.get("/v1/foods")
    assert res_pub_foods.status_code == 200
    items = res_pub_foods.json()["items"]
    names = {item["name"] for item in items}
    assert "Condrès" in names
    assert "Coucouma" in names


@pytest.mark.asyncio
async def test_manual_food_entry_quality_controls(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    admin, headers = await make_admin(db_session, "Manual Admin")

    # Invalid: missing source
    payload_no_source = {
        "name": "Bouillie de mil",
        "category": "cereale",
        "source": {},
        "nutrients": [{"nutrient": "Zinc", "value": 2.5, "unit": "mg"}],
    }
    res_bad = await client.post("/v1/admin/foods", json=payload_no_source, headers=headers)
    assert res_bad.status_code == 422
    assert "Source obligatoire manquante" in res_bad.json()["error"]["message"]

    # Valid manual creation
    payload_valid = {
        "name": "Bouillie de mil rouge",
        "kind": "dish",
        "category": "cereale",
        "state": "cuit",
        "local_names": [{"language": "fr", "name": "Pap rouge"}],
        "regions": ["centre", "extreme_nord"],
        "source": {
            "article_reference": "Ponka et al. 2005",
            "doi": "10.1016/j.foodchem.2005.01.001",
        },
        "nutrients": [{"nutrient": "Zinc", "value": 2.5, "unit": "mg", "basis": "poids frais"}],
    }
    res_ok = await client.post("/v1/admin/foods", json=payload_valid, headers=headers)
    assert res_ok.status_code == 201
    created_food = res_ok.json()
    assert created_food["name"] == "Bouillie de mil rouge"
    assert created_food["status"] == "to_review"


@pytest.mark.asyncio
async def test_food_versioning_and_correction(db_session: AsyncSession) -> None:
    admin, _ = await make_admin(db_session, "Version Admin")
    service = FoodDatabaseService(db_session)

    # Initial food
    food = Food(
        name="Condrès Ancien",
        kind="dish",
        status="published",
        version=1,
        is_current=True,
        created_by=admin.id,
    )
    db_session.add(food)
    await db_session.flush()

    # Create correction
    corrected = await service.create_food_correction(
        food_id=food.id,
        user_id=admin.id,
        updated_name="Condrès Corrigé",
    )
    assert corrected.version == 2
    assert corrected.is_current is True
    assert corrected.name == "Condrès Corrigé"
    assert corrected.root_food_id == food.id
    assert food.is_current is False


@pytest.mark.asyncio
async def test_public_food_catalog_filters_and_detail(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    service = FoodDatabaseService(db_session)
    admin, _ = await make_admin(db_session, "Catalog Admin")

    cat = await service.repo.get_or_create_category("legumineuse", "Légumineuse")
    await service.repo.get_or_create_region("centre", "Centre")

    food_pub = Food(
        name="Koki Traditionnel",
        kind="dish",
        category_id=cat.id,
        status="published",
        version=1,
        is_current=True,
    )
    db_session.add(food_pub)
    await db_session.flush()

    # Draft food (must NOT be visible)
    food_draft = Food(
        name="Koki Brouillon",
        kind="dish",
        category_id=cat.id,
        status="draft",
        version=1,
        is_current=True,
    )
    db_session.add(food_draft)
    await db_session.flush()

    # Filter published foods by query
    res_q = await client.get("/v1/foods?q=Koki")
    assert res_q.status_code == 200
    items = res_q.json()["items"]
    names = [i["name"] for i in items]
    assert "Koki Traditionnel" in names
    assert "Koki Brouillon" not in names

    # Detail endpoint
    res_detail = await client.get(f"/v1/foods/{food_pub.id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["name"] == "Koki Traditionnel"

    # Detail of draft food returns 404 to public
    res_draft = await client.get(f"/v1/foods/{food_draft.id}")
    assert res_draft.status_code == 404
