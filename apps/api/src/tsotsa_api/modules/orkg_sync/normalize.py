"""Step 3 & 4 of ORKG pipeline: Normalize values and run quality/outlier controls."""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from statistics import median
from typing import Any

from tsotsa_api.modules.nutrients.service import NutrientService
from tsotsa_api.modules.orkg_sync.schemas import (
    NormalizedCompositionItem,
    NormalizedRecipe,
    ParsedCompositionItem,
    ParsedRecipe,
)

BASIS_GRAMS_PATTERN = re.compile(r"(\d+(?:[.,]\d+)?)\s*g\b", re.IGNORECASE)


def parse_basis_grams(basis_str: str | None) -> tuple[Decimal, str, bool]:
    """Return (basis_grams, clean_basis_label, is_unconfirmed)."""
    if not basis_str or not basis_str.strip():
        return Decimal("100.0"), "poids frais", True
    clean = basis_str.strip()
    unconfirmed = "confirmer" in clean.lower()
    m = BASIS_GRAMS_PATTERN.search(clean)
    if m:
        try:
            grams = Decimal(m.group(1).replace(",", "."))
            if grams > 0:
                return grams, clean, unconfirmed
        except InvalidOperation:
            pass
    return Decimal("100.0"), clean, unconfirmed


async def _normalize_single_composition(
    item: ParsedCompositionItem,
    nutrient_service: NutrientService,
    basis_grams: Decimal,
    basis_label: str,
    basis_unconfirmed: bool,
    region: str | None,
) -> NormalizedCompositionItem:
    messages: list[str] = list(item.parse_errors)
    status = "error" if messages else "valid"

    if item.label_nutrient and item.component_name:
        n_label = await nutrient_service.normalize_nutrient(item.label_nutrient)
        n_comp = await nutrient_service.normalize_nutrient(item.component_name)
        if n_label and n_comp and n_label.code != n_comp.code:
            messages.append(
                f"Incohérence nutriment : '{item.label_nutrient}' vs '{item.component_name}'."
            )
            status = "error"

    target_nutrient = item.label_nutrient or (item.component_name or "")
    rep = await nutrient_service.normalize_and_validate(
        raw_nutrient=target_nutrient,
        raw_value=item.raw_value,
        raw_unit=item.raw_unit,
        sample_basis_g=basis_grams,
    )
    if not rep.recognized or rep.errors or rep.normalized_value is None:
        messages.extend(rep.errors)
        status = "error"

    if basis_unconfirmed and status == "valid":
        messages.append("Base de calcul 'À CONFIRMER' dans le registre (normalisée sur 100 g).")
        status = "warning"

    return NormalizedCompositionItem(
        comparison_id=item.comparison_id,
        contribution_label=item.contribution_label,
        dish_name=item.dish_name,
        sample_label=item.sample_label,
        nutrient_id=rep.nutrient_id,
        nutrient_code=rep.canonical_code,
        nutrient_name=rep.canonical_name,
        value_per_100g=rep.normalized_value,
        reference_unit=rep.reference_unit,
        basis=basis_label,
        region=region,
        paper_title=item.paper_title,
        doi=item.doi,
        status=status,
        messages=messages,
    )


def _flag_duplicates_and_outliers(items: list[NormalizedCompositionItem]) -> None:
    seen: set[tuple[str, str, str]] = set()
    for it in items:
        if it.nutrient_code:
            key = (it.dish_name.lower(), it.nutrient_code, it.sample_label.lower())
            if key in seen:
                it.status = "error"
                it.messages.append(
                    f"Doublon détecté pour ({it.dish_name}, {it.nutrient_code}, {it.sample_label})."
                )
            else:
                seen.add(key)

    valid_vals = [
        float(it.value_per_100g)
        for it in items
        if it.status != "error" and it.value_per_100g is not None and it.value_per_100g > 0
    ]
    if len(valid_vals) < 3:
        return

    med = median(valid_vals)
    if med <= 0:
        return

    for it in items:
        if it.status == "error" or it.value_per_100g is None:
            continue
        val_f = float(it.value_per_100g)
        if val_f > med * 2.5 or val_f < med / 2.5:
            it.is_outlier = True
            it.messages.append(
                f"Valeur atypique ({it.value_per_100g} {it.reference_unit}) vs médiane ({med:.2f})."
            )
            if it.status == "valid":
                it.status = "warning"


async def normalize_composition_items(
    items: list[ParsedCompositionItem],
    nutrient_service: NutrientService,
    basis: str | None = None,
    region: str | None = None,
) -> list[NormalizedCompositionItem]:
    """Normalize Type A items (dictionary, unit conversion, 100g basis) and run controls."""
    basis_grams, basis_label, unconfirmed = parse_basis_grams(basis)
    normalized: list[NormalizedCompositionItem] = []
    for item in items:
        norm_item = await _normalize_single_composition(
            item, nutrient_service, basis_grams, basis_label, unconfirmed, region
        )
        normalized.append(norm_item)

    _flag_duplicates_and_outliers(normalized)
    return normalized


def normalize_recipes(
    recipes: list[ParsedRecipe],
    region: str | None = None,
) -> list[NormalizedRecipe]:
    """Validate and normalize Type B recipes (sum of proportions between 98% and 102%)."""
    results: list[NormalizedRecipe] = []
    for rec in recipes:
        results.append(_normalize_single_recipe(rec, region))
    return results


def _normalize_single_recipe(rec: ParsedRecipe, region: str | None) -> NormalizedRecipe:
    messages: list[str] = []
    has_error = False
    has_warning = False
    seen_names: set[str] = set()
    total_pct = Decimal("0.0")
    norm_ings: list[dict[str, Any]] = []

    for ing in rec.ingredients:
        if ing.errors:
            has_error = True
            messages.extend(ing.errors)
        if ing.warnings:
            has_warning = True
            messages.extend(ing.warnings)

        low_name = ing.common_name.lower()
        if low_name in seen_names:
            has_error = True
            messages.append(f"Ingrédient en doublon dans la recette : '{ing.common_name}'.")
        seen_names.add(low_name)

        if ing.raw_unit != "%":
            has_error = True
            messages.append(
                f"Unité invalide '{ing.raw_unit}' pour '{ing.common_name}' ('%' attendu)."
            )

        try:
            pct = Decimal(ing.raw_proportion)
            if pct <= Decimal("0") or pct > Decimal("100"):
                has_error = True
                messages.append(f"Proportion hors bornes ({pct} %) pour '{ing.common_name}'.")
            else:
                total_pct += pct
        except (InvalidOperation, ValueError):
            has_error = True
            pct = Decimal("0.0")
            messages.append(
                f"Proportion non numérique ('{ing.raw_proportion}') pour '{ing.common_name}'."
            )

        norm_ings.append(
            {
                "contribution_label": ing.contribution_label,
                "common_name": ing.common_name,
                "scientific_name": ing.scientific_name,
                "importance": ing.importance,
                "proportion_pct": pct.quantize(Decimal("0.0001")),
                "position": ing.position,
            }
        )

    total_pct = total_pct.quantize(Decimal("0.01"))
    if total_pct < Decimal("98.00") or total_pct > Decimal("102.00"):
        has_error = True
        messages.append(
            f"Somme des ingrédients ({total_pct} %) hors de la plage [98.00 %, 102.00 %]."
        )

    status = "error" if has_error else ("warning" if has_warning else "valid")
    return NormalizedRecipe(
        comparison_id=rec.comparison_id,
        dish_name=rec.dish_name,
        region=region,
        paper_title=rec.paper_title,
        doi=rec.doi,
        total_proportion_pct=total_pct,
        ingredients=norm_ings,
        status=status,
        messages=messages,
    )
