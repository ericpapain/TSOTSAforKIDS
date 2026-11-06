"""FastAPI routers for Domain I (Intakes, offline sync, history, compliance rate)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity import get_current_user, is_user_admin
from tsotsa_api.modules.intakes.schemas import (
    ComplianceRateResponse,
    IntakeCreate,
    IntakeRead,
    IntakeSyncRequest,
    IntakeSyncResponse,
)
from tsotsa_api.modules.intakes.service import IntakesService

intakes_router = APIRouter(tags=["Intakes"])


@intakes_router.post(
    "/intakes",
    response_model=IntakeRead,
    status_code=status.HTTP_201_CREATED,
)
async def record_intake(
    payload: IntakeCreate,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> IntakeRead:
    """Record a single intake (food or product). Idempotent on client-generated UUID."""
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(user, db)
    service = IntakesService(db)
    result = await service.record_single_intake(
        user_id=user.id,
        is_admin=admin_flag,
        payload=payload,
        ip=ip,
    )
    from tsotsa_api.modules.monitoring.service import MonitoringService

    monitoring = MonitoringService(db)
    await monitoring.on_intake_recorded(payload.person_id)
    return result


@intakes_router.post(
    "/sync/intakes",
    response_model=IntakeSyncResponse,
    status_code=status.HTTP_200_OK,
)
async def sync_offline_intakes(
    payload: IntakeSyncRequest,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> IntakeSyncResponse:
    """Synchronize a batch of offline recorded intakes idempotently."""
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(user, db)
    service = IntakesService(db)
    result = await service.sync_offline_intakes(
        user_id=user.id,
        is_admin=admin_flag,
        payload=payload,
        ip=ip,
    )
    from tsotsa_api.modules.monitoring.service import MonitoringService

    monitoring = MonitoringService(db)
    for it in payload.intakes:
        await monitoring.on_intake_recorded(it.person_id)
    return result


@intakes_router.get(
    "/persons/{person_id}/intakes",
    response_model=list[IntakeRead],
)
async def list_person_intakes(
    person_id: str,
    request: Request,
    item_type: str | None = Query(default=None, description="Filtre: 'product' ou 'food'"),
    consumption: str | None = Query(default=None, description="Filtre: 'all', 'half' ou 'refused'"),
    start_date: datetime | None = Query(default=None, description="Date de début ISO"),
    end_date: datetime | None = Query(default=None, description="Date de fin ISO"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[IntakeRead]:
    """Retrieve intake history for a followed person with optional filters."""
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(user, db)
    service = IntakesService(db)
    return await service.list_intakes(
        user_id=user.id,
        is_admin=admin_flag,
        person_id=person_id,
        item_type=item_type,
        consumption=consumption,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
        ip=ip,
    )


@intakes_router.get(
    "/persons/{person_id}/intakes/compliance-rate",
    response_model=ComplianceRateResponse,
)
async def get_intakes_compliance_rate(
    person_id: str,
    reference_date: datetime | None = Query(
        default=None, description="Date de référence (par défaut UTC maintenant)"
    ),
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ComplianceRateResponse:
    """Compute confirmed intake compliance rate over 7 days for clinical dashboard."""
    admin_flag = await is_user_admin(user, db)
    service = IntakesService(db)
    return await service.calculate_7_day_compliance_rate(
        user_id=user.id,
        is_admin=admin_flag,
        person_id=person_id,
        reference_dt=reference_date,
    )
