"""Domain I: Intakes table migration.

Revision ID: 20261106_0009_domain_i_intakes
Revises: 20261106_0008_domain_h_pricing
Create Date: 2026-11-06 13:20:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261106_0009_domain_i_intakes"
down_revision = "20261106_0008_domain_h_pricing"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "intakes",
        sa.Column("id", sa.BINARY(16), primary_key=True),  # Client-generated UUIDv7 or UUIDv4
        sa.Column("person_id", sa.BINARY(16), sa.ForeignKey("persons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("item_type", sa.String(20), nullable=False),  # 'product' or 'food'
        sa.Column("product_id", sa.BINARY(16), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=True),
        sa.Column("food_id", sa.BINARY(16), sa.ForeignKey("foods.id", ondelete="CASCADE"), nullable=True),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit", sa.String(50), nullable=False),  # 'sachet', 'g', 'ml'
        sa.Column("taken_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumption", sa.String(20), nullable=False),  # 'all', 'half', 'refused'
        sa.Column("origin", sa.String(20), server_default="app", nullable=False),  # 'app', 'late'
        sa.Column("schedule_time_id", sa.BINARY(16), nullable=True),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("recorded_by", sa.BINARY(16), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_intakes_person_id", "intakes", ["person_id"])
    op.create_index("ix_intakes_person_taken_at", "intakes", ["person_id", "taken_at"])
    op.create_index("ix_intakes_product_id", "intakes", ["product_id"])
    op.create_index("ix_intakes_food_id", "intakes", ["food_id"])


def downgrade() -> None:
    op.drop_index("ix_intakes_food_id", table_name="intakes")
    op.drop_index("ix_intakes_product_id", table_name="intakes")
    op.drop_index("ix_intakes_person_taken_at", table_name="intakes")
    op.drop_index("ix_intakes_person_id", table_name="intakes")
    op.drop_table("intakes")

