"""Domain B & C: organizations, modules, app_settings, persons, person_care.

Revision ID: 20261105_0006
Revises: 20261105_0005
Create Date: 2026-11-05 23:45:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql

revision: str = "20261105_0006"
down_revision: str | None = "20261105_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("preferred_region_id", sa.BINARY(16), nullable=True))
    op.create_index("ix_users_preferred_region_id", "users", ["preferred_region_id"])
    op.create_foreign_key(
        "fk_users_preferred_region",
        "users",
        "regions",
        ["preferred_region_id"],
        ["id"],
    )

    op.create_table(
        "modules",
        sa.Column("code", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="coming_soon"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("updated_by", sa.BINARY(16), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.CheckConstraint(
            "status IN ('active', 'coming_soon', 'disabled')",
            name="ck_modules_status",
        ),
    )

    op.create_table(
        "app_settings",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("updated_by", sa.BINARY(16), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_at", mysql.DATETIME(fsp=3), nullable=False),
    )

    op.create_table(
        "organizations",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("region_id", sa.BINARY(16), sa.ForeignKey("regions.id"), nullable=True),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="active"),
        sa.Column("created_by", sa.BINARY(16), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.Column("updated_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.CheckConstraint(
            "type IN ('hopital', 'cma', 'centre_de_sante', 'ong')",
            name="ck_organizations_type",
        ),
        sa.CheckConstraint(
            "status IN ('active', 'inactive')",
            name="ck_organizations_status",
        ),
    )
    op.create_index("ix_organizations_name", "organizations", ["name"])
    op.create_index("ix_organizations_region_id", "organizations", ["region_id"])

    op.create_table(
        "persons",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column("pseudonym", sa.String(30), nullable=False, unique=True),
        sa.Column("first_name", sa.String(120), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=False),
        sa.Column("sex", sa.String(10), nullable=False),
        sa.Column("region_id", sa.BINARY(16), sa.ForeignKey("regions.id"), nullable=True),
        sa.Column("created_by", sa.BINARY(16), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.Column("updated_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.Column("deleted_at", mysql.DATETIME(fsp=3), nullable=True),
        sa.CheckConstraint("sex IN ('M', 'F')", name="ck_persons_sex"),
    )
    op.create_index("ix_persons_pseudonym", "persons", ["pseudonym"])
    op.create_index("ix_persons_region_id", "persons", ["region_id"])

    op.create_table(
        "person_care",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "person_id",
            sa.BINARY(16),
            sa.ForeignKey("persons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "organization_id",
            sa.BINARY(16),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "primary_caregiver_id",
            sa.BINARY(16),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("started_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.Column("ended_at", mysql.DATETIME(fsp=3), nullable=True),
    )
    op.create_index(
        "ix_person_care_org_person", "person_care", ["organization_id", "person_id"]
    )


def downgrade() -> None:
    op.drop_table("person_care")
    op.drop_table("persons")
    op.drop_table("organizations")
    op.drop_table("app_settings")
    op.drop_table("modules")
    op.drop_constraint("fk_users_preferred_region", "users", type_="foreignkey")
    op.drop_index("ix_users_preferred_region_id", table_name="users")
    op.drop_column("users", "preferred_region_id")

