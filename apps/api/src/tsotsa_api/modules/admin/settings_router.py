"""Admin routes for platform health, custom-products review, and notification settings."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.admin.schemas import (
    NotificationSettingsRead,
    NotificationSettingsUpdate,
    PlatformHealthResponse,
)
from tsotsa_api.modules.admin.service import AdminService
from tsotsa_api.modules.identity import require_role
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.notifications.schemas import (
    NotificationTemplateRead,
    NotificationTemplateUpdate,
)

admin_settings_router = APIRouter(dependencies=[Depends(require_role("admin"))])


@admin_settings_router.get(
    "/notifications/settings",
    response_model=NotificationSettingsRead,
    summary="Réglages globaux des notifications",
)
async def get_notification_settings(
    db: AsyncSession = Depends(get_db_session),
) -> NotificationSettingsRead:
    srv = AdminService(db)
    return await srv.get_notification_settings()


@admin_settings_router.put(
    "/notifications/settings",
    response_model=NotificationSettingsRead,
    summary="Mettre à jour les réglages globaux des notifications",
)
async def update_notification_settings(
    payload: NotificationSettingsUpdate,
    admin_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db_session),
) -> NotificationSettingsRead:
    srv = AdminService(db)
    res = await srv.update_notification_settings(payload, admin_user.id)
    await db.commit()
    return res


@admin_settings_router.get(
    "/notifications/templates",
    response_model=list[NotificationTemplateRead],
    summary="Lister les modèles de messages FR/EN",
)
async def list_templates(
    db: AsyncSession = Depends(get_db_session),
) -> list[NotificationTemplateRead]:
    srv = AdminService(db)
    return await srv.notif_service.list_templates()


@admin_settings_router.patch(
    "/notifications/templates/{template_id}",
    response_model=NotificationTemplateRead,
    summary="Mettre à jour un modèle de message",
)
async def update_template(
    template_id: str,
    payload: NotificationTemplateUpdate,
    admin_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db_session),
) -> NotificationTemplateRead:
    srv = AdminService(db)
    res = await srv.notif_service.update_template(template_id, payload, actor_user_id=admin_user.id)
    await db.commit()
    return res


@admin_settings_router.get(
    "/health-metrics",
    response_model=PlatformHealthResponse,
    summary="Indicateurs de santé globale de la plateforme",
)
async def get_health_metrics(
    db: AsyncSession = Depends(get_db_session),
) -> PlatformHealthResponse:
    srv = AdminService(db)
    return await srv.get_platform_health()
