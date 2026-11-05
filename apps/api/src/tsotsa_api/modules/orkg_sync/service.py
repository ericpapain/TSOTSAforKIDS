"""Step 6 & Orchestrator: ORKG synchronization service."""

from __future__ import annotations

import csv
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.food_database.service import FoodDatabaseService
from tsotsa_api.modules.nutrients.service import NutrientService
from tsotsa_api.modules.orkg_sync.diff import compute_composition_diff, compute_recipe_diff
from tsotsa_api.modules.orkg_sync.fetch import fetch_comparison_with_fallback
from tsotsa_api.modules.orkg_sync.models import OrkgComparison
from tsotsa_api.modules.orkg_sync.normalize import normalize_composition_items, normalize_recipes
from tsotsa_api.modules.orkg_sync.parse_composition import parse_composition_table
from tsotsa_api.modules.orkg_sync.parse_recipe import parse_recipe_table
from tsotsa_api.modules.orkg_sync.repository import OrkgSyncRepository
from tsotsa_api.modules.orkg_sync.schemas import (
    DiffReport,
    FetchedComparisonData,
    OrkgSyncComparisonResult,
    OrkgSyncResponse,
)

STATUS_MAP = {
    "actif": "active",
    "active": "active",
    "remplacé": "replaced",
    "incomplet": "incomplete",
}
TYPE_MAP = {"composition": "composition", "recette": "recipe", "recipe": "recipe"}


def _resolve_registry_csv(csv_path: Path | None = None) -> Path:
    if csv_path and csv_path.exists():
        return csv_path
    for candidate in [
        Path("data/orkg/comparaisons.csv"),
        Path("../../data/orkg/comparaisons.csv"),
        Path(__file__).parents[5] / "data" / "orkg" / "comparaisons.csv",
    ]:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("Registre data/orkg/comparaisons.csv introuvable.")


class OrkgSyncService:
    """Orchestrates the 6-step ORKG extraction, normalization, diff, and review batch loading."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = OrkgSyncRepository(session)
        self.nutrient_service = NutrientService(session)
        self.food_service = FoodDatabaseService(session)

    async def load_registry_from_csv(self, csv_path: Path | None = None) -> list[OrkgComparison]:
        path = _resolve_registry_csv(csv_path)
        with path.open("r", encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        return [c for r in rows if (c := await self._upsert_registry_row(r)) is not None]

    async def _upsert_registry_row(self, row: dict[str, Any]) -> OrkgComparison | None:
        cid = (row.get("comparison_id") or "").strip()
        if not cid:
            return None
        comp_type = TYPE_MAP.get((row.get("type") or "composition").strip().lower(), "composition")
        status = STATUS_MAP.get((row.get("statut") or "actif").strip().lower(), "active")
        nut_label = (row.get("nutriment") or "").strip() or None
        reg_label = (row.get("region") or "").strip() or None
        nut_obj = (
            await self.nutrient_service.normalize_nutrient(nut_label)
            if nut_label and comp_type == "composition"
            else None
        )
        reg_id = await self.food_service.get_or_create_region_id(reg_label) if reg_label else None
        return await self.repo.upsert_comparison(
            comparison_id=cid,
            comp_type=comp_type,
            nutrient_id=nut_obj.id if nut_obj else None,
            nutrient_label=nut_label,
            region_id=reg_id,
            region_label=reg_label,
            basis=(row.get("base") or "").strip() or None,
            status=status,
            replaced_by=(row.get("remplacee_par") or "").strip() or None,
            notes=(row.get("remarque") or "").strip() or None,
        )

    async def synchronize(
        self,
        user_id: str,
        comparison_ids: list[str] | None = None,
        orkg_client: Any | None = None,
        exports_dir: Path | None = None,
        raw_root: Path | None = None,
    ) -> OrkgSyncResponse:
        if not await self.repo.list_comparisons(only_active=False):
            await self.load_registry_from_csv()
        targets = await self.repo.list_comparisons(
            comparison_ids, only_active=(comparison_ids is None)
        )
        comp_db_map = await self.food_service.get_current_nutrient_values()
        rec_db_map = await self._load_current_recipes_map()

        ctx: dict[str, list[Any]] = {"alerts": [], "comp": [], "rec": [], "rows": [], "snaps": []}
        results = [
            await self._sync_single(
                c, orkg_client, exports_dir, raw_root, comp_db_map, rec_db_map, ctx
            )
            for c in targets
        ]
        batch_id = await self._finalize_batch(user_id, ctx)
        status = "batch_created" if batch_id else ("alert" if ctx["alerts"] else "no_changes")
        return OrkgSyncResponse(
            batch_id=batch_id, status=status, alerts=ctx["alerts"], comparisons=results
        )

    async def _sync_single(
        self,
        comp: OrkgComparison,
        orkg_client: Any | None,
        exports_dir: Path | None,
        raw_root: Path | None,
        comp_db_map: dict[tuple[str, str, str], tuple[str, Decimal, int]],
        rec_db_map: dict[str, dict[str, Decimal]],
        ctx: dict[str, list[Any]],
    ) -> OrkgSyncComparisonResult:
        latest = await self.repo.get_latest_snapshot(comp.comparison_id)
        fetched, alert = fetch_comparison_with_fallback(
            comp.comparison_id, orkg_client, exports_dir, raw_root, latest
        )
        if alert:
            ctx["alerts"].append(alert)
        if fetched is None:
            await self.repo.record_snapshot(
                comp.comparison_id, "failed", "0" * 64, "", alert_message=alert
            )
            return OrkgSyncComparisonResult(
                comparison_id=comp.comparison_id,
                type=comp.type,
                method="failed",
                checksum="0" * 64,
                raw_file="",
                alert=alert,
            )

        snap = await self.repo.record_snapshot(
            comp.comparison_id,
            fetched.method,
            fetched.checksum,
            fetched.raw_file,
            {"headers": fetched.headers, "rows": fetched.rows},
            alert_message=alert,
            fetched_at=fetched.fetched_at,
        )
        ctx["snaps"].append(snap)
        diff, warnings, errors = (
            await self._handle_comp(comp, fetched, comp_db_map, ctx)
            if comp.type == "composition"
            else self._handle_rec(comp, fetched, rec_db_map, ctx)
        )
        return OrkgSyncComparisonResult(
            comparison_id=comp.comparison_id,
            type=comp.type,
            method=fetched.method,
            checksum=fetched.checksum,
            raw_file=fetched.raw_file,
            diff_new=diff.new_count,
            diff_modified=diff.modified_count,
            diff_unchanged=diff.unchanged_count,
            diff_missing=diff.missing_count,
            warnings=warnings,
            errors=errors,
            alert=fetched.alert_message,
        )

    async def _handle_comp(
        self,
        comp: OrkgComparison,
        fetched: FetchedComparisonData,
        comp_db_map: dict[tuple[str, str, str], tuple[str, Decimal, int]],
        ctx: dict[str, list[Any]],
    ) -> tuple[DiffReport, list[str], list[str]]:
        parsed = parse_composition_table(comp.comparison_id, fetched.headers, fetched.rows)
        norm = await normalize_composition_items(
            parsed, self.nutrient_service, basis=comp.basis, region=comp.region_label
        )
        for it in norm:
            ctx["rows"].append(
                {
                    "raw_data": it.model_dump(mode="json"),
                    "status": it.status,
                    "messages": it.messages,
                }
            )
        diff = compute_composition_diff(norm, comp_db_map, scoped_nutrient_id=comp.nutrient_id)
        ctx["comp"].extend(e.payload for e in diff.entries if e.status in ("new", "modified"))
        return (
            diff,
            [m for it in norm if it.status == "warning" for m in it.messages],
            [m for it in norm if it.status == "error" for m in it.messages],
        )

    def _handle_rec(
        self,
        comp: OrkgComparison,
        fetched: FetchedComparisonData,
        rec_db_map: dict[str, dict[str, Decimal]],
        ctx: dict[str, list[Any]],
    ) -> tuple[DiffReport, list[str], list[str]]:
        parsed_rec = parse_recipe_table(comp.comparison_id, fetched.headers, fetched.rows)
        norm_rec = normalize_recipes(parsed_rec, region=comp.region_label)
        for r in norm_rec:
            ctx["rows"].append(
                {"raw_data": r.model_dump(mode="json"), "status": r.status, "messages": r.messages}
            )
        diff = compute_recipe_diff(norm_rec, rec_db_map)
        ctx["rec"].extend(e.payload for e in diff.entries if e.status in ("new", "modified"))
        return (
            diff,
            [m for r in norm_rec if r.status == "warning" for m in r.messages],
            [m for r in norm_rec if r.status == "error" for m in r.messages],
        )

    async def _finalize_batch(self, user_id: str, ctx: dict[str, list[Any]]) -> str | None:
        if not ctx["comp"] and not ctx["rec"]:
            return None
        report = {
            "source": "orkg_sync",
            "composition_changes": len(ctx["comp"]),
            "recipe_changes": len(ctx["rec"]),
        }
        batch_id = await self.food_service.create_orkg_batch(
            user_id, "orkg_sync_batch.json", report, ctx["rows"], ctx["comp"]
        )
        for r_payload in ctx["rec"]:
            await self._persist_recipe_change(user_id, batch_id, r_payload)
        for snap in ctx["snaps"]:
            snap.batch_id = batch_id
        await self.session.flush()
        return batch_id

    async def _persist_recipe_change(
        self, user_id: str, batch_id: str, r_payload: dict[str, Any]
    ) -> None:
        reg_label = r_payload.get("region")
        reg_id = await self.food_service.get_or_create_region_id(reg_label) if reg_label else None
        dish_id = await self.food_service.ensure_food_item(
            r_payload["dish_name"], "dish", region_name=reg_label, user_id=user_id
        )
        src_id = await self.food_service.find_or_create_orkg_source_id(
            r_payload["comparison_id"],
            paper_title=r_payload.get("paper_title"),
            doi=r_payload.get("doi"),
        )
        ing_models = [
            {
                "ingredient_food_id": await self.food_service.ensure_food_item(
                    i["common_name"],
                    "ingredient",
                    scientific_name=i.get("scientific_name"),
                    user_id=user_id,
                ),
                "proportion_pct": i["proportion_pct"],
                "importance": i.get("importance"),
                "position": i.get("position", 1),
            }
            for i in r_payload.get("ingredients", [])
        ]
        await self.repo.save_versioned_recipe(dish_id, reg_id, src_id, batch_id, ing_models)

    async def _load_current_recipes_map(self) -> dict[str, dict[str, Decimal]]:
        recipes = await self.repo.get_current_recipes()
        if not recipes:
            return {}
        all_ids = [r.dish_food_id for r in recipes] + [
            i.ingredient_food_id for r in recipes for i in r.ingredients
        ]
        names = await self.food_service.get_food_names_by_ids(list(set(all_ids)))
        return {
            names.get(r.dish_food_id, "").strip().lower(): {
                names.get(i.ingredient_food_id, "").strip().lower(): Decimal(str(i.proportion_pct))
                for i in r.ingredients
                if names.get(i.ingredient_food_id)
            }
            for r in recipes
            if names.get(r.dish_food_id)
        }
