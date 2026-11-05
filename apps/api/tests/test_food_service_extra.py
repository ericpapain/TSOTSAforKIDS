"""Additional edge case tests for food database service and ingestion workflows."""

from __future__ import annotations

from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import NotFoundError, ValidationError
from tsotsa_api.core.security import create_access_token
from tsotsa_api.modules.food_database.models import Food, FoodRegion
from tsotsa_api.modules.food_database.service import FoodDatabaseService
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.nutrients.cli import seed_nutrients_command
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
async def test_xlsx_file_upload(client: AsyncClient, db_session: AsyncSession) -> None:
    _, headers = await make_admin(db_session, "Xlsx Admin")
    xlsx_path = Path("tests/fixtures/food_import_sample.xlsx")
    if not xlsx_path.exists():
        xlsx_path = Path("apps/api/tests/fixtures/food_import_sample.xlsx")

    files = {"file": ("sample.xlsx", xlsx_path.read_bytes(), "application/vnd.openxmlformats")}
    res = await client.post("/v1/admin/food-imports", files=files, headers=headers)
    assert res.status_code == 201
    assert res.json()["file_type"] == "xlsx"


@pytest.mark.asyncio
async def test_invalid_and_empty_file_uploads(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    _, headers = await make_admin(db_session, "Invalid Upload Admin")

    # Unsupported extension
    res_ext = await client.post(
        "/v1/admin/food-imports",
        files={"file": ("test.txt", b"hello", "text/plain")},
        headers=headers,
    )
    assert res_ext.status_code == 422

    # Empty CSV
    res_empty = await client.post(
        "/v1/admin/food-imports",
        files={"file": ("empty.csv", b"", "text/csv")},
        headers=headers,
    )
    assert res_empty.status_code == 422


@pytest.mark.asyncio
async def test_batch_reject_workflow(client: AsyncClient, db_session: AsyncSession) -> None:
    admin1, headers1 = await make_admin(db_session, "Reject Creator")
    _, headers2 = await make_admin(db_session, "Reject Reviewer")

    fixture_path = Path("tests/fixtures/food_import_valid.csv")
    if not fixture_path.exists():
        fixture_path = Path("apps/api/tests/fixtures/food_import_valid.csv")

    files = {"file": ("valid.csv", fixture_path.read_bytes(), "text/csv")}
    res_up = await client.post("/v1/admin/food-imports", files=files, headers=headers1)
    batch_id = res_up.json()["id"]

    await client.post(f"/v1/admin/food-imports/{batch_id}/execute", headers=headers1)

    # Reject batch
    res_rej = await client.post(
        f"/v1/admin/food-imports/{batch_id}/review",
        json={"decision": "reject", "comment": "Non conforme"},
        headers=headers2,
    )
    assert res_rej.status_code == 200
    assert res_rej.json()["status"] == "rejected"


@pytest.mark.asyncio
async def test_service_not_found_and_validation_errors(db_session: AsyncSession) -> None:
    service = FoodDatabaseService(db_session)
    admin, _ = await make_admin(db_session, "Error Admin")

    with pytest.raises(NotFoundError):
        await service.update_column_mapping("00000000-0000-0000-0000-000000000000", {})

    with pytest.raises(NotFoundError):
        await service.validate_batch_dry_run("00000000-0000-0000-0000-000000000000")

    with pytest.raises(NotFoundError):
        await service.execute_import("00000000-0000-0000-0000-000000000000")

    with pytest.raises(NotFoundError):
        await service.review_batch("00000000-0000-0000-0000-000000000000", admin.id, "publish")

    with pytest.raises(NotFoundError):
        await service.create_food_correction("00000000-0000-0000-0000-000000000000", admin.id)

    # Empty batch execution
    batch_zero = await service.create_import_batch_from_file(
        user_id=admin.id,
        file_name="zero.csv",
        file_bytes=b"aliment,nutriment,valeur,unite\nInvalide,Inconnuium,10,kg\n",
    )
    with pytest.raises(ValidationError):
        await service.execute_import(batch_zero.id)

    # Invalid review decision
    with pytest.raises(ValidationError):
        await service.review_batch(batch_zero.id, "11111111-1111-1111-1111-111111111111", "other")


@pytest.mark.asyncio
async def test_public_catalog_category_and_region_filters(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    service = FoodDatabaseService(db_session)
    cat = await service.repo.get_or_create_category("oleagineux", "Oléagineux")
    reg = await service.repo.get_or_create_region("extreme_nord", "Extrême-Nord")

    food = Food(
        name="Arachide Grillée",
        kind="ingredient",
        category_id=cat.id,
        status="published",
        version=1,
        is_current=True,
    )
    db_session.add(food)
    await db_session.flush()
    db_session.add(FoodRegion(food_id=food.id, region_id=reg.id))
    await db_session.commit()

    # Search with category filter
    res_cat = await client.get("/v1/foods?category=oleagineux")
    assert res_cat.status_code == 200
    assert any(i["name"] == "Arachide Grillée" for i in res_cat.json()["items"])

    # Search with region filter
    res_reg = await client.get("/v1/foods?region=extreme_nord")
    assert res_reg.status_code == 200
    assert any(i["name"] == "Arachide Grillée" for i in res_reg.json()["items"])


@pytest.mark.asyncio
async def test_seed_nutrients_cli(db_session: AsyncSession) -> None:
    await seed_nutrients_command(session=db_session)


@pytest.mark.asyncio
async def test_manual_food_service_direct(db_session: AsyncSession) -> None:
    from decimal import Decimal

    from tsotsa_api.modules.food_database.schemas import (
        ManualFoodCreate,
        ManualNutrientEntry,
        ManualSourceEntry,
    )

    service = FoodDatabaseService(db_session)
    admin, _ = await make_admin(db_session, "Direct Manual Admin")

    payload = ManualFoodCreate(
        name="Foléré Préparé",
        kind="dish",
        category="legume_feuille",
        state="cuit",
        local_names=[{"language": "fulfulde", "name": "Folere"}],
        regions=["extreme_nord"],
        source=ManualSourceEntry(
            article_reference="Ponka 2005",
            doi="10.123/test",
            orkg_comparison_id="R123",
            paper_title="Study on folere",
        ),
        nutrients=[
            ManualNutrientEntry(
                nutrient="Zinc", value=Decimal("3.1"), unit="mg", basis="poids frais"
            )
        ],
    )
    food = await service.create_manual_food(admin.id, payload)
    assert food.name == "Foléré Préparé"
    assert food.status == "to_review"


@pytest.mark.asyncio
async def test_persist_imported_row_existing_food(db_session: AsyncSession) -> None:
    from tsotsa_api.modules.food_database.persistence import persist_imported_row

    service = FoodDatabaseService(db_session)
    admin, _ = await make_admin(db_session, "Persist Admin")
    batch = await service.create_import_batch_from_file(
        user_id=admin.id,
        file_name="test.csv",
        file_bytes=b"aliment,nutriment,valeur,unite,doi\nFolere,Zinc,2.0,mg,10.1/a\n",
    )
    mapped = {
        "food_name": "Folere",
        "category": "legume_feuille",
        "state": "cuit",
        "nutrient": "Zinc",
        "value": "2.0",
        "unit": "mg",
        "doi": "10.1/a",
    }
    await persist_imported_row(db_session, service.repo, service.nutrient_service, batch, mapped)
    # Second time with existing food
    await persist_imported_row(db_session, service.repo, service.nutrient_service, batch, mapped)
