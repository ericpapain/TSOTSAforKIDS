"""Step 2A of ORKG pipeline: Parse Type A (nutritional composition) tables."""

from __future__ import annotations

import re

from tsotsa_api.modules.orkg_sync.schemas import ParsedCompositionItem

LABEL_PATTERN = re.compile(r"^(.+?)(\d{1,3})?_([A-Za-zÀ-ÿ0-9\s\-]+)$")
VALUE_UNIT_PATTERN = re.compile(r"^([+-]?\d+(?:[.,]\d+)?)\s*([a-zA-Zµ%]+)$")


def clean_text_preserve_accents(value: str) -> str:
    """Clean whitespace while strictly preserving French/local accents."""
    return re.sub(r"\s+", " ", value.strip())


def split_contribution_label(label: str) -> tuple[str, str, str] | None:
    """Split '<plat><échantillon>_<nutriment>' into (dish_name, sample_label, nutrient)."""
    cleaned = label.strip()
    match = LABEL_PATTERN.match(cleaned)
    if not match:
        return None
    raw_dish, raw_sample, raw_nutrient = match.groups()
    dish_name = clean_text_preserve_accents(raw_dish)
    sample_label = (raw_sample or "01").strip()
    nutrient = clean_text_preserve_accents(raw_nutrient)
    if not dish_name or not nutrient:
        return None
    return dish_name, sample_label, nutrient


def _build_column_props(rows: list[list[str]], col_idx: int) -> dict[str, str]:
    props: dict[str, str] = {}
    for row in rows:
        if not row or col_idx >= len(row):
            continue
        prop_key = row[0].strip().lower()
        val = row[col_idx].strip()
        if prop_key and val:
            props[prop_key] = val
    return props


def _extract_value_and_unit(props: dict[str, str]) -> tuple[str, str, list[str]]:
    errors: list[str] = []
    num_val = props.get("numericvalue", "").replace(",", ".").strip()
    unit_val = props.get("unit", "").strip()

    if not num_val or not unit_val:
        combined = props.get("value", "").strip()
        m = VALUE_UNIT_PATTERN.match(combined)
        if m:
            if not num_val:
                num_val = m.group(1).replace(",", ".")
            if not unit_val:
                unit_val = m.group(2)

    if not num_val:
        errors.append("Valeur numérique ('numericValue') manquante.")
    if not unit_val:
        errors.append("Unité ('unit') manquante.")
    return num_val, unit_val, errors


def parse_composition_table(
    comparison_id: str,
    headers: list[str],
    rows: list[list[str]],
) -> list[ParsedCompositionItem]:
    """Parse an ORKG Type A comparison table into ParsedCompositionItem records."""
    if len(headers) <= 1:
        return []

    items: list[ParsedCompositionItem] = []
    for col_idx in range(1, len(headers)):
        contrib_label = headers[col_idx].strip()
        if not contrib_label:
            continue

        props = _build_column_props(rows, col_idx)
        errors: list[str] = []

        split_res = split_contribution_label(contrib_label)
        if split_res is None:
            dish_name = clean_text_preserve_accents(contrib_label)
            sample_label = "01"
            label_nutrient = props.get("food component name", "")
            errors.append(f"Libellé de contribution non conforme : '{contrib_label}'.")
        else:
            dish_name, sample_label, label_nutrient = split_res

        comp_name = props.get("food component name")
        num_val, unit_val, val_errors = _extract_value_and_unit(props)
        errors.extend(val_errors)

        paper_title = props.get("titre de l'article") or props.get("title")
        doi = props.get("doi")

        items.append(
            ParsedCompositionItem(
                comparison_id=comparison_id,
                contribution_label=contrib_label,
                dish_name=dish_name,
                sample_label=sample_label,
                label_nutrient=label_nutrient,
                component_name=comp_name,
                raw_value=num_val,
                raw_unit=unit_val,
                paper_title=paper_title,
                doi=doi,
                parse_errors=errors,
            )
        )
    return items
