"""Seed helper for tests requiring roles and permissions catalog."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.identity.models import (
    Permission,
    Role,
    RolePermission,
)

DEFAULT_ROLES = [
    ("admin", "Administrateur"),
    ("super_caregiver", "Super Soignant"),
    ("caregiver", "Soignant"),
    ("field_agent", "Agent de terrain"),
    ("parent", "Parent"),
]

DEFAULT_PERMS = [
    "accounts.create",
    "accounts.update",
    "accounts.delete",
    "staff.validate",
    "facilities.manage",
    "permissions.manage",
    "patients.register",
    "patients.validate",
    "patients.assign",
    "patients.read_all",
    "caregivers.view_as",
    "records.follow",
]

DEFAULT_MATRIX: dict[str, list[str]] = {
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


async def seed_test_catalog(session: AsyncSession) -> dict[str, Role]:
    """Seed the 5 roles, 12 permissions and default matrix associations."""
    role_map: dict[str, Role] = {}
    for code, name in DEFAULT_ROLES:
        role = Role(code=code, name=name, description=f"Rôle {name}")
        session.add(role)
        role_map[code] = role

    perm_map: dict[str, Permission] = {}
    for code in DEFAULT_PERMS:
        perm = Permission(code=code, name=code, description=f"Droit {code}")
        session.add(perm)
        perm_map[code] = perm

    await session.flush()

    for role_code, perm_codes in DEFAULT_MATRIX.items():
        role = role_map[role_code]
        for pcode in perm_codes:
            perm = perm_map[pcode]
            rp = RolePermission(role_id=role.id, permission_id=perm.id, is_default=True)
            session.add(rp)

    await session.flush()
    return role_map
