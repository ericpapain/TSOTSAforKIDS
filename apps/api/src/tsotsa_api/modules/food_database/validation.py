"""Validation engine implementing the 5 quality control rules for food ingestion."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from tsotsa_api.modules.food_database.schemas import BatchRowMessage, BatchValidationReport
from tsotsa_api.modules.nutrients.service import NutrientService


class IngestionValidator:
    """Evaluates rows against canonical quality rules."""

    def __init__(self, nutrient_service: NutrientService) -> None:
        self.nutrient_service = nutrient_service

    async def validate_rows(
        self,
        batch_id: str,
        file_name: str,
        rows: list[dict[str, Any]],
        column_mapping: dict[str, str],
        existing_keys: set[str] | None = None,
    ) -> BatchValidationReport:
        seen_batch_keys: set[str] = set()
        db_keys = existing_keys or set()
        row_results: list[BatchRowMessage] = []
        counts = {"valid": 0, "error": 0, "warning": 0}

        for idx, row in enumerate(rows, start=1):
            mapped = self._map_row(row, column_mapping)
            status, msgs = await self._validate_single_row(mapped, seen_batch_keys, db_keys)
            counts[status] += 1
            row_results.append(BatchRowMessage(row_number=idx, status=status, messages=msgs))

        can_execute = counts["valid"] > 0
        return BatchValidationReport(
            batch_id=batch_id,
            file_name=file_name,
            status="to_review" if can_execute else "draft",
            rows_valid=counts["valid"],
            rows_warning=counts["warning"],
            rows_error=counts["error"],
            can_execute=can_execute,
            details=row_results,
        )

    def _map_row(self, row: dict[str, Any], mapping: dict[str, str]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for original_col, value in row.items():
            target_field = mapping.get(original_col)
            if target_field:
                result[target_field] = str(value).strip() if value is not None else ""
            else:
                result[original_col] = str(value).strip() if value is not None else ""
        return result

    async def _validate_single_row(
        self,
        mapped: dict[str, Any],
        seen_batch_keys: set[str],
        db_keys: set[str],
    ) -> tuple[str, list[str]]:
        errors: list[str] = []
        warnings: list[str] = []

        food_name = mapped.get("food_name", "").strip()
        if not food_name:
            errors.append("Règle 0 : Nom d'aliment manquant.")

        # Règle 5 : Source obligatoire
        src = (
            mapped.get("article_reference", "")
            or mapped.get("doi", "")
            or mapped.get("orkg_comparison", "")
        ).strip()
        if not src:
            errors.append(
                "Règle 5 : Source obligatoire manquante "
                "(article_reference, doi, ou orkg_comparaison)."
            )

        # Règle 1, 2, 3 : Nutriment, Unité convertible, Limites plausibles
        raw_nut = mapped.get("nutrient", "").strip()
        raw_val = mapped.get("value", "").strip()
        raw_unit = mapped.get("unit", "").strip()
        basis = mapped.get("basis", "poids frais").strip() or "poids frais"

        if not raw_nut or not raw_val or not raw_unit:
            errors.append("Nutriment, valeur ou unité manquant dans la ligne.")
            return "error", errors

        report = await self.nutrient_service.normalize_and_validate(
            raw_nutrient=raw_nut,
            raw_value=raw_val,
            raw_unit=raw_unit,
            sample_basis_g=Decimal("100.0"),
        )

        if not report.recognized:
            errors.append(f"Règle 1 : {report.errors[0]}")
        elif report.errors:
            for err in report.errors:
                if "non convertible" in err:
                    errors.append(f"Règle 2 : {err}")
                elif "plausible" in err or "maximum" in err or "minimum" in err:
                    errors.append(f"Règle 3 : {err}")
                else:
                    errors.append(err)

        # Règle 4 : Détection de doublons
        canonical_code = report.canonical_code or raw_nut.lower()
        dedupe_key = f"{food_name.lower()}|{canonical_code}|{basis.lower()}"
        if dedupe_key in seen_batch_keys:
            warnings.append(
                f"Règle 4 : Doublon détecté au sein du lot pour '{food_name}' et '{raw_nut}'."
            )
        elif dedupe_key in db_keys:
            warnings.append(
                f"Règle 4 : Aliment '{food_name}' et '{raw_nut}' déjà présents en base."
            )
        seen_batch_keys.add(dedupe_key)

        if errors:
            return "error", errors
        if warnings:
            return "warning", warnings
        return "valid", ["Ligne conforme."]
