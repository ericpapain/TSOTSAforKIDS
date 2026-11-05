"""Step 5 of ORKG pipeline: Compare normalized ORKG items against current database state."""

from __future__ import annotations

from decimal import Decimal

from tsotsa_api.modules.orkg_sync.schemas import (
    DiffEntry,
    DiffReport,
    NormalizedCompositionItem,
    NormalizedRecipe,
)


def compute_composition_diff(
    items: list[NormalizedCompositionItem],
    current_db_map: dict[tuple[str, str, str], tuple[str, Decimal, int]],
    scoped_nutrient_id: str | None = None,
) -> DiffReport:
    """Compare normalized composition items with current database values."""
    report = DiffReport()
    seen_keys: set[tuple[str, str, str]] = set()

    for item in items:
        if item.status == "error" or not item.nutrient_id or item.value_per_100g is None:
            continue

        key_tuple = (
            item.dish_name.strip().lower(),
            item.nutrient_id,
            item.sample_label.strip(),
        )
        seen_keys.add(key_tuple)
        new_val = item.value_per_100g.quantize(Decimal("0.0001"))
        human_key = f"{item.dish_name}[{item.sample_label}]:{item.nutrient_code}"

        base_payload = {
            "comparison_id": item.comparison_id,
            "contribution_label": item.contribution_label,
            "food_name": item.dish_name,
            "sample_label": item.sample_label,
            "nutrient_id": item.nutrient_id,
            "nutrient_code": item.nutrient_code,
            "value_per_100g": str(new_val),
            "basis": item.basis,
            "region": item.region,
            "paper_title": item.paper_title,
            "doi": item.doi,
        }

        if key_tuple not in current_db_map:
            report.new_count += 1
            report.entries.append(
                DiffEntry(
                    entity_type="composition",
                    key=human_key,
                    status="new",
                    old_value=None,
                    new_value=str(new_val),
                    payload=base_payload,
                )
            )
            continue

        fnv_id, old_raw, old_ver = current_db_map[key_tuple]
        old_val = old_raw.quantize(Decimal("0.0001"))
        if old_val != new_val:
            report.modified_count += 1
            mod_payload = {
                **base_payload,
                "previous_fnv_id": fnv_id,
                "previous_version": old_ver,
            }
            report.entries.append(
                DiffEntry(
                    entity_type="composition",
                    key=human_key,
                    status="modified",
                    old_value=str(old_val),
                    new_value=str(new_val),
                    payload=mod_payload,
                )
            )
        else:
            report.unchanged_count += 1
            report.entries.append(
                DiffEntry(
                    entity_type="composition",
                    key=human_key,
                    status="unchanged",
                    old_value=str(old_val),
                    new_value=str(new_val),
                    payload=base_payload,
                )
            )

    if scoped_nutrient_id:
        for (food_low, nut_id, samp), (_, old_raw, _) in current_db_map.items():
            if nut_id == scoped_nutrient_id and (food_low, nut_id, samp) not in seen_keys:
                report.missing_count += 1
                report.entries.append(
                    DiffEntry(
                        entity_type="composition",
                        key=f"{food_low}[{samp}]:{nut_id}",
                        status="missing",
                        old_value=str(old_raw.quantize(Decimal("0.0001"))),
                        new_value=None,
                    )
                )

    return report


def compute_recipe_diff(
    recipes: list[NormalizedRecipe],
    current_recipes_map: dict[str, dict[str, Decimal]],
) -> DiffReport:
    """Compare normalized Type B recipes with current recipes in database."""
    report = DiffReport()

    for rec in recipes:
        if rec.status == "error":
            continue

        dish_key = rec.dish_name.strip().lower()
        new_map = {
            str(ing["common_name"]).strip().lower(): Decimal(str(ing["proportion_pct"])).quantize(
                Decimal("0.0001")
            )
            for ing in rec.ingredients
        }
        payload = rec.model_dump(mode="json")

        if dish_key not in current_recipes_map:
            report.new_count += 1
            report.entries.append(
                DiffEntry(
                    entity_type="recipe",
                    key=rec.dish_name,
                    status="new",
                    old_value=None,
                    new_value=f"{len(new_map)} ingredients ({rec.total_proportion_pct}%)",
                    payload=payload,
                )
            )
            continue

        old_map = {
            k.strip().lower(): v.quantize(Decimal("0.0001"))
            for k, v in current_recipes_map[dish_key].items()
        }
        if old_map != new_map:
            report.modified_count += 1
            report.entries.append(
                DiffEntry(
                    entity_type="recipe",
                    key=rec.dish_name,
                    status="modified",
                    old_value=f"{len(old_map)} ingredients",
                    new_value=f"{len(new_map)} ingredients ({rec.total_proportion_pct}%)",
                    payload=payload,
                )
            )
        else:
            report.unchanged_count += 1
            report.entries.append(
                DiffEntry(
                    entity_type="recipe",
                    key=rec.dish_name,
                    status="unchanged",
                    old_value=f"{len(old_map)} ingredients",
                    new_value=f"{len(new_map)} ingredients",
                    payload=payload,
                )
            )

    return report
