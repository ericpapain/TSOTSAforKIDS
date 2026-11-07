"""FastAPI endpoints for Domain B (Organizations, Regions, User Region Preference) and Isolation."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity import (
    get_current_user,
    is_user_admin,
    require_role,
    require_verified_caregiver,
)
from tsotsa_api.modules.organizations.schemas import (
    CaregiverAttachmentRead,
    CaregiverAttachmentRequest,
    OrganizationCreate,
    OrganizationRead,
    OrganizationUpdate,
    PersonInCareCreate,
    PersonInCareRead,
    RegionCreate,
    RegionRead,
    RegionUpdate,
    UserRegionPreferenceRead,
    UserRegionPreferenceUpdate,
)
from tsotsa_api.modules.organizations.service import OrganizationsService

organizations_router = APIRouter(prefix="/organizations", tags=["Organizations"])
regions_router = APIRouter(prefix="/regions", tags=["Regions"])
users_region_router = APIRouter(prefix="/users/me", tags=["User Preferences"])
admin_router = APIRouter(prefix="/admin", tags=["Admin - Organizations & Regions"])


@organizations_router.get("", response_model=list[OrganizationRead])
async def list_active_organizations(
    region_id: str | None = Query(None, description="Filtrer par région"),
    db: AsyncSession = Depends(get_db_session),
) -> list[OrganizationRead]:
    """List active health establishments."""
    service = OrganizationsService(db)
    orgs = await service.list_organizations(region_id=region_id, only_active=True)
    return [OrganizationRead.model_validate(o) for o in orgs]


@organizations_router.get("/{org_id}", response_model=OrganizationRead)
async def get_organization_detail(
    org_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> OrganizationRead:
    """Get details of a health establishment."""
    service = OrganizationsService(db)
    org = await service.get_organization(org_id)
    return OrganizationRead.model_validate(org)


@organizations_router.post(
    "/{org_id}/persons",
    response_model=PersonInCareRead,
    status_code=status.HTTP_201_CREATED,
)
async def register_person_in_establishment(
    org_id: str,
    payload: PersonInCareCreate,
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> PersonInCareRead:
    """Register a followed person in an establishment (strictly scoped to caregiver's org)."""
    admin_flag = await is_user_admin(caregiver, db)
    from tsotsa_api.modules.persons.service import PersonsService

    service = PersonsService(db)
    care_read = await service.register_person_in_care(
        org_id=org_id,
        pseudonym=payload.pseudonym,
        first_name=payload.first_name,
        birth_date=payload.birth_date,
        sex=payload.sex,
        region_id=payload.region_id,
        actor_user_id=caregiver.id,
        is_admin=admin_flag,
    )
    return PersonInCareRead(
        id=care_read.id,
        pseudonym=care_read.pseudonym,
        first_name=care_read.first_name,
        birth_date=care_read.birth_date,
        sex=care_read.sex,
        region_id=care_read.region_id,
        organization_id=care_read.organization_id,
        created_at=care_read.created_at or care_read.care_started_at,
    )


@organizations_router.get("/{org_id}/persons", response_model=list[PersonInCareRead])
async def list_establishment_persons(
    org_id: str,
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> list[PersonInCareRead]:
    """List persons followed in an establishment (caregiver only sees their own establishment)."""
    admin_flag = await is_user_admin(caregiver, db)
    from tsotsa_api.modules.persons.service import PersonsService

    service = PersonsService(db)
    items = await service.list_establishment_persons(
        caregiver_user_id=caregiver.id,
        organization_id=org_id,
        is_admin=admin_flag,
    )
    return [
        PersonInCareRead(
            id=it.id,
            pseudonym=it.pseudonym,
            first_name=it.first_name,
            birth_date=it.birth_date,
            sex=it.sex,
            region_id=it.region_id,
            organization_id=it.organization_id,
            created_at=it.created_at or it.care_started_at,
        )
        for it in items
    ]


@organizations_router.get("/{org_id}/persons/{person_id}", response_model=PersonInCareRead)
async def get_establishment_person(
    org_id: str,
    person_id: str,
    caregiver: Any = Depends(require_verified_caregiver),
    db: AsyncSession = Depends(get_db_session),
) -> PersonInCareRead:
    """Read a followed person within an establishment (strictly isolated by organization_id)."""
    admin_flag = await is_user_admin(caregiver, db)
    from tsotsa_api.modules.persons.service import PersonsService

    service = PersonsService(db)
    it = await service.get_establishment_person(
        caregiver_user_id=caregiver.id,
        organization_id=org_id,
        person_id=person_id,
        is_admin=admin_flag,
    )
    return PersonInCareRead(
        id=it.id,
        pseudonym=it.pseudonym,
        first_name=it.first_name,
        birth_date=it.birth_date,
        sex=it.sex,
        region_id=it.region_id,
        organization_id=it.organization_id,
        created_at=it.created_at or it.care_started_at,
    )


@regions_router.get("", response_model=list[RegionRead])
async def list_all_regions(
    db: AsyncSession = Depends(get_db_session),
) -> list[RegionRead]:
    """List administered geographical regions."""
    service = OrganizationsService(db)
    return await service.list_regions()


@users_region_router.get("/region", response_model=UserRegionPreferenceRead)
async def get_my_preferred_region(
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UserRegionPreferenceRead:
    """Get the authenticated user's preferred region."""
    service = OrganizationsService(db)
    return await service.get_user_region_preference(user)


@users_region_router.put("/region", response_model=UserRegionPreferenceRead)
async def update_my_preferred_region(
    payload: UserRegionPreferenceUpdate,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UserRegionPreferenceRead:
    """Update the authenticated user's preferred region."""
    service = OrganizationsService(db)
    return await service.set_user_region_preference(user.id, payload.region_id)


@admin_router.post(
    "/organizations",
    response_model=OrganizationRead,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_organization(
    payload: OrganizationCreate,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> OrganizationRead:
    """Create a health establishment (admin only)."""
    service = OrganizationsService(db)
    org = await service.create_organization(payload, admin_user_id=admin.id)
    return OrganizationRead.model_validate(org)


@admin_router.put("/organizations/{org_id}", response_model=OrganizationRead)
async def admin_update_organization(
    org_id: str,
    payload: OrganizationUpdate,
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> OrganizationRead:
    """Update a health establishment (admin only)."""
    service = OrganizationsService(db)
    org = await service.update_organization(org_id, payload)
    return OrganizationRead.model_validate(org)


@admin_router.post(
    "/organizations/{org_id}/caregivers",
    response_model=CaregiverAttachmentRead,
)
async def admin_attach_caregiver_to_organization(
    org_id: str,
    payload: CaregiverAttachmentRequest,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> CaregiverAttachmentRead:
    """Attach a caregiver to a health establishment and optionally approve them."""
    service = OrganizationsService(db)
    return await service.attach_caregiver(org_id, payload, admin_user_id=admin.id)


@admin_router.post("/regions", response_model=RegionRead, status_code=status.HTTP_201_CREATED)
async def admin_create_region(
    payload: RegionCreate,
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> RegionRead:
    """Create an administered geographical region (admin only)."""
    service = OrganizationsService(db)
    return await service.create_region(payload)


@admin_router.put("/regions/{region_id}", response_model=RegionRead)
async def admin_update_region(
    region_id: str,
    payload: RegionUpdate,
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> RegionRead:
    """Update an administered geographical region (admin only)."""
    service = OrganizationsService(db)
    return await service.update_region(region_id, payload)
