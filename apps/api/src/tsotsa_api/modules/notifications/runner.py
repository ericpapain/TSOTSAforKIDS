"""Dedicated background runner for periodic notifications and reminders."""

from __future__ import annotations

import asyncio
import logging
import sys

from tsotsa_api.core.database import async_session_factory
from tsotsa_api.modules.notifications.worker import NotificationWorker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("tsotsa.scheduler")


async def run_scheduler_tick() -> None:
    """Execute a single scheduler evaluation pass across due notifications."""
    async with async_session_factory() as session:
        worker = NotificationWorker(session=session)
        stats = await worker.run_tick()
        logger.info(
            "Scheduler tick completed: lookahead=%s sent=%s followups=%s",
            stats.get("lookahead_created", 0),
            stats.get("notifications_sent", 0),
            stats.get("followups_created", 0),
        )


async def main_loop(interval_seconds: int = 60) -> None:
    """Run continuous scheduler loop every minute until terminated."""
    logger.info("Notification scheduler service started (tick every %ss)", interval_seconds)
    while True:
        try:
            await run_scheduler_tick()
        except asyncio.CancelledError:
            logger.info("Notification scheduler received cancellation signal, stopping.")
            break
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("Error during scheduler tick: %s", exc, exc_info=True)
        await asyncio.sleep(interval_seconds)


if __name__ == "__main__":
    try:
        asyncio.run(main_loop())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Notification scheduler stopped.")
        sys.exit(0)
