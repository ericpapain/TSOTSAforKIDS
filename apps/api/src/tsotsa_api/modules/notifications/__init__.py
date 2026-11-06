"""Module Notifications (Domain J): Push, SMS, Email, In-app and Scheduler."""

from __future__ import annotations

from tsotsa_api.modules.notifications.models import DeviceToken, Notification, NotificationTemplate
from tsotsa_api.modules.notifications.router import notifications_router
from tsotsa_api.modules.notifications.service import NotificationsService
from tsotsa_api.modules.notifications.worker import NotificationWorker

__all__ = [
    "DeviceToken",
    "Notification",
    "NotificationTemplate",
    "NotificationWorker",
    "NotificationsService",
    "notifications_router",
]
