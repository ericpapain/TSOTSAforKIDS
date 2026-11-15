"""Unit tests for Roles, Permissions, Staff profiles, and Admin CLI (Étape 1)."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from sqlalchemy import select

from tsotsa_api.cli import create_admin_account
from tsotsa_api.core.security import verify_password
from tsotsa_api.modules.identity.models import (
    CaregiverProfile,
    FieldAgentProfile,
    Permission,
    PermissionGrant,
    Role,
    RolePermission,
    User,
    UserIdentity,
    UserRole,
)
from tsotsa_api.modules.organizations.models import Organization
from tsotsa_api.modules.persons.models import Person, PersonCare


@pytest.mark.asyncio
async def test_roles_and_permissions_models(db_session):
    """Verify Role, Permission, RolePermission and PermissionGrant ORM entities."""
    admin_role = Role(code="admin", name="Administrateur", description="Plateforme")
    perm = Permission(code="accounts.create", name="Créer un compte", description="Desc")
    db_session.add_all([admin_role, perm])
    await db_session.flush()

    rp = RolePermission(role_id=admin_role.id, permission_id=perm.id, is_default=True)
    db_session.add(rp)
    await db_session.flush()

    user = User(
        display_name="Grantee User",
        first_name="Jean",
        last_name="Dupont",
        locality="Yaoundé",
        status="active",
        failed_login_attempts=0,
    )
    admin = User(display_name="Admin Grantor", status="active")
    db_session.add_all([user, admin])
    await db_session.flush()

    grant = PermissionGrant(
        user_id=user.id,
        permission_id=perm.id,
        granted_by=admin.id,
        reason="Délégation temporaire",
        is_active=True,
    )
    db_session.add(grant)
    await db_session.flush()

    stmt = select(PermissionGrant).where(PermissionGrant.user_id == user.id)
    res = await db_session.execute(stmt)
    saved_grant = res.scalar_one()
    assert saved_grant.reason == "Délégation temporaire"
    assert saved_grant.is_active is True
    assert saved_grant.granted_by == admin.id


@pytest.mark.asyncio
async def test_field_agent_and_caregiver_profiles(db_session):
    """Verify FieldAgentProfile and updated CaregiverProfile schema fields."""
    user = User(display_name="Agent Terrain Test", status="pending")
    cg_user = User(display_name="Dr Test", status="pending")
    org = Organization(name="Centre Médical Pilote", type="centre_de_sante", status="active")
    db_session.add_all([user, cg_user, org])
    await db_session.flush()

    fa_profile = FieldAgentProfile(
        user_id=user.id,
        phone="+237699112233",
        structure_name="Croix-Rouge Locale",
        verification_status="pending",
    )
    cg_profile = CaregiverProfile(
        user_id=cg_user.id,
        organization_id=org.id,
        phone="+237699445566",
        speciality="Pédiatre",
        order_number="ONMC-2026-1234",
        verification_status="pending",
    )
    db_session.add_all([fa_profile, cg_profile])
    await db_session.flush()

    assert fa_profile.phone == "+237699112233"
    assert fa_profile.verification_status == "pending"
    assert cg_profile.speciality == "Pédiatre"
    assert cg_profile.order_number == "ONMC-2026-1234"


@pytest.mark.asyncio
async def test_person_validation_and_care_assignment(db_session):
    """Verify Person status ('pending', 'validated') and PersonCare assignment."""
    doctor = User(display_name="Dr Validateur", status="active")
    org = Organization(name="Hôpital Central Test", type="hopital", status="active")
    db_session.add_all([doctor, org])
    await db_session.flush()

    child = Person(
        pseudonym="#P-TEST-001",
        first_name="Junior",
        birth_date=datetime(2023, 1, 1, tzinfo=UTC).date(),
        sex="M",
        status="pending",
    )
    db_session.add(child)
    await db_session.flush()

    assert child.status == "pending"
    assert child.validated_by is None

    # Validate child
    child.status = "validated"
    child.validated_by = doctor.id
    child.validated_at = datetime.now(UTC)

    care = PersonCare(
        person_id=child.id,
        organization_id=org.id,
        primary_caregiver_id=doctor.id,
        assigned_by=doctor.id,
        reason="Suivi nutritionnel",
    )
    db_session.add(care)
    await db_session.flush()

    assert child.status == "validated"
    assert care.assigned_by == doctor.id
    assert care.reason == "Suivi nutritionnel"


@pytest.mark.asyncio
async def test_cli_create_admin_success(db_session):
    """Verify create_admin_account function hashes password and sets admin role."""
    user = await create_admin_account(
        email="test.admin.cli@tsotsa-for-kids.com",
        first_name="Admin",
        last_name="Système",
        password="SuperPassword2026!",
        session=db_session,
    )

    assert user.display_name == "Admin Système"
    assert user.status == "active"

    # Verify identity and bcrypt hash in same session
    stmt = (
        select(UserIdentity)
        .where(UserIdentity.email == "test.admin.cli@tsotsa-for-kids.com")
    )
    res = await db_session.execute(stmt)
    identity = res.scalar_one_or_none()
    assert identity is not None
    assert verify_password("SuperPassword2026!", identity.password_hash)

    # Verify role assignment
    stmt_roles = select(UserRole).where(UserRole.user_id == user.id)
    res_roles = await db_session.execute(stmt_roles)
    roles = res_roles.scalars().all()
    assert len(roles) >= 1


@pytest.mark.asyncio
async def test_cli_invalid_inputs(db_session):
    """Verify CLI rejects invalid email and weak passwords."""
    with pytest.raises(ValueError, match="Adresse email invalide"):
        await create_admin_account(
            "invalid-email", password="ValidPassword123!", session=db_session
        )

    with pytest.raises(ValueError, match="entre 8 et 72 caractères"):
        await create_admin_account(
            "admin.weak@tsotsa-for-kids.com", password="short", session=db_session
        )


def test_canonical_permissions_matrix():
    """Verify the 12 canonical permissions match the specification and matrix."""
    import importlib.util
    from pathlib import Path

    mig_path = (
        Path(__file__).resolve().parent.parent
        / "migrations"
        / "versions"
        / "20261115_0015_refonte_roles_permissions_facilities.py"
    )
    spec = importlib.util.spec_from_file_location("mig_0015", mig_path)
    mig_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mig_mod)

    codes = [p[0] for p in mig_mod.CANONICAL_PERMISSIONS]
    assert len(codes) == 12
    assert "accounts.create" in codes
    assert "accounts.update" in codes
    assert "accounts.delete" in codes
    assert "staff.validate" in codes
    assert "facilities.manage" in codes
    assert "permissions.manage" in codes
    assert "patients.register" in codes
    assert "patients.validate" in codes
    assert "patients.assign" in codes
    assert "patients.read_all" in codes
    assert "caregivers.view_as" in codes
    assert "records.follow" in codes

    role_codes = [r[0] for r in mig_mod.CANONICAL_ROLES]
    assert set(role_codes) == {"admin", "super_caregiver", "caregiver", "field_agent", "parent"}

    # Validate defaults per MATRICE_DROITS.md
    assert set(mig_mod.DEFAULT_ROLE_PERMISSIONS["admin"]) == {
        "accounts.create",
        "accounts.update",
        "accounts.delete",
        "staff.validate",
        "facilities.manage",
        "permissions.manage",
    }
    assert set(mig_mod.DEFAULT_ROLE_PERMISSIONS["super_caregiver"]) == {
        "staff.validate",
        "permissions.manage",
        "patients.register",
        "patients.validate",
        "patients.assign",
        "patients.read_all",
        "caregivers.view_as",
        "records.follow",
    }
    assert set(mig_mod.DEFAULT_ROLE_PERMISSIONS["caregiver"]) == {
        "patients.register",
        "records.follow",
    }
    assert set(mig_mod.DEFAULT_ROLE_PERMISSIONS["field_agent"]) == {
        "patients.register",
        "patients.validate",
    }
    assert set(mig_mod.DEFAULT_ROLE_PERMISSIONS["parent"]) == {
        "patients.register",
    }
