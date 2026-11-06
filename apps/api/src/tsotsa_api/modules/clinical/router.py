"""FastAPI router for Domain Clinical (Evaluations, Scores, and Growth curves)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.clinical.schemas import EvaluationCreate, EvaluationRead
from tsotsa_api.modules.clinical.service import ClinicalService
from tsotsa_api.modules.identity import (
    get_current_user,
    is_user_admin,
    require_verified_caregiver,
)

clinical_router = APIRouter(
    prefix="/persons/{person_id}/evaluations", tags=["Clinical - Evaluations"]
)


@clinical_router.post(
    "",
    response_model=EvaluationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_evaluation(
    person_id: str,
    payload: EvaluationCreate,
    request: Request,
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> EvaluationRead:
    """Record an anthropometric consultation (strictly verified caregiver of establishment)."""
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(caregiver, db)
    service = ClinicalService(db)
    return await service.record_evaluation(
        caregiver_user_id=caregiver.id,
        is_admin=admin_flag,
        person_id=person_id,
        payload=payload,
        ip=ip,
    )


@clinical_router.get(
    "",
    response_model=list[EvaluationRead],
)
async def list_person_evaluations(
    person_id: str,
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[EvaluationRead]:
    """Retrieve consultation history (family member or authorized caregiver)."""
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(user, db)
    service = ClinicalService(db)
    return await service.list_evaluations(
        user_id=user.id,
        is_admin=admin_flag,
        person_id=person_id,
        limit=limit,
        offset=offset,
        ip=ip,
    )


@clinical_router.get(
    "/latest",
    response_model=EvaluationRead | None,
)
async def get_latest_person_evaluation(
    person_id: str,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> EvaluationRead | None:
    """Retrieve the most recent clinical evaluation for a followed child."""
    admin_flag = await is_user_admin(user, db)
    service = ClinicalService(db)
    return await service.get_latest_evaluation(
        user_id=user.id,
        is_admin=admin_flag,
        person_id=person_id,
    )


@clinical_router.get(
    "/curves",
)
async def get_person_growth_curves(
    person_id: str,
    indicator: str = Query(default="wfl", description="Indicateur: wfl, wfh, lhfa, wfa, acfa, bfa"),
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Fetch WHO reference curves overlaid with child's consultation history."""
    admin_flag = await is_user_admin(user, db)
    service = ClinicalService(db)
    return await service.get_growth_curves_with_points(
        user_id=user.id,
        is_admin=admin_flag,
        person_id=person_id,
        indicator=indicator,
    )
