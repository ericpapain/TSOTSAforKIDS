"""Domain C & L: person_links, person_invitations, consent_texts, consents, audit_log.

Revision ID: 20261106_0007
Revises: 20261105_0006
Create Date: 2026-11-06 10:45:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql

revision: str = "20261106_0007"
down_revision: str | None = "20261105_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "person_links",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "person_id",
            sa.BINARY(16),
            sa.ForeignKey("persons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.BINARY(16),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("relation", sa.String(30), nullable=False, server_default="child"),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.CheckConstraint(
            "relation IN ('self', 'child', 'relative')",
            name="ck_person_links_relation",
        ),
        sa.UniqueConstraint("person_id", "user_id", name="uq_person_links_person_user"),
    )
    op.create_index("ix_person_links_person_id", "person_links", ["person_id"])
    op.create_index("ix_person_links_user_id", "person_links", ["user_id"])

    op.create_table(
        "person_invitations",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "person_id",
            sa.BINARY(16),
            sa.ForeignKey("persons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "invited_by_user_id",
            sa.BINARY(16),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("phone_or_email", sa.String(255), nullable=False),
        sa.Column("relation", sa.String(30), nullable=False, server_default="child"),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("expires_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.Column("created_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.CheckConstraint(
            "status IN ('pending', 'accepted', 'expired')",
            name="ck_person_invitations_status",
        ),
    )
    op.create_index("ix_person_invitations_person_id", "person_invitations", ["person_id"])

    op.create_table(
        "consent_texts",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("language", sa.String(10), nullable=False, server_default="fr"),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("published_at", mysql.DATETIME(fsp=3), nullable=False),
    )
    op.create_index(
        "ix_consent_texts_lang_current", "consent_texts", ["language", "is_current"]
    )

    op.create_table(
        "consents",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "person_id",
            sa.BINARY(16),
            sa.ForeignKey("persons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "consent_text_id",
            sa.BINARY(16),
            sa.ForeignKey("consent_texts.id"),
            nullable=False,
        ),
        sa.Column(
            "given_by_user_id",
            sa.BINARY(16),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("legal_guardian", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("given_at", mysql.DATETIME(fsp=3), nullable=False),
        sa.Column("withdrawn_at", mysql.DATETIME(fsp=3), nullable=True),
    )
    op.create_index("ix_consents_person_id", "consents", ["person_id"])
    op.create_index(
        "ix_consents_person_withdrawn", "consents", ["person_id", "withdrawn_at"]
    )

    op.create_table(
        "audit_log",
        sa.Column("id", sa.BINARY(16), primary_key=True),
        sa.Column(
            "actor_user_id",
            sa.BINARY(16),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("entity", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(64), nullable=True),
        sa.Column(
            "organization_id",
            sa.BINARY(16),
            sa.ForeignKey("organizations.id"),
            nullable=True,
        ),
        sa.Column("at", mysql.DATETIME(fsp=3), nullable=False),
        sa.Column("ip", sa.String(50), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
    )
    op.create_index("ix_audit_log_actor_at", "audit_log", ["actor_user_id", "at"])
    op.create_index("ix_audit_log_entity_id", "audit_log", ["entity", "entity_id"])
    op.create_index("ix_audit_log_org_at", "audit_log", ["organization_id", "at"])


def downgrade() -> None:
    op.drop_table("audit_log")
    op.drop_table("consents")
    op.drop_table("consent_texts")
    op.drop_table("person_invitations")
    op.drop_table("person_links")

