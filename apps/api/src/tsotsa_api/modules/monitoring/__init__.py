"""Monitoring module public exports."""

from tsotsa_api.modules.monitoring.router import (
    admin_alerts_router,
    alerts_router,
    dashboard_router,
    preferences_router,
)
from tsotsa_api.modules.monitoring.service import MonitoringService

__all__ = [
    "MonitoringService",
    "admin_alerts_router",
    "alerts_router",
    "dashboard_router",
    "preferences_router",
]
