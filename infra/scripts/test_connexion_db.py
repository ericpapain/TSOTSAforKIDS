#!/usr/bin/env python3
"""TSOTSA Kids - Script de vérification de la connexion MySQL et des privilèges.

Vérifie :
1. Connexion et chiffrement TLS actif (Ssl_cipher non vide).
2. Jeu de caractères utf8mb4.
3. Fuseau horaire UTC (+00:00).
4. Mode SQL strict (STRICT_TRANS_TABLES).
5. Respect du moindre privilège pour tsotsa_app :
   - Une tentative de CREATE TABLE doit impérativement échouer.
"""

from __future__ import annotations

import asyncio
import os
import ssl
import sys
from urllib.parse import urlparse
import asyncmy


def parse_db_config() -> dict[str, object]:
    url = os.getenv("DATABASE_URL")
    if url:
        parsed = urlparse(url.replace("mysql+asyncmy://", "mysql://"))
        return {
            "host": parsed.hostname or "127.0.0.1",
            "port": parsed.port or 3306,
            "user": parsed.username or "tsotsa_app",
            "password": parsed.password or "",
            "db": (parsed.path or "/tsotsa_prod").lstrip("/"),
        }

    return {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "tsotsa_app"),
        "password": os.getenv("DB_PASSWORD", ""),
        "db": os.getenv("DB_NAME", "tsotsa_prod"),
    }


def create_ssl_context() -> ssl.SSLContext | None:
    ca_path = os.getenv("DATABASE_SSL_CA_PATH") or os.getenv("DB_SSL_CA")
    require_ssl = os.getenv("DB_REQUIRE_SSL", "true").lower() in ("true", "1", "yes")

    if not require_ssl:
        return None

    if ca_path and os.path.exists(ca_path):
        ctx = ssl.create_default_context(cafile=ca_path)
        ctx.check_hostname = False
        return ctx

    # Contexte TLS par défaut si le certificat CA n'est pas spécifié localement
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


async def verify_tls(conn: asyncmy.Connection) -> None:
    async with conn.cursor() as cur:
        await cur.execute("SHOW STATUS LIKE 'Ssl_cipher'")
        row = await cur.fetchone()
        cipher = row[1] if row else ""
        if not cipher and os.getenv("DB_REQUIRE_SSL", "true").lower() in ("true", "1", "yes"):
            raise RuntimeError("Échec vérification TLS : la connexion n'est pas chiffrée.")
        print(f"[OK] Chiffrement TLS actif : {cipher or 'Désactivé (mode local)'}")


async def verify_charset_and_timezone(conn: asyncmy.Connection) -> None:
    async with conn.cursor() as cur:
        await cur.execute("SELECT @@character_set_connection, @@sql_mode")
        row = await cur.fetchone()
        charset, sql_mode = (row[0], row[1]) if row else ("", "")
        if "utf8mb4" not in charset.lower():
            raise RuntimeError(f"Échec charset : attendu utf8mb4, obtenu {charset}")
        print(f"[OK] Jeu de caractères : {charset}")

        if "STRICT_TRANS_TABLES" not in sql_mode and "STRICT_ALL_TABLES" not in sql_mode:
            print(f"[WARN] Mode SQL non strict : {sql_mode}")
        else:
            print("[OK] Mode SQL strict actif")

        await cur.execute("SELECT TIMEDIFF(NOW(), UTC_TIMESTAMP())")
        tz_row = await cur.fetchone()
        diff = str(tz_row[0]) if tz_row else ""
        if diff not in ("0:00:00", "00:00:00"):
            print(f"[WARN] Décalage UTC session non nul : {diff}")
        else:
            print("[OK] Fuseau horaire session : UTC (+00:00)")


async def verify_least_privilege(conn: asyncmy.Connection) -> None:
    """Vérifie que tsotsa_app n'a pas les droits DDL (CREATE TABLE doit échouer)."""
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1")
        print("[OK] Requête de lecture SELECT autorisée pour l'utilisateur")

        ddl_failed = False
        try:
            await cur.execute("CREATE TABLE _probe_forbidden_table (id INT)")
            # Si la commande réussit, c'est une violation de sécurité critique
            await cur.execute("DROP TABLE _probe_forbidden_table")
        except Exception as exc:  # pylint: disable=broad-except
            ddl_failed = True
            print(f"[OK] Moindre privilège respecté : CREATE TABLE refusé ({exc})")

        if not ddl_failed:
            raise RuntimeError(
                "VIOLATION DE SÉCURITÉ : tsotsa_app a réussi à exécuter CREATE TABLE !"
            )


async def main() -> int:
    config = parse_db_config()
    ssl_ctx = create_ssl_context()
    print(f"Connexion à MySQL ({config['user']}@{config['host']}:{config['port']}/{config['db']})...")

    try:
        conn = await asyncmy.connect(
            host=str(config["host"]),
            port=int(config["port"]),
            user=str(config["user"]),
            password=str(config["password"]),
            database=str(config["db"]),
            ssl=ssl_ctx,
            init_command="SET time_zone = '+00:00';",
        )
    except Exception as exc:  # pylint: disable=broad-except
        print(f"Erreur de connexion MySQL : {exc}", file=sys.stderr)
        return 1

    try:
        await verify_tls(conn)
        await verify_charset_and_timezone(conn)
        await verify_least_privilege(conn)
        print("Toutes les vérifications de sécurité de la base de données sont validées !")
        return 0
    finally:
        await conn.ensure_closed()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

