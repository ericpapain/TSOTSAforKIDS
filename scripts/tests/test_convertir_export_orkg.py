"""Tests unitaires pour scripts/convertir_export_orkg.py."""

from pathlib import Path

from scripts.convertir_export_orkg import (
    convert_export_file,
    load_dictionary,
    parse_label_type_a,
)

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
DICT_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "dictionnaire_nutriments.csv"


def test_load_dictionary() -> None:
    dict_map = load_dictionary(DICT_PATH)
    assert "zinc" in dict_map
    assert "phytate" in dict_map
    assert "magnesium" in dict_map
    assert dict_map["zinc"].reference_unit == "mg"
    assert dict_map["protein"].reference_unit == "g"


def test_parse_label_type_a() -> None:
    dish, sample, nut = parse_label_type_a("Condrès01_Zinc")
    assert dish == "Condrès"
    assert sample == "01"
    assert nut == "Zinc"

    dish2, sample2, nut2 = parse_label_type_a("Coucouma02_Magnesium")
    assert dish2 == "Coucouma"
    assert sample2 == "02"
    assert nut2 == "Magnesium"

    dish3, sample3, nut3 = parse_label_type_a("Ebobolo_Phytate")
    assert dish3 == "Ebobolo"
    assert sample3 == ""
    assert nut3 == "Phytate"


def test_convert_type_a_zinc_fixture() -> None:
    fixture = FIXTURES_DIR / "fixture_orkg_type_a_zinc.csv"
    meta = {"comparison_id": "R1903384", "region": "Centre"}
    rows, report = convert_export_file(fixture, DICT_PATH, meta)

    assert report.total_contributions == 2
    assert report.converted_rows == 2
    assert len(report.errors) == 0

    assert rows[0]["aliment"] == "Condrès"
    assert rows[0]["nutriment"] == "Zinc"
    assert rows[0]["valeur"] == 2.29
    assert rows[0]["unite"] == "mg"
    assert rows[0]["orkg_contribution"] == "Condrès01_Zinc"
    assert rows[0]["orkg_comparaison"] == "R1903384"
    assert rows[0]["doi"] == "10.1111/j.1365-2621.2005.01072.x"

    assert rows[1]["aliment"] == "Coucouma"
    assert rows[1]["valeur"] == 4.04


def test_convert_type_a_phytate_fixture() -> None:
    fixture = FIXTURES_DIR / "fixture_orkg_type_a_phytate.csv"
    rows, report = convert_export_file(fixture, DICT_PATH)

    assert report.total_contributions == 2
    assert report.converted_rows == 2
    assert rows[0]["aliment"] == "Condrès"
    assert rows[0]["nutriment"] == "Phytate"
    assert rows[0]["valeur"] == 14.06
    assert rows[1]["aliment"] == "Coucouma"
    assert rows[1]["valeur"] == 19.2


def test_convert_type_b_recipe_warns_without_guessing() -> None:
    fixture = FIXTURES_DIR / "fixture_orkg_type_b_recipe.csv"
    rows, report = convert_export_file(fixture, DICT_PATH)

    # Doit refuser de convertir des lignes d'ingrédients en aliments simples
    assert report.total_contributions == 2
    assert report.converted_rows == 0
    assert len(report.warnings) == 2
    assert "Ligne de recette (Type B)" in report.warnings[0]


def test_convert_invalid_fixture_handles_errors() -> None:
    fixture = FIXTURES_DIR / "fixture_orkg_invalid.csv"
    rows, report = convert_export_file(fixture, DICT_PATH)

    # Les valeurs invalides ou manquantes ne doivent pas être devinées
    assert report.total_contributions == 3
    assert report.converted_rows == 0
    assert len(report.errors) > 0
    assert any("Valeur non numérique" in e for e in report.errors)
    assert any("Aucune valeur trouvée" in e for e in report.errors)
