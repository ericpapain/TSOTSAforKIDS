"""Command-line utility to seed nutrients from CSV."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import async_session_factory
from tsotsa_api.modules.nutrients.service import NutrientService


async def seed_nutrients_command(
    csv_path: str | None = None, session: AsyncSession | None = None
) -> None:
    """Execute idempotent nutrient dictionary seeding."""
    if session:
        service = NutrientService(session)
        target = Path(csv_path) if csv_path else None
        loaded = await service.seed_from_csv(target)
        await session.commit()
        print(f"[OK] Successfully seeded {loaded} canonical nutrients.")
        return

    async with async_session_factory() as sess:
        service = NutrientService(sess)
        target = Path(csv_path) if csv_path else None
        loaded = await service.seed_from_csv(target)
        await sess.commit()
        print(f"[OK] Successfully seeded {loaded} canonical nutrients.")


def main() -> None:
    target_csv = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(seed_nutrients_command(target_csv))


if __name__ == "__main__":
    main()
