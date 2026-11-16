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


async def seed_symptom_catalog(session: AsyncSession) -> dict[str, str]:
    """Seed standard symptom catalog items for test suites."""
    from tsotsa_api.modules.health.models import SymptomCatalog

    items = [
        ("convulsions", "danger_sign", "Convulsions ou spasmes", True, 1),
        ("unconscious_lethargic", "danger_sign", "Inconscient ou somnolent", True, 2),
        ("unable_drink_breastfeed", "danger_sign", "Incapable de boire", True, 3),
        ("vomits_everything", "danger_sign", "Vomit tout", True, 4),
        ("severe_respiratory_distress", "danger_sign", "Difficulté respiratoire", True, 5),
        ("fever", "general", "Fièvre", False, 10),
        ("cough", "respiratory", "Toux", False, 11),
        ("rapid_breathing", "respiratory", "Respiration rapide", False, 12),
        ("diarrhea", "digestive", "Diarrhée", False, 13),
        ("vomiting", "digestive", "Vomissements", False, 14),
        ("reduced_eating", "digestive", "Mange moins", False, 15),
        ("reduced_drinking", "digestive", "Boit moins", False, 16),
        ("fatigue", "general", "Fatigue inhabituelle", False, 17),
        ("irritability", "general", "Irritable ou pleurs inhabituels", False, 18),
        ("edema_both_feet", "nutritional", "Gonflement des deux pieds", False, 19),
        ("weight_loss", "nutritional", "Perte de poids visible", False, 20),
        ("skin_rash", "skin", "Éruption cutanée", False, 21),
        ("localized_pain", "pain", "Douleur localisée", False, 22),
        ("other_change", "general", "Autre changement", False, 30),
    ]
    catalog_map = {}
    for code, cat, label, is_danger, order in items:
        sc = SymptomCatalog(
            code=code,
            category=cat,
            label_fr=label,
            label_en=code,
            is_danger_sign=is_danger,
            display_order=order,
            is_active=True,
        )
        session.add(sc)
        catalog_map[code] = code
    await session.flush()
    return catalog_map
