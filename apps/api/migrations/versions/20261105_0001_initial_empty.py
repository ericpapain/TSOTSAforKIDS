"""Initial empty migration (foundation).

Revision ID: 20261105_0001
Revises: None
Create Date: 2026-11-05 14:00:00.000000

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "20261105_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Apply migration operations."""
    pass


def downgrade() -> None:
    """Revert migration operations."""
    pass
