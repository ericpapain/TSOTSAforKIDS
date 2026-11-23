"""Update users table status check constraint to include pending and other domain states.

Revision ID: 20261123_0018_update_users_status_check
Revises: 20261116_0017_module_health_events_symptoms
Create Date: 2026-11-23 12:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision: str = "20261123_0018_update_users_status_check"
down_revision: str | None = "20261116_0017_module_health_events_symptoms"
branch_labels: tuple[str, ...] | None = None
depends_on: tuple[str, ...] | None = None


def upgrade() -> None:
    op.execute(
        sa.text(
            "ALTER TABLE users DROP CHECK ck_users_status, "
            "ADD CONSTRAINT ck_users_status CHECK "
            "(status IN ('pending', 'active', 'refused', 'suspended', 'deleted', 'invited'))"
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            "ALTER TABLE users DROP CHECK ck_users_status, "
            "ADD CONSTRAINT ck_users_status CHECK "
            "(status IN ('active', 'invited', 'suspended'))"
        )
    )
