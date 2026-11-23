#!/usr/bin/env python3
"""Seed official Cameroon regions and reference healthcare organizations into MySQL."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import os
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from tsotsa_api.core.config import get_settings
from tsotsa_api.shared.types import generate_uuid7

REGIONS = [
    {"code": "AD", "name": "Adamaoua", "country_code": "CMR"},
    {"code": "CE", "name": "Centre", "country_code": "CMR"},
    {"code": "ES", "name": "Est", "country_code": "CMR"},
    {"code": "EN", "name": "Extrême-Nord", "country_code": "CMR"},
    {"code": "LT", "name": "Littoral", "country_code": "CMR"},
    {"code": "NO", "name": "Nord", "country_code": "CMR"},
    {"code": "NW", "name": "Nord-Ouest", "country_code": "CMR"},
    {"code": "OU", "name": "Ouest", "country_code": "CMR"},
    {"code": "SU", "name": "Sud", "country_code": "CMR"},
    {"code": "SW", "name": "Sud-Ouest", "country_code": "CMR"},
]

ORGANIZATIONS = [
    {
        "name": "CMA de Kousséri",
        "type": "cma",
        "region_code": "EN",
        "address": "Centre Médical d'Arrondissement, Kousséri",
    },
    {
        "name": "Hôpital Central de Yaoundé",
        "type": "hopital",
        "region_code": "CE",
        "address": "Quartier Melen, Yaoundé",
    },
    {
        "name": "Hôpital Général de Douala",
        "type": "hopital",
        "region_code": "LT",
        "address": "Zone Bépanda, Douala",
    },
    {
        "name": "Hôpital Régional de Bafoussam",
        "type": "hopital",
        "region_code": "OU",
        "address": "Bafoussam Centre, Ouest",
    },
    {
        "name": "Hôpital Régional de Garoua",
        "type": "hopital",
        "region_code": "NO",
        "address": "Garoua Plateau, Nord",
    },
    {
        "name": "Centre Médical de Bafang",
        "type": "centre_de_sante",
        "region_code": "OU",
        "address": "Bafang, Ouest",
    },
]


async def seed() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    now = datetime.now(UTC)

    async with engine.begin() as conn:
        print("[*] Seeding Cameroon regions...")
        region_ids: dict[str, bytes] = {}

        for reg in REGIONS:
            code = reg["code"]
            row = (
                await conn.execute(
                    text("SELECT id FROM regions WHERE code = :code"),
                    {"code": code},
                )
            ).fetchone()

            if row:
                region_ids[code] = row[0]
                await conn.execute(
                    text("UPDATE regions SET name = :name, country_code = :cc WHERE id = :id"),
                    {"id": row[0], "name": reg["name"], "cc": reg["country_code"]},
                )
                print(f"  [✓] Région existante mise à jour : {reg['name']} ({code})")
            else:
                rid = uuid.UUID(generate_uuid7()).bytes
                region_ids[code] = rid
                await conn.execute(
                    text(
                        "INSERT INTO regions (id, code, name, country_code) "
                        "VALUES (:id, :code, :name, :cc)"
                    ),
                    {"id": rid, "code": code, "name": reg["name"], "cc": reg["country_code"]},
                )
                print(f"  [+] Région créée : {reg['name']} ({code})")

        print("\n[*] Seeding Healthcare Organizations...")
        for org in ORGANIZATIONS:
            reg_bytes = region_ids.get(org["region_code"])
            row = (
                await conn.execute(
                    text("SELECT id FROM organizations WHERE name = :name"),
                    {"name": org["name"]},
                )
            ).fetchone()

            if row:
                await conn.execute(
                    text(
                        "UPDATE organizations SET type = :type, region_id = :rid, "
                        "address = :addr, status = 'active', updated_at = :now WHERE id = :id"
                    ),
                    {
                        "id": row[0],
                        "type": org["type"],
                        "rid": reg_bytes,
                        "addr": org["address"],
                        "now": now,
                    },
                )
                print(f"  [✓] Établissement mis à jour : {org['name']}")
            else:
                oid = uuid.UUID(generate_uuid7()).bytes
                await conn.execute(
                    text(
                        "INSERT INTO organizations (id, name, type, region_id, address, status, created_at, updated_at) "
                        "VALUES (:id, :name, :type, :rid, :addr, 'active', :now, :now)"
                    ),
                    {
                        "id": oid,
                        "name": org["name"],
                        "type": org["type"],
                        "rid": reg_bytes,
                        "addr": org["address"],
                        "now": now,
                    },
                )
                print(f"  [+] Établissement créé : {org['name']}")

    await engine.dispose()
    print("\n[✓] Seeding terminé avec succès !")


if __name__ == "__main__":
    asyncio.run(seed())
