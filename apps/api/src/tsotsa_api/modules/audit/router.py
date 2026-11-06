"""FastAPI router for Domain L (Audit log inspection by admin)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.audit.schemas import AuditLogRead
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.identity import require_role

audit_admin_router = APIRouter(prefix="/admin/audit-logs", tags=["Admin - Audit Logs"])


@audit_admin_router.get("", response_model=list[AuditLogRead])
async def list_audit_logs(
    actor_user_id: str | None = Query(None, description="Filtrer par utilisateur"),
    entity: str | None = Query(None, description="Filtrer par entité"),
    entity_id: str | None = Query(None, description="Filtrer par identifiant d'entité"),
    organization_id: str | None = Query(None, description="Filtrer par établissement"),
    limit: int = Query(100, ge=1, le=500, description="Nombre maximum de résultats"),
    offset: int = Query(0, ge=0, description="Décalage pour la pagination"),
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> list[AuditLogRead]:
    """Retrieve immutable audit logs with optional filters."""
    service = AuditService(db)
    items = await service.list_logs(
        actor_user_id=actor_user_id,
        entity=entity,
        entity_id=entity_id,
        organization_id=organization_id,
        limit=limit,
        offset=offset,
    )
    return [AuditLogRead.model_validate(it) for it in items]
