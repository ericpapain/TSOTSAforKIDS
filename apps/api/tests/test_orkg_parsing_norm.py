"""Unit tests for ORKG label splitting, Type A/B parsing, normalization, and fetch fallback."""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path
from typing import Any

import pandas as pd
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.nutrients.service import NutrientService
from tsotsa_api.modules.orkg_sync.diff import compute_composition_diff, compute_recipe_diff
from tsotsa_api.modules.orkg_sync.fetch import (
    _dataframe_to_table,
    fetch_comparison_with_fallback,
)
from tsotsa_api.modules.orkg_sync.models import OrkgSnapshot
from tsotsa_api.modules.orkg_sync.normalize import (
    normalize_composition_items,
    normalize_recipes,
    parse_basis_grams,
)
from tsotsa_api.modules.orkg_sync.parse_composition import (
    parse_composition_table,
    split_contribution_label,
)
from tsotsa_api.modules.orkg_sync.parse_recipe import parse_recipe_table

EXPORTS_DIR = Path(__file__).parents[3] / "data" / "orkg_exports"


@pytest.fixture(autouse=True)
async def setup_nutrients(db_session: AsyncSession) -> None:
    service = NutrientService(db_session)
    await service.seed_from_csv()


def test_split_contribution_label_accents_spaces_and_samples() -> None:
    assert split_contribution_label("Condrès01_Zinc") == ("Condrès", "01", "Zinc")
    assert split_contribution_label("Etongo non salé01_Phytate") == (
        "Etongo non salé",
        "01",
        "Phytate",
    )
    assert split_contribution_label("Mendjana mebanga02_Magnesium") == (
        "Mendjana mebanga",
        "02",
        "Magnesium",
    )
    assert split_contribution_label("Lombo01_Phyttate") == ("Lombo", "01", "Phyttate")
    assert split_contribution_label("Etondo salé_Cuivre") == ("Etondo salé", "01", "Cuivre")
    assert split_contribution_label("LabelSansUnderscore") is None


@pytest.mark.asyncio
async def test_parse_and_normalize_type_a_real_exports_and_outliers(
    db_session: AsyncSession, tmp_path: Path
) -> None:
    nutrient_service = NutrientService(db_session)
    fetched, _ = fetch_comparison_with_fallback(
        "R1901262", exports_dir=EXPORTS_DIR, raw_root=tmp_path
    )
    assert fetched is not None and fetched.method == "manual_csv"

    parsed = parse_composition_table("R1901262", fetched.headers, fetched.rows)
    assert len(parsed) == 32
    condres = next(p for p in parsed if p.dish_name == "Condrès")
    assert condres.sample_label == "01" and condres.raw_value == "100.0"

    norm = await normalize_composition_items(
        parsed, nutrient_service, basis="100 g poids frais", region="Centre"
    )
    norm_condres = next(n for n in norm if n.dish_name == "Condrès")
    norm_coucouma = next(n for n in norm if n.dish_name == "Coucouma")
    assert norm_coucouma.is_outlier is True and norm_coucouma.status == "warning"
    assert norm_condres.value_per_100g == Decimal("100.0000")


@pytest.mark.asyncio
async def test_unit_conversion_basis_and_quality_errors(db_session: AsyncSession) -> None:
    nutrient_service = NutrientService(db_session)
    assert parse_basis_grams("50 g poids frais")[0] == Decimal("50.0")
    assert parse_basis_grams("À CONFIRMER")[2] is True

    headers = [
        "Properties",
        "Condrès01_Zinc",
        "Condrès01_Zinc",
        "MauvaisLabel",
        "Ebobolo01_Zinc",
    ]
    rows = [
        ["food component name", "Zinc", "Zinc", "Zinc", "Fer"],
        ["numericValue", "0.00229", "2.29", "", "2.48"],
        ["unit", "g", "mg", "", "mg"],
    ]
    parsed = parse_composition_table("R_TEST", headers, rows)
    norm = await normalize_composition_items(
        parsed, nutrient_service, basis="50 g", region="Centre"
    )

    # 0.00229 g per 50 g -> 2.29 mg per 50 g -> 4.58 mg per 100 g
    assert norm[0].value_per_100g == Decimal("4.5800")
    assert norm[0].reference_unit == "mg"
    # Second column is duplicate of (Condrès, zinc, 01)
    assert norm[1].status == "error"
    # Third column has invalid label and missing value/unit
    assert norm[2].status == "error"
    # Fourth column has mismatch between label_nutrient (Zinc) and component_name (Fer)
    assert norm[3].status == "error"


def test_parse_and_normalize_type_b_gari_digari_sum_100_percent(tmp_path: Path) -> None:
    fetched, _ = fetch_comparison_with_fallback(
        "R693268", exports_dir=EXPORTS_DIR, raw_root=tmp_path
    )
    assert fetched is not None
    recipes = parse_recipe_table("R693268", fetched.headers, fetched.rows)
    assert len(recipes) == 1
    gari = recipes[0]
    assert gari.dish_name == "Gari digari"
    assert len(gari.ingredients) == 7
    assert gari.ingredients[0].common_name == "Red millet flour"
    assert gari.ingredients[0].scientific_name == "Digitaria iburua"
    assert gari.ingredients[0].importance == "basic"

    norm_recipes = normalize_recipes(recipes, region="Extrême-Nord")
    assert len(norm_recipes) == 1
    norm_gari = norm_recipes[0]
    assert norm_gari.total_proportion_pct == Decimal("100.00")
    assert norm_gari.status in ("valid", "warning")

    # Test invalid recipe sum (< 98%)
    bad_headers = ["Properties", "Plat01_ingredient1"]
    bad_rows = [
        ["food name", "Plat Test"],
        ["common name", "Eau"],
        ["numericValue", "50.0"],
        ["unit", "%"],
    ]
    bad_norm = normalize_recipes(parse_recipe_table("R_BAD", bad_headers, bad_rows))
    assert bad_norm[0].status == "error"


def test_fetch_dataframe_and_snapshot_fallback(tmp_path: Path) -> None:
    df = pd.DataFrame(
        {
            "Properties": ["food component name", "numericValue", "unit"],
            "Condrès01_Zinc": ["Zinc", "2.29", "mg"],
        }
    )
    h, r = _dataframe_to_table(df)
    assert h == ["Properties", "Condrès01_Zinc"] and len(r) == 3

    class BrokenOrkgContributions:
        def compare_dataframe(self, **_: Any) -> Any:
            raise ConnectionError("ORKG API unreachable")

    class BrokenOrkgClient:
        contributions = BrokenOrkgContributions()

    snap = OrkgSnapshot(
        id="018f0000-0000-7000-8000-000000000001",
        comparison_id="R999999",
        method="api",
        checksum="abc",
        raw_file="data/orkg/raw/R999999/snap.json",
        raw_payload={"headers": h, "rows": r},
    )
    res, alert = fetch_comparison_with_fallback(
        "R999999",
        orkg_client=BrokenOrkgClient(),
        exports_dir=tmp_path / "empty_exports",
        raw_root=tmp_path / "raw",
        latest_snapshot=snap,
    )
    assert res is not None and res.method == "snapshot"
    assert alert is not None and "dernier instantané" in alert

    # Diff check (new, modified, unchanged, missing)
    diff_rep = compute_composition_diff(
        [], {("condrès", "nut-1", "01"): ("fnv-1", Decimal("2.29"), 1)}, "nut-1"
    )
    assert diff_rep.missing_count == 1
    rec_diff = compute_recipe_diff([], {})
    assert not rec_diff.has_changes
