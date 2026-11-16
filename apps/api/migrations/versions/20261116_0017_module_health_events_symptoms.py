"""Module Sante et Bien-etre de l'Enfant : tables et referentiel des symptomes.

Revision ID: 20261116_0017_module_health_events_symptoms
Revises: 20261116_0016_migration_existing_accounts
Create Date: 2026-11-16 12:00:00.000000
"""

from __future__ import annotations

from datetime import UTC, datetime
import json

from alembic import op
import sqlalchemy as sa

revision: str = "20261116_0017_module_health_events_symptoms"
down_revision: str | None = "20261116_0016_migration_existing_accounts"
branch_labels: tuple[str, ...] | None = None
depends_on: tuple[str, ...] | None = None

INITIAL_SYMPTOMS = [
    # Danger Signs (Immediate Alert)
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
    # Common Clinical Symptoms
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


def upgrade() -> None:
    uuid_type = sa.BINARY(16).with_variant(sa.String(36), "sqlite")
    now = datetime.now(UTC)

    # 1. symptom_catalog table
    op.create_table(
        "symptom_catalog",
        sa.Column("code", sa.String(50), primary_key=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("label_fr", sa.String(150), nullable=False),
        sa.Column("label_en", sa.String(150), nullable=False),
        sa.Column("is_danger_sign", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("conditional_questions", sa.JSON(), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_symptom_catalog_category", "symptom_catalog", ["category"])
    op.create_index("ix_symptom_catalog_danger", "symptom_catalog", ["is_danger_sign"])

    # 2. health_events table
    op.create_table(
        "health_events",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("person_id", uuid_type, sa.ForeignKey("persons.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("reported_by", uuid_type, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("intake_id", uuid_type, sa.ForeignKey("intakes.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("declaration_context", sa.String(30), server_default="standalone", nullable=False),
        sa.Column("status", sa.String(30), server_default="submitted", nullable=False),
        sa.Column("priority", sa.String(20), server_default="normal", nullable=False),
        sa.Column("comment", sa.String(1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_health_events_person_created", "health_events", ["person_id", "created_at"])
    op.create_index("ix_health_events_org_status", "health_events", ["organization_id", "status"])
    op.create_index("ix_health_events_priority", "health_events", ["priority"])

    # 3. health_event_symptoms table
    op.create_table(
        "health_event_symptoms",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("health_event_id", uuid_type, sa.ForeignKey("health_events.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("symptom_code", sa.String(50), sa.ForeignKey("symptom_catalog.code", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("duration", sa.String(30), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=True),
        sa.Column("recurrence_count", sa.Integer(), nullable=True),
        sa.Column("specific_metrics", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_event_symptoms_event", "health_event_symptoms", ["health_event_id"])
    op.create_index("ix_event_symptoms_code", "health_event_symptoms", ["symptom_code"])

    # 4. clinical_assessments table
    op.create_table(
        "clinical_assessments",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("health_event_id", uuid_type, sa.ForeignKey("health_events.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("caregiver_id", uuid_type, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("clinical_notes", sa.String(2000), nullable=False),
        sa.Column("suspected_condition", sa.String(100), nullable=True),
        sa.Column("requires_investigation", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("investigation_type", sa.String(100), nullable=True),
        sa.Column("assessed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_assessments_event", "clinical_assessments", ["health_event_id"])

    # 5. health_event_actions table
    op.create_table(
        "health_event_actions",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("health_event_id", uuid_type, sa.ForeignKey("health_events.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("actor_id", uuid_type, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column("details", sa.String(1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_actions_event", "health_event_actions", ["health_event_id"])

    # 6. Seed official symptom catalog
    bind = op.get_bind()
    symptom_table = sa.table(
        "symptom_catalog",
        sa.column("code", sa.String),
        sa.column("category", sa.String),
        sa.column("label_fr", sa.String),
        sa.column("label_en", sa.String),
        sa.column("is_danger_sign", sa.Boolean),
        sa.column("conditional_questions", sa.JSON),
        sa.column("display_order", sa.Integer),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime),
    )

    seed_data = [
        {
            "code": s["code"],
            "category": s["category"],
            "label_fr": s["label_fr"],
            "label_en": s["label_en"],
            "is_danger_sign": s["is_danger_sign"],
            "conditional_questions": json.dumps(s["conditional_questions"]) if bind.dialect.name == "sqlite" else s["conditional_questions"],
            "display_order": s["display_order"],
            "is_active": True,
            "created_at": now,
        }
        for s in INITIAL_SYMPTOMS
    ]
    op.bulk_insert(symptom_table, seed_data)


def downgrade() -> None:
    op.drop_table("health_event_actions")
    op.drop_table("clinical_assessments")
    op.drop_table("health_event_symptoms")
    op.drop_table("health_events")
    op.drop_table("symptom_catalog")

