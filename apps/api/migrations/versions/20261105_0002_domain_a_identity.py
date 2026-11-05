"""Domain A (Identity and Access) schema migration.

Revision ID: 20261105_0002
Revises: 20261105_0001
Create Date: 2026-11-05 18:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261105_0002"
down_revision: str | None = "20261105_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create all Domain A identity and access tables."""
    uuid_type = sa.BINARY(16)

    # 1. users
    op.create_table(
        "users",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("display_name", sa.String(150), nullable=False),
        sa.Column("language", sa.String(10), server_default="fr", nullable=False),
        sa.Column("status", sa.String(30), server_default="active", nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status IN ('active', 'invited', 'suspended')", name="ck_users_status"),
    )

    # 2. user_identities
    op.create_table(
        "user_identities",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "user_id",
            uuid_type,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("provider", sa.String(30), nullable=False),
        sa.Column("provider_subject", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True, index=True),
        sa.Column("phone_e164", sa.String(30), nullable=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("phone_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("provider", "provider_subject", name="uq_user_identities_provider_sub"),
        sa.CheckConstraint(
            "provider IN ('google', 'phone', 'email')", name="ck_user_identities_prov"
        ),
    )

    # 3. roles
    op.create_table(
        "roles",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("code IN ('user', 'caregiver', 'admin')", name="ck_roles_code"),
    )

    # 4. user_roles
    op.create_table(
        "user_roles",
        sa.Column(
            "user_id",
            uuid_type,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "role_id",
            uuid_type,
            sa.ForeignKey("roles.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 5. otp_codes
    op.create_table(
        "otp_codes",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("phone_e164", sa.String(30), nullable=False, index=True),
        sa.Column("code_hash", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_otp_codes_phone_expires", "otp_codes", ["phone_e164", "expires_at"]
    )

    # 6. email_tokens
    op.create_table(
        "email_tokens",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "user_identity_id",
            uuid_type,
            sa.ForeignKey("user_identities.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("purpose", sa.String(30), nullable=False),
        sa.Column("token_hash", sa.String(255), unique=True, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("purpose IN ('verify', 'reset')", name="ck_email_tokens_purpose"),
    )

    # 7. refresh_tokens
    op.create_table(
        "refresh_tokens",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "user_id",
            uuid_type,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("token_hash", sa.String(255), unique=True, nullable=False),
        sa.Column("device_label", sa.String(255), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 8. caregiver_profiles
    op.create_table(
        "caregiver_profiles",
        sa.Column(
            "user_id",
            uuid_type,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("organization_id", uuid_type, nullable=True, index=True),
        sa.Column("licence_number", sa.String(100), nullable=True),
        sa.Column("document_file", sa.String(255), nullable=True),
        sa.Column(
            "verification_status", sa.String(30), server_default="pending", nullable=False
        ),
        sa.Column("verified_by", uuid_type, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "verification_status IN ('pending', 'approved', 'rejected')",
            name="ck_caregiver_status",
        ),
    )

    # 9. invitations
    op.create_table(
        "invitations",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("created_by", uuid_type, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("organization_id", uuid_type, nullable=True),
        sa.Column("phone_or_email", sa.String(255), nullable=False, index=True),
        sa.Column("token_hash", sa.String(255), unique=True, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    """Revert Domain A tables in reverse dependency order."""
    op.drop_table("invitations")
    op.drop_table("caregiver_profiles")
    op.drop_table("refresh_tokens")
    op.drop_table("email_tokens")
    op.drop_index("ix_otp_codes_phone_expires", table_name="otp_codes")
    op.drop_table("otp_codes")
    op.drop_table("user_roles")
    op.drop_table("roles")
    op.drop_table("user_identities")
    op.drop_table("users")
