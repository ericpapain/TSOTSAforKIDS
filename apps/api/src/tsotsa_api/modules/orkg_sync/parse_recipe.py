"""Step 2B of ORKG pipeline: Parse Type B (dish recipes and proportions) tables."""

from __future__ import annotations

import re

from tsotsa_api.modules.orkg_sync.parse_composition import (
    _build_column_props,
    clean_text_preserve_accents,
)
from tsotsa_api.modules.orkg_sync.schemas import ParsedRecipe, ParsedRecipeIngredient

INGREDIENT_POS_PATTERN = re.compile(r"_ingredient(\d+)$", re.IGNORECASE)


def _extract_position(contrib_label: str, default_pos: int) -> int:
    m = INGREDIENT_POS_PATTERN.search(contrib_label.strip())
    if m:
        return int(m.group(1))
    return default_pos


def _normalize_importance(raw_importance: str | None) -> str:
    if not raw_importance:
        return "optional"
    clean = raw_importance.strip().lower()
    if clean in ("basic", "base", "principal", "essentiel"):
        return "basic"
    return "optional"


def parse_recipe_table(
    comparison_id: str,
    headers: list[str],
    rows: list[list[str]],
) -> list[ParsedRecipe]:
    """Parse an ORKG Type B comparison table into ParsedRecipe objects grouped by dish."""
    if len(headers) <= 1:
        return []

    recipes_by_dish: dict[str, ParsedRecipe] = {}

    for col_idx in range(1, len(headers)):
        contrib_label = headers[col_idx].strip()
        if not contrib_label:
            continue

        props = _build_column_props(rows, col_idx)
        raw_dish = props.get("food name", "")
        if not raw_dish:
            # Skip non-recipe typology columns if food name is absent
            continue

        dish_name = clean_text_preserve_accents(raw_dish)
        common_name = clean_text_preserve_accents(props.get("common name", ""))
        sci_raw = props.get("scientific name", "")
        scientific_name = clean_text_preserve_accents(sci_raw) if sci_raw else None
        importance = _normalize_importance(props.get("importance"))
        raw_prop = props.get("numericvalue", "").replace(",", ".").strip()
        raw_unit = props.get("unit", "").strip()
        position = _extract_position(contrib_label, col_idx)

        warnings: list[str] = []
        errors: list[str] = []
        if not common_name:
            errors.append(f"Nom d'ingrédient ('common name') manquant pour {contrib_label}.")
        elif "/" in common_name:
            warnings.append(f"Ingrédient composite détecté : '{common_name}'.")

        if not raw_prop:
            errors.append(f"Proportion ('numericValue') manquante pour {contrib_label}.")
        if not raw_unit:
            errors.append(f"Unité ('unit') manquante pour {contrib_label}.")

        if dish_name not in recipes_by_dish:
            recipes_by_dish[dish_name] = ParsedRecipe(
                comparison_id=comparison_id,
                dish_name=dish_name,
                paper_title=props.get("titre de l'article") or props.get("title"),
                doi=props.get("doi"),
                ingredients=[],
            )

        recipes_by_dish[dish_name].ingredients.append(
            ParsedRecipeIngredient(
                contribution_label=contrib_label,
                common_name=common_name,
                scientific_name=scientific_name,
                importance=importance,
                raw_proportion=raw_prop,
                raw_unit=raw_unit,
                position=position,
                warnings=warnings,
                errors=errors,
            )
        )

    for rec in recipes_by_dish.values():
        rec.ingredients.sort(key=lambda ing: ing.position)

    return list(recipes_by_dish.values())
