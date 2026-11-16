"""Refonte roles, permissions, facilities, field agents, patient validation.

Revision ID: 20261115_0015_refonte_roles_permissions_facilities
Revises: 20261109_0014_i18n_locales_and_translations
Create Date: 2026-11-15 20:30:00.000000
"""

from __future__ import annotations

from datetime import UTC, datetime
import uuid

from alembic import op
import sqlalchemy as sa

revision: str = "20261115_0015_refonte_roles_permissions_facilities"
down_revision: str | None = "20261109_0014_i18n_locales_and_translations"
branch_labels: tuple[str, ...] | None = None
depends_on: tuple[str, ...] | None = None

CANONICAL_PERMISSIONS = [
    ("accounts.create", "Créer un compte", "Créer un compte agent de terrain / soignant / super soignant"),
    ("accounts.update", "Modifier un compte", "Modifier les informations d'un compte"),
    ("accounts.delete", "Suspendre/supprimer un compte", "Suspendre ou supprimer un compte utilisateur"),
    ("staff.validate", "Valider soignants/agents", "Valider un nouveau soignant ou agent de terrain"),
    ("facilities.manage", "Gérer établissements", "Créer, modifier, supprimer un établissement de santé"),
    ("permissions.manage", "Gérer les droits", "Donner ou retirer des droits délégués"),
    ("patients.register", "Inscrire des patients", "Inscrire une famille ou un patient"),
    ("patients.validate", "Valider des patients", "Valider un patient en attente de validation"),
    ("patients.assign", "Associer patients", "Associer un patient à un soignant référent"),
    ("patients.read_all", "Voir tous les patients", "Accéder à la liste complète de tous les patients"),
    ("caregivers.view_as", "Vue soignant", "Voir l'interface d'un autre soignant en lecture seule"),
    ("records.follow", "Suivi médical", "Suivre le dossier médical de ses patients"),
]

CANONICAL_ROLES = [
    ("admin", "Administrateur", "Administrateur de la plateforme"),
    ("super_caregiver", "Super Soignant", "Médecin coordinateur principal"),
    ("caregiver", "Soignant", "Médecin ou infirmier assurant le suivi"),
    ("field_agent", "Agent de terrain", "Agent de terrain enregistrant les familles"),
    ("parent", "Parent", "Compte famille parent / représentant légal"),
]

DEFAULT_ROLE_PERMISSIONS: dict[str, list[str]] = {
    "admin": [
        "accounts.create",
        "accounts.update",
        "accounts.delete",
        "staff.validate",
        "facilities.manage",
        "permissions.manage",
    ],
    "super_caregiver": [
        "staff.validate",
        "permissions.manage",
        "patients.register",
        "patients.validate",
        "patients.assign",
        "patients.read_all",
        "caregivers.view_as",
        "records.follow",
    ],
    "caregiver": [
        "patients.register",
        "records.follow",
    ],
    "field_agent": [
        "patients.register",
        "patients.validate",
    ],
    "parent": [
        "patients.register",
    ],
}


def _make_id(name: str, is_sqlite: bool) -> bytes | str:
    u = uuid.uuid5(uuid.NAMESPACE_DNS, name)
    return str(u) if is_sqlite else u.bytes


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"
    uuid_type = sa.BINARY(16).with_variant(sa.String(36), "sqlite")
    now = datetime.now(UTC)

    # 1. Update roles table and migrate 'user' -> 'parent'
    if not is_sqlite:
        op.execute("ALTER TABLE roles DROP CHECK ck_roles_code")
        op.execute(
            "ALTER TABLE roles ADD CONSTRAINT ck_roles_code "
            "CHECK (code IN ('admin', 'super_caregiver', 'caregiver', 'field_agent', 'parent', 'user'))"
        )
    op.execute("UPDATE roles SET code = 'parent', name = 'Parent' WHERE code = 'user'")

    # 2. Create permissions table
    op.create_table(
        "permissions",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("code", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 3. Create role_permissions table
    op.create_table(
        "role_permissions",
        sa.Column("role_id", uuid_type, sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("permission_id", uuid_type, sa.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("is_default", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 4. Create permission_grants table
    op.create_table(
        "permission_grants",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("user_id", uuid_type, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("permission_id", uuid_type, sa.ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("granted_by", uuid_type, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("reason", sa.String(255), nullable=True),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("valid_to", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_permission_grants_active", "permission_grants", ["user_id", "permission_id", "is_active"])

    # 5. Create field_agent_profiles table
    op.create_table(
        "field_agent_profiles",
        sa.Column("user_id", uuid_type, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("phone", sa.String(30), nullable=False),
        sa.Column("structure_name", sa.String(200), nullable=True),
        sa.Column("verification_status", sa.String(30), server_default="pending", nullable=False),
        sa.Column("verification_notes", sa.String(500), nullable=True),
        sa.Column("refusal_reason", sa.String(255), nullable=True),
        sa.Column("verified_by", uuid_type, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("verification_status IN ('pending', 'approved', 'rejected')", name="ck_field_agent_status"),
    )

    # 6. Alter users table
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("first_name", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("last_name", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("locality", sa.String(150), nullable=True))
        batch_op.add_column(sa.Column("failed_login_attempts", sa.Integer(), server_default="0", nullable=False))
        batch_op.add_column(sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("refusal_reason", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("deleted_by", uuid_type, nullable=True))

    # 7. Alter caregiver_profiles table
    with op.batch_alter_table("caregiver_profiles") as batch_op:
        batch_op.add_column(sa.Column("phone", sa.String(30), nullable=True))
        batch_op.add_column(sa.Column("speciality", sa.String(150), nullable=True))
        batch_op.add_column(sa.Column("order_number", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("refusal_reason", sa.String(255), nullable=True))

    # 8. Alter organizations table
    with op.batch_alter_table("organizations") as batch_op:
        batch_op.add_column(sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("deleted_by", uuid_type, nullable=True))

    # 9. Alter persons table
    with op.batch_alter_table("persons") as batch_op:
        batch_op.add_column(sa.Column("status", sa.String(30), server_default="pending", nullable=False))
        batch_op.add_column(sa.Column("validated_by", uuid_type, nullable=True))
        batch_op.add_column(sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("refusal_reason", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("deleted_by", uuid_type, nullable=True))

    # 10. Alter person_care table
    with op.batch_alter_table("person_care") as batch_op:
        batch_op.add_column(sa.Column("assigned_by", uuid_type, nullable=True))
        batch_op.add_column(sa.Column("reason", sa.String(255), nullable=True))

    # 11. Seed roles if missing
    roles_table = sa.table("roles", sa.column("id"), sa.column("code"), sa.column("name"), sa.column("description"), sa.column("created_at"))
    for code, name, desc in CANONICAL_ROLES:
        role_id = _make_id(f"tsotsa.role.{code}", is_sqlite)
        # Check if role exists
        exists = bind.execute(sa.select(roles_table.c.id).where(roles_table.c.code == code)).scalar_one_or_none()
        if not exists:
            op.bulk_insert(roles_table, [{"id": role_id, "code": code, "name": name, "description": desc, "created_at": now}])

    # 12. Seed permissions
    permissions_table = sa.table("permissions", sa.column("id"), sa.column("code"), sa.column("name"), sa.column("description"), sa.column("created_at"))
    perm_id_map: dict[str, bytes | str] = {}
    perm_rows = []
    for code, name, desc in CANONICAL_PERMISSIONS:
        pid = _make_id(f"tsotsa.permission.{code}", is_sqlite)
        perm_id_map[code] = pid
        perm_rows.append({"id": pid, "code": code, "name": name, "description": desc, "created_at": now})
    op.bulk_insert(permissions_table, perm_rows)

    # 13. Seed default role_permissions
    role_permissions_table = sa.table("role_permissions", sa.column("role_id"), sa.column("permission_id"), sa.column("is_default"), sa.column("created_at"))
    rp_rows = []
    for role_code, perm_codes in DEFAULT_ROLE_PERMISSIONS.items():
        role_id_row = bind.execute(sa.select(roles_table.c.id).where(roles_table.c.code == role_code)).scalar_one_or_none()
        if not role_id_row:
            continue
        for perm_code in perm_codes:
            pid = perm_id_map.get(perm_code)
            if pid:
                rp_rows.append({"role_id": role_id_row, "permission_id": pid, "is_default": True, "created_at": now})
    if rp_rows:
        op.bulk_insert(role_permissions_table, rp_rows)


def downgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    with op.batch_alter_table("person_care") as batch_op:
        batch_op.drop_column("reason")
        batch_op.drop_column("assigned_by")

    with op.batch_alter_table("persons") as batch_op:
        batch_op.drop_column("deleted_by")
        batch_op.drop_column("refusal_reason")
        batch_op.drop_column("validated_at")
        batch_op.drop_column("validated_by")
        batch_op.drop_column("status")

    with op.batch_alter_table("organizations") as batch_op:
        batch_op.drop_column("deleted_by")
        batch_op.drop_column("deleted_at")

    with op.batch_alter_table("caregiver_profiles") as batch_op:
        batch_op.drop_column("refusal_reason")
        batch_op.drop_column("order_number")
        batch_op.drop_column("speciality")
        batch_op.drop_column("phone")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("deleted_by")
        batch_op.drop_column("deleted_at")
        batch_op.drop_column("refusal_reason")
        batch_op.drop_column("locked_until")
        batch_op.drop_column("failed_login_attempts")
        batch_op.drop_column("locality")
        batch_op.drop_column("last_name")
        batch_op.drop_column("first_name")

    op.drop_table("field_agent_profiles")
    op.drop_index("ix_permission_grants_active", table_name="permission_grants")
    op.drop_table("permission_grants")
    op.drop_table("role_permissions")
    op.drop_table("permissions")

