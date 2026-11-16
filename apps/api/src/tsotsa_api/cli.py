"""TSOTSA Kids CLI commands (e.g., create-admin)."""

from __future__ import annotations

import argparse
import asyncio
import getpass
import re
import sys
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.core.config import get_settings
from tsotsa_api.core.database import async_session_factory
from tsotsa_api.core.security import hash_password
from tsotsa_api.modules.identity.models import Role, User, UserIdentity, UserRole


def _validate_email(email: str) -> str:
    """Validate and normalize email string."""
    clean = email.strip().lower()
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, clean):
        raise ValueError("Adresse email invalide.")
    return clean


def _prompt_password() -> str:
    """Prompt for password interactively with confirmation and length check."""
    pwd = getpass.getpass("Mot de passe administrateur (8 à 72 caractères) : ")
    if len(pwd) < 8 or len(pwd) > 72:
        raise ValueError("Le mot de passe doit comporter entre 8 et 72 caractères.")
    confirm = getpass.getpass("Confirmez le mot de passe : ")
    if pwd != confirm:
        raise ValueError("Les mots de passe ne correspondent pas.")
    return pwd


async def create_admin_account(
    email: str,
    first_name: str | None = None,
    last_name: str | None = None,
    display_name: str | None = None,
    password: str | None = None,
    session: AsyncSession | None = None,
) -> User:
    """Create an administrator account with hashed password and admin role."""
    clean_email = _validate_email(email)
    pwd = password or _prompt_password()
    if len(pwd) < 8 or len(pwd) > 72:
        raise ValueError("Le mot de passe doit comporter entre 8 et 72 caractères.")

    settings = get_settings()
    pwd_hash = hash_password(pwd, rounds=settings.BCRYPT_ROUNDS)
    now = datetime.now(UTC)

    d_name = display_name or f"{first_name or ''} {last_name or ''}".strip() or clean_email

    async def _execute_in_session(sess: AsyncSession) -> User:
        # Check if identity exists
        stmt = (
            select(UserIdentity)
            .options(selectinload(UserIdentity.user).selectinload(User.user_roles))
            .where(UserIdentity.provider == "email", UserIdentity.email == clean_email)
        )
        res = await sess.execute(stmt)
        existing_identity = res.scalar_one_or_none()

        role_stmt = select(Role).where(Role.code == "admin")
        role_res = await sess.execute(role_stmt)
        admin_role = role_res.scalar_one_or_none()
        if not admin_role:
            admin_role = Role(
                code="admin",
                name="Administrateur",
                description="Administrateur de la plateforme",
            )
            sess.add(admin_role)
            await sess.flush()

        if existing_identity:
            user = existing_identity.user
            existing_identity.password_hash = pwd_hash
            existing_identity.email_verified_at = existing_identity.email_verified_at or now
            existing_identity.updated_at = now
            user.status = "active"
            if not any(ur.role_id == admin_role.id for ur in user.user_roles):
                sess.add(UserRole(user_id=user.id, role_id=admin_role.id))
            await sess.commit()
            return user

        user = User(
            first_name=first_name,
            last_name=last_name,
            display_name=d_name,
            language="fr",
            preferred_locale="fr",
            status="active",
        )
        sess.add(user)
        await sess.flush()

        identity = UserIdentity(
            user_id=user.id,
            provider="email",
            provider_subject=clean_email,
            email=clean_email,
            password_hash=pwd_hash,
            email_verified_at=now,
        )
        sess.add(identity)
        sess.add(UserRole(user_id=user.id, role_id=admin_role.id))

        await sess.commit()
        return user

    if session is not None:
        return await _execute_in_session(session)

    async with async_session_factory() as new_session:
        return await _execute_in_session(new_session)


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description="TSOTSA Kids CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    admin_parser = subparsers.add_parser("create-admin", help="Créer un administrateur")
    admin_parser.add_argument("--email", "-e", help="Adresse email de l'administrateur")
    admin_parser.add_argument("--first-name", "-f", help="Prénom")
    admin_parser.add_argument("--last-name", "-l", help="Nom")
    admin_parser.add_argument("--display-name", "-d", help="Nom affiché")
    admin_parser.add_argument("--password", "-p", help="Mot de passe (non interactif)")

    args = parser.parse_args()

    if args.command == "create-admin":
        email = args.email or input("Email administrateur : ").strip()
        first_name = args.first_name or input("Prénom : ").strip()
        last_name = args.last_name or input("Nom : ").strip()

        try:
            user = asyncio.run(
                create_admin_account(
                    email=email,
                    first_name=first_name or None,
                    last_name=last_name or None,
                    display_name=args.display_name or None,
                    password=args.password or None,
                )
            )
            print(f"Compte administrateur créé avec succès : {user.display_name} (ID: {user.id})")
        except Exception as exc:
            print(f"Erreur : {exc}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
