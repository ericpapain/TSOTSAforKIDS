"""FastAPI routers for Caregiver Dashboard, Clinical Alerts, and Admin Rules."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.core.errors import ForbiddenError
from tsotsa_api.modules.identity import (
    get_current_user,
    is_user_admin,
    require_role,
    require_verified_caregiver,
)
from tsotsa_api.modules.monitoring.schemas import (
    AlertHandleRequest,
    AlertRead,
    AlertRuleRead,
    AlertRuleUpdate,
    DashboardMetricsResponse,
    DashboardPersonItem,
    DashboardScheduledEvaluationItem,
    NotificationPreferenceRead,
    NotificationPreferenceSetRequest,
)
from tsotsa_api.modules.monitoring.service import MonitoringService

dashboard_router = APIRouter(prefix="/dashboard", tags=["Caregiver Dashboard"])
alerts_router = APIRouter(prefix="/alerts", tags=["Clinical Alerts"])
admin_alerts_router = APIRouter(prefix="/admin/alert-rules", tags=["Admin - Alert Rules"])
preferences_router = APIRouter(prefix="/notification-preferences", tags=["Preferences"])


async def _resolve_caregiver_org(caregiver: Any, is_admin: bool, service: MonitoringService) -> str:
    org_id = await service.orgs.get_caregiver_organization_id(caregiver.id)
    if not org_id and not is_admin:
        raise ForbiddenError("Soignant non rattaché à un établissement actif.")
    return org_id or ""


# -----------------------------------------------------------------------------
# Dashboard Endpoints
# -----------------------------------------------------------------------------


@dashboard_router.get("/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    request: Request,
    organization_id: str | None = Query(None, description="Filtrer par établissement (admin)"),
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> DashboardMetricsResponse:
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(caregiver, db)
    service = MonitoringService(db)
    org_id = organization_id or await _resolve_caregiver_org(caregiver, admin_flag, service)
    return await service.dashboard.get_metrics(
        caregiver_user_id=caregiver.id,
        organization_id=org_id,
        is_admin=admin_flag,
        ip=ip,
    )


@dashboard_router.get(
    "/scheduled-evaluations", response_model=list[DashboardScheduledEvaluationItem]
)
async def list_scheduled_evaluations(
    organization_id: str | None = Query(None, description="Filtrer par établissement (admin)"),
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> list[DashboardScheduledEvaluationItem]:
    admin_flag = await is_user_admin(caregiver, db)
    service = MonitoringService(db)
    org_id = organization_id or await _resolve_caregiver_org(caregiver, admin_flag, service)
    return await service.dashboard.list_scheduled_evaluations(
        caregiver_user_id=caregiver.id,
        organization_id=org_id,
        is_admin=admin_flag,
    )


@dashboard_router.get("/persons", response_model=list[DashboardPersonItem])
async def list_dashboard_persons(
    status: str | None = Query(None, description="Statut nutritionnel (MAS, MAM, normal)"),
    region_id: str | None = Query(None, description="Région"),
    min_age_months: int | None = Query(None, ge=0),
    max_age_months: int | None = Query(None, ge=0),
    search: str | None = Query(None, description="Recherche prénom ou pseudonyme"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    organization_id: str | None = Query(None),
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> list[DashboardPersonItem]:
    admin_flag = await is_user_admin(caregiver, db)
    service = MonitoringService(db)
    org_id = organization_id or await _resolve_caregiver_org(caregiver, admin_flag, service)
    return await service.dashboard.list_dashboard_persons(
        caregiver_user_id=caregiver.id,
        organization_id=org_id,
        status=status,
        region_id=region_id,
        min_age_months=min_age_months,
        max_age_months=max_age_months,
        search=search,
        limit=limit,
        offset=offset,
        is_admin=admin_flag,
    )


# -----------------------------------------------------------------------------
# Alerts Endpoints
# -----------------------------------------------------------------------------


@alerts_router.get("", response_model=list[AlertRead])
async def list_alerts(
    request: Request,
    status: str | None = Query("open", description="Statut : open, handled"),
    priority: str | None = Query(None, description="Priorité : urgent, high, normal"),
    person_id: str | None = Query(None, description="Filtrer par personne suivie"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    organization_id: str | None = Query(None),
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> list[AlertRead]:
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(caregiver, db)
    service = MonitoringService(db)
    org_id = organization_id or await _resolve_caregiver_org(caregiver, admin_flag, service)
    return await service.list_alerts(
        caregiver_user_id=caregiver.id,
        organization_id=org_id,
        status=status,
        priority=priority,
        person_id=person_id,
        limit=limit,
        offset=offset,
        is_admin=admin_flag,
        ip=ip,
    )


@alerts_router.post("/{alert_id}/handle", response_model=AlertRead)
async def handle_alert(
    alert_id: str,
    payload: AlertHandleRequest,
    request: Request,
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> AlertRead:
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(caregiver, db)
    service = MonitoringService(db)
    result = await service.handle_alert(
        caregiver_user_id=caregiver.id,
        alert_id=alert_id,
        notes=payload.notes,
        is_admin=admin_flag,
        ip=ip,
    )
    await db.commit()
    return result


# -----------------------------------------------------------------------------
# Admin: Alert Rules Endpoints
# -----------------------------------------------------------------------------


@admin_alerts_router.get("", response_model=list[AlertRuleRead])
async def list_alert_rules(
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> list[AlertRuleRead]:
    service = MonitoringService(db)
    return await service.list_alert_rules(is_admin=True)


@admin_alerts_router.patch("/{rule_id}", response_model=AlertRuleRead)
async def update_alert_rule(
    rule_id: str,
    payload: AlertRuleUpdate,
    request: Request,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> AlertRuleRead:
    ip = request.client.host if request.client else None
    service = MonitoringService(db)
    result = await service.update_alert_rule(
        admin_user_id=admin.id,
        rule_id=rule_id,
        payload=payload,
        is_admin=True,
        ip=ip,
    )
    await db.commit()
    return result


# -----------------------------------------------------------------------------
# User Preferences Endpoints
# -----------------------------------------------------------------------------


@preferences_router.post(
    "", response_model=NotificationPreferenceRead, status_code=status.HTTP_201_CREATED
)
async def set_notification_preference(
    payload: NotificationPreferenceSetRequest,
    current_user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> NotificationPreferenceRead:
    service = MonitoringService(db)
    result = await service.set_notification_preference(user_id=current_user.id, payload=payload)
    await db.commit()
    return result
