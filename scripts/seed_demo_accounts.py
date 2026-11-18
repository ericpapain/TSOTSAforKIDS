#!/usr/bin/env python3
"""Script de création des comptes de démonstration et d'administration TSOTSA Kids.

Crée ou met à jour un compte actif pour chacun des 5 rôles utilisateurs :
- Administrateur : admin@tsotsa-for-kids.com et ericpapainmezatio@gmail.com
- Super soignant : supersoignant@tsotsa-for-kids.com
- Soignant : soignant@tsotsa-for-kids.com
- Agent de terrain : terrain@tsotsa-for-kids.com
- Parent : parent@tsotsa-for-kids.com
"""

from __future__ import annotations

import asyncio
import os
import sys

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from tsotsa_api.core.config import get_settings
from tsotsa_api.core.security import hash_password
from tsotsa_api.modules.identity.models import User, UserIdentity
from tsotsa_api.modules.identity.models_roles import Role, UserRole
from tsotsa_api.modules.identity.models_staff import CaregiverProfile, FieldAgentProfile
from tsotsa_api.shared.types import generate_uuid7

DEMO_PASSWORD = os.getenv("DEMO_ACCOUNTS_PASSWORD", "Tsotsa2026!Demo")

DEMO_USERS = [
    {
        "email": "admin@tsotsa-for-kids.com",
        "role": "admin",
        "first_name": "Administrateur",
        "last_name": "TSOTSA",
        "display_name": "Admin TSOTSA",
    },
    {
        "email": "ericpapainmezatio@gmail.com",
        "role": "admin",
        "first_name": "Eric Papain",
        "last_name": "Mezatio",
        "display_name": "Eric Papain (Admin)",
    },
    {
        "email": "supersoignant@tsotsa-for-kids.com",
        "role": "super_caregiver",
        "first_name": "Dr. Sarah",
        "last_name": "Ngo",
        "display_name": "Dr. Sarah Ngo (Super Soignant)",
    },
    {
        "email": "soignant@tsotsa-for-kids.com",
        "role": "caregiver",
        "first_name": "Dr. Paul",
        "last_name": "Kamga",
        "display_name": "Dr. Paul Kamga (Soignant)",
    },
    {
        "email": "terrain@tsotsa-for-kids.com",
        "role": "field_agent",
        "first_name": "Marie",
        "last_name": "Fotso",
        "display_name": "Marie Fotso (Agent terrain)",
    },
    {
        "email": "parent@tsotsa-for-kids.com",
        "role": "parent",
        "first_name": "Jeanne",
        "last_name": "Mballa",
        "display_name": "Jeanne Mballa (Parent)",
    },
]


async def seed() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    pwd_hash = hash_password(DEMO_PASSWORD)

    async with AsyncSession(engine) as session:
        # Load roles
        roles_res = await session.execute(select(Role))
        roles_map = {r.code: r for r in roles_res.scalars().all()}

        for user_data in DEMO_USERS:
            email = user_data["email"].lower().strip()
            role_code = user_data["role"]
            role_obj = roles_map.get(role_code)

            if not role_obj:
                print(f"[!] Role non trouvé : {role_code}")
                continue

            # Check if identity exists
            id_res = await session.execute(
                select(UserIdentity).where(UserIdentity.email == email)
            )
            existing_identity = id_res.scalar_one_or_none()

            if existing_identity:
                # Update password and activate user
                existing_identity.password_hash = pwd_hash
                user_res = await session.execute(
                    select(User).where(User.id == existing_identity.user_id)
                )
                user = user_res.scalar_one()
                user.status = "active"
                user.failed_login_attempts = 0
                user.locked_until = None

                # Reassign role
                await session.execute(
                    text("DELETE FROM user_roles WHERE user_id = :uid"),
                    {"uid": user.id},
                )
                session.add(UserRole(user_id=user.id, role_id=role_obj.id))
                print(f"[✓] Compte mis à jour : {email} ({role_code})")
            else:
                user_id = generate_uuid7()
                user = User(
                    id=user_id,
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    display_name=user_data["display_name"],
                    status="active",
                    language="fr",
                    preferred_locale="fr",
                )
                session.add(user)
                await session.flush()

                identity = UserIdentity(
                    id=generate_uuid7(),
                    user_id=user_id,
                    provider="email",
                    provider_subject=email,
                    email=email,
                    password_hash=pwd_hash,
                )
                session.add(identity)
                session.add(UserRole(user_id=user_id, role_id=role_obj.id))

                if role_code in ("caregiver", "super_caregiver"):
                    session.add(
                        CaregiverProfile(
                            user_id=user_id,
                            speciality="Pédiatrie nutritionnelle",
                            order_number="ORD-2026-001",
                            status="validated",
                        )
                    )
                elif role_code == "field_agent":
                    session.add(
                        FieldAgentProfile(
                            user_id=user_id,
                            structure_name="Croix-Rouge Cameroun",
                            phone="+237690000000",
                            status="validated",
                        )
                    )

                print(f"[+] Compte créé : {email} ({role_code})")

        await session.commit()
    await engine.dispose()
    print("\nTous les comptes de démonstration sont prêts et actifs !")


if __name__ == "__main__":
    asyncio.run(seed())
