"""Tests for food database file parsing and column mapping heuristics."""

from __future__ import annotations

from pathlib import Path

from tsotsa_api.modules.food_database.importer import (
    guess_column_mapping,
    parse_csv_file,
    parse_xlsx_file,
)


def test_guess_column_mapping_standard_headers() -> None:
    headers = [
        "aliment",
        "nom_local",
        "categorie",
        "etat",
        "nutriment",
        "valeur",
        "unite",
        "base",
        "region",
        "article_reference",
        "doi",
    ]
    mapping = guess_column_mapping(headers)
    assert mapping["aliment"] == "food_name"
    assert mapping["nom_local"] == "local_name"
    assert mapping["categorie"] == "category"
    assert mapping["etat"] == "state"
    assert mapping["nutriment"] == "nutrient"
    assert mapping["valeur"] == "value"
    assert mapping["unite"] == "unit"
    assert mapping["base"] == "basis"
    assert mapping["region"] == "region"
    assert mapping["article_reference"] == "article_reference"
    assert mapping["doi"] == "doi"


def test_guess_column_mapping_english_headers() -> None:
    headers = ["dish", "local_name", "nutrient", "numericvalue", "unit", "ref", "doi"]
    mapping = guess_column_mapping(headers)
    assert mapping["dish"] == "food_name"
    assert mapping["nutrient"] == "nutrient"
    assert mapping["numericvalue"] == "value"
    assert mapping["unit"] == "unit"
    assert mapping["ref"] == "article_reference"


def test_parse_csv_file() -> None:
    csv_bytes = b"aliment,nutriment,valeur,unite\nCondres,Zinc,2.29,mg\nCoucouma,Zinc,4.04,mg\n"
    headers, rows = parse_csv_file(csv_bytes)
    assert headers == ["aliment", "nutriment", "valeur", "unite"]
    assert len(rows) == 2
    assert rows[0]["aliment"] == "Condres"
    assert rows[0]["valeur"] == "2.29"
    assert rows[1]["aliment"] == "Coucouma"


def test_parse_xlsx_file() -> None:
    xlsx_path = Path("tests/fixtures/food_import_sample.xlsx")
    if not xlsx_path.exists():
        xlsx_path = Path("apps/api/tests/fixtures/food_import_sample.xlsx")
    headers, rows = parse_xlsx_file(xlsx_path.read_bytes())
    assert "aliment" in headers
    assert len(rows) >= 2
    assert rows[0]["aliment"] == "Condrès"


def test_parse_empty_files() -> None:
    headers_csv, rows_csv = parse_csv_file(b"")
    assert headers_csv == []
    assert rows_csv == []
