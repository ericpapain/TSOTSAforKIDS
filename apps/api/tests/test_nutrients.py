"""Tests for Domain D (Nutrients module: seeding, normalization, units, endpoints)."""

from __future__ import annotations

from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.nutrients.service import NutrientService


@pytest.mark.asyncio
async def test_seed_nutrients_idempotent(db_session: AsyncSession) -> None:
    service = NutrientService(db_session)
    count1 = await service.seed_from_csv()
    assert count1 >= 30

    # Idempotent re-run
    count2 = await service.seed_from_csv()
    assert count2 == count1


@pytest.mark.asyncio
async def test_normalize_nutrient_synonyms(db_session: AsyncSession) -> None:
    service = NutrientService(db_session)
    await service.seed_from_csv()

    # Canonical match
    zinc = await service.normalize_nutrient("Zinc")
    assert zinc is not None
    assert zinc.code == "zinc"

    # Synonym matches
    protein = await service.normalize_nutrient("matières azotées")
    assert protein is not None
    assert protein.code == "protein"

    phytate = await service.normalize_nutrient("acide phytique")
    assert phytate is not None
    assert phytate.code == "phytate"

    # Typo from ORKG metadata
    typo_phytate = await service.normalize_nutrient("Phyttate")
    assert typo_phytate is not None
    assert typo_phytate.code == "phytate"

    # Unknown
    unknown = await service.normalize_nutrient("Inconnuium")
    assert unknown is None


@pytest.mark.asyncio
async def test_unit_conversions(db_session: AsyncSession) -> None:
    service = NutrientService(db_session)
    await service.seed_from_csv()

    # kJ to kcal
    val_kcal = await service.convert_unit(Decimal("1000.0"), "kJ", "kcal")
    assert val_kcal is not None
    assert round(val_kcal, 2) == Decimal("239.01")

    # mg to g
    val_g = await service.convert_unit(Decimal("2500.0"), "mg", "g")
    assert val_g is not None
    assert val_g == Decimal("2.5")

    # µg to mg
    val_mg = await service.convert_unit(Decimal("500.0"), "µg", "mg")
    assert val_mg is not None
    assert val_mg == Decimal("0.5")

    # Incompatible units
    val_inval = await service.convert_unit(Decimal("10.0"), "litres", "g")
    assert val_inval is None


@pytest.mark.asyncio
async def test_normalize_to_100g(db_session: AsyncSession) -> None:
    service = NutrientService(db_session)
    # 5g observed in 50g sample -> 10g per 100g
    normalized = service.normalize_to_100g(Decimal("5.0"), Decimal("50.0"))
    assert normalized == Decimal("10.0")


@pytest.mark.asyncio
async def test_normalize_and_validate_plausible_limits(db_session: AsyncSession) -> None:
    service = NutrientService(db_session)
    await service.seed_from_csv()

    # Valid Zinc
    rep_valid = await service.normalize_and_validate("Zinc", "2.5", "mg")
    assert rep_valid.recognized is True
    assert rep_valid.is_plausible is True
    assert len(rep_valid.errors) == 0

    # Implausible Zinc (> 100 mg/100g)
    rep_high = await service.normalize_and_validate("Zinc", "500.0", "mg")
    assert rep_high.recognized is True
    assert rep_high.is_plausible is False
    assert any("maximum" in e for e in rep_high.errors)

    # Implausible negative value
    rep_neg = await service.normalize_and_validate("Zinc", "-5.0", "mg")
    assert rep_neg.recognized is True
    assert rep_neg.is_plausible is False
    assert any("minimum" in e for e in rep_neg.errors)


@pytest.mark.asyncio
async def test_nutrients_public_endpoints(client: AsyncClient, db_session: AsyncSession) -> None:
    service = NutrientService(db_session)
    await service.seed_from_csv()

    res = await client.get("/v1/nutrients")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 30
    codes = {n["code"] for n in data}
    assert "zinc" in codes
    assert "protein" in codes

    res_single = await client.get("/v1/nutrients/zinc")
    assert res_single.status_code == 200
    zinc_data = res_single.json()
    assert zinc_data["name_fr"] == "Zinc"
    assert "Zn" in zinc_data["synonyms"]

    res_404 = await client.get("/v1/nutrients/not_existing")
    assert res_404.status_code == 404
