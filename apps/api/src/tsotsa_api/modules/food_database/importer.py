"""File parsing and column mapping heuristics for food imports."""

from __future__ import annotations

import csv
import io
from typing import Any

import openpyxl

CANONICAL_FIELD_SYNONYMS: dict[str, list[str]] = {
    "food_name": ["aliment", "nom", "food", "dish", "nom_aliment", "food_name", "nom aliment"],
    "local_name": ["nom_local", "nom local", "local_name", "vernaculaire"],
    "category": ["categorie", "catégorie", "category", "food_category"],
    "state": ["etat", "état", "state", "preparation", "forme"],
    "nutrient": ["nutriment", "nutrient", "composant", "food component name", "element"],
    "value": ["valeur", "value", "numericvalue", "teneur", "quantite"],
    "unit": ["unite", "unité", "unit", "unite_mesure"],
    "basis": ["base", "basis", "base_calcul"],
    "region": ["region", "région", "zone", "location"],
    "article_reference": ["article_reference", "reference", "source", "article", "ref"],
    "doi": ["doi"],
    "orkg_comparison": ["orkg_comparaison", "orkg_comparison", "comparison_id"],
    "orkg_contribution": ["orkg_contribution", "contribution_label", "contribution"],
}


def guess_column_mapping(headers: list[str]) -> dict[str, str]:
    """Propose automatic column mapping based on detected header labels."""
    mapping: dict[str, str] = {}
    for header in headers:
        clean_header = header.strip().lower().replace("_", "").replace(" ", "")
        for target_field, synonyms in CANONICAL_FIELD_SYNONYMS.items():
            if target_field in mapping.values():
                continue
            for syn in synonyms:
                clean_syn = syn.lower().replace("_", "").replace(" ", "")
                if clean_header == clean_syn:
                    mapping[header] = target_field
                    break
            if header in mapping:
                break
    return mapping


def parse_csv_file(file_bytes: bytes) -> tuple[list[str], list[dict[str, Any]]]:
    """Parse raw CSV bytes into header list and list of row dicts."""
    text_content = file_bytes.decode("utf-8-sig", errors="replace")
    reader = csv.reader(io.StringIO(text_content))
    rows = [row for row in reader if any(cell.strip() for cell in row)]
    if not rows:
        return [], []
    headers = [col.strip() for col in rows[0]]
    data_rows: list[dict[str, Any]] = []
    for row in rows[1:]:
        row_dict = {headers[i]: row[i].strip() if i < len(row) else "" for i in range(len(headers))}
        data_rows.append(row_dict)
    return headers, data_rows


def parse_xlsx_file(file_bytes: bytes) -> tuple[list[str], list[dict[str, Any]]]:
    """Parse raw XLSX workbook bytes into headers and row dicts."""
    workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    sheet = workbook.active
    if not sheet:
        return [], []

    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return [], []

    raw_headers = rows[0]
    headers = [
        str(h).strip() if h is not None else f"col_{idx}" for idx, h in enumerate(raw_headers)
    ]
    data_rows: list[dict[str, Any]] = []
    for r in rows[1:]:
        if not any(c is not None and str(c).strip() for c in r):
            continue
        row_dict = {
            headers[i]: str(r[i]).strip() if i < len(r) and r[i] is not None else ""
            for i in range(len(headers))
        }
        data_rows.append(row_dict)
    return headers, data_rows
