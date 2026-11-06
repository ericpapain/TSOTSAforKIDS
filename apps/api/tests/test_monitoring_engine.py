"""Tests for Domain Monitoring pure calculation engine and priority ordering."""

from __future__ import annotations

from decimal import Decimal

from tsotsa_api.modules.monitoring.engine import (
    evaluate_edema_rule,
    evaluate_insufficient_weight_gain_rule,
    evaluate_late_evaluation_rule,
    evaluate_reminders_disabled_rule,
    evaluate_severe_zone_rule,
    evaluate_unconfirmed_intakes_rule,
    evaluate_weight_loss_rule,
    get_priority_rank,
)


def test_evaluate_unconfirmed_intakes_rule() -> None:
    params = {"threshold_count": 3, "period_days": 2}

    trig, msg, det = evaluate_unconfirmed_intakes_rule(params, refused_count=3)
    assert trig is True
    assert "3 prises refusées" in msg
    assert det["refused_count"] == 3

    trig, _, _ = evaluate_unconfirmed_intakes_rule(params, refused_count=2)
    assert trig is False


def test_evaluate_insufficient_weight_gain_rule() -> None:
    params = {"threshold_g_kg_day": 5.0}

    # Insufficient gain (velocity 3.5 < 5.0)
    trig, msg, det = evaluate_insufficient_weight_gain_rule(
        params, weight_gain_velocity=Decimal("3.5"), edema="none"
    )
    assert trig is True
    assert "3.5 g/kg/j < 5.0 g/kg/j" in msg
    assert det["velocity_g_kg_day"] == 3.5

    # Sufficient gain (velocity 6.0 >= 5.0)
    trig, _, _ = evaluate_insufficient_weight_gain_rule(
        params, weight_gain_velocity=Decimal("6.0"), edema="none"
    )
    assert trig is False

    # Negative velocity is weight loss, not insufficient gain
    trig, _, _ = evaluate_insufficient_weight_gain_rule(
        params, weight_gain_velocity=Decimal("-1.0"), edema="none"
    )
    assert trig is False

    # Suppressed if edema present
    trig, _, _ = evaluate_insufficient_weight_gain_rule(
        params, weight_gain_velocity=Decimal("2.0"), edema="plus_1"
    )
    assert trig is False

    # No velocity computed (first consultation)
    trig, _, _ = evaluate_insufficient_weight_gain_rule(
        params, weight_gain_velocity=None, edema="none"
    )
    assert trig is False


def test_evaluate_weight_loss_rule() -> None:
    params = {"threshold_g_kg_day": 0.0}

    # Weight loss (velocity -2.5 < 0.0)
    trig, msg, det = evaluate_weight_loss_rule(
        params, weight_gain_velocity=Decimal("-2.5"), edema="none"
    )
    assert trig is True
    assert "-2.5 g/kg/j" in msg
    assert det["velocity_g_kg_day"] == -2.5

    # Positive gain
    trig, _, _ = evaluate_weight_loss_rule(
        params, weight_gain_velocity=Decimal("4.0"), edema="none"
    )
    assert trig is False

    # Suppressed by edema
    trig, _, _ = evaluate_weight_loss_rule(params, weight_gain_velocity=Decimal("-1.5"), edema="+")
    assert trig is False


def test_evaluate_severe_zone_rule() -> None:
    params = {"whz_threshold": -3.0, "muac_threshold_mm": 115.0}

    # Triggered by classification MAS
    trig, msg, _ = evaluate_severe_zone_rule(
        params, proposed_status="MAS", scores=[], muac_mm=Decimal("128.0")
    )
    assert trig is True
    assert "malnutrition aiguë sévère" in msg

    # Triggered by low MUAC (< 115 mm)
    trig, _, det = evaluate_severe_zone_rule(
        params, proposed_status="normal", scores=[], muac_mm=Decimal("112.0")
    )
    assert trig is True
    assert det["muac_mm"] == 112.0

    # Triggered by low z-score (WHZ < -3.0)
    trig, _, det = evaluate_severe_zone_rule(
        params,
        proposed_status="MAM",
        scores=[{"indicator": "wfl", "z_score": Decimal("-3.25")}],
        muac_mm=Decimal("120.0"),
    )
    assert trig is True
    assert det["worst_z_score"] == -3.25

    # Normal scores
    trig, _, _ = evaluate_severe_zone_rule(
        params,
        proposed_status="normal",
        scores=[{"indicator": "wfl", "z_score": Decimal("-1.10")}],
        muac_mm=Decimal("130.0"),
    )
    assert trig is False


def test_evaluate_edema_rule() -> None:
    params = {"trigger_on_edema": True}

    # Positive edema
    trig, msg, det = evaluate_edema_rule(params, edema="plus_2")
    assert trig is True
    assert "plus_2" in msg
    assert det["edema"] == "plus_2"

    trig, _, _ = evaluate_edema_rule(params, edema="+")
    assert trig is True

    # No edema
    trig, _, _ = evaluate_edema_rule(params, edema="none")
    assert trig is False
    trig, _, _ = evaluate_edema_rule(params, edema=None)
    assert trig is False


def test_evaluate_late_evaluation_rule() -> None:
    params = {"max_days_since_eval": 14}

    # Late (20 days > 14)
    trig, msg, det = evaluate_late_evaluation_rule(params, days_since_last_evaluation=20)
    assert trig is True
    assert "20 jours écoulés" in msg
    assert det["days_since_last_evaluation"] == 20

    # On time (10 days <= 14)
    trig, _, _ = evaluate_late_evaluation_rule(params, days_since_last_evaluation=10)
    assert trig is False

    # None
    trig, _, _ = evaluate_late_evaluation_rule(params, days_since_last_evaluation=None)
    assert trig is False


def test_evaluate_reminders_disabled_rule() -> None:
    params = {"require_reminders": True}

    trig, msg, _ = evaluate_reminders_disabled_rule(params, reminders_enabled=False)
    assert trig is True
    assert "Rappels et notifications désactivés" in msg

    trig, _, _ = evaluate_reminders_disabled_rule(params, reminders_enabled=True)
    assert trig is False

    trig, _, _ = evaluate_reminders_disabled_rule(params, reminders_enabled=None)
    assert trig is False


def test_priority_ranking_order() -> None:
    assert get_priority_rank("urgent") == 1
    assert get_priority_rank("high") == 2
    assert get_priority_rank("normal") == 3
    assert get_priority_rank("unknown") == 4

    priorities = ["normal", "urgent", "high", "normal"]
    sorted_p = sorted(priorities, key=get_priority_rank)
    assert sorted_p == ["urgent", "high", "normal", "normal"]
