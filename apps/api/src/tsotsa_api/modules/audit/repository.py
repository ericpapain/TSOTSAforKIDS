"""Repository for Domain L (Audit log) immutable append-only operations."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.audit.models import AuditLog


class AuditRepository:
    """Encapsulates append-only database operations for audit logging."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def log_entry(
        self,
        action: str,
        entity: str,
        actor_user_id: str | None = None,
        entity_id: str | None = None,
        organization_id: str | None = None,
        ip: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> AuditLog:
        """Insert an immutable audit log record."""
        entry = AuditLog(
            actor_user_id=actor_user_id,
            action=action.strip().lower(),
            entity=entity.strip().lower(),
            entity_id=str(entity_id) if entity_id else None,
            organization_id=organization_id,
            at=datetime.now(UTC),
            ip=ip.strip() if ip else None,
            details=details,
        )
        self.session.add(entry)
        await self.session.flush()
        return entry

    async def list_logs(
        self,
        actor_user_id: str | None = None,
        entity: str | None = None,
        entity_id: str | None = None,
        organization_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[AuditLog]:
        stmt = select(AuditLog)
        if actor_user_id:
            stmt = stmt.where(AuditLog.actor_user_id == actor_user_id)
        if entity:
            stmt = stmt.where(AuditLog.entity == entity.strip().lower())
        if entity_id:
            stmt = stmt.where(AuditLog.entity_id == str(entity_id))
        if organization_id:
            stmt = stmt.where(AuditLog.organization_id == organization_id)
        stmt = stmt.order_by(AuditLog.at.desc()).offset(offset).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def count_logs(
        self,
        actor_user_id: str | None = None,
        entity: str | None = None,
        entity_id: str | None = None,
        organization_id: str | None = None,
    ) -> int:
        stmt = select(func.count(AuditLog.id))
        if actor_user_id:
            stmt = stmt.where(AuditLog.actor_user_id == actor_user_id)
        if entity:
            stmt = stmt.where(AuditLog.entity == entity.strip().lower())
        if entity_id:
            stmt = stmt.where(AuditLog.entity_id == str(entity_id))
        if organization_id:
            stmt = stmt.where(AuditLog.organization_id == organization_id)
        res = await self.session.execute(stmt)
        return int(res.scalar() or 0)
