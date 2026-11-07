"""Domain I: Clinical evaluations, scores, and WHO growth references migration.

Revision ID: 20261106_0010_domain_i_clinical_growth
Revises: 20261106_0009_domain_i_intakes
Create Date: 2026-11-06 16:15:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261106_0010_domain_i_clinical_growth"
down_revision = "20261106_0009_domain_i_intakes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Official WHO Growth Standards lookup table
    op.create_table(
        "growth_references",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column("indicator", sa.String(20), nullable=False),  # wfl, wfh, lhfa, wfa, acfa, bfa
        sa.Column("sex", sa.String(1), nullable=False),  # F or M
        sa.Column("x_value", sa.Numeric(8, 2), nullable=False),  # length/height in cm or age in days
        sa.Column("l", sa.Numeric(10, 6), nullable=False),
        sa.Column("m", sa.Numeric(12, 6), nullable=False),
        sa.Column("s", sa.Numeric(10, 6), nullable=False),
        sa.Column("sd4neg", sa.Numeric(10, 4), nullable=True),
        sa.Column("sd3neg", sa.Numeric(10, 4), nullable=False),
        sa.Column("sd2neg", sa.Numeric(10, 4), nullable=False),
        sa.Column("sd1neg", sa.Numeric(10, 4), nullable=True),
        sa.Column("sd0", sa.Numeric(10, 4), nullable=False),
        sa.Column("sd1", sa.Numeric(10, 4), nullable=True),
        sa.Column("sd2", sa.Numeric(10, 4), nullable=False),
        sa.Column("sd3", sa.Numeric(10, 4), nullable=False),
        sa.Column("sd4", sa.Numeric(10, 4), nullable=True),
    )
    op.create_index(
        "ix_growth_ref_lookup",
        "growth_references",
        ["indicator", "sex", "x_value"],
        unique=True,
    )

    # 2. Clinical evaluations recorded by caregivers
    op.create_table(
        "evaluations",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column("person_id", sa.BINARY(16), sa.ForeignKey("persons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_id", sa.BINARY(16), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("caregiver_id", sa.BINARY(16), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("measured_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("weight_kg", sa.Numeric(6, 3), nullable=False),
        sa.Column("length_cm", sa.Numeric(6, 2), nullable=False),
        sa.Column("position", sa.String(20), nullable=False),  # recumbent, standing
        sa.Column("muac_mm", sa.Numeric(6, 1), nullable=True),
        sa.Column("edema", sa.String(20), server_default="none", nullable=False),  # none, plus_1, plus_2, plus_3
        sa.Column("notes", sa.String(500), nullable=True),
        sa.Column("weight_gain_velocity", sa.Numeric(6, 2), nullable=True),  # g/kg/day
        sa.Column("proposed_status", sa.String(20), nullable=True),  # MAS, MAM, normal
        sa.Column("proposed_criteria", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_evaluations_person_date", "evaluations", ["person_id", "measured_at"])
    op.create_index("ix_evaluations_org", "evaluations", ["organization_id"])

    # 3. Z-scores and clinical flags per evaluation
    op.create_table(
        "evaluation_scores",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column("evaluation_id", sa.BINARY(16), sa.ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("indicator", sa.String(20), nullable=False),  # wfl, lhfa, wfa, acfa, bfa
        sa.Column("z_score", sa.Numeric(6, 2), nullable=True),
        sa.Column("flag", sa.String(30), nullable=True),  # extreme, oedema
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_eval_scores_eval_ind", "evaluation_scores", ["evaluation_id", "indicator"])


def downgrade() -> None:
    op.drop_table("evaluation_scores")
    op.drop_table("evaluations")
    op.drop_table("growth_references")

