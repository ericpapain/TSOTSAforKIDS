"""Domain I/J: Monitoring, Alerts, and Notification Preferences migration.

Revision ID: 20261106_0011_domain_i_monitoring_alerts
Revises: 20261106_0010_domain_i_clinical_growth
Create Date: 2026-11-06 17:00:00.000000
"""

from __future__ import annotations

from datetime import UTC, datetime
import uuid

from alembic import op
import sqlalchemy as sa

revision = "20261106_0011_domain_i_monitoring_alerts"
down_revision = "20261106_0010_domain_i_clinical_growth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Alert rules configured by administration
    alert_rules_table = op.create_table(
        "alert_rules",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("parameters", sa.JSON(), nullable=False),
        sa.Column("priority", sa.String(20), nullable=False),  # urgent, high, normal
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_alert_rules_code", "alert_rules", ["code"])

    # 2. Generated alerts per person and organization
    op.create_table(
        "alerts",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "person_id",
            sa.BINARY(16),
            sa.ForeignKey("persons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "organization_id",
            sa.BINARY(16),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "rule_id",
            sa.BINARY(16),
            sa.ForeignKey("alert_rules.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rule_code", sa.String(50), nullable=False),
        sa.Column("priority", sa.String(20), nullable=False),  # urgent, high, normal
        sa.Column("status", sa.String(20), server_default="open", nullable=False),  # open, handled
        sa.Column("message", sa.String(255), nullable=False),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("handled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "handled_by",
            sa.BINARY(16),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("handling_notes", sa.String(500), nullable=True),
    )
    op.create_index(
        "ix_alerts_org_status_priority",
        "alerts",
        ["organization_id", "status", "priority"],
    )
    op.create_index(
        "ix_alerts_person_rule_status",
        "alerts",
        ["person_id", "rule_code", "status"],
    )
    op.create_index("ix_alerts_opened_at", "alerts", ["opened_at"])

    # 3. Notification preferences (used for reminders_disabled check and Domain J)
    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "user_id",
            sa.BINARY(16),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "person_id",
            sa.BINARY(16),
            sa.ForeignKey("persons.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("notification_type", sa.String(50), nullable=False),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_notif_pref_user_person",
        "notification_preferences",
        ["user_id", "person_id", "notification_type"],
    )

    # 4. Seed default alert rules
    now = datetime.now(UTC)
    default_rules = [
        {
            "id": uuid.uuid4().bytes,
            "code": "unconfirmed_intakes",
            "name": "Prises non confirmées",
            "description": "Prises consécutivement refusées ou non renseignées sur une période donnée.",
            "parameters": {"threshold_count": 3, "period_days": 2},
            "priority": "high",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "code": "insufficient_weight_gain",
            "name": "Gain de poids insuffisant",
            "description": "Vitesse pondérale inférieure au seuil de récupération nutritionnelle.",
            "parameters": {"threshold_g_kg_day": 5.0},
            "priority": "high",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "code": "weight_loss",
            "name": "Perte de poids",
            "description": "Vitesse pondérale négative entre consultations consécutives.",
            "parameters": {"threshold_g_kg_day": 0.0},
            "priority": "urgent",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "code": "severe_zone",
            "name": "Passage en zone sévère",
            "description": "Classification en malnutrition aiguë sévère (MAS), z-score < -3 ou PB < 115 mm.",
            "parameters": {"whz_threshold": -3.0, "muac_threshold_mm": 115.0},
            "priority": "urgent",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "code": "edema",
            "name": "Apparition d'œdèmes",
            "description": "Détection d'œdèmes bilatéraux (+, ++ ou +++).",
            "parameters": {"trigger_on_edema": True},
            "priority": "urgent",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "code": "late_evaluation",
            "name": "Évaluation clinique en retard",
            "description": "Aucune consultation enregistrée depuis plus de 14 jours.",
            "parameters": {"max_days_since_eval": 14},
            "priority": "normal",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "code": "reminders_disabled",
            "name": "Rappels désactivés",
            "description": "Rappels et notifications désactivés par le représentant légal.",
            "parameters": {"require_reminders": True},
            "priority": "normal",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ]
    op.bulk_insert(alert_rules_table, default_rules)


def downgrade() -> None:
    op.drop_table("notification_preferences")
    op.drop_table("alerts")
    op.drop_table("alert_rules")
