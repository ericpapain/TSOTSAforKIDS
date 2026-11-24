#!/usr/bin/env python3
"""Seed standard WHO IMCI symptoms and danger signs into MySQL symptom_catalog."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import json
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from tsotsa_api.core.config import get_settings

SYMPTOMS = [
    {
        "code": "convulsions",
        "category": "danger_sign",
        "label_fr": "Convulsions ou spasmes",
        "label_en": "Convulsions or spasms",
        "is_danger_sign": True,
        "display_order": 1,
        "conditional_questions": [
            {"key": "episodes_count", "label_fr": "Combien de crises ont eu lieu ?", "type": "number"},
            {"key": "last_episode", "label_fr": "Quand a eu lieu la dernière crise ?", "type": "text"},
        ],
    },
    {
        "code": "unconscious_lethargic",
        "category": "danger_sign",
        "label_fr": "Inconscient ou anormalement somnolent / difficile à réveiller",
        "label_en": "Unconscious or abnormally sleepy / hard to wake up",
        "is_danger_sign": True,
        "display_order": 2,
        "conditional_questions": [
            {"key": "responds_to_voice", "label_fr": "Réagit-il quand vous lui parlez ?", "type": "boolean"},
        ],
    },
    {
        "code": "unable_drink_breastfeed",
        "category": "danger_sign",
        "label_fr": "Incapable de boire ou de téter",
        "label_en": "Unable to drink or breastfeed",
        "is_danger_sign": True,
        "display_order": 3,
        "conditional_questions": [],
    },
    {
        "code": "vomits_everything",
        "category": "danger_sign",
        "label_fr": "Vomit tout ce qu'il avale (incapable de garder liquide ou nourriture)",
        "label_en": "Vomits everything (cannot keep liquids or food down)",
        "is_danger_sign": True,
        "display_order": 4,
        "conditional_questions": [
            {"key": "last_kept_intake", "label_fr": "Quand a-t-il réussi à boire ou manger la dernière fois ?", "type": "text"},
        ],
    },
    {
        "code": "severe_respiratory_distress",
        "category": "danger_sign",
        "label_fr": "Difficulté respiratoire importante (tirage sous-costal, geignement)",
        "label_en": "Severe respiratory distress (chest indrawing, grunting)",
        "is_danger_sign": True,
        "display_order": 5,
        "conditional_questions": [],
    },
    {
        "code": "fever",
        "category": "general",
        "label_fr": "Il semble avoir chaud ou avoir de la fièvre",
        "label_en": "Seems hot or has a fever",
        "is_danger_sign": False,
        "display_order": 10,
        "conditional_questions": [
            {"key": "temp_measured", "label_fr": "Avez-vous mesuré la température ?", "type": "boolean"},
            {"key": "temp_value", "label_fr": "Quelle température (°C) ?", "type": "number"},
            {"key": "temp_time", "label_fr": "À quelle heure ?", "type": "text"},
        ],
    },
    {
        "code": "cough",
        "category": "respiratory",
        "label_fr": "Il tousse",
        "label_en": "Coughing",
        "is_danger_sign": False,
        "display_order": 11,
        "conditional_questions": [
            {"key": "cough_duration_days", "label_fr": "Depuis combien de jours exactement ?", "type": "number"},
            {"key": "rapid_breathing", "label_fr": "Sa respiration vous paraît-elle plus rapide que d'habitude ?", "type": "boolean"},
            {"key": "contact_tuberculosis", "label_fr": "A-t-il été en contact avec une personne qui tousse depuis longtemps ?", "type": "boolean"},
        ],
    },
    {
        "code": "rapid_breathing",
        "category": "respiratory",
        "label_fr": "Il respire difficilement ou rapidement",
        "label_en": "Breathing difficult or rapid",
        "is_danger_sign": False,
        "display_order": 12,
        "conditional_questions": [
            {"key": "breathing_difficulty_eating", "label_fr": "A-t-il du mal à manger à cause de sa respiration ?", "type": "boolean"},
        ],
    },
    {
        "code": "diarrhea",
        "category": "digestive",
        "label_fr": "Il a des selles liquides (diarrhée)",
        "label_en": "Watery stools (diarrhea)",
        "is_danger_sign": False,
        "display_order": 13,
        "conditional_questions": [
            {"key": "stools_today_count", "label_fr": "Combien de selles liquides aujourd'hui ?", "type": "number"},
            {"key": "blood_in_stool", "label_fr": "Avez-vous observé du sang dans les selles ?", "type": "boolean"},
            {"key": "can_drink", "label_fr": "L'enfant arrive-t-il à boire ?", "type": "boolean"},
        ],
    },
    {
        "code": "vomiting",
        "category": "digestive",
        "label_fr": "Il vomit",
        "label_en": "Vomiting",
        "is_danger_sign": False,
        "display_order": 14,
        "conditional_questions": [
            {"key": "vomiting_frequency", "label_fr": "Combien de fois a-t-il vomi aujourd'hui ?", "type": "number"},
            {"key": "after_meal", "label_fr": "Est-ce survenu immédiatement après un repas ?", "type": "boolean"},
        ],
    },
    {
        "code": "reduced_eating",
        "category": "digestive",
        "label_fr": "Il mange moins que d'habitude",
        "label_en": "Eating less than usual",
        "is_danger_sign": False,
        "display_order": 15,
        "conditional_questions": [
            {"key": "refuses_meals", "label_fr": "Refuse-t-il complètement certains repas ?", "type": "boolean"},
        ],
    },
    {
        "code": "reduced_drinking",
        "category": "digestive",
        "label_fr": "Il boit moins que d'habitude",
        "label_en": "Drinking less than usual",
        "is_danger_sign": False,
        "display_order": 16,
        "conditional_questions": [],
    },
    {
        "code": "fatigue",
        "category": "general",
        "label_fr": "Il semble très fatigué ou manque d'énergie",
        "label_en": "Seems very tired or lacks energy",
        "is_danger_sign": False,
        "display_order": 17,
        "conditional_questions": [],
    },
    {
        "code": "excessive_sleep",
        "category": "general",
        "label_fr": "Il dort plus que d'habitude",
        "label_en": "Sleeping more than usual",
        "is_danger_sign": False,
        "display_order": 18,
        "conditional_questions": [],
    },
    {
        "code": "red_eyes",
        "category": "general",
        "label_fr": "Ses yeux sont rouges",
        "label_en": "Red eyes",
        "is_danger_sign": False,
        "display_order": 19,
        "conditional_questions": [
            {"key": "has_rash", "label_fr": "A-t-il aussi des boutons sur le corps ?", "type": "boolean"},
        ],
    },
    {
        "code": "runny_nose",
        "category": "respiratory",
        "label_fr": "Son nez coule",
        "label_en": "Runny nose",
        "is_danger_sign": False,
        "display_order": 20,
        "conditional_questions": [],
    },
    {
        "code": "skin_rash",
        "category": "skin",
        "label_fr": "Des boutons ou une éruption sont apparus sur son corps",
        "label_en": "Spots or a rash appeared on body",
        "is_danger_sign": False,
        "display_order": 21,
        "conditional_questions": [
            {"key": "appearance_date", "label_fr": "Quand les boutons sont-ils apparus ?", "type": "text"},
            {"key": "has_fever_too", "label_fr": "A-t-il également de la fièvre ?", "type": "boolean"},
        ],
    },
    {
        "code": "localized_pain",
        "category": "pain",
        "label_fr": "Il semble avoir mal à une partie du corps (ventre, oreille...)",
        "label_en": "Seems in pain in a body part (belly, ear...)",
        "is_danger_sign": False,
        "display_order": 22,
        "conditional_questions": [
            {"key": "body_part", "label_fr": "Quelle partie du corps ?", "type": "text"},
            {"key": "ear_discharge", "label_fr": "Y a-t-il un écoulement au niveau de l'oreille ?", "type": "boolean"},
        ],
    },
    {
        "code": "other_change",
        "category": "general",
        "label_fr": "Il présente un autre changement",
        "label_en": "Other observed change",
        "is_danger_sign": False,
        "display_order": 30,
        "conditional_questions": [
            {"key": "details_text", "label_fr": "Précisez le changement observé :", "type": "text"},
        ],
    },
]


async def seed_symptom_catalog() -> None:
    """Insert or update symptom catalog items into MySQL."""
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    now = datetime.now(UTC)

    async with engine.begin() as conn:
        for sym in SYMPTOMS:
            questions_json = json.dumps(sym["conditional_questions"])
            stmt = text(
                """
                INSERT INTO symptom_catalog (
                    code, category, label_fr, label_en,
                    is_danger_sign, conditional_questions,
                    display_order, is_active, created_at
                ) VALUES (
                    :code, :category, :label_fr, :label_en,
                    :is_danger_sign, :conditional_questions,
                    :display_order, 1, :created_at
                )
                ON DUPLICATE KEY UPDATE
                    category = VALUES(category),
                    label_fr = VALUES(label_fr),
                    label_en = VALUES(label_en),
                    is_danger_sign = VALUES(is_danger_sign),
                    conditional_questions = VALUES(conditional_questions),
                    display_order = VALUES(display_order),
                    is_active = 1
                """
            )
            await conn.execute(
                stmt,
                {
                    "code": sym["code"],
                    "category": sym["category"],
                    "label_fr": sym["label_fr"],
                    "label_en": sym["label_en"],
                    "is_danger_sign": 1 if sym["is_danger_sign"] else 0,
                    "conditional_questions": questions_json,
                    "display_order": sym["display_order"],
                    "created_at": now,
                },
            )

    await engine.dispose()
    print(f"Successfully seeded {len(SYMPTOMS)} symptoms into symptom_catalog.")


if __name__ == "__main__":
    asyncio.run(seed_symptom_catalog())
