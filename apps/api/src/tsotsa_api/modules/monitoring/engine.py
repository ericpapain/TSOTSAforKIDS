"""Pure domain logic for alert rule evaluations and priority ranking."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

PRIORITY_RANKS: dict[str, int] = {
    "urgent": 1,
    "high": 2,
    "normal": 3,
}


def get_priority_rank(priority: str) -> int:
    return PRIORITY_RANKS.get(priority.lower(), 4)


def evaluate_unconfirmed_intakes_rule(
    parameters: dict[str, Any],
    refused_count: int,
) -> tuple[bool, str, dict[str, Any]]:
    threshold_count = int(parameters.get("threshold_count", 3))
    period_days = int(parameters.get("period_days", 2))

    if refused_count >= threshold_count:
        msg = (
            f"{refused_count} prises refusées/non confirmées sur les {period_days} derniers jours."
        )
        return (
            True,
            msg,
            {
                "refused_count": refused_count,
                "period_days": period_days,
                "threshold_count": threshold_count,
            },
        )
    return False, "", {}


def evaluate_insufficient_weight_gain_rule(
    parameters: dict[str, Any],
    weight_gain_velocity: Decimal | None,
    edema: str = "none",
) -> tuple[bool, str, dict[str, Any]]:
    if edema not in ("none", "", None):
        return False, "", {}

    if weight_gain_velocity is None:
        return False, "", {}

    threshold = Decimal(str(parameters.get("threshold_g_kg_day", 5.0)))
    if Decimal("0.0") <= weight_gain_velocity < threshold:
        msg = (
            f"Gain de poids insuffisant ({float(weight_gain_velocity):.1f} g/kg/j < "
            f"{float(threshold):.1f} g/kg/j attendus)."
        )
        return (
            True,
            msg,
            {
                "velocity_g_kg_day": float(weight_gain_velocity),
                "threshold_g_kg_day": float(threshold),
            },
        )
    return False, "", {}


def evaluate_weight_loss_rule(
    parameters: dict[str, Any],
    weight_gain_velocity: Decimal | None,
    edema: str = "none",
) -> tuple[bool, str, dict[str, Any]]:
    if edema not in ("none", "", None):
        return False, "", {}

    if weight_gain_velocity is None:
        return False, "", {}

    threshold = Decimal(str(parameters.get("threshold_g_kg_day", 0.0)))
    if weight_gain_velocity < threshold:
        msg = f"Perte de poids détectée ({float(weight_gain_velocity):.1f} g/kg/j)."
        return (
            True,
            msg,
            {
                "velocity_g_kg_day": float(weight_gain_velocity),
                "threshold_g_kg_day": float(threshold),
            },
        )
    return False, "", {}


def evaluate_severe_zone_rule(
    parameters: dict[str, Any],
    proposed_status: str | None,
    scores: list[dict[str, Any]],
    muac_mm: Decimal | None = None,
) -> tuple[bool, str, dict[str, Any]]:
    whz_threshold = Decimal(str(parameters.get("whz_threshold", -3.0)))
    muac_threshold = Decimal(str(parameters.get("muac_threshold_mm", 115.0)))

    is_mas = (proposed_status or "").upper() == "MAS"
    low_muac = muac_mm is not None and muac_mm < muac_threshold

    low_score = False
    worst_z: float | None = None
    for s in scores:
        z = s.get("z_score")
        if z is not None:
            z_dec = Decimal(str(z))
            if z_dec < whz_threshold:
                low_score = True
                if worst_z is None or float(z_dec) < worst_z:
                    worst_z = float(z_dec)

    if is_mas or low_muac or low_score:
        msg = "Passage en zone de malnutrition aiguë sévère (MAS)."
        return (
            True,
            msg,
            {
                "proposed_status": proposed_status,
                "muac_mm": float(muac_mm) if muac_mm is not None else None,
                "worst_z_score": worst_z,
            },
        )
    return False, "", {}


def evaluate_edema_rule(
    parameters: dict[str, Any],
    edema: str | None,
) -> tuple[bool, str, dict[str, Any]]:
    if not edema or edema.lower() in ("none", "aucun", "0"):
        return False, "", {}

    msg = f"Présence d'œdèmes bilatéraux ({edema})."
    return True, msg, {"edema": edema}


def evaluate_late_evaluation_rule(
    parameters: dict[str, Any],
    days_since_last_evaluation: int | None,
) -> tuple[bool, str, dict[str, Any]]:
    if days_since_last_evaluation is None:
        return False, "", {}

    max_days = int(parameters.get("max_days_since_eval", 14))
    if days_since_last_evaluation > max_days:
        msg = (
            f"Évaluation clinique en retard ({days_since_last_evaluation} jours écoulés "
            f"> {max_days} jours max)."
        )
        return (
            True,
            msg,
            {
                "days_since_last_evaluation": days_since_last_evaluation,
                "max_days_allowed": max_days,
            },
        )
    return False, "", {}


def evaluate_reminders_disabled_rule(
    parameters: dict[str, Any],
    reminders_enabled: bool | None,
) -> tuple[bool, str, dict[str, Any]]:
    if reminders_enabled is False:
        msg = "Rappels et notifications désactivés par l'utilisateur."
        return True, msg, {"reminders_enabled": False}
    return False, "", {}
