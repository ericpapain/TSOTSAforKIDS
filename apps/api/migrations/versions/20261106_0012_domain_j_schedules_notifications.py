"""Domain J: Intake Schedules and Notifications migration.

Revision ID: 20261106_0012_domain_j_schedules_notifications
Revises: 20261106_0011_domain_i_monitoring_alerts
Create Date: 2026-11-06 18:40:00.000000
"""

from __future__ import annotations

from datetime import UTC, datetime
import uuid

from alembic import op
import sqlalchemy as sa

revision = "20261106_0012_domain_j_schedules_notifications"
down_revision = "20261106_0011_domain_i_monitoring_alerts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Intake Schedules
    op.create_table(
        "intake_schedules",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "person_id",
            sa.BINARY(16),
            sa.ForeignKey("persons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_by",
            sa.BINARY(16),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("product_id", sa.BINARY(16), nullable=True),
        sa.Column("food_id", sa.BINARY(16), nullable=True),
        sa.Column("product_name", sa.String(150), nullable=True),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit", sa.String(30), nullable=False),  # sachet, g, ml
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(20), server_default="active", nullable=False),
        sa.Column("origin", sa.String(30), server_default="manual", nullable=False),
        sa.Column("timezone", sa.String(50), server_default="Africa/Douala", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_intake_schedules_person", "intake_schedules", ["person_id", "status"])

    # 2. Schedule Times
    op.create_table(
        "schedule_times",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "schedule_id",
            sa.BINARY(16),
            sa.ForeignKey("intake_schedules.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("local_time", sa.String(5), nullable=False),  # HH:MM
        sa.Column("days_of_week", sa.JSON(), nullable=True),  # e.g. [1, 2, 3, 4, 5, 6, 7]
        sa.Column("enabled", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.create_index("ix_schedule_times_schedule", "schedule_times", ["schedule_id", "enabled"])

    # 3. Device Tokens
    op.create_table(
        "device_tokens",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "user_id",
            sa.BINARY(16),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("platform", sa.String(20), nullable=False),  # android, ios, web
        sa.Column("expo_push_token", sa.String(255), unique=True, nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_device_tokens_user", "device_tokens", ["user_id"])

    # 4. Notification Templates
    templates_table = op.create_table(
        "notification_templates",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("language", sa.String(10), server_default="fr", nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.String(500), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_notif_templates_type_lang", "notification_templates", ["type", "language"], unique=True)

    # 5. Add quiet hours to notification_preferences
    with op.batch_alter_table("notification_preferences") as batch_op:
        batch_op.add_column(sa.Column("quiet_start", sa.String(5), nullable=True))
        batch_op.add_column(sa.Column("quiet_end", sa.String(5), nullable=True))

    # 6. Notifications Table (with unique dedupe_key)
    op.create_table(
        "notifications",
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
        sa.Column("schedule_id", sa.BINARY(16), nullable=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("channel", sa.String(20), nullable=False),  # push, sms, email, in_app
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.String(500), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), server_default="queued", nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("provider_ticket_id", sa.String(100), nullable=True),
        sa.Column("provider_receipt", sa.JSON(), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("dedupe_key", sa.String(150), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_notifications_scheduled_status", "notifications", ["status", "scheduled_for"])
    op.create_index("ix_notifications_user_in_app", "notifications", ["user_id", "channel", "read_at"])

    # 7. Seed Default Notification Templates
    now = datetime.now(UTC)
    default_templates = [
        {
            "id": uuid.uuid4().bytes,
            "type": "reminder",
            "language": "fr",
            "title": "Rappel de prise pour {first_name}",
            "body": "Il est l'heure de donner la prise de {product_name} ({quantity} {unit}) à {first_name}.",
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "type": "reminder_followup",
            "language": "fr",
            "title": "Relance : prise de {first_name}",
            "body": "La prise de {product_name} prévue à {scheduled_time} n'a pas encore été confirmée.",
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "type": "intake_confirmed",
            "language": "fr",
            "title": "Prise confirmée pour {first_name}",
            "body": "La prise de {product_name} ({quantity} {unit}) a été donnée avec succès.",
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "type": "intake_unconfirmed",
            "language": "fr",
            "title": "Alerte : prise non confirmée pour {first_name}",
            "body": "Aucune prise n'a été enregistrée pour {first_name} suite au rappel de {scheduled_time}.",
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "type": "clinical_alert",
            "language": "fr",
            "title": "Alerte de santé pour {first_name}",
            "body": "{alert_message}",
            "updated_at": now,
        },
        {
            "id": uuid.uuid4().bytes,
            "type": "daily_summary",
            "language": "fr",
            "title": "Résumé quotidien des prises",
            "body": "Bilan de la journée pour {first_name} : {confirmed_count} prises données sur {total_count} prévues.",
            "updated_at": now,
        },
    ]
    op.bulk_insert(templates_table, default_templates)


def downgrade() -> None:
    op.drop_table("notifications")
    with op.batch_alter_table("notification_preferences") as batch_op:
        batch_op.drop_column("quiet_end")
        batch_op.drop_column("quiet_start")
    op.drop_table("notification_templates")
    op.drop_table("device_tokens")
    op.drop_table("schedule_times")
    op.drop_table("intake_schedules")

