"""FastAPI endpoints for Domain J: Notifications, Preferences, and Device Tokens."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.core.errors import ForbiddenError
from tsotsa_api.modules.identity import get_current_user, is_user_admin
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.notifications.schemas import (
    DeviceTokenCreate,
    DeviceTokenRead,
    InAppNotificationRead,
    NotificationLogItem,
    NotificationPreferenceRead,
    NotificationPreferenceSetRequest,
    NotificationStatsResponse,
    NotificationTemplateRead,
    NotificationTemplateUpdate,
)
from tsotsa_api.modules.notifications.service import NotificationsService

notifications_router = APIRouter(tags=["Notifications"])


# --- Preferences ---
@notifications_router.get(
    "/notification-preferences",
    response_model=list[NotificationPreferenceRead],
    summary="Récupérer ses préférences de notification",
)
async def get_my_preferences(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[NotificationPreferenceRead]:
    service = NotificationsService(db)
    return await service.list_preferences(user.id)


@notifications_router.post(
    "/notification-preferences",
    response_model=NotificationPreferenceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Configurer une préférence de notification",
)
async def set_my_preference(
    payload: NotificationPreferenceSetRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> NotificationPreferenceRead:
    service = NotificationsService(db)
    return await service.set_preference(user.id, payload)


# --- Device Tokens ---
@notifications_router.post(
    "/device-tokens",
    response_model=DeviceTokenRead,
    status_code=status.HTTP_201_CREATED,
    summary="Enregistrer un jeton push de téléphone",
)
async def register_device_token(
    payload: DeviceTokenCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DeviceTokenRead:
    service = NotificationsService(db)
    return await service.register_device_token(user.id, payload)


@notifications_router.delete(
    "/device-tokens/{token}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Révoquer un jeton push",
)
async def revoke_device_token(
    token: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = NotificationsService(db)
    await service.revoke_device_token(user.id, token)


# --- In-App Notification Center ---
@notifications_router.get(
    "/in-app-notifications",
    response_model=list[InAppNotificationRead],
    summary="Centre de notifications de l'utilisateur",
)
async def list_in_app_notifications(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    unread_only: Annotated[bool, Query()] = False,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[InAppNotificationRead]:
    service = NotificationsService(db)
    return await service.list_in_app(user.id, unread_only=unread_only, limit=limit)


@notifications_router.post(
    "/in-app-notifications/{id}/read",
    response_model=InAppNotificationRead,
    summary="Marquer une notification comme lue",
)
async def mark_notification_read(
    id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> InAppNotificationRead:
    service = NotificationsService(db)
    return await service.mark_read(notification_id=id, user_id=user.id)


@notifications_router.post(
    "/in-app-notifications/{id}/snooze",
    response_model=InAppNotificationRead,
    summary="Reporter un rappel ('Plus tard' : +15 minutes)",
)
async def snooze_notification(
    id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    minutes: Annotated[int, Query(ge=5, le=120)] = 15,
) -> InAppNotificationRead:
    service = NotificationsService(db)
    return await service.snooze(notification_id=id, user_id=user.id, minutes=minutes)


# --- Administration ---
@notifications_router.get(
    "/admin/notifications/stats",
    response_model=NotificationStatsResponse,
    summary="Compteurs d'envois de notifications",
)
async def get_notification_stats(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> NotificationStatsResponse:
    if not await is_user_admin(user, db):
        raise ForbiddenError("Réservé à l'administration.")
    service = NotificationsService(db)
    return await service.get_stats()


@notifications_router.get(
    "/admin/notifications/log",
    response_model=list[NotificationLogItem],
    summary="Journal d'envoi des notifications",
)
async def list_notification_logs(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[NotificationLogItem]:
    if not await is_user_admin(user, db):
        raise ForbiddenError("Réservé à l'administration.")
    service = NotificationsService(db)
    return await service.list_logs(limit=limit, status_filter=status_filter)


@notifications_router.get(
    "/admin/notification-templates",
    response_model=list[NotificationTemplateRead],
    summary="Lister les gabarits de messages",
)
async def list_templates(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[NotificationTemplateRead]:
    if not await is_user_admin(user, db):
        raise ForbiddenError("Réservé à l'administration.")
    service = NotificationsService(db)
    return await service.list_templates()


@notifications_router.patch(
    "/admin/notification-templates/{id}",
    response_model=NotificationTemplateRead,
    summary="Mettre à jour un gabarit de message",
)
async def update_template(
    id: str,
    payload: NotificationTemplateUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> NotificationTemplateRead:
    if not await is_user_admin(user, db):
        raise ForbiddenError("Réservé à l'administration.")
    service = NotificationsService(db)
    return await service.update_template(id, payload, actor_user_id=user.id)
