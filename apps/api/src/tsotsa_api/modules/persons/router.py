"""FastAPI routers for Domain C (Family members and Caregiver medical access)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity import (
    get_current_user,
    is_user_admin,
    require_verified_caregiver,
)
from tsotsa_api.modules.persons.schemas import (
    AcceptInvitationRequest,
    CareAttachmentRequest,
    CaregiverPersonRead,
    PersonCreate,
    PersonRead,
    PersonUpdate,
    SecondParentInviteRequest,
    SecondParentInviteResponse,
)
from tsotsa_api.modules.persons.service import PersonsService

family_router = APIRouter(prefix="/family/members", tags=["Family - Followed Persons"])
caregiver_persons_router = APIRouter(prefix="/caregiver", tags=["Caregiver - Followed Persons"])


@family_router.post("", response_model=PersonRead, status_code=status.HTTP_201_CREATED)
async def create_family_member(
    payload: PersonCreate,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PersonRead:
    """Add a new followed person (child, self, relative) to the family account."""
    ip = request.client.host if request.client else None
    service = PersonsService(db)
    return await service.create_family_member(user_id=user.id, payload=payload, ip=ip)


@family_router.get("", response_model=list[PersonRead])
async def list_my_family_members(
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[PersonRead]:
    """List all followed persons linked to the authenticated family account."""
    ip = request.client.host if request.client else None
    service = PersonsService(db)
    return await service.list_family_members(user_id=user.id, ip=ip)


@family_router.get("/{person_id}", response_model=PersonRead)
async def get_my_family_member(
    person_id: str,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PersonRead:
    """Get details of a followed person linked to the family account."""
    ip = request.client.host if request.client else None
    service = PersonsService(db)
    return await service.get_family_member(user_id=user.id, person_id=person_id, ip=ip)


@family_router.put("/{person_id}", response_model=PersonRead)
async def update_my_family_member(
    person_id: str,
    payload: PersonUpdate,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PersonRead:
    """Update details of a followed person linked to the family account."""
    ip = request.client.host if request.client else None
    service = PersonsService(db)
    return await service.update_family_member(
        user_id=user.id, person_id=person_id, payload=payload, ip=ip
    )


@family_router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_my_family_member(
    person_id: str,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Remove a followed person from the account (soft-deletes if no other links)."""
    ip = request.client.host if request.client else None
    service = PersonsService(db)
    await service.remove_family_member(user_id=user.id, person_id=person_id, ip=ip)


@family_router.post(
    "/{person_id}/invite",
    response_model=SecondParentInviteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def invite_second_parent(
    person_id: str,
    payload: SecondParentInviteRequest,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SecondParentInviteResponse:
    """Invite a second parent or guardian by phone or email to link the same person."""
    ip = request.client.host if request.client else None
    service = PersonsService(db)
    return await service.invite_second_parent(
        user_id=user.id, person_id=person_id, payload=payload, ip=ip
    )


@family_router.post("/invitations/accept", response_model=PersonRead)
async def accept_second_parent_invitation(
    payload: AcceptInvitationRequest,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PersonRead:
    """Accept an invitation to link an existing followed person to the current account."""
    ip = request.client.host if request.client else None
    service = PersonsService(db)
    return await service.accept_second_parent_invitation(
        second_user_id=user.id, token_str=payload.token, ip=ip
    )


@family_router.post("/{person_id}/care", status_code=status.HTTP_201_CREATED)
async def attach_person_to_establishment(
    person_id: str,
    payload: CareAttachmentRequest,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """Attach a followed person to a health organization for medical care."""
    ip = request.client.host if request.client else None
    service = PersonsService(db)
    await service.attach_person_to_organization(
        person_id=person_id,
        organization_id=payload.organization_id,
        primary_caregiver_id=payload.primary_caregiver_id,
        actor_user_id=user.id,
        ip=ip,
    )
    return {"message": "Personne rattachée avec succès à l'établissement de santé."}


@caregiver_persons_router.get(
    "/organizations/{org_id}/persons", response_model=list[CaregiverPersonRead]
)
async def list_caregiver_establishment_persons(
    org_id: str,
    request: Request,
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> list[CaregiverPersonRead]:
    """List followed persons in caregiver's establishment (active consent required)."""
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(caregiver, db)
    service = PersonsService(db)
    return await service.list_establishment_persons(
        caregiver_user_id=caregiver.id,
        organization_id=org_id,
        is_admin=admin_flag,
        ip=ip,
    )


@caregiver_persons_router.get(
    "/organizations/{org_id}/persons/{person_id}", response_model=CaregiverPersonRead
)
async def get_caregiver_establishment_person(
    org_id: str,
    person_id: str,
    request: Request,
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> CaregiverPersonRead:
    """Read a followed person in caregiver's establishment (active consent required)."""
    ip = request.client.host if request.client else None
    admin_flag = await is_user_admin(caregiver, db)
    service = PersonsService(db)
    return await service.get_establishment_person(
        caregiver_user_id=caregiver.id,
        organization_id=org_id,
        person_id=person_id,
        is_admin=admin_flag,
        ip=ip,
    )
