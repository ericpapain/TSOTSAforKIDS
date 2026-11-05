"""Domain F (Products) and Domain L (Audit log) migration.

Revision ID: 20261105_0004
Revises: 20261105_0003
Create Date: 2026-11-05 22:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261105_0004"
down_revision: str | None = "20261105_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create Domain F and Domain L tables."""
    uuid_type = sa.BINARY(16)

    # 1. products
    op.create_table(
        "products",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("type", sa.String(30), nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False, index=True),
        sa.Column("base", sa.String(20), server_default="100g", nullable=False),
        sa.Column("usage", sa.String(30), nullable=True),
        sa.Column("owner_user_id", uuid_type, sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("status", sa.String(30), nullable=False, index=True),
        sa.Column("source_id", uuid_type, sa.ForeignKey("sources.id"), nullable=True),
        sa.Column("source_reference", sa.String(500), nullable=True),
        sa.Column("unit_label", sa.String(50), nullable=True),
        sa.Column("label_photo_file", sa.String(255), nullable=True),
        sa.Column("created_by", uuid_type, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("validated_by", uuid_type, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 2. product_nutrient_values
    op.create_table(
        "product_nutrient_values",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "product_id",
            uuid_type,
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("nutrient_id", uuid_type, sa.ForeignKey("nutrients.id"), nullable=False),
        sa.Column("nutrient_code", sa.String(50), nullable=False),
        sa.Column("nutrient_name", sa.String(150), nullable=False),
        sa.Column("reference_unit", sa.String(20), nullable=False),
        sa.Column("value_min", sa.Numeric(12, 4), nullable=False),
        sa.Column("value_max", sa.Numeric(12, 4), nullable=True),
        sa.Column("source_id", uuid_type, sa.ForeignKey("sources.id"), nullable=True),
    )

    # 3. product_essential_nutrients
    op.create_table(
        "product_essential_nutrients",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "product_id",
            uuid_type,
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("nutrient_id", uuid_type, sa.ForeignKey("nutrients.id"), nullable=False),
        sa.Column("nutrient_code", sa.String(50), nullable=False),
    )

    # 4. audit_log (Domain L)
    op.create_table(
        "audit_log",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("actor_user_id", uuid_type, sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("entity", sa.String(50), nullable=False, index=True),
        sa.Column("entity_id", uuid_type, nullable=False, index=True),
        sa.Column("organization_id", uuid_type, nullable=True),
        sa.Column("at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip", sa.String(50), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    """Drop Domain F and Domain L tables."""
    op.drop_table("audit_log")
    op.drop_table("product_essential_nutrients")
    op.drop_table("product_nutrient_values")
    op.drop_table("products")

