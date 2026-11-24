"""FastAPI endpoints for staff management, validation, and permissions delegation."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity.dependencies import (
    require_permission,
)
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.permissions_service import PermissionsService
from tsotsa_api.modules.identity.schemas import MessageResponse, UserProfileResponse
from tsotsa_api.modules.identity.schemas_staff import (
    PermissionGrantRequest,
    PermissionGrantResponse,
    PermissionRevokeRequest,
    StaffValidationRequest,
)
from tsotsa_api.modules.identity.staff_service import StaffService

staff_router = APIRouter(prefix="/staff", tags=["Staff Management"])
permissions_router = APIRouter(prefix="/permissions", tags=["Permissions & Delegations"])


@staff_router.get(
    "/pending",
    response_model=list[UserProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Lister le personnel en attente de validation",
)
async def list_pending_staff(
    actor: User = Depends(require_permission("staff.validate")),
    db: AsyncSession = Depends(get_db_session),
) -> list[UserProfileResponse]:
    """Retrieve caregivers and field agents awaiting validation."""
    service = StaffService(db)
    pending_users = await service.list_pending_staff(actor)
    return [
        UserProfileResponse(
            id=u.id,
            display_name=u.display_name,
            first_name=u.first_name,
            last_name=u.last_name,
            locality=u.locality,
            language=u.preferred_locale,
            preferred_locale=u.preferred_locale if u.preferred_locale in ("fr", "en") else "fr",  # type: ignore[arg-type]
            status=u.status,
            roles=[ur.role.code for ur in u.user_roles if ur.role],
            permissions=[],
            is_verified_caregiver=False,
        )
        for u in pending_users
    ]


@staff_router.post(
    "/{user_id}/validate",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Valider ou refuser un compte soignant ou agent de terrain",
)
async def validate_staff(
    user_id: str,
    payload: StaffValidationRequest,
    actor: User = Depends(require_permission("staff.validate")),
    db: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    """Validate or refuse a pending staff account."""
    service = StaffService(db)
    user = await service.validate_staff(
        actor=actor,
        target_user_id=user_id,
        decision=payload.decision,
        refusal_reason=payload.refusal_reason,
    )
    status_label = "validé" if user.status == "active" else "refusé"
    return MessageResponse(message=f"Le compte a été {status_label} avec succès.")


@staff_router.post(
    "/{user_id}/suspend",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Suspendre un compte utilisateur",
)
async def suspend_user(
    user_id: str,
    actor: User = Depends(require_permission("accounts.delete")),
    db: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    """Suspend user account."""
    service = StaffService(db)
    await service.suspend_user(actor, user_id)
    return MessageResponse(message="Compte suspendu avec succès.")


@staff_router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Supprimer (soft delete) un compte utilisateur",
)
async def delete_user(
    user_id: str,
    actor: User = Depends(require_permission("accounts.delete")),
    db: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    """Soft delete user account."""
    service = StaffService(db)
    await service.soft_delete_user(actor, user_id)
    return MessageResponse(message="Compte supprimé avec succès.")


class PromoteSuperCaregiverRequest(BaseModel):
    caregiver_id: str


@staff_router.post(
    "/promote-super-caregiver",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Nommer un autre Super Soignant",
)
async def promote_super_caregiver(
    payload: PromoteSuperCaregiverRequest,
    actor: User = Depends(require_permission("permissions.manage")),
    db: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    """Promote another caregiver to Super Caregiver coordinator."""
    service = StaffService(db)
    await service.promote_to_super_caregiver(actor, payload.caregiver_id)
    return MessageResponse(message="Soignant nommé Super Soignant avec succès.")


@permissions_router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Lister toutes les permissions canoniques",
)
async def list_permissions(
    actor: User = Depends(require_permission("permissions.manage")),
    db: AsyncSession = Depends(get_db_session),
) -> list[dict[str, str | None]]:
    """List system permissions."""
    service = PermissionsService(db)
    perms = await service.list_permissions()
    return [
        {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "description": p.description,
        }
        for p in perms
    ]


@permissions_router.get(
    "/users/{user_id}",
    response_model=list[PermissionGrantResponse],
    status_code=status.HTTP_200_OK,
    summary="Lister les droits délégués d'un utilisateur",
)
async def list_user_grants(
    user_id: str,
    actor: User = Depends(require_permission("permissions.manage")),
    db: AsyncSession = Depends(get_db_session),
) -> list[PermissionGrantResponse]:
    """List granted permissions for a target user."""
    service = PermissionsService(db)
    grants = await service.list_user_grants(user_id)
    return [
        PermissionGrantResponse(
            id=g.id,
            user_id=g.user_id,
            permission_code=g.permission.code,
            granted_by=g.granted_by,
            reason=g.reason,
            valid_from=g.valid_from,
            valid_to=g.valid_to,
            is_active=g.is_active,
        )
        for g in grants
    ]


@permissions_router.post(
    "/grant",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Déléguer un droit à un utilisateur",
)
async def grant_permission(
    payload: PermissionGrantRequest,
    actor: User = Depends(require_permission("permissions.manage")),
    db: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    """Delegate a permission."""
    service = PermissionsService(db)
    await service.grant_permission(
        actor=actor,
        target_user_id=payload.target_user_id,
        permission_code=payload.permission_code,
        reason=payload.reason,
        valid_to=payload.valid_to,
    )
    return MessageResponse(message=f"Droit '{payload.permission_code}' accordé avec succès.")


@permissions_router.post(
    "/revoke",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Révoquer un droit délégué",
)
async def revoke_permission(
    payload: PermissionRevokeRequest,
    actor: User = Depends(require_permission("permissions.manage")),
    db: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    """Revoke a permission grant."""
    service = PermissionsService(db)
    count = await service.revoke_permission(
        actor=actor,
        target_user_id=payload.target_user_id,
        permission_code=payload.permission_code,
    )
    msg = f"Droit '{payload.permission_code}' révoqué ({count} délégation(s) désactivée(s))."
    return MessageResponse(message=msg)
