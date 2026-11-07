"""Domain D (Nutrients) and Domain E (Food database) migration.

Revision ID: 20261105_0003
Revises: 20261105_0002
Create Date: 2026-11-05 21:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261105_0003"
down_revision: str | None = "20261105_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create Domain D and Domain E tables."""
    uuid_type = sa.BINARY(16)

    # 1. units
    op.create_table(
        "units",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("code", sa.String(20), nullable=False, unique=True, index=True),
        sa.Column("kind", sa.String(30), nullable=False),
        sa.Column("name", sa.String(100), nullable=True),
    )

    # 2. unit_conversions
    op.create_table(
        "unit_conversions",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("from_unit_id", uuid_type, sa.ForeignKey("units.id", ondelete="CASCADE"), nullable=False),
        sa.Column("to_unit_id", uuid_type, sa.ForeignKey("units.id", ondelete="CASCADE"), nullable=False),
        sa.Column("factor", sa.Numeric(18, 8), nullable=False),
        sa.UniqueConstraint("from_unit_id", "to_unit_id", name="uq_unit_conversion_pair"),
    )

    # 3. nutrients
    op.create_table(
        "nutrients",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("name_fr", sa.String(150), nullable=False),
        sa.Column("name_en", sa.String(150), nullable=True),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("reference_unit_id", uuid_type, sa.ForeignKey("units.id"), nullable=False),
        sa.Column("plausible_min", sa.Numeric(12, 4), nullable=True),
        sa.Column("plausible_max", sa.Numeric(12, 4), nullable=True),
        sa.Column("is_tracked", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 4. nutrient_synonyms
    op.create_table(
        "nutrient_synonyms",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("nutrient_id", uuid_type, sa.ForeignKey("nutrients.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(150), nullable=False, index=True),
    )

    # 5. regions (Domain B subset)
    op.create_table(
        "regions",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("country_code", sa.String(10), server_default="CMR", nullable=False),
    )

    # 6. food_categories
    op.create_table(
        "food_categories",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(100), nullable=False),
    )

    # 7. food_groups
    op.create_table(
        "food_groups",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(100), nullable=False),
    )

    # 8. foods
    op.create_table(
        "foods",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("name", sa.String(200), nullable=False, index=True),
        sa.Column("kind", sa.String(30), server_default="dish", nullable=False),
        sa.Column("scientific_name", sa.String(200), nullable=True),
        sa.Column("category_id", uuid_type, sa.ForeignKey("food_categories.id"), nullable=True),
        sa.Column("food_group_id", uuid_type, sa.ForeignKey("food_groups.id"), nullable=True),
        sa.Column("state", sa.String(50), nullable=True),
        sa.Column("status", sa.String(30), server_default="draft", nullable=False),
        sa.Column("photo_file", sa.String(255), nullable=True),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("is_current", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("root_food_id", uuid_type, nullable=True),
        sa.Column("created_by", uuid_type, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 9. food_names
    op.create_table(
        "food_names",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("food_id", uuid_type, sa.ForeignKey("foods.id", ondelete="CASCADE"), nullable=False),
        sa.Column("language_or_dialect", sa.String(50), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
    )

    # 10. food_regions
    op.create_table(
        "food_regions",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("food_id", uuid_type, sa.ForeignKey("foods.id", ondelete="CASCADE"), nullable=False),
        sa.Column("region_id", uuid_type, sa.ForeignKey("regions.id"), nullable=False),
        sa.Column("availability", sa.String(50), server_default="toute l'année", nullable=False),
        sa.Column("season_months", sa.String(50), nullable=True),
    )

    # 11. sources
    op.create_table(
        "sources",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("orkg_comparison_id", sa.String(50), nullable=True),
        sa.Column("orkg_comparison_version", sa.Integer(), nullable=True),
        sa.Column("orkg_contribution_id", sa.String(50), nullable=True),
        sa.Column("orkg_contribution_label", sa.String(200), nullable=True),
        sa.Column("paper_title", sa.String(300), nullable=True),
        sa.Column("article_reference", sa.String(500), nullable=True),
        sa.Column("doi", sa.String(150), nullable=True),
        sa.Column("url", sa.String(500), nullable=True),
        sa.Column("licence", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 12. import_batches
    op.create_table(
        "import_batches",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("file_type", sa.String(30), nullable=False),
        sa.Column("status", sa.String(30), server_default="draft", nullable=False),
        sa.Column("created_by", uuid_type, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reviewed_by", uuid_type, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("control_report", sa.JSON(), nullable=True),
        sa.Column("column_mapping", sa.JSON(), nullable=True),
        sa.Column("rows_valid", sa.Integer(), server_default="0", nullable=False),
        sa.Column("rows_error", sa.Integer(), server_default="0", nullable=False),
        sa.Column("rows_warning", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 13. import_batch_rows
    op.create_table(
        "import_batch_rows",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("batch_id", uuid_type, sa.ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("row_number", sa.Integer(), nullable=False),
        sa.Column("raw_data", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(30), server_default="valid", nullable=False),
        sa.Column("messages", sa.JSON(), nullable=True),
    )

    # 14. food_nutrient_values
    op.create_table(
        "food_nutrient_values",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("food_id", uuid_type, sa.ForeignKey("foods.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nutrient_id", uuid_type, sa.ForeignKey("nutrients.id"), nullable=False),
        sa.Column("value_per_100g", sa.Numeric(12, 4), nullable=False),
        sa.Column("basis", sa.String(50), server_default="poids frais", nullable=False),
        sa.Column("sample_label", sa.String(50), nullable=True),
        sa.Column("is_estimated", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("source_id", uuid_type, sa.ForeignKey("sources.id"), nullable=True),
        sa.Column("batch_id", uuid_type, sa.ForeignKey("import_batches.id"), nullable=True),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("is_current", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("entered_by", uuid_type, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_by", uuid_type, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_food_nutrient_lookup",
        "food_nutrient_values",
        ["nutrient_id", "is_current", "value_per_100g"],
    )


def downgrade() -> None:
    """Drop Domain D and E tables in reverse order."""
    op.drop_table("food_nutrient_values")
    op.drop_table("import_batch_rows")
    op.drop_table("import_batches")
    op.drop_table("sources")
    op.drop_table("food_regions")
    op.drop_table("food_names")
    op.drop_table("foods")
    op.drop_table("food_groups")
    op.drop_table("food_categories")
    op.drop_table("regions")
    op.drop_table("nutrient_synonyms")
    op.drop_table("nutrients")
    op.drop_table("unit_conversions")
    op.drop_table("units")

