"""Clinical orientation rules for child health events.

Determines priority, flags immediate danger signs, and prepares clinical guidance
following WHO IMCI / PCIME guidelines.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

DANGER_SIGN_CODES = {
    "convulsions",
    "unconscious_lethargic",
    "unable_drink_breastfeed",
    "vomits_everything",
    "severe_respiratory_distress",
    "danger_convulsions",
    "danger_unable_to_drink",
    "danger_vomiting_all",
    "danger_lethargy",
    "danger_respiratory_distress",
}

DANGER_PARENT_MESSAGE = (
    "ATTENTION : Présence d'un signe de danger grave. "
    "Conduisez immédiatement l'enfant au centre de santé ou à l'hôpital le plus proche."
)

NORMAL_PARENT_MESSAGE = (
    "Votre signalement a été enregistré. Continuez à surveiller l'état de votre enfant "
    "et hydratez-le régulièrement. En cas d'aggravation, consultez un soignant."
)

ATTENTION_PARENT_MESSAGE = (
    "Votre signalement a été enregistré. Ces symptômes méritent une surveillance attentive. "
    "Si l'état ne s'améliore pas rapidement, consultez un professionnel de santé."
)

HIGH_PARENT_MESSAGE = (
    "Ces symptômes nécessitent une consultation médicale rapide. "
    "Prenez contact avec votre soignant ou rendez-vous en consultation."
)


@dataclass(frozen=True)
class SymptomInput:
    """Input structure for symptom evaluation in clinical rules."""

    code: str
    duration_days: int | None = None
    recurrence_count: int | None = None
    specific_metrics: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ClinicalEvaluationResult:
    """Outcome of rule-based clinical evaluation."""

    priority: str
    has_danger_sign: bool
    parent_guidance_message: str
    caregiver_guidance_notes: list[str]
    suggested_conditions: list[str]
    requires_urgent_transfer: bool
    malaria_screening_indicated: bool = False
    tb_screening_indicated: bool = False
    rehydration_indicated: bool = False


def _check_danger_signs(symptoms: list[SymptomInput]) -> bool:
    """Check if any reported symptom matches general danger signs."""
    return any(s.code in DANGER_SIGN_CODES for s in symptoms)


def _evaluate_fever(
    symptom: SymptomInput,
    temp: float | None,
) -> tuple[bool, str | None]:
    """Evaluate fever duration and temperature threshold."""
    is_high_temp = temp is not None and temp >= 38.5
    is_prolonged = symptom.duration_days is not None and symptom.duration_days >= 3
    if is_high_temp or is_prolonged:
        note = (
            f"Fièvre {'élevée (' + str(temp) + '°C)' if is_high_temp else ''} "
            f"{'prolongée (' + str(symptom.duration_days) + ' jours)' if is_prolonged else ''} : "
            "recherche paludisme et foyer infectieux recommandée."
        )
        return True, note.strip()
    return False, None


def _evaluate_cough(symptom: SymptomInput) -> tuple[bool, str | None]:
    """Evaluate chronic cough for tuberculosis screening indication."""
    if symptom.duration_days is not None and symptom.duration_days >= 14:
        return True, "Toux persistante >= 14 jours : orientation dépistage tuberculose (PCIME)."
    return False, None


def _evaluate_diarrhea(
    symptom: SymptomInput,
    stools_frequency: int | None,
) -> tuple[str, str | None, bool]:
    """Evaluate diarrhea severity, chronic duration and dehydration risk."""
    has_blood = bool(symptom.specific_metrics.get("has_blood"))
    is_persistent = symptom.duration_days is not None and symptom.duration_days >= 14
    is_frequent = stools_frequency is not None and stools_frequency >= 4

    notes = []
    if is_persistent:
        notes.append("Diarrhée persistante >= 14 jours : risque élevé de dénutrition aiguë.")
    if has_blood:
        notes.append("Présence de sang dans les selles (dysenterie suspectée).")
    if is_frequent:
        notes.append(
            f"Fréquence élevée ({stools_frequency} selles/jour) : réhydratation SRO prioritaire."
        )

    severity = "high" if (is_persistent or has_blood or is_frequent) else "attention"
    combined_note = " ".join(notes) if notes else None
    return severity, combined_note, bool(notes)


def evaluate_child_health_rules(
    symptoms: list[SymptomInput],
    temperature_celsius: float | None = None,
    stools_frequency_per_day: int | None = None,
    vomiting_frequency_per_day: int | None = None,
) -> ClinicalEvaluationResult:
    """Evaluate symptoms against clinical protocols and determine response."""
    has_danger = _check_danger_signs(symptoms)
    if has_danger:
        return ClinicalEvaluationResult(
            priority="urgent",
            has_danger_sign=True,
            parent_guidance_message=DANGER_PARENT_MESSAGE,
            caregiver_guidance_notes=[
                "Signe de danger général identifié : transfert d'urgence requis."
            ],
            suggested_conditions=["DetresseVitalePossible"],
            requires_urgent_transfer=True,
        )

    notes: list[str] = []
    conditions: list[str] = []
    malaria_indicated = False
    tb_indicated = False
    rehydration_indicated = False
    priority = "normal"

    for sym in symptoms:
        if sym.code == "fever":
            indicated, note = _evaluate_fever(sym, temperature_celsius)
            if indicated:
                priority = "high"
                malaria_indicated = True
                conditions.append("PaludismePossible")
                if note:
                    notes.append(note)
            else:
                priority = max(priority, "attention", key=_priority_rank)

        elif sym.code == "cough":
            indicated, note = _evaluate_cough(sym)
            if indicated:
                priority = "high"
                tb_indicated = True
                conditions.append("TuberculosePossible")
                if note:
                    notes.append(note)
            else:
                priority = max(priority, "attention", key=_priority_rank)

        elif sym.code == "diarrhea":
            sev, note, rehyd = _evaluate_diarrhea(sym, stools_frequency_per_day)
            priority = max(priority, sev, key=_priority_rank)
            if rehyd:
                rehydration_indicated = True
            if note:
                notes.append(note)

        elif sym.code in {"edema_feet", "severe_weakness", "refuses_food"}:
            priority = max(priority, "attention", key=_priority_rank)
            notes.append(f"Symptôme nutritionnel ou général d'alerte : {sym.code}.")

    if vomiting_frequency_per_day is not None and vomiting_frequency_per_day >= 4:
        priority = max(priority, "high", key=_priority_rank)
        rehydration_indicated = True
        notes.append(f"Vomissements fréquents ({vomiting_frequency_per_day}/jour).")

    parent_msg = _select_parent_message(priority)

    return ClinicalEvaluationResult(
        priority=priority,
        has_danger_sign=False,
        parent_guidance_message=parent_msg,
        caregiver_guidance_notes=notes,
        suggested_conditions=conditions,
        requires_urgent_transfer=False,
        malaria_screening_indicated=malaria_indicated,
        tb_screening_indicated=tb_indicated,
        rehydration_indicated=rehydration_indicated,
    )


def _priority_rank(p: str) -> int:
    ranks = {"normal": 0, "attention": 1, "high": 2, "urgent": 3}
    return ranks.get(p, 0)


def _select_parent_message(priority: str) -> str:
    if priority == "high":
        return HIGH_PARENT_MESSAGE
    if priority == "attention":
        return ATTENTION_PARENT_MESSAGE
    return NORMAL_PARENT_MESSAGE
