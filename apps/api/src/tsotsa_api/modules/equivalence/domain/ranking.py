"""Pure domain logic for food equivalence ranking.

Independent of database models or framework dependencies.
Calculates m, e, relative distances on N, and applies regional ordering rules.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal


@dataclass(frozen=True)
class EquivalenceConfig:
    """Configurable parameters for nutrient presence thresholds."""

    default_threshold_pct: Decimal = Decimal("10.0")  # X % of product content
    nutrient_specific_thresholds: dict[str, Decimal] = field(default_factory=dict)


@dataclass(frozen=True)
class FoodCandidate:
    """Represents a food candidate to evaluate for equivalence."""

    id: str
    name: str
    nutrients: dict[str, Decimal]
    regions: set[str] = field(default_factory=set)
    source: str | None = None
    category: str | None = None
    local_name: str | None = None


@dataclass(frozen=True)
class ProductProfile:
    """Represents the product against which candidates are compared."""

    id: str
    name: str
    essential_nutrients: list[str]
    nutrients: dict[str, Decimal]


@dataclass(frozen=True)
class EquivalenceResult:
    """Ranked equivalence result for a food candidate."""

    food_id: str
    food_name: str
    m: int
    e: int
    distance: Decimal
    is_in_target_region: bool
    common_nutrients: list[str]
    extra_nutrients: list[str]
    food_nutrients: dict[str, Decimal]
    regions: set[str]
    source: str | None = None
    category: str | None = None


def is_nutrient_present(
    food_val: Decimal | None,
    product_val: Decimal,
    config: EquivalenceConfig,
    nutrient_code: str | None = None,
) -> bool:
    """Check if food contains a nutrient at or above the threshold."""
    if food_val is None or food_val <= Decimal(0):
        return False

    if nutrient_code and nutrient_code in config.nutrient_specific_thresholds:
        threshold = config.nutrient_specific_thresholds[nutrient_code]
    else:
        threshold = product_val * (config.default_threshold_pct / Decimal(100))

    return food_val >= threshold


def compute_relative_distance(
    product_nutrients: dict[str, Decimal],
    food_nutrients: dict[str, Decimal],
    essential_nutrients: list[str],
) -> Decimal:
    """Calculate mean relative distance over all essential nutrients N."""
    if not essential_nutrients:
        return Decimal(0)

    total_diff = Decimal(0)
    for n in essential_nutrients:
        prod_val = product_nutrients.get(n, Decimal(0))
        food_val = food_nutrients.get(n, Decimal(0))

        if prod_val > Decimal(0):
            diff = abs(food_val - prod_val) / prod_val
        elif food_val > Decimal(0):
            diff = Decimal(1)
        else:
            diff = Decimal(0)

        total_diff += diff

    return total_diff / Decimal(len(essential_nutrients))


def rank_food_equivalents(
    product: ProductProfile,
    candidates: list[FoodCandidate],
    custom_nutrients: list[str] | None = None,
    target_region: str | None = None,
    strict_region: bool = False,
    config: EquivalenceConfig | None = None,
) -> list[EquivalenceResult]:
    """Rank candidate foods against a product profile according to TSOTSA rules.

    Sorting hierarchy:
    1. m descending: number of essential nutrients present >= threshold.
    2. e ascending: number of extra tracked nutrients present in food.
    3. distance ascending: mean relative difference on N.
    4. Regional availability: candidate available in target region comes first.
    """
    cfg = config or EquivalenceConfig()
    essential_n = custom_nutrients if custom_nutrients is not None else product.essential_nutrients
    essential_set = set(essential_n)

    filtered_candidates = candidates
    if target_region and strict_region:
        filtered_candidates = [c for c in candidates if target_region in c.regions or not c.regions]

    scored: list[tuple[tuple[int, int, Decimal, int], EquivalenceResult]] = []

    for c in filtered_candidates:
        common_present: list[str] = []
        for n in essential_n:
            prod_val = product.nutrients.get(n, Decimal(0))
            food_val = c.nutrients.get(n)
            if is_nutrient_present(food_val, prod_val, cfg, n):
                common_present.append(n)

        m = len(common_present)

        extra_present: list[str] = [
            k
            for k, val in c.nutrients.items()
            if k not in essential_set and val is not None and val > Decimal(0)
        ]
        e = len(extra_present)

        dist = compute_relative_distance(product.nutrients, c.nutrients, essential_n)

        in_region = bool(target_region and target_region in c.regions)

        res = EquivalenceResult(
            food_id=c.id,
            food_name=c.name,
            m=m,
            e=e,
            distance=dist,
            is_in_target_region=in_region,
            common_nutrients=common_present,
            extra_nutrients=extra_present,
            food_nutrients=c.nutrients,
            regions=c.regions,
            source=c.source,
            category=c.category,
        )

        region_score = 1 if in_region else 0
        sort_key = (-m, e, dist, -region_score)
        scored.append((sort_key, res))

    scored.sort(key=lambda item: item[0])
    return [item[1] for item in scored]
