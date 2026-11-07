"""Admin routes for user accounts and caregiver verification."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.admin.schemas import (
    AdminCaregiverListResponse,
    AdminCaregiverReviewRequest,
    AdminUserCreateRequest,
    AdminUserCreateResponse,
    AdminUserListResponse,
    AdminUserSuspendRequest,
)
from tsotsa_api.modules.admin.service import AdminService
from tsotsa_api.modules.identity import require_role
from tsotsa_api.modules.identity.models import User

admin_users_router = APIRouter(dependencies=[Depends(require_role("admin"))])


@admin_users_router.get(
    "/users", response_model=AdminUserListResponse, summary="Lister les comptes"
)
async def list_users(
    role: Annotated[str | None, Query(description="Filtrer par rôle")] = None,
    status: Annotated[str | None, Query(description="Filtrer par statut")] = None,
    search: Annotated[str | None, Query(description="Recherche nom, e-mail ou téléphone")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db_session),
) -> AdminUserListResponse:
    srv = AdminService(db)
    return await srv.list_users(role=role, status=status, search=search, limit=limit, offset=offset)


@admin_users_router.post(
    "/users",
    response_model=AdminUserCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer directement un compte avec invitation",
)
async def create_user(
    payload: AdminUserCreateRequest,
    admin_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db_session),
) -> AdminUserCreateResponse:
    srv = AdminService(db)
    res = await srv.create_user_invitation(admin_user.id, payload)
    await db.commit()
    return res


@admin_users_router.post("/users/{user_id}/suspend", summary="Suspendre un compte")
async def suspend_user(
    user_id: str,
    admin_user: Annotated[User, Depends(require_role("admin"))],
    payload: AdminUserSuspendRequest | None = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    srv = AdminService(db)
    reason = payload.reason if payload else None
    res = await srv.suspend_user(user_id, admin_user.id, reason=reason)
    await db.commit()
    return res


@admin_users_router.post("/users/{user_id}/reactivate", summary="Réactiver un compte")
async def reactivate_user(
    user_id: str,
    admin_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    srv = AdminService(db)
    res = await srv.reactivate_user(user_id, admin_user.id)
    await db.commit()
    return res


@admin_users_router.get(
    "/caregivers", response_model=AdminCaregiverListResponse, summary="Lister les soignants"
)
async def list_caregivers(
    status: Annotated[str | None, Query(description="Filtrer par statut")] = None,
    organization_id: Annotated[str | None, Query(description="Filtrer par établissement")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db_session),
) -> AdminCaregiverListResponse:
    srv = AdminService(db)
    return await srv.list_caregivers(
        status=status, organization_id=organization_id, limit=limit, offset=offset
    )


@admin_users_router.post("/caregivers/{user_id}/approve", summary="Approuver un soignant")
async def approve_caregiver(
    user_id: str,
    admin_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    srv = AdminService(db)
    req = AdminCaregiverReviewRequest(action="approve")
    res = await srv.review_caregiver(user_id, admin_user.id, req)
    await db.commit()
    return res


@admin_users_router.post("/caregivers/{user_id}/reject", summary="Refuser un soignant")
async def reject_caregiver(
    user_id: str,
    payload: AdminCaregiverReviewRequest,
    admin_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    srv = AdminService(db)
    req = AdminCaregiverReviewRequest(action="reject", reason=payload.reason)
    res = await srv.review_caregiver(user_id, admin_user.id, req)
    await db.commit()
    return res


@admin_users_router.post("/caregivers/{user_id}/request-document", summary="Demander un document")
async def request_document_caregiver(
    user_id: str,
    payload: AdminCaregiverReviewRequest,
    admin_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    srv = AdminService(db)
    req = AdminCaregiverReviewRequest(action="request_document", message=payload.message)
    res = await srv.review_caregiver(user_id, admin_user.id, req)
    await db.commit()
    return res
