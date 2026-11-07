"""FastAPI router for administrative ORKG synchronization endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity import require_role
from tsotsa_api.modules.orkg_sync.repository import OrkgSyncRepository
from tsotsa_api.modules.orkg_sync.schemas import (
    OrkgComparisonRead,
    OrkgSnapshotRead,
    OrkgSyncRequest,
    OrkgSyncResponse,
)
from tsotsa_api.modules.orkg_sync.service import OrkgSyncService

admin_router = APIRouter(prefix="/admin/orkg", tags=["Admin - ORKG Sync"])


@admin_router.post("/sync", response_model=OrkgSyncResponse)
async def trigger_orkg_sync(
    payload: OrkgSyncRequest | None = Body(default=None),
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> OrkgSyncResponse:
    """Trigger ORKG extraction, normalization, diff, and review batch creation."""
    service = OrkgSyncService(db)
    comp_ids = payload.comparison_ids if payload else None
    result = await service.synchronize(user_id=admin.id, comparison_ids=comp_ids)
    await db.commit()
    return result


@admin_router.get("/comparisons", response_model=list[OrkgComparisonRead])
async def list_orkg_comparisons(
    only_active: bool = Query(default=False),
    _admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> list[OrkgComparisonRead]:
    """List ORKG comparisons from the registry."""
    service = OrkgSyncService(db)
    items = await service.repo.list_comparisons(only_active=only_active)
    if not items:
        await service.load_registry_from_csv()
        await db.commit()
        items = await service.repo.list_comparisons(only_active=only_active)
    return [OrkgComparisonRead.model_validate(c) for c in items]


@admin_router.get("/snapshots", response_model=list[OrkgSnapshotRead])
async def list_orkg_snapshots(
    comparison_id: str | None = Query(default=None),
    _admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> list[OrkgSnapshotRead]:
    """List recorded ORKG fetch snapshots and administrative alerts."""
    repo = OrkgSyncRepository(db)
    snaps = await repo.list_snapshots(comparison_id=comparison_id)
    return [OrkgSnapshotRead.model_validate(s) for s in snaps]
