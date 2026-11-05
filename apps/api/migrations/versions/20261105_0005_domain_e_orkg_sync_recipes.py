"""Domain E ORKG synchronization and recipes migration.

Revision ID: 20261105_0005
Revises: 20261105_0004
Create Date: 2026-11-05 23:05:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261105_0005"
down_revision: str | None = "20261105_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create recipes, recipe_ingredients, orkg_comparisons, and orkg_snapshots tables."""
    uuid_type = sa.BINARY(16)

    # 1. recipes
    op.create_table(
        "recipes",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "dish_food_id",
            uuid_type,
            sa.ForeignKey("foods.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("region_id", uuid_type, sa.ForeignKey("regions.id"), nullable=True),
        sa.Column("source_id", uuid_type, sa.ForeignKey("sources.id"), nullable=True),
        sa.Column("batch_id", uuid_type, sa.ForeignKey("import_batches.id"), nullable=True),
        sa.Column("status", sa.String(30), server_default="to_review", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("is_current", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 2. recipe_ingredients
    op.create_table(
        "recipe_ingredients",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "recipe_id",
            uuid_type,
            sa.ForeignKey("recipes.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "ingredient_food_id",
            uuid_type,
            sa.ForeignKey("foods.id"),
            nullable=False,
        ),
        sa.Column("proportion_pct", sa.Numeric(12, 4), nullable=False),
        sa.Column("importance", sa.String(30), nullable=True),
        sa.Column("position", sa.Integer(), server_default="1", nullable=False),
    )

    # 3. orkg_comparisons
    op.create_table(
        "orkg_comparisons",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("comparison_id", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("nutrient_id", uuid_type, sa.ForeignKey("nutrients.id"), nullable=True),
        sa.Column("nutrient_label", sa.String(100), nullable=True),
        sa.Column("region_id", uuid_type, sa.ForeignKey("regions.id"), nullable=True),
        sa.Column("region_label", sa.String(100), nullable=True),
        sa.Column("basis", sa.String(100), nullable=True),
        sa.Column("status", sa.String(30), server_default="active", nullable=False),
        sa.Column("replaced_by", sa.String(50), nullable=True),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 4. orkg_snapshots
    op.create_table(
        "orkg_snapshots",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("comparison_id", sa.String(50), nullable=False, index=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("method", sa.String(30), nullable=False),
        sa.Column("checksum", sa.String(64), nullable=False),
        sa.Column("raw_file", sa.String(500), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("batch_id", uuid_type, sa.ForeignKey("import_batches.id"), nullable=True),
        sa.Column("alert_message", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    """Drop Domain E ORKG sync and recipes tables."""
    op.drop_table("orkg_snapshots")
    op.drop_table("orkg_comparisons")
    op.drop_table("recipe_ingredients")
    op.drop_table("recipes")

