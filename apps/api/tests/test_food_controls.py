"""Tests for the 5 quality control rules during food and nutrient ingestion."""

from __future__ import annotations

from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.food_database.importer import guess_column_mapping, parse_csv_file
from tsotsa_api.modules.food_database.validation import IngestionValidator
from tsotsa_api.modules.nutrients.service import NutrientService


@pytest.fixture
async def validator(db_session: AsyncSession) -> IngestionValidator:
    service = NutrientService(db_session)
    await service.seed_from_csv()
    return IngestionValidator(service)


@pytest.mark.asyncio
async def test_control_rule_0_food_name(validator: IngestionValidator) -> None:
    # Valid: food_name present
    rows_valid = [
        {
            "food_name": "Condrès",
            "nutrient": "Zinc",
            "value": "2.29",
            "unit": "mg",
            "article_reference": "Ponka 2005",
        }
    ]
    rep_v = await validator.validate_rows("b1", "f1", rows_valid, {k: k for k in rows_valid[0]})
    assert rep_v.rows_valid == 1

    # Invalid: missing food_name
    rows_inval = [
        {
            "food_name": "",
            "nutrient": "Zinc",
            "value": "2.29",
            "unit": "mg",
            "article_reference": "Ponka 2005",
        }
    ]
    rep_i = await validator.validate_rows("b1", "f1", rows_inval, {k: k for k in rows_inval[0]})
    assert rep_i.rows_error == 1
    assert any("Règle 0" in m for m in rep_i.details[0].messages)


@pytest.mark.asyncio
async def test_control_rule_1_recognized_nutrient(validator: IngestionValidator) -> None:
    # Valid: Zinc is recognized
    row_v = [
        {"food_name": "Condrès", "nutrient": "Zinc", "value": "2.29", "unit": "mg", "doi": "10.123"}
    ]
    rep_v = await validator.validate_rows("b1", "f1", row_v, {k: k for k in row_v[0]})
    assert rep_v.rows_valid == 1

    # Invalid: Inconnuium not recognized
    row_i = [
        {
            "food_name": "Condrès",
            "nutrient": "Inconnuium",
            "value": "2.29",
            "unit": "mg",
            "doi": "10.123",
        }
    ]
    rep_i = await validator.validate_rows("b1", "f1", row_i, {k: k for k in row_i[0]})
    assert rep_i.rows_error == 1
    assert any("Règle 1" in m for m in rep_i.details[0].messages)


@pytest.mark.asyncio
async def test_control_rule_2_unit_convertible(validator: IngestionValidator) -> None:
    # Valid: mg is convertible to mg (or g)
    row_v = [
        {"food_name": "Condrès", "nutrient": "Zinc", "value": "2.29", "unit": "mg", "doi": "10.123"}
    ]
    rep_v = await validator.validate_rows("b1", "f1", row_v, {k: k for k in row_v[0]})
    assert rep_v.rows_valid == 1

    # Invalid: litres is not convertible to mass for Zinc
    row_i = [
        {
            "food_name": "Condrès",
            "nutrient": "Zinc",
            "value": "2.29",
            "unit": "litres",
            "doi": "10.123",
        }
    ]
    rep_i = await validator.validate_rows("b1", "f1", row_i, {k: k for k in row_i[0]})
    assert rep_i.rows_error == 1
    assert any("Règle 2" in m for m in rep_i.details[0].messages)


@pytest.mark.asyncio
async def test_control_rule_3_plausible_bounds(validator: IngestionValidator) -> None:
    # Valid: 2.29 mg Zinc is plausible
    row_v = [
        {"food_name": "Condrès", "nutrient": "Zinc", "value": "2.29", "unit": "mg", "doi": "10.123"}
    ]
    rep_v = await validator.validate_rows("b1", "f1", row_v, {k: k for k in row_v[0]})
    assert rep_v.rows_valid == 1

    # Invalid: 9999 mg Zinc is impossible for 100g (max is 100 mg)
    row_i = [
        {
            "food_name": "Condrès",
            "nutrient": "Zinc",
            "value": "9999.0",
            "unit": "mg",
            "doi": "10.123",
        }
    ]
    rep_i = await validator.validate_rows("b1", "f1", row_i, {k: k for k in row_i[0]})
    assert rep_i.rows_error == 1
    assert any("Règle 3" in m for m in rep_i.details[0].messages)


@pytest.mark.asyncio
async def test_control_rule_4_duplicate_detection(validator: IngestionValidator) -> None:
    rows = [
        {
            "food_name": "Condrès",
            "nutrient": "Zinc",
            "value": "2.29",
            "unit": "mg",
            "doi": "10.123",
        },
        {
            "food_name": "Condrès",
            "nutrient": "Zinc",
            "value": "2.29",
            "unit": "mg",
            "doi": "10.123",
        },
    ]
    rep = await validator.validate_rows("b1", "f1", rows, {k: k for k in rows[0]})
    assert rep.rows_valid == 1
    assert rep.rows_warning == 1
    assert any("Règle 4" in m for m in rep.details[1].messages)


@pytest.mark.asyncio
async def test_control_rule_5_mandatory_source(validator: IngestionValidator) -> None:
    # Valid: DOI provided
    row_v = [
        {"food_name": "Condrès", "nutrient": "Zinc", "value": "2.29", "unit": "mg", "doi": "10.123"}
    ]
    rep_v = await validator.validate_rows("b1", "f1", row_v, {k: k for k in row_v[0]})
    assert rep_v.rows_valid == 1

    # Invalid: no source at all
    row_i = [
        {
            "food_name": "Condrès",
            "nutrient": "Zinc",
            "value": "2.29",
            "unit": "mg",
            "doi": "",
            "article_reference": "",
        }
    ]
    rep_i = await validator.validate_rows("b1", "f1", row_i, {k: k for k in row_i[0]})
    assert rep_i.rows_error == 1
    assert any("Règle 5" in m for m in rep_i.details[0].messages)


@pytest.mark.asyncio
async def test_validate_mixed_fixture_report(validator: IngestionValidator) -> None:
    fixture_path = Path("tests/fixtures/food_import_mixed.csv")
    if not fixture_path.exists():
        fixture_path = Path("apps/api/tests/fixtures/food_import_mixed.csv")

    headers, rows = parse_csv_file(fixture_path.read_bytes())
    mapping = guess_column_mapping(headers)
    report = await validator.validate_rows("b_mixed", "food_import_mixed.csv", rows, mapping)

    # 1 valid row (line 1), 1 warning (line 6 duplicate), 4 errors
    assert report.rows_valid == 1
    assert report.rows_warning == 1
    assert report.rows_error == 4
    assert report.can_execute is True
