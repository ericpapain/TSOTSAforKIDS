#!/usr/bin/env python3
"""Script de création des comptes de démonstration et d'administration TSOTSA Kids.

Insère ou met à jour les comptes avec SQL direct.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import os
import uuid

import bcrypt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from tsotsa_api.core.config import get_settings
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


def hash_pwd(pwd: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd.encode("utf-8"), salt).decode("utf-8")


async def seed() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    pwd_hash = hash_pwd(DEMO_PASSWORD)
    now = datetime.now(UTC)

    async with engine.begin() as conn:
        # Load roles map: code -> id (BINARY(16))
        roles_rows = (await conn.execute(text("SELECT id, code FROM roles"))).fetchall()
        roles_map = {row[1]: row[0] for row in roles_rows}

        for u in DEMO_USERS:
            email = u["email"].lower().strip()
            role_code = u["role"]
            role_id = roles_map.get(role_code)

            if not role_id:
                print(f"[!] Role non trouvé dans la base : {role_code}")
                continue

            # Check if user already exists
            existing = (
                await conn.execute(
                    text(
                        "SELECT u.id, ui.id FROM users u "
                        "JOIN user_identities ui ON ui.user_id = u.id "
                        "WHERE ui.email = :email"
                    ),
                    {"email": email},
                )
            ).fetchone()

            if existing:
                user_id, identity_id = existing[0], existing[1]
                # Update user and identity
                await conn.execute(
                    text(
                        "UPDATE users SET status = 'active', failed_login_attempts = 0, "
                        "locked_until = NULL, updated_at = :now WHERE id = :uid"
                    ),
                    {"now": now, "uid": user_id},
                )
                await conn.execute(
                    text(
                        "UPDATE user_identities SET password_hash = :pwd, updated_at = :now "
                        "WHERE id = :iid"
                    ),
                    {"pwd": pwd_hash, "now": now, "iid": identity_id},
                )
                await conn.execute(
                    text("DELETE FROM user_roles WHERE user_id = :uid"),
                    {"uid": user_id},
                )
                await conn.execute(
                    text(
                        "INSERT INTO user_roles (user_id, role_id, created_at) "
                        "VALUES (:uid, :rid, :now)"
                    ),
                    {"uid": user_id, "rid": role_id, "now": now},
                )
                print(f"[✓] Compte mis à jour : {email} ({role_code})")
            else:
                user_uuid_str = generate_uuid7()
                user_id = uuid.UUID(user_uuid_str).bytes
                identity_uuid_str = generate_uuid7()
                identity_id = uuid.UUID(identity_uuid_str).bytes

                await conn.execute(
                    text(
                        "INSERT INTO users (id, first_name, last_name, display_name, "
                        "language, preferred_locale, status, failed_login_attempts, created_at, updated_at) "
                        "VALUES (:id, :fn, :ln, :dn, 'fr', 'fr', 'active', 0, :now, :now)"
                    ),
                    {
                        "id": user_id,
                        "fn": u["first_name"],
                        "ln": u["last_name"],
                        "dn": u["display_name"],
                        "now": now,
                    },
                )

                await conn.execute(
                    text(
                        "INSERT INTO user_identities (id, user_id, provider, provider_subject, "
                        "email, password_hash, created_at, updated_at) "
                        "VALUES (:id, :uid, 'email', :email, :email, :pwd, :now, :now)"
                    ),
                    {
                        "id": identity_id,
                        "uid": user_id,
                        "email": email,
                        "pwd": pwd_hash,
                        "now": now,
                    },
                )

                await conn.execute(
                    text(
                        "INSERT INTO user_roles (user_id, role_id, created_at) "
                        "VALUES (:uid, :rid, :now)"
                    ),
                    {"uid": user_id, "rid": role_id, "now": now},
                )

                if role_code in ("caregiver", "super_caregiver"):
                    await conn.execute(
                        text(
                            "INSERT INTO caregiver_profiles (user_id, speciality, order_number, "
                            "verification_status, created_at, updated_at) "
                            "VALUES (:uid, 'Pédiatrie nutritionnelle', 'ORD-2026-001', 'approved', :now, :now)"
                        ),
                        {"uid": user_id, "now": now},
                    )
                elif role_code == "field_agent":
                    await conn.execute(
                        text(
                            "INSERT INTO field_agent_profiles (user_id, phone, structure_name, "
                            "verification_status, created_at, updated_at) "
                            "VALUES (:uid, '+237690000000', 'Croix-Rouge Cameroun', 'approved', :now, :now)"
                        ),
                        {"uid": user_id, "now": now},
                    )

                print(f"[+] Compte créé : {email} ({role_code})")

    await engine.dispose()
    print("\nTous les comptes de démonstration sont créés et opérationnels !")


if __name__ == "__main__":
    asyncio.run(seed())
