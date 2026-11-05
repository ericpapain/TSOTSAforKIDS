"""Integration tests for ORKG synchronization workflow, versioning, review, and scheduler."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

import pandas as pd
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.security import create_access_token
from tsotsa_api.modules.food_database.models import FoodNutrientValue, ImportBatch
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.nutrients.service import NutrientService
from tsotsa_api.modules.orkg_sync.models import Recipe
from tsotsa_api.modules.orkg_sync.scheduler import (
    OrkgWeeklyScheduler,
    run_weekly_orkg_sync_once,
)
from tsotsa_api.modules.orkg_sync.service import OrkgSyncService


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
async def test_orkg_sync_review_gate_and_no_changes_idempotence(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    _, author_headers = await make_admin(db_session, "Admin Sync Author")
    _, reviewer_headers = await make_admin(db_session, "Admin Sync Reviewer")

    comps_res = await client.get("/v1/admin/orkg/comparisons", headers=author_headers)
    assert comps_res.status_code == 200 and len(comps_res.json()) >= 10

    sync_res = await client.post(
        "/v1/admin/orkg/sync",
        headers=author_headers,
        json={"comparison_ids": ["R1903384", "R693268"]},
    )
    assert sync_res.status_code == 200
    body = sync_res.json()
    batch_id = body["batch_id"]
    assert batch_id is not None and body["status"] == "batch_created"

    batch = (
        await db_session.execute(select(ImportBatch).where(ImportBatch.id == batch_id))
    ).scalar_one()
    assert batch.file_type == "orkg" and batch.status == "to_review"

    # Nothing is published automatically before second-person review
    pub_before = await client.get("/v1/foods", params={"q": "Condrès"})
    assert pub_before.json()["total"] == 0

    # Author cannot self-approve
    self_rev = await client.post(
        f"/v1/admin/food-imports/{batch_id}/review",
        headers=author_headers,
        json={"decision": "publish"},
    )
    assert self_rev.status_code == 403

    # Second person reviews and publishes
    ok_rev = await client.post(
        f"/v1/admin/food-imports/{batch_id}/review",
        headers=reviewer_headers,
        json={"decision": "publish"},
    )
    assert ok_rev.status_code == 200 and ok_rev.json()["status"] == "published"

    pub_after = await client.get("/v1/foods", params={"q": "Condrès"})
    assert pub_after.json()["total"] >= 1

    # Re-syncing identical data produces 0 changes and creates NO batch
    sync_again = await client.post(
        "/v1/admin/orkg/sync",
        headers=author_headers,
        json={"comparison_ids": ["R1903384", "R693268"]},
    )
    assert sync_again.status_code == 200
    assert sync_again.json()["batch_id"] is None

    snaps_res = await client.get(
        "/v1/admin/orkg/snapshots",
        params={"comparison_id": "R1903384"},
        headers=author_headers,
    )
    assert snaps_res.status_code == 200 and len(snaps_res.json()) >= 2


@pytest.mark.asyncio
async def test_orkg_sync_modified_creates_new_version_and_snapshot_fallback(
    db_session: AsyncSession, tmp_path: Path
) -> None:
    admin, _ = await make_admin(db_session, "Admin Versioner")
    service = OrkgSyncService(db_session)
    await service.load_registry_from_csv()

    class InitialOrkgClient:
        class contributions:
            @staticmethod
            def compare_dataframe(comparison_id: str, **_: Any) -> pd.DataFrame:
                if comparison_id == "R1903384":
                    return pd.DataFrame(
                        {
                            "Properties": ["food component name", "numericValue", "unit"],
                            "Condrès01_Zinc": ["Zinc", "2.29", "mg"],
                        }
                    )
                return pd.DataFrame(
                    {
                        "Properties": ["food name", "common name", "numericValue", "unit"],
                        "Gari01_ingredient1": ["Gari digari", "Water", "100.0", "%"],
                    }
                )

    res1 = await service.synchronize(
        user_id=admin.id,
        comparison_ids=["R1903384", "R693268"],
        orkg_client=InitialOrkgClient(),
        exports_dir=tmp_path / "no_csv",
        raw_root=tmp_path / "raw",
    )
    assert res1.batch_id is not None
    assert all(c.method == "api" for c in res1.comparisons)

    class ModifiedOrkgClient:
        class contributions:
            @staticmethod
            def compare_dataframe(comparison_id: str, **_: Any) -> pd.DataFrame:
                if comparison_id == "R1903384":
                    return pd.DataFrame(
                        {
                            "Properties": ["food component name", "numericValue", "unit"],
                            "Condrès01_Zinc": ["Zinc", "2.55", "mg"],
                        }
                    )
                return pd.DataFrame(
                    {
                        "Properties": ["food name", "common name", "numericValue", "unit"],
                        "Gari01_ingredient1": ["Gari digari", "Water", "90.0", "%"],
                        "Gari01_ingredient2": ["Gari digari", "Sugar", "10.0", "%"],
                    }
                )

    res2 = await service.synchronize(
        user_id=admin.id,
        comparison_ids=["R1903384", "R693268"],
        orkg_client=ModifiedOrkgClient(),
        exports_dir=tmp_path / "no_csv",
        raw_root=tmp_path / "raw",
    )
    assert res2.batch_id is not None
    assert res2.comparisons[0].diff_modified == 1

    fnv_rows = (await db_session.execute(select(FoodNutrientValue))).scalars().all()
    versions = sorted((r.version, r.is_current, str(r.value_per_100g)) for r in fnv_rows)
    assert (1, False, "2.2900") in versions
    assert (2, True, "2.5500") in versions

    rec_rows = (await db_session.execute(select(Recipe))).scalars().all()
    rec_versions = sorted((r.version, r.is_current) for r in rec_rows)
    assert rec_versions == [(1, False), (2, True)]

    # API outage with no CSV -> falls back to latest recorded snapshot
    class OutageClient:
        class contributions:
            @staticmethod
            def compare_dataframe(**_: Any) -> Any:
                raise RuntimeError("ORKG server 503")

    res_fallback = await service.synchronize(
        user_id=admin.id,
        comparison_ids=["R1903384", "R1900294"],
        orkg_client=OutageClient(),
        exports_dir=tmp_path / "no_csv",
        raw_root=tmp_path / "raw",
    )
    methods = {c.comparison_id: c.method for c in res_fallback.comparisons}
    assert methods["R1903384"] == "snapshot"
    assert methods["R1900294"] == "failed"
    assert len(res_fallback.alerts) >= 2


@pytest.mark.asyncio
async def test_weekly_scheduler_execution(db_session: AsyncSession, tmp_path: Path) -> None:
    admin, _ = await make_admin(db_session, "Admin Scheduler")
    resp = await run_weekly_orkg_sync_once(
        db_session,
        system_user_id=admin.id,
        raw_root=tmp_path / "sched_raw",
    )
    assert resp.status in ("batch_created", "alert", "no_changes")

    ran = False

    async def job() -> None:
        nonlocal ran
        ran = True

    scheduler = OrkgWeeklyScheduler(interval_seconds=0.02)
    scheduler.start(job)
    await asyncio.sleep(0.05)
    await scheduler.stop()
    assert ran is True
