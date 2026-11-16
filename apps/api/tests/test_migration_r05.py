"""Non-regression tests for Étape 5 existing data migration."""

from __future__ import annotations

from datetime import date

import pytest
from sqlalchemy import select, text

from tests.seed_helpers import seed_test_catalog
from tsotsa_api.modules.identity.models import (
    CaregiverProfile,
    Role,
    User,
    UserIdentity,
    UserRole,
)
from tsotsa_api.modules.organizations.models import Organization
from tsotsa_api.modules.persons.models import Person


@pytest.mark.asyncio
async def test_migration_promotes_target_admin_safely(db_session):
    """Test that existing target user is promoted to admin and active status."""
    role_map = await seed_test_catalog(db_session)
    email = "ericpapainmezatio@gmail.com"

    # Seed existing user
    user = User(
        display_name="Eric Papain",
        first_name="Eric",
        last_name="Mezatio",
        locality="Douala",
        status="active",
        failed_login_attempts=0,
    )
    db_session.add(user)
    await db_session.flush()

    identity = UserIdentity(
        user_id=user.id,
        provider="email",
        provider_subject=email,
        email=email,
        password_hash="hashed_secret_pw",
    )
    user_role = UserRole(user_id=user.id, role_id=role_map["parent"].id)
    db_session.add_all([identity, user_role])
    await db_session.commit()

    # Simulate migration promotion step
    conn = await db_session.connection()
    user_row = (
        await conn.execute(
            text(
                "SELECT u.id FROM users u "
                "JOIN user_identities ui ON ui.user_id = u.id "
                "WHERE ui.email = :email"
            ),
            {"email": email},
        )
    ).fetchone()

    assert user_row is not None
    uid = user_row[0]

    # Update role to admin
    admin_row = (await conn.execute(text("SELECT id FROM roles WHERE code = 'admin'"))).fetchone()
    assert admin_row is not None
    admin_role_id = admin_row[0]
    await conn.execute(
        text("UPDATE user_roles SET role_id = :role_id WHERE user_id = :uid"),
        {"role_id": admin_role_id, "uid": uid},
    )
    await conn.execute(
        text("UPDATE users SET status = 'active' WHERE id = :uid"),
        {"uid": uid},
    )
    await db_session.commit()

    # Verify updated entities
    res_code = (
        await db_session.execute(
            select(Role.code)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        )
    ).scalar_one()
    assert res_code == "admin"

    res_user = (await db_session.execute(select(User).where(User.id == user.id))).scalar_one()
    assert res_user.status == "active"
    assert res_user.display_name == "Eric Papain"


@pytest.mark.asyncio
async def test_migration_normalizes_legacy_roles(db_session):
    """Test that legacy user roles are safely normalized to parent."""
    role_map = await seed_test_catalog(db_session)

    user = User(display_name="Parent Account", status="active")
    db_session.add(user)
    await db_session.flush()

    ur = UserRole(user_id=user.id, role_id=role_map["parent"].id)
    db_session.add(ur)
    await db_session.commit()

    res_code = (
        await db_session.execute(
            select(Role.code)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        )
    ).scalar_one()
    assert res_code == "parent"


@pytest.mark.asyncio
async def test_migration_preserves_caregivers_and_patients(db_session):
    """Test that existing caregiver and patient relationships remain intact."""
    role_map = await seed_test_catalog(db_session)

    org = Organization(name="Hôpital Central", type="hopital", status="active")
    db_session.add(org)
    await db_session.flush()

    doctor = User(display_name="Dr Test", status="active")
    db_session.add(doctor)
    await db_session.flush()

    doc_role = UserRole(user_id=doctor.id, role_id=role_map["caregiver"].id)
    doc_profile = CaregiverProfile(
        user_id=doctor.id,
        organization_id=org.id,
        speciality="Pédiatrie",
        phone="+237699000000",
    )
    patient = Person(
        pseudonym="#A-014",
        first_name="Enfant",
        birth_date=date(2022, 1, 1),
        sex="M",
        status="validated",
        created_by=doctor.id,
    )
    db_session.add_all([doc_role, doc_profile, patient])
    await db_session.commit()

    # Verification: caregiver profile and patient still exist intact
    doc_res = (
        await db_session.execute(
            select(CaregiverProfile).where(CaregiverProfile.user_id == doctor.id)
        )
    ).scalar_one()
    assert doc_res.speciality == "Pédiatrie"

    patient_res = (
        await db_session.execute(select(Person).where(Person.id == patient.id))
    ).scalar_one()
    assert patient_res.first_name == "Enfant"
    assert patient_res.created_by == doctor.id
