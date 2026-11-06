"""Unit tests for Domain Growth pure calculation engine (WHO 2006 Standards).

100% test coverage mandatory according to AGENTS.md.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

import pytest

from tsotsa_api.modules.growth.engine import (
    WHOReferenceRow,
    adjust_measurement_position,
    calculate_daily_weight_gain,
    calculate_lms_zscore,
    evaluate_child_anthropometry,
    propose_nutritional_status,
)

# 10 official reference rows sampled directly from WHO Child Growth Standards 2006 tables
WHO_OFFICIAL_TEST_CASES = [
    # 1. WFL Girls 50.0 cm
    WHOReferenceRow("wfl", "F", 50.0, -0.3833, 3.3518, 0.09068, 2.588, 2.813, 3.352, 4.045, 4.467),
    # 2. WFL Boys 65.0 cm
    WHOReferenceRow("wfl", "M", 65.0, -0.3521, 7.2666, 0.08223, 5.736, 6.193, 7.267, 8.608, 9.406),
    # 3. WFH Girls 85.0 cm
    WHOReferenceRow(
        "wfh", "F", 85.0, -0.3833, 11.3934, 0.08896, 8.837, 9.592, 11.393, 13.699, 15.098
    ),
    # 4. WFH Boys 95.0 cm
    WHOReferenceRow("wfh", "M", 95.0, -0.3521, 14.06, 0.0806, 11.148, 12.02, 14.06, 16.598, 18.103),
    # 5. LHFA Girls 365 days (1 yr)
    WHOReferenceRow(
        "lhfa", "F", 365, 1.0, 74.0049, 0.03479, 66.281, 68.856, 74.005, 79.154, 81.729
    ),
    # 6. LHFA Boys 730 days (2 yr)
    WHOReferenceRow(
        "lhfa", "M", 730, 1.0, 87.8018, 0.03479, 78.638, 81.693, 87.802, 93.911, 96.966
    ),
    # 7. WFA Girls 365 days
    WHOReferenceRow("wfa", "F", 365, -0.2022, 8.9462, 0.12267, 6.273, 7.041, 8.946, 11.506, 13.114),
    # 8. WFA Boys 500 days
    WHOReferenceRow("wfa", "M", 500, 0.0314, 10.6125, 0.11057, 7.603, 8.5, 10.612, 13.229, 14.762),
    # 9. ACFA Girls 365 days (MUAC)
    WHOReferenceRow(
        "acfa", "F", 365, -0.1733, 14.2062, 0.0828, 11.139, 12.066, 14.206, 16.805, 18.312
    ),
    # 10. BFA Boys 365 days (BMI)
    WHOReferenceRow(
        "bfa", "M", 365, -0.4113, 16.7992, 0.08009, 13.359, 14.385, 16.799, 19.827, 21.635
    ),
]


@pytest.mark.parametrize("row", WHO_OFFICIAL_TEST_CASES)
def test_who_official_lms_reference_points(row: WHOReferenceRow) -> None:
    """Verify that SD2neg -> -2.00, SD3neg -> -3.00, SD0 -> 0.00, SD2 -> +2.00, SD3 -> +3.00."""
    assert abs(calculate_lms_zscore(row.SD0, row)) <= 0.01
    assert abs(calculate_lms_zscore(row.SD2neg, row) - (-2.00)) <= 0.01
    assert abs(calculate_lms_zscore(row.SD3neg, row) - (-3.00)) <= 0.01
    assert abs(calculate_lms_zscore(row.SD2, row) - 2.00) <= 0.01
    assert abs(calculate_lms_zscore(row.SD3, row) - 3.00) <= 0.01


def test_who_adjusted_zscore_beyond_three_sd() -> None:
    """Test WHO adjusted z-score formula beyond +/- 3 SD."""
    row = WHO_OFFICIAL_TEST_CASES[0]  # WFL Girls at 50 cm: SD3neg=2.588, SD2neg=2.813, SD3pos=4.467
    y_low = 2.0  # < SD3neg
    z_low = calculate_lms_zscore(y_low, row)
    assert z_low < -3.0
    expected_low = -3.0 + (y_low - row.SD3neg) / (row.SD2neg - row.SD3neg)
    assert abs(z_low - expected_low) < 0.01

    y_high = 5.0  # > SD3pos
    z_high = calculate_lms_zscore(y_high, row)
    assert z_high > 3.0
    expected_high = 3.0 + (y_high - row.SD3) / (row.SD3 - row.SD2)
    assert abs(z_high - expected_high) < 0.01


def test_lms_with_zero_power_l() -> None:
    """Test edge-case where L == 0 (pure logarithmic formulation)."""
    row_zero_l = WHOReferenceRow("test", "M", 100, 0.0, 10.0, 0.1, 7.4, 8.1, 10.0, 12.2, 13.5)
    assert abs(calculate_lms_zscore(10.0, row_zero_l)) < 0.001
    import math

    y_1sd = 10.0 * math.exp(0.1)
    assert abs(calculate_lms_zscore(y_1sd, row_zero_l) - 1.0) < 0.001


def test_measurement_position_correction() -> None:
    """Verify 0.7 cm position correction based on age and measurement position."""
    l1, pos1 = adjust_measurement_position(75.0, "recumbent", 300)
    assert l1 == 75.0 and pos1 == "recumbent"

    l2, pos2 = adjust_measurement_position(75.0, "standing", 300)
    assert l2 == 75.7 and pos2 == "recumbent"

    h1, pos_h1 = adjust_measurement_position(90.0, "standing", 800)
    assert h1 == 90.0 and pos_h1 == "standing"

    h2, pos_h2 = adjust_measurement_position(90.0, "recumbent", 800)
    assert h2 == 89.3 and pos_h2 == "standing"

    d1, _ = adjust_measurement_position(70.0, None, 200)
    assert d1 == 70.0


def test_edema_handling_and_extreme_flags() -> None:
    """Verify edema suppresses weight z-scores, and extreme values are flagged."""
    row_wfl = WHO_OFFICIAL_TEST_CASES[0]
    row_lhfa = WHO_OFFICIAL_TEST_CASES[4]
    row_acfa = WHO_OFFICIAL_TEST_CASES[8]
    row_wfa = WHO_OFFICIAL_TEST_CASES[6]
    row_bfa = WHO_OFFICIAL_TEST_CASES[9]

    # Case with Edema
    scores_edema = evaluate_child_anthropometry(
        weight_kg=3.352,
        length_height_cm=74.005,
        muac_mm=142.0,
        age_days=365,
        sex="F",
        position="recumbent",
        edema="plus_2",
        ref_wfl=row_wfl,
        ref_lhfa=row_lhfa,
        ref_acfa=row_acfa,
    )
    assert scores_edema.z_weight_for_length is None
    assert scores_edema.edema_flag is True
    assert scores_edema.z_length_for_age is not None
    assert abs(scores_edema.z_length_for_age) <= 0.05
    assert scores_edema.z_muac_for_age is not None

    # Case without Edema: extreme low weight (|z| > 5)
    scores_extreme = evaluate_child_anthropometry(
        weight_kg=1.8,
        length_height_cm=50.0,
        age_days=60,
        sex="F",
        position="recumbent",
        edema="none",
        ref_wfl=row_wfl,
        ref_wfa=row_wfa,
        ref_bfa=row_bfa,
    )
    assert scores_extreme.z_weight_for_length is not None
    assert scores_extreme.z_weight_for_length < -5.0
    assert scores_extreme.z_weight_for_age is not None
    assert scores_extreme.z_bmi_for_age is not None
    assert scores_extreme.is_extreme is True


def test_daily_weight_gain_velocity() -> None:
    """Verify g/kg/day calculation between two sequential clinical evaluations."""
    d1 = datetime(2026, 10, 1, 10, 0, tzinfo=UTC)
    d2 = datetime(2026, 10, 11, 10, 0, tzinfo=UTC)

    rate = calculate_daily_weight_gain(Decimal("5.0"), d1, Decimal("5.2"), d2)
    assert rate == Decimal("4.00")

    assert calculate_daily_weight_gain(Decimal("5.0"), d1, Decimal("5.2"), d1) is None
    assert calculate_daily_weight_gain(Decimal("5.0"), d2, Decimal("5.2"), d1) is None
    assert calculate_daily_weight_gain(Decimal("0.0"), d1, Decimal("5.2"), d2) is None


def test_proposed_nutritional_status_classification() -> None:
    """Verify SAM / MAM / Normal triage proposal according to medical protocols."""
    sam_edema = propose_nutritional_status(Decimal("0.5"), Decimal("130"), "plus_1")
    assert sam_edema.classification == "MAS" and "œdème" in sam_edema.criteria.lower()

    sam_whz = propose_nutritional_status(Decimal("-3.2"), Decimal("120"), "none")
    assert sam_whz.classification == "MAS"

    sam_muac = propose_nutritional_status(Decimal("-1.5"), Decimal("110"), "none")
    assert sam_muac.classification == "MAS"

    mam_whz = propose_nutritional_status(Decimal("-2.5"), Decimal("130"), "none")
    assert mam_whz.classification == "MAM"

    mam_muac = propose_nutritional_status(Decimal("-1.0"), Decimal("120"), "none")
    assert mam_muac.classification == "MAM"

    normal = propose_nutritional_status(Decimal("-0.8"), Decimal("135"), "none")
    assert normal.classification == "normal"
