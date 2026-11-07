"""CLI script to seed official WHO Child Growth Standards 2006 tables into database."""

from __future__ import annotations

import asyncio
import os
import sys

# Ensure apps/api/src is on sys.path
api_src = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api", "src"))
if api_src not in sys.path:
    sys.path.insert(0, api_src)

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from tsotsa_api.core.config import get_settings
from tsotsa_api.modules.growth.service import GrowthService


async def main() -> None:
    settings = get_settings()
    db_url = settings.DATABASE_MIGRATIONS_URL or settings.DATABASE_URL
    print(f"Connexion à la base pour chargement des tables OMS : {db_url}")

    engine = create_async_engine(db_url, echo=False)
    maker = async_sessionmaker(engine, expire_on_commit=False)

    async with maker() as session:
        service = GrowthService(session)
        count = await service.seed_from_directory("data/who")
        print(f"Chargement réussi : {count} points de référence OMS synchronisés.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

