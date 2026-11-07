"""Service for Domain L (Audit log) reusable across all modules."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.audit.models import AuditLog
from tsotsa_api.modules.audit.repository import AuditRepository


class AuditService:
    """Service providing audit logging for health and sensitive operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = AuditRepository(session)

    async def log(
        self,
        action: str,
        entity: str,
        actor_user_id: str | None = None,
        entity_id: str | None = None,
        organization_id: str | None = None,
        ip: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> AuditLog:
        """Write an immutable audit log entry."""
        return await self.repo.log_entry(
            action=action,
            entity=entity,
            actor_user_id=actor_user_id,
            entity_id=entity_id,
            organization_id=organization_id,
            ip=ip,
            details=details,
        )

    async def list_logs(
        self,
        actor_user_id: str | None = None,
        entity: str | None = None,
        entity_id: str | None = None,
        organization_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[AuditLog]:
        return await self.repo.list_logs(
            actor_user_id=actor_user_id,
            entity=entity,
            entity_id=entity_id,
            organization_id=organization_id,
            limit=limit,
            offset=offset,
        )

    async def count_logs(
        self,
        actor_user_id: str | None = None,
        entity: str | None = None,
        entity_id: str | None = None,
        organization_id: str | None = None,
    ) -> int:
        return await self.repo.count_logs(
            actor_user_id=actor_user_id,
            entity=entity,
            entity_id=entity_id,
            organization_id=organization_id,
        )
