"""Domain H: Price records table migration.

Revision ID: 20261106_0008_domain_h_pricing
Revises: 20261106_0007_domain_c_persons_consents_audit
Create Date: 2026-11-06 13:10:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261106_0008_domain_h_pricing"
down_revision = "20261106_0007_domain_c_persons_consents_audit"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "price_records",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column("region_id", sa.BINARY(16), sa.ForeignKey("regions.id"), nullable=False),
        sa.Column("item_type", sa.String(20), nullable=False),  # 'food' or 'product'
        sa.Column("food_id", sa.BINARY(16), sa.ForeignKey("foods.id", ondelete="CASCADE"), nullable=True),
        sa.Column("product_id", sa.BINARY(16), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=True),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(10), server_default="FCFA", nullable=False),
        sa.Column("unit", sa.String(50), nullable=False),
        sa.Column("observed_at", sa.Date(), nullable=False),
        sa.Column("source", sa.String(255), nullable=False),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("entered_by", sa.BINARY(16), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_price_records_region_id", "price_records", ["region_id"])
    op.create_index("ix_price_records_food_id", "price_records", ["food_id"])
    op.create_index("ix_price_records_product_id", "price_records", ["product_id"])
    op.create_index(
        "ix_price_records_lookup",
        "price_records",
        ["region_id", "item_type", "food_id", "product_id", "observed_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_price_records_lookup", table_name="price_records")
    op.drop_index("ix_price_records_product_id", table_name="price_records")
    op.drop_index("ix_price_records_food_id", table_name="price_records")
    op.drop_index("ix_price_records_region_id", table_name="price_records")
    op.drop_table("price_records")

