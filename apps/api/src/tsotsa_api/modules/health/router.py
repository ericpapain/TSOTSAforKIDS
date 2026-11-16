"""FastAPI HTTP router for child health events, triage and caregiver evaluations."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.health.schemas import (
    ClinicalAssessmentCreate,
    HealthAlertSummary,
    HealthEventActionCreate,
    HealthEventCaregiverOut,
    HealthEventCreate,
    HealthEventParentOut,
    SymptomCatalogOut,
)
from tsotsa_api.modules.health.service import HealthService
from tsotsa_api.modules.identity import get_current_user

health_router = APIRouter(prefix="/health", tags=["Health & Well-being"])


@health_router.get(
    "/symptoms/catalog",
    response_model=list[SymptomCatalogOut],
    status_code=status.HTTP_200_OK,
)
async def get_symptom_catalog(
    _user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[SymptomCatalogOut]:
    """Return active symptom catalog entries with conditional questions and priority indicators."""
    service = HealthService(db)
    return await service.get_symptom_catalog()


@health_router.post(
    "/events",
    response_model=HealthEventParentOut | HealthEventCaregiverOut,
    status_code=status.HTTP_201_CREATED,
)
async def declare_health_event(
    payload: HealthEventCreate,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> HealthEventParentOut | HealthEventCaregiverOut:
    """Report a health event for a child either standalone or during a meal."""
    ip = request.client.host if request.client else None
    service = HealthService(db)
    return await service.declare_health_event(actor_id=user.id, payload=payload, ip=ip)


@health_router.get(
    "/events/person/{person_id}",
    response_model=list[HealthEventParentOut | HealthEventCaregiverOut],
    status_code=status.HTTP_200_OK,
)
async def list_health_events_by_person(
    person_id: str,
    status_filter: str | None = Query(default=None, alias="status"),
    priority_filter: str | None = Query(default=None, alias="priority"),
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[HealthEventParentOut | HealthEventCaregiverOut]:
    """Retrieve chronological longitudinal health event history for an authorized child."""
    service = HealthService(db)
    return await service.list_events_for_person(
        actor_id=user.id,
        person_id=person_id,
        status=status_filter,
        priority=priority_filter,
    )


@health_router.get(
    "/events/{event_id}",
    response_model=HealthEventParentOut | HealthEventCaregiverOut,
    status_code=status.HTTP_200_OK,
)
async def get_health_event_detail(
    event_id: str,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> HealthEventParentOut | HealthEventCaregiverOut:
    """Fetch health event detail with role-appropriate visibility filtering."""
    service = HealthService(db)
    return await service.get_health_event(actor_id=user.id, event_id=event_id)


@health_router.post(
    "/events/{event_id}/assessments",
    response_model=HealthEventCaregiverOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_clinical_assessment(
    event_id: str,
    payload: ClinicalAssessmentCreate,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> HealthEventCaregiverOut:
    """Record a clinical doctor assessment on a reported health event."""
    ip = request.client.host if request.client else None
    service = HealthService(db)
    return await service.add_clinical_assessment(
        caregiver_id=user.id,
        event_id=event_id,
        payload=payload,
        ip=ip,
    )


@health_router.post(
    "/events/{event_id}/actions",
    response_model=HealthEventCaregiverOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_health_action(
    event_id: str,
    payload: HealthEventActionCreate,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> HealthEventCaregiverOut:
    """Record a medical action (transfer, clarification, follow-up, closure)."""
    ip = request.client.host if request.client else None
    service = HealthService(db)
    return await service.add_health_action(
        actor_id=user.id,
        event_id=event_id,
        payload=payload,
        ip=ip,
    )


@health_router.get(
    "/alerts",
    response_model=list[HealthAlertSummary],
    status_code=status.HTTP_200_OK,
)
async def list_health_alerts(
    min_priority: str | None = Query(default=None, alias="min_priority"),
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[HealthAlertSummary]:
    """Retrieve open alerts for healthcare professionals and coordinators."""
    service = HealthService(db)
    return await service.list_open_health_alerts(actor_id=user.id, min_priority=min_priority)
