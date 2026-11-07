"""Pure computation engine for WHO Child Growth Standards (2006) and clinical indicators.

100% test coverage mandatory.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Literal


@dataclass(frozen=True)
class WHOReferenceRow:
    """Row of WHO growth reference table containing LMS and SD cutoff points."""

    indicator: str
    sex: Literal["F", "M"]
    x_value: float
    L: float
    M: float
    S: float
    SD3neg: float
    SD2neg: float
    SD0: float
    SD2: float
    SD3: float
    SD4neg: float = 0.0
    SD1neg: float = 0.0
    SD1: float = 0.0
    SD4: float = 0.0


@dataclass(frozen=True)
class ChildAnthropometryEvaluation:
    """Calculated clinical z-scores and safety flags."""

    z_weight_for_length: float | None = None
    z_length_for_age: float | None = None
    z_weight_for_age: float | None = None
    z_muac_for_age: float | None = None
    z_bmi_for_age: float | None = None
    edema_flag: bool = False
    is_extreme: bool = False


@dataclass(frozen=True)
class NutritionalStatusProposal:
    """Suggested clinical categorization based on anthropometric cutoffs."""

    classification: Literal["MAS", "MAM", "normal"]
    criteria: str


def calculate_lms_zscore(y: float | Decimal, row: WHOReferenceRow) -> float:
    """Calculate z-score using Cole's LMS method with WHO adjustment beyond +/- 3 SD."""
    y_val = float(y)
    m = row.M
    s = row.S
    l_val = row.L

    if abs(l_val) < 1e-7:
        z = math.log(y_val / m) / s
    else:
        z = ((y_val / m) ** l_val - 1.0) / (l_val * s)

    # WHO restricted/adjusted z-score beyond +/- 3 SD for asymmetric indicators
    if z > 3.0:
        sd3 = row.SD3
        sd2 = row.SD2
        diff = sd3 - sd2
        if diff > 1e-9:
            z = 3.0 + (y_val - sd3) / diff
    elif z < -3.0:
        sd3neg = row.SD3neg
        sd2neg = row.SD2neg
        diff = sd2neg - sd3neg
        if diff > 1e-9:
            z = -3.0 + (y_val - sd3neg) / diff

    return round(z, 4)


def adjust_measurement_position(
    length_or_height: float,
    position: str | None,
    age_days: int,
) -> tuple[float, str]:
    """Correct measurement by 0.7 cm if position does not match WHO protocol for age."""
    pos = (position or "").strip().lower()

    if age_days < 731:
        # Expected: recumbent length
        if pos in ("standing", "debout"):
            return round(length_or_height + 0.7, 2), "recumbent"
        return length_or_height, "recumbent"
    else:
        # Expected: standing height
        if pos in ("recumbent", "lying", "couche", "couché"):
            return round(length_or_height - 0.7, 2), "standing"
        return length_or_height, "standing"


def evaluate_child_anthropometry(
    weight_kg: float | Decimal | None,
    length_height_cm: float | Decimal | None,
    age_days: int,
    sex: Literal["F", "M"],
    muac_mm: float | Decimal | None = None,
    position: str | None = None,
    edema: str | None = None,
    ref_wfl: WHOReferenceRow | None = None,
    ref_lhfa: WHOReferenceRow | None = None,
    ref_wfa: WHOReferenceRow | None = None,
    ref_acfa: WHOReferenceRow | None = None,
    ref_bfa: WHOReferenceRow | None = None,
) -> ChildAnthropometryEvaluation:
    """Compute z-scores across all indicators with edema suppression and extreme vigilance."""
    edema_clean = (edema or "").strip().lower()
    has_edema = edema_clean in ("plus_1", "plus_2", "plus_3", "+", "++", "+++")

    z_wfl: float | None = None
    z_lhfa: float | None = None
    z_wfa: float | None = None
    z_acfa: float | None = None
    z_bfa: float | None = None
    is_extreme = False

    # 1. Length/height for age (unaffected by edema)
    if length_height_cm and ref_lhfa:
        z_lhfa = calculate_lms_zscore(length_height_cm, ref_lhfa)

    # 2. MUAC for age (unaffected by edema)
    if muac_mm and ref_acfa:
        # WHO table is in cm, input in mm
        muac_cm = float(muac_mm) / 10.0
        z_acfa = calculate_lms_zscore(muac_cm, ref_acfa)

    # 3. Weight-based indicators: NEVER interpret if child has bilateral edema
    if not has_edema and weight_kg:
        if ref_wfl:
            z_wfl = calculate_lms_zscore(weight_kg, ref_wfl)
            if abs(z_wfl) > 5.0:
                is_extreme = True

        if ref_wfa:
            z_wfa = calculate_lms_zscore(weight_kg, ref_wfa)

        if ref_bfa and length_height_cm:
            h_m = float(length_height_cm) / 100.0
            if h_m > 0:
                bmi = float(weight_kg) / (h_m * h_m)
                z_bfa = calculate_lms_zscore(bmi, ref_bfa)

    return ChildAnthropometryEvaluation(
        z_weight_for_length=z_wfl,
        z_length_for_age=z_lhfa,
        z_weight_for_age=z_wfa,
        z_muac_for_age=z_acfa,
        z_bmi_for_age=z_bfa,
        edema_flag=has_edema,
        is_extreme=is_extreme,
    )


def calculate_daily_weight_gain(
    weight_earlier_kg: Decimal,
    date_earlier: datetime,
    weight_later_kg: Decimal,
    date_later: datetime,
) -> Decimal | None:
    """Calculate weight velocity in g/kg/day between two clinical evaluations."""
    from datetime import UTC

    d1 = date_earlier if date_earlier.tzinfo is not None else date_earlier.replace(tzinfo=UTC)
    d2 = date_later if date_later.tzinfo is not None else date_later.replace(tzinfo=UTC)
    delta_days = Decimal(str((d2 - d1).total_seconds())) / Decimal("86400")
    if delta_days <= 0 or weight_earlier_kg <= 0:
        return None

    weight_diff_g = (weight_later_kg - weight_earlier_kg) * Decimal("1000")
    velocity = weight_diff_g / (weight_earlier_kg * delta_days)
    return round(velocity, 2)


def propose_nutritional_status(
    z_wfl: Decimal | float | None,
    muac_mm: Decimal | float | None,
    edema: str | None,
) -> NutritionalStatusProposal:
    """Propose clinical categorization (SAM / MAM / Normal) without ever imposing it."""
    edema_clean = (edema or "").strip().lower()
    has_edema = edema_clean in ("plus_1", "plus_2", "plus_3", "+", "++", "+++")

    if has_edema:
        return NutritionalStatusProposal(
            classification="MAS",
            criteria="Présence d'œdèmes bilatéraux (critère direct de malnutrition aiguë sévère)",
        )

    z_val = float(z_wfl) if z_wfl is not None else None
    muac_val = float(muac_mm) if muac_mm is not None else None

    # MAS criteria: WHZ < -3 OR MUAC < 115 mm
    if (z_val is not None and z_val < -3.0) or (muac_val is not None and muac_val < 115.0):
        reasons = []
        if z_val is not None and z_val < -3.0:
            reasons.append("Poids-pour-taille < -3 Z-score")
        if muac_val is not None and muac_val < 115.0:
            reasons.append("Périmètre brachial < 115 mm")
        return NutritionalStatusProposal(classification="MAS", criteria=" et ".join(reasons))

    # MAM criteria: -3 <= WHZ < -2 OR 115 <= MUAC < 125 mm
    if (z_val is not None and -3.0 <= z_val < -2.0) or (
        muac_val is not None and 115.0 <= muac_val < 125.0
    ):
        reasons = []
        if z_val is not None and -3.0 <= z_val < -2.0:
            reasons.append("Poids-pour-taille entre -3 et -2 Z-score")
        if muac_val is not None and 115.0 <= muac_val < 125.0:
            reasons.append("Périmètre brachial entre 115 et 125 mm")
        return NutritionalStatusProposal(classification="MAM", criteria=" et ".join(reasons))

    return NutritionalStatusProposal(
        classification="normal",
        criteria="Valeurs anthropométriques dans les seuils normaux",
    )
