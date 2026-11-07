"""Weekly scheduled job for automatic ORKG synchronization (Requirement 7)."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.logging import get_logger
from tsotsa_api.modules.orkg_sync.schemas import OrkgSyncResponse
from tsotsa_api.modules.orkg_sync.service import OrkgSyncService

logger = get_logger(__name__)

WEEKLY_INTERVAL_SECONDS = 7 * 24 * 3600


async def run_weekly_orkg_sync_once(
    session: AsyncSession,
    system_user_id: str,
    orkg_client: Any | None = None,
    exports_dir: Path | None = None,
    raw_root: Path | None = None,
) -> OrkgSyncResponse:
    """Execute one scheduled weekly synchronization cycle and log any alerts."""
    service = OrkgSyncService(session)
    response = await service.synchronize(
        user_id=system_user_id,
        orkg_client=orkg_client,
        exports_dir=exports_dir,
        raw_root=raw_root,
    )
    if response.alerts:
        logger.warning(
            "Scheduled ORKG sync completed with alerts",
            status=response.status,
            alerts=response.alerts,
        )
    else:
        logger.info(
            "Scheduled ORKG sync completed",
            status=response.status,
            batch_id=response.batch_id,
        )
    await session.commit()
    return response


class OrkgWeeklyScheduler:
    """Background weekly scheduler for automatic ORKG synchronization."""

    def __init__(self, interval_seconds: float = WEEKLY_INTERVAL_SECONDS) -> None:
        self.interval_seconds = interval_seconds
        self._task: asyncio.Task[None] | None = None
        self._running = False

    def start(self, job_coro_factory: Any) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop(job_coro_factory))

    async def stop(self) -> None:
        self._running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _loop(self, job_coro_factory: Any) -> None:
        while self._running:
            try:
                await job_coro_factory()
            except Exception as exc:
                logger.error("Error in scheduled ORKG sync job", error=str(exc))
            await asyncio.sleep(self.interval_seconds)
