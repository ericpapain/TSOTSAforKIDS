"""Domain A: Admin extensions (invitations user_id, caregiver verification notes).

Revision ID: 20261106_0013_domain_a_admin_extensions
Revises: 20261106_0012_domain_j_schedules_notifications
Create Date: 2026-11-06 20:30:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20261106_0013_domain_a_admin_extensions"
down_revision = "20261106_0012_domain_j_schedules_notifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    uuid_type = sa.BINARY(16).with_variant(sa.String(36), "sqlite")
    with op.batch_alter_table("invitations") as batch_op:
        batch_op.add_column(
            sa.Column(
                "user_id",
                uuid_type,
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=True,
            )
        )
        batch_op.create_index("ix_invitations_user_id", ["user_id"])

    with op.batch_alter_table("caregiver_profiles") as batch_op:
        batch_op.add_column(
            sa.Column("verification_notes", sa.String(500), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table("caregiver_profiles") as batch_op:
        batch_op.drop_column("verification_notes")

    with op.batch_alter_table("invitations") as batch_op:
        batch_op.drop_index("ix_invitations_user_id")
        batch_op.drop_column("user_id")

