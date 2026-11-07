"""Unit tests for the nutrition equivalence ranking algorithm (Étape P05).

All test scenarios use HAND-CALCULATED reference tables to verify exact ranking:
1. m descending, then e ascending, then distance ascending, then regional availability.
2. Regional filtering: normal (region prioritized) vs strict (region only).
3. Configurable threshold X% (default 10%, dynamic admin parameter).
4. Unit conversions, zero/missing nutrient values, custom user products, empty results.
"""

from __future__ import annotations

from decimal import Decimal

import pytest

from tsotsa_api.modules.equivalence.domain.ranking import (
    EquivalenceConfig,
    FoodCandidate,
    ProductProfile,
    compute_relative_distance,
    is_nutrient_present,
    rank_food_equivalents,
)


def _d(val: float | str | int) -> Decimal:
    return Decimal(str(val))


@pytest.fixture
def product_f75() -> ProductProfile:
    # F-75 Therapeutic Milk: N = ["protein", "iron", "zinc"]
    # protein: 10.0 g, iron: 2.0 mg, zinc: 2.0 mg per 100g.
    # Default X = 10% -> threshold(protein)=1.0g, threshold(iron)=0.2mg, threshold(zinc)=0.2mg
    return ProductProfile(
        id="prod-f75",
        name="F-75 Therapeutic Milk",
        essential_nutrients=["protein", "iron", "zinc"],
        nutrients={"protein": _d("10.0"), "iron": _d("2.0"), "zinc": _d("2.0")},
    )


def test_is_nutrient_present_with_configurable_threshold() -> None:
    """Verify presence rule: Food value >= X% of product value (configurable X)."""
    product_val = _d("2.0")
    config_10_pct = EquivalenceConfig(default_threshold_pct=_d("10.0"))
    assert is_nutrient_present(_d("0.25"), product_val, config_10_pct) is True
    assert is_nutrient_present(_d("0.20"), product_val, config_10_pct) is True
    assert is_nutrient_present(_d("0.19"), product_val, config_10_pct) is False
    assert is_nutrient_present(_d("0.0"), product_val, config_10_pct) is False
    assert is_nutrient_present(None, product_val, config_10_pct) is False

    # Dynamic admin parameter: X = 50% -> threshold is 1.0 mg
    config_50_pct = EquivalenceConfig(default_threshold_pct=_d("50.0"))
    assert is_nutrient_present(_d("0.8"), product_val, config_50_pct) is False
    assert is_nutrient_present(_d("1.0"), product_val, config_50_pct) is True

    # Nutrient-specific absolute threshold override
    config_specific = EquivalenceConfig(nutrient_specific_thresholds={"iron": _d("0.5")})
    assert is_nutrient_present(_d("0.4"), product_val, config_specific, "iron") is False
    assert is_nutrient_present(_d("0.5"), product_val, config_specific, "iron") is True


def test_compute_relative_distance_hand_calculated() -> None:
    """Verify relative distance on N: mean(|food - prod| / prod) for each nutrient in N."""
    prod_nutrients = {"protein": _d("10.0"), "iron": _d("2.0"), "zinc": _d("2.0")}
    essential_n = ["protein", "iron", "zinc"]

    # Food 1: protein: 9.0 (diff 0.10), iron: 1.8 (diff 0.10), zinc: 1.6 (diff 0.20)
    # Mean distance = (0.10 + 0.10 + 0.20) / 3 = 0.40 / 3 = 0.1333...
    food_1 = {"protein": _d("9.0"), "iron": _d("1.8"), "zinc": _d("1.6")}
    dist_1 = compute_relative_distance(prod_nutrients, food_1, essential_n)
    assert round(float(dist_1), 4) == 0.1333

    # Food 2: Zinc absent (0.0 -> diff 1.0), protein 10.0 (diff 0.0), iron 2.0 (diff 0.0)
    # Mean distance = (0.0 + 0.0 + 1.0) / 3 = 0.3333...
    food_2 = {"protein": _d("10.0"), "iron": _d("2.0")}
    dist_2 = compute_relative_distance(prod_nutrients, food_2, essential_n)
    assert round(float(dist_2), 4) == 0.3333

    # Empty essential nutrients edge case
    assert compute_relative_distance(prod_nutrients, food_1, []) == Decimal(0)

    # Edge cases where product value is 0
    prod_zero = {"protein": _d("0.0"), "iron": _d("0.0")}
    food_mixed = {"protein": _d("5.0"), "iron": _d("0.0")}
    dist_zero = compute_relative_distance(prod_zero, food_mixed, ["protein", "iron"])
    assert dist_zero == Decimal("0.5")  # (1.0 + 0.0) / 2


def test_ranking_m_descending_then_e_ascending(product_f75: ProductProfile) -> None:
    """Hand-calculated test: m (descending) beats e (ascending), then e beats distance."""
    # c1: m=3, e=0, distance=0.1333
    c1 = FoodCandidate(
        id="c1",
        name="Haricot Blanc",
        nutrients={"protein": _d("9.0"), "iron": _d("1.8"), "zinc": _d("1.6")},
        regions={"Centre"},
    )
    # c2: m=3, e=1 (extra calcium), distance=0.1833
    c2 = FoodCandidate(
        id="c2",
        name="Soja Enrichi",
        nutrients={
            "protein": _d("12.0"),
            "iron": _d("2.5"),
            "zinc": _d("2.2"),
            "calcium": _d("100.0"),
        },
        regions={"Centre", "Littoral"},
    )
    # c3: m=2 (zinc=0.1 < 0.2 threshold), e=0
    c3 = FoodCandidate(
        id="c3",
        name="Arachide Partielle",
        nutrients={"protein": _d("8.0"), "iron": _d("1.5"), "zinc": _d("0.1")},
        regions={"Nord"},
    )

    results = rank_food_equivalents(
        product=product_f75,
        candidates=[c3, c2, c1],
        config=EquivalenceConfig(),
    )
    assert [r.food_id for r in results] == ["c1", "c2", "c3"]
    assert (results[0].m, results[0].e) == (3, 0)
    assert (results[1].m, results[1].e) == (3, 1)
    assert (results[2].m, results[2].e) == (2, 0)


def test_ranking_tie_break_by_distance(product_f75: ProductProfile) -> None:
    """When m and e are equal, smaller distance on N wins."""
    # Both candidates have m=3, e=0
    # c_close: diffs 0.05, 0.05, 0.05 -> mean distance = 0.0500
    c_close = FoodCandidate(
        id="c_close",
        name="Sésame Équilibré",
        nutrients={"protein": _d("9.5"), "iron": _d("1.9"), "zinc": _d("1.9")},
        regions={"Littoral"},
    )
    # c_far: diffs 0.10, 0.10, 0.20 -> mean distance = 0.1333
    c_far = FoodCandidate(
        id="c_far",
        name="Haricot Éloigné",
        nutrients={"protein": _d("9.0"), "iron": _d("1.8"), "zinc": _d("1.6")},
        regions={"Littoral"},
    )

    results = rank_food_equivalents(
        product=product_f75,
        candidates=[c_far, c_close],
        config=EquivalenceConfig(),
    )
    assert [r.food_id for r in results] == ["c_close", "c_far"]
    assert results[0].distance < results[1].distance


def test_ranking_tie_break_by_region_normal_filter(product_f75: ProductProfile) -> None:
    """When m, e, and distance are identical, target region availability breaks tie."""
    c_in_region = FoodCandidate(
        id="c_in_region",
        name="Farine Centre",
        nutrients={"protein": _d("9.5"), "iron": _d("1.9"), "zinc": _d("1.9")},
        regions={"Centre"},
    )
    c_out_region = FoodCandidate(
        id="c_out_region",
        name="Farine Littoral",
        nutrients={"protein": _d("9.5"), "iron": _d("1.9"), "zinc": _d("1.9")},
        regions={"Littoral"},
    )

    results = rank_food_equivalents(
        product=product_f75,
        candidates=[c_out_region, c_in_region],
        target_region="Centre",
        strict_region=False,
    )
    assert [r.food_id for r in results] == ["c_in_region", "c_out_region"]
    assert results[0].is_in_target_region is True
    assert results[1].is_in_target_region is False


def test_ranking_strict_region_filter(product_f75: ProductProfile) -> None:
    """Strict region filter excludes candidates not in target region."""
    c_centre = FoodCandidate(
        id="c_centre",
        name="Aliment Centre",
        nutrients={"protein": _d("9.0"), "iron": _d("1.8"), "zinc": _d("1.6")},
        regions={"Centre"},
    )
    c_nord = FoodCandidate(
        id="c_nord",
        name="Aliment Nord",
        nutrients={"protein": _d("9.5"), "iron": _d("1.9"), "zinc": _d("1.9")},
        regions={"Nord"},
    )

    results = rank_food_equivalents(
        product=product_f75,
        candidates=[c_centre, c_nord],
        target_region="Centre",
        strict_region=True,
    )
    assert len(results) == 1
    assert results[0].food_id == "c_centre"


def test_ranking_empty_results(product_f75: ProductProfile) -> None:
    """Handling of empty candidate lists or no matching strict region."""
    assert (
        rank_food_equivalents(
            product=product_f75,
            candidates=[],
            target_region="Centre",
            strict_region=False,
        )
        == []
    )
    c_nord = FoodCandidate(
        id="c_nord",
        name="Mil",
        nutrients={"protein": _d("5.0")},
        regions={"Nord"},
    )
    assert (
        rank_food_equivalents(
            product=product_f75,
            candidates=[c_nord],
            target_region="Est",
            strict_region=True,
        )
        == []
    )


def test_user_modified_essential_nutrients(product_f75: ProductProfile) -> None:
    """User can customize N for their search (e.g. only protein and iron, ignoring zinc)."""
    c = FoodCandidate(
        id="c_pi",
        name="Pois Chiches",
        nutrients={"protein": _d("9.0"), "iron": _d("1.8")},
        regions={"Centre"},
    )
    # Default N has 3 nutrients -> m = 2
    r_default = rank_food_equivalents(product=product_f75, candidates=[c])
    assert r_default[0].m == 2

    # User restricts search to N = ["protein", "iron"] -> m = 2 out of 2
    r_custom = rank_food_equivalents(
        product=product_f75,
        candidates=[c],
        custom_nutrients=["protein", "iron"],
    )
    assert r_custom[0].m == 2
    assert set(r_custom[0].common_nutrients) == {"protein", "iron"}


def test_custom_user_product() -> None:
    """Equivalence engine supports custom user-entered products with arbitrary nutrients."""
    custom_prod = ProductProfile(
        id="custom-bouillie",
        name="Bouillie Bébé Maison",
        essential_nutrients=["protein", "calcium"],
        nutrients={"protein": _d("8.0"), "calcium": _d("200.0")},
    )
    c1 = FoodCandidate(
        id="c1",
        name="Poudre de Moringa",
        nutrients={"protein": _d("10.0"), "calcium": _d("250.0")},
        regions={"Centre"},
    )
    c2 = FoodCandidate(
        id="c2",
        name="Manioc Nature",
        nutrients={"protein": _d("1.0"), "calcium": _d("20.0")},
        regions={"Centre"},
    )

    results = rank_food_equivalents(product=custom_prod, candidates=[c1, c2])
    assert results[0].food_id == "c1"
    assert results[0].m == 2
    assert results[1].food_id == "c2"
