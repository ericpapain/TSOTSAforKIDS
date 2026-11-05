"""Tests unitaires pour scripts/generer_gabarit.py."""

from pathlib import Path
import tempfile
import openpyxl

from scripts.generer_gabarit import (
    COLUMNS,
    CATEGORIES,
    REGIONS,
    UNITS,
    build_template_workbook,
    load_nutrients,
)


def test_load_nutrients_from_real_dict() -> None:
    project_root = Path(__file__).resolve().parent.parent.parent
    dict_path = project_root / "data" / "dictionnaire_nutriments.csv"
    nutrients = load_nutrients(dict_path)

    assert "Zinc" in nutrients
    assert "Magnésium" in nutrients
    assert "Phytate" in nutrients
    assert "Protéines" in nutrients
    assert len(nutrients) >= 20


def test_load_nutrients_fallback_nonexistent() -> None:
    nutrients = load_nutrients(Path("/nonexistent/dict.csv"))
    assert "Zinc" in nutrients
    assert len(nutrients) > 0


def test_build_template_workbook() -> None:
    project_root = Path(__file__).resolve().parent.parent.parent
    dict_path = project_root / "data" / "dictionnaire_nutriments.csv"
    wb = build_template_workbook(dict_path)

    sheet_names = wb.sheetnames
    assert "Base aliments" in sheet_names
    assert "Mode d'emploi" in sheet_names
    assert "Listes" in sheet_names

    ws_base = wb["Base aliments"]
    assert ws_base.max_column == len(COLUMNS)
    for idx, (expected_col, _) in enumerate(COLUMNS, start=1):
        assert ws_base.cell(row=1, column=idx).value == expected_col

    # Vérification des listes de référence
    ws_listes = wb["Listes"]
    assert ws_listes["A2"].value == CATEGORIES[0]
    assert ws_listes["C2"].value == UNITS[0]
    assert ws_listes["D2"].value == REGIONS[0]

    # Vérification présence de validations
    validations = ws_base.data_validations.dataValidation
    assert len(validations) == 4


def test_workbook_save_and_reload() -> None:
    project_root = Path(__file__).resolve().parent.parent.parent
    dict_path = project_root / "data" / "dictionnaire_nutriments.csv"
    wb = build_template_workbook(dict_path)

    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        wb.save(tmp_path)
        loaded = openpyxl.load_workbook(tmp_path)
        assert "Base aliments" in loaded.sheetnames
        assert loaded["Base aliments"]["A1"].value == "aliment"
    finally:
        if tmp_path.exists():
            tmp_path.unlink()
