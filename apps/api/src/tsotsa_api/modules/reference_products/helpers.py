"""Validation and serialization helpers for reference and custom products."""

from __future__ import annotations

from decimal import Decimal

from tsotsa_api.core.errors import ValidationError
from tsotsa_api.modules.nutrients.service import NutrientService
from tsotsa_api.modules.reference_products.models import (
    Product,
    ProductEssentialNutrient,
    ProductNutrientValue,
)
from tsotsa_api.modules.reference_products.schemas import (
    ProductDetailRead,
    ProductNutrientInput,
    ProductNutrientRead,
    ProductSummaryRead,
)

REFERENCE_STATUS_MAP: dict[str, str] = {
    "to_enter": "to_enter",
    "a_saisir": "to_enter",
    "à saisir": "to_enter",
    "to_validate": "to_validate",
    "a_valider": "to_validate",
    "à valider": "to_validate",
    "validated": "validated",
    "valide": "validated",
    "validé": "validated",
}

USAGE_MAP: dict[str, str] = {
    "hospital": "hospital",
    "hopital": "hospital",
    "hôpital": "hospital",
    "home": "home",
    "domicile": "home",
}

BASE_MAP: dict[str, str] = {
    "100g": "100g",
    "100 g": "100g",
    "100ml": "100ml",
    "100 ml": "100ml",
}


def normalize_base(raw_base: str) -> str:
    clean = raw_base.strip().lower()
    if clean not in BASE_MAP:
        raise ValidationError(f"Base invalide : '{raw_base}'. Utilisez '100g' ou '100ml'.")
    return BASE_MAP[clean]


def normalize_usage(raw_usage: str) -> str:
    clean = raw_usage.strip().lower()
    if clean not in USAGE_MAP:
        raise ValidationError(f"Usage invalide : '{raw_usage}'. Utilisez 'hospital' ou 'home'.")
    return USAGE_MAP[clean]


def normalize_ref_status(raw_status: str) -> str:
    clean = raw_status.strip().lower()
    if clean not in REFERENCE_STATUS_MAP:
        raise ValidationError(f"Statut de produit de référence invalide : '{raw_status}'.")
    return REFERENCE_STATUS_MAP[clean]


async def build_nutrient_models(
    product_id: str,
    inputs: list[ProductNutrientInput],
    nutrient_service: NutrientService,
) -> list[ProductNutrientValue]:
    models: list[ProductNutrientValue] = []
    for item in inputs:
        raw_min = item.value_min if item.value_min is not None else item.value
        if raw_min is None:
            raise ValidationError(
                f"Une valeur ou valeur minimale est requise pour '{item.nutrient}'."
            )

        rep_min = await nutrient_service.normalize_and_validate(
            raw_nutrient=item.nutrient,
            raw_value=raw_min,
            raw_unit=item.unit,
            sample_basis_g=Decimal("100.0"),
        )
        if not rep_min.recognized or rep_min.errors or rep_min.normalized_value is None:
            err_detail = "; ".join(rep_min.errors) if rep_min.errors else "Nutriment invalide"
            raise ValidationError(f"Erreur sur '{item.nutrient}' : {err_detail}")

        norm_max = await _validate_optional_max(item, rep_min.normalized_value, nutrient_service)

        models.append(
            ProductNutrientValue(
                product_id=product_id,
                nutrient_id=rep_min.nutrient_id or "",
                nutrient_code=rep_min.canonical_code or "",
                nutrient_name=rep_min.canonical_name or item.nutrient,
                reference_unit=rep_min.reference_unit or item.unit,
                value_min=rep_min.normalized_value,
                value_max=norm_max,
            )
        )
    return models


async def _validate_optional_max(
    item: ProductNutrientInput,
    norm_min: Decimal,
    nutrient_service: NutrientService,
) -> Decimal | None:
    if item.value_max is None:
        return None
    rep_max = await nutrient_service.normalize_and_validate(
        raw_nutrient=item.nutrient,
        raw_value=item.value_max,
        raw_unit=item.unit,
        sample_basis_g=Decimal("100.0"),
    )
    if not rep_max.recognized or rep_max.errors or rep_max.normalized_value is None:
        err_detail = "; ".join(rep_max.errors) if rep_max.errors else "Valeur max invalide"
        raise ValidationError(f"Erreur sur '{item.nutrient}' (max) : {err_detail}")
    if rep_max.normalized_value < norm_min:
        raise ValidationError(
            f"La valeur max ({rep_max.normalized_value}) est inférieure au min ({item.nutrient})."
        )
    return rep_max.normalized_value


async def build_essential_models(
    product_id: str,
    codes: list[str],
    nutrient_service: NutrientService,
) -> list[ProductEssentialNutrient]:
    models: list[ProductEssentialNutrient] = []
    seen: set[str] = set()
    for raw_code in codes:
        nut = await nutrient_service.normalize_nutrient(raw_code)
        if not nut:
            raise ValidationError(f"Nutriment essentiel inconnu : '{raw_code}'.")
        if nut.code in seen:
            continue
        seen.add(nut.code)
        models.append(
            ProductEssentialNutrient(
                product_id=product_id,
                nutrient_id=nut.id,
                nutrient_code=nut.code,
            )
        )
    return models


def to_product_summary(product: Product) -> ProductSummaryRead:
    return ProductSummaryRead.model_validate(product)


def to_product_detail(product: Product) -> ProductDetailRead:
    nutrients = [
        ProductNutrientRead(
            nutrient_code=nv.nutrient_code,
            nutrient_name=nv.nutrient_name,
            value=nv.value_min,
            value_min=nv.value_min,
            value_max=nv.value_max,
            unit=nv.reference_unit,
            unit_code=nv.reference_unit,
        )
        for nv in product.nutrient_values
    ]
    essentials = [en.nutrient_code for en in product.essential_nutrients]
    return ProductDetailRead(
        id=product.id,
        type=product.type,
        name=product.name,
        base=product.base,
        usage=product.usage,
        owner_user_id=product.owner_user_id,
        status=product.status,
        unit_label=product.unit_label,
        label_photo_file=product.label_photo_file,
        source_reference=product.source_reference,
        nutrients=nutrients,
        essential_nutrients=essentials,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )
