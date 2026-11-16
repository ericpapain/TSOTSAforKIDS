"""Migration des donnees existantes : promotion admin, rattachement soignants et normalisation.

Revision ID: 20261116_0016_migration_existing_accounts
Revises: 20261115_0015_refonte_roles_permissions_facilities
Create Date: 2026-11-16 03:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision: str = "20261116_0016_migration_existing_accounts"
down_revision: str | None = "20261115_0015_refonte_roles_permissions_facilities"
branch_labels: tuple[str, ...] | None = None
depends_on: tuple[str, ...] | None = None

TARGET_ADMIN_EMAIL = "ericpapainmezatio@gmail.com"


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Promote target real user to admin if present in database
    user_row = conn.execute(
        sa.text(
            "SELECT u.id FROM users u "
            "JOIN user_identities ui ON ui.user_id = u.id "
            "WHERE ui.email = :email"
        ),
        {"email": TARGET_ADMIN_EMAIL},
    ).fetchone()

    admin_role = conn.execute(
        sa.text("SELECT id FROM roles WHERE code = 'admin'")
    ).fetchone()

    if user_row and admin_role:
        user_id = user_row[0]
        admin_role_id = admin_role[0]
        # Update user record with active status
        conn.execute(
            sa.text(
                "UPDATE users "
                "SET status = 'active', failed_login_attempts = 0, locked_until = NULL "
                "WHERE id = :id"
            ),
            {"id": user_id},
        )
        # Update or assign admin role
        conn.execute(
            sa.text("DELETE FROM user_roles WHERE user_id = :user_id"),
            {"user_id": user_id},
        )
        conn.execute(
            sa.text(
                "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)"
            ),
            {"user_id": user_id, "role_id": admin_role_id},
        )

    # 2. Normalize users with null status to active
    conn.execute(
        sa.text("UPDATE users SET status = 'active' WHERE status IS NULL")
    )

    # 3. Normalize persons with null status to validated
    conn.execute(
        sa.text("UPDATE persons SET status = 'validated' WHERE status IS NULL")
    )


def downgrade() -> None:
    # Non-destructive downgrade: data modifications are preserved
    pass
