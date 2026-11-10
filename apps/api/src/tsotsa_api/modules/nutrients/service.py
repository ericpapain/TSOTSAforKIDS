"""Business logic service for Domain D (Nutrients and Units)."""

from __future__ import annotations

import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.logging import get_logger
from tsotsa_api.modules.nutrients.models import Nutrient
from tsotsa_api.modules.nutrients.repository import NutrientsRepository
from tsotsa_api.modules.nutrients.schemas import NormalizationReport

logger = get_logger(__name__)

STANDARD_UNITS = [
    ("g", "mass", "Gramme"),
    ("mg", "mass", "Milligramme"),
    ("µg", "mass", "Microgramme"),
    ("ug", "mass", "Microgramme (ASCII)"),
    ("kcal", "energy", "Kilocalorie"),
    ("kJ", "energy", "Kilojoule"),
    ("cal", "energy", "Calorie"),
    ("%", "ratio", "Pourcentage"),
]

CANONICAL_NUTRIENT_NAMES_EN: dict[str, str] = {
    "energy": "Energy",
    "protein": "Proteins",
    "fat": "Lipids",
    "carbohydrates": "Carbohydrates",
    "fiber": "Fiber",
    "water": "Water",
    "zinc": "Zinc",
    "magnesium": "Magnesium",
    "copper": "Copper",
    "iron": "Iron",
    "calcium": "Calcium",
    "sodium": "Sodium",
    "potassium": "Potassium",
    "phosphorus": "Phosphorus",
    "iodine": "Iodine",
    "selenium": "Selenium",
    "vitamin_a": "Vitamin A",
    "vitamin_d": "Vitamin D",
    "vitamin_e": "Vitamin E",
    "vitamin_k": "Vitamin K",
    "vitamin_c": "Vitamin C",
    "vitamin_b1": "Vitamin B1",
    "vitamin_b2": "Vitamin B2",
    "vitamin_b3": "Vitamin B3",
    "vitamin_b5": "Vitamin B5",
    "vitamin_b6": "Vitamin B6",
    "vitamin_b8": "Vitamin B8",
    "vitamin_b9": "Vitamin B9",
    "vitamin_b12": "Vitamin B12",
    "phytate": "Phytate",
}


class NutrientService:
    """Service providing nutrient identification, unit conversions, and validation."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = NutrientsRepository(session)

    async def seed_from_csv(self, csv_path: Path | str | None = None) -> int:
        """Load data/dictionnaire_nutriments.csv idempotently."""
        path = self._resolve_csv_path(csv_path)
        await self._ensure_standard_units()
        unit_map = {u.code: u for u in await self.repo.get_all_units()}

        count = 0
        with open(path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                ref_unit = unit_map.get(row["unite_reference"].strip())
                if not ref_unit:
                    continue
                p_min = (
                    Decimal(row["plausible_min_100g"]) if row.get("plausible_min_100g") else None
                )
                p_max = (
                    Decimal(row["plausible_max_100g"]) if row.get("plausible_max_100g") else None
                )
                code_val = row["code"].strip()
                name_en_val = row.get("nom_anglais", "").strip() or CANONICAL_NUTRIENT_NAMES_EN.get(
                    code_val
                )
                nutrient = await self.repo.save_nutrient(
                    code=code_val,
                    name_fr=row["nom_canonique"].strip(),
                    name_en=name_en_val,
                    category=row["categorie"].strip(),
                    reference_unit_id=ref_unit.id,
                    plausible_min=p_min,
                    plausible_max=p_max,
                )
                await self._seed_synonyms(nutrient.id, row.get("synonymes", ""))
                await self._seed_conversions(
                    ref_unit.id, row.get("facteurs_conversion", ""), unit_map
                )
                count += 1

        await self.session.flush()
        return count

    def _resolve_csv_path(self, csv_path: Path | str | None) -> Path:
        if csv_path:
            return Path(csv_path)
        # Default project path
        candidates = [
            Path("data/dictionnaire_nutriments.csv"),
            Path("../../data/dictionnaire_nutriments.csv"),
            Path(__file__).parents[5] / "data" / "dictionnaire_nutriments.csv",
        ]
        for c in candidates:
            if c.exists():
                return c.resolve()
        raise FileNotFoundError("data/dictionnaire_nutriments.csv introuvable.")

    async def _ensure_standard_units(self) -> None:
        for code, kind, name in STANDARD_UNITS:
            await self.repo.save_unit(code=code, kind=kind, name=name)

    async def _seed_synonyms(self, nutrient_id: str, raw_synonyms: str) -> None:
        synonyms = [s.strip() for s in raw_synonyms.split("|") if s.strip()]
        for syn in synonyms:
            await self.repo.add_synonym(nutrient_id=nutrient_id, label=syn)

    async def _seed_conversions(
        self, ref_unit_id: str, conversions_str: str, unit_map: dict[str, Any]
    ) -> None:
        pairs = [p.strip() for p in conversions_str.split("|") if p.strip()]
        for pair in pairs:
            if ":" not in pair:
                continue
            unit_code, factor_str = pair.split(":", 1)
            unit_code = unit_code.strip()
            from_unit = unit_map.get(unit_code)
            if from_unit:
                factor = Decimal(factor_str.strip())
                await self.repo.save_unit_conversion(from_unit.id, ref_unit_id, factor)

    async def normalize_nutrient(self, label: str) -> Nutrient | None:
        """Find canonical nutrient by code, name, or synonym."""
        return await self.repo.find_nutrient_by_label(label)

    async def convert_unit(
        self, value: Decimal, from_unit_code: str, to_unit_code: str
    ) -> Decimal | None:
        """Convert a numerical value from one unit to another."""
        clean_from = from_unit_code.strip().lower()
        clean_to = to_unit_code.strip().lower()
        if clean_from == clean_to:
            return value

        from_unit = await self.repo.get_unit_by_code(clean_from)
        to_unit = await self.repo.get_unit_by_code(clean_to)
        if not from_unit or not to_unit:
            return None

        factor = await self.repo.get_conversion_factor(from_unit.id, to_unit.id)
        if factor is not None:
            return value * factor

        # Try reverse factor
        reverse_factor = await self.repo.get_conversion_factor(to_unit.id, from_unit.id)
        if reverse_factor is not None and reverse_factor > 0:
            return value / reverse_factor

        return None

    def normalize_to_100g(self, value: Decimal, basis_quantity: Decimal) -> Decimal:
        """Scale value to a 100g / 100ml basis."""
        if basis_quantity <= 0:
            return value
        return value * (Decimal("100.0") / basis_quantity)

    async def normalize_and_validate(
        self,
        raw_nutrient: str,
        raw_value: Decimal | float | str,
        raw_unit: str,
        sample_basis_g: Decimal = Decimal("100.0"),
    ) -> NormalizationReport:
        """Normalize raw nutrient observation, convert unit, and verify bounds."""
        nutrient = await self.normalize_nutrient(raw_nutrient)
        if not nutrient:
            return NormalizationReport(
                recognized=False,
                errors=[f"Nutriment inconnu ou non répertorié : '{raw_nutrient}'"],
            )

        try:
            val = Decimal(str(raw_value).strip().replace(",", "."))
        except (InvalidOperation, ValueError):
            return NormalizationReport(
                recognized=True,
                nutrient_id=nutrient.id,
                canonical_code=nutrient.code,
                canonical_name=nutrient.name_fr,
                errors=[f"Valeur numérique invalide : '{raw_value}'"],
            )

        ref_unit = nutrient.reference_unit.code
        converted_val = await self.convert_unit(val, raw_unit, ref_unit)
        if converted_val is None:
            return NormalizationReport(
                recognized=True,
                nutrient_id=nutrient.id,
                canonical_code=nutrient.code,
                canonical_name=nutrient.name_fr,
                raw_value=val,
                reference_unit=ref_unit,
                errors=[f"Unité '{raw_unit}' non convertible vers '{ref_unit}'"],
            )

        normalized = self.normalize_to_100g(converted_val, sample_basis_g)
        errors: list[str] = []
        is_plausible = True

        if nutrient.plausible_min is not None and normalized < nutrient.plausible_min:
            is_plausible = False
            errors.append(f"Valeur {normalized} {ref_unit} < minimum ({nutrient.plausible_min})")
        if nutrient.plausible_max is not None and normalized > nutrient.plausible_max:
            is_plausible = False
            errors.append(f"Valeur {normalized} {ref_unit} > maximum ({nutrient.plausible_max})")

        return NormalizationReport(
            recognized=True,
            nutrient_id=nutrient.id,
            canonical_code=nutrient.code,
            canonical_name=nutrient.name_fr,
            raw_value=val,
            normalized_value=normalized,
            reference_unit=ref_unit,
            is_plausible=is_plausible,
            errors=errors,
        )
