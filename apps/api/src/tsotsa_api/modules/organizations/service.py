"""Service layer for Domain B (Organizations and Regions)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError
from tsotsa_api.modules.food_database.service import FoodDatabaseService
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.identity.service import IdentityService
from tsotsa_api.modules.organizations.models import Organization
from tsotsa_api.modules.organizations.repository import OrganizationsRepository
from tsotsa_api.modules.organizations.schemas import (
    CaregiverAttachmentRead,
    CaregiverAttachmentRequest,
    OrganizationCreate,
    OrganizationUpdate,
    RegionCreate,
    RegionRead,
    RegionUpdate,
    UserRegionPreferenceRead,
)


class OrganizationsService:
    """Orchestrates health establishments, caregiver attachments, and administered regions."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = OrganizationsRepository(session)
        self.food_service = FoodDatabaseService(session)
        self.identity_service = IdentityService(IdentityRepository(session))

    async def create_organization(
        self, payload: OrganizationCreate, admin_user_id: str
    ) -> Organization:
        if payload.region_id:
            reg = await self.food_service.get_region_by_id(payload.region_id)
            if not reg:
                raise NotFoundError("Région spécifiée introuvable.")
        return await self.repo.create_organization(
            name=payload.name,
            org_type=payload.type,
            region_id=payload.region_id,
            address=payload.address,
            status=payload.status,
            created_by=admin_user_id,
        )

    async def update_organization(self, org_id: str, payload: OrganizationUpdate) -> Organization:
        org = await self.repo.get_organization_by_id(org_id)
        if not org:
            raise NotFoundError("Établissement de santé introuvable.")
        if payload.region_id:
            reg = await self.food_service.get_region_by_id(payload.region_id)
            if not reg:
                raise NotFoundError("Région spécifiée introuvable.")
        return await self.repo.update_organization(
            org=org,
            name=payload.name,
            org_type=payload.type,
            region_id=payload.region_id,
            address=payload.address,
            status=payload.status,
        )

    async def get_organization(self, org_id: str) -> Organization:
        org = await self.repo.get_organization_by_id(org_id)
        if not org:
            raise NotFoundError("Établissement de santé introuvable.")
        return org

    async def list_organizations(
        self, region_id: str | None = None, only_active: bool = True
    ) -> list[Organization]:
        return await self.repo.list_organizations(region_id=region_id, only_active=only_active)

    async def attach_caregiver(
        self, org_id: str, payload: CaregiverAttachmentRequest, admin_user_id: str
    ) -> CaregiverAttachmentRead:
        await self.get_organization(org_id)
        status = "approved" if payload.approve else "pending"
        profile = await self.identity_service.attach_caregiver_to_organization(
            user_id=payload.user_id,
            organization_id=org_id,
            licence_number=payload.licence_number,
            verification_status=status,
            verified_by=admin_user_id if payload.approve else None,
        )
        return CaregiverAttachmentRead(
            user_id=profile.user_id,
            organization_id=org_id,
            licence_number=profile.licence_number,
            verification_status=profile.verification_status,
        )

    async def _enforce_establishment_isolation(
        self, user_id: str, is_admin: bool, target_org_id: str
    ) -> str:
        """Ensure caregiver belongs to target_org_id and return the scoped organization_id."""
        await self.get_organization(target_org_id)
        if is_admin:
            return target_org_id
        caregiver_org_id = await self.identity_service.get_caregiver_organization_id(user_id)
        if not caregiver_org_id or caregiver_org_id != target_org_id:
            raise ForbiddenError(
                message="Isolation stricte : accès refusé aux données d'un autre établissement.",
                details={
                    "caregiver_organization_id": caregiver_org_id,
                    "requested_organization_id": target_org_id,
                },
            )
        return caregiver_org_id

    async def list_regions(self) -> list[RegionRead]:
        regions = await self.food_service.list_regions()
        return [RegionRead.model_validate(r) for r in regions]

    async def create_region(self, payload: RegionCreate) -> RegionRead:
        reg = await self.food_service.create_region(
            code=payload.code, name=payload.name, country_code=payload.country_code
        )
        return RegionRead.model_validate(reg)

    async def update_region(self, region_id: str, payload: RegionUpdate) -> RegionRead:
        reg = await self.food_service.update_region(
            region_id=region_id,
            code=payload.code,
            name=payload.name,
            country_code=payload.country_code,
        )
        return RegionRead.model_validate(reg)

    async def get_user_region_preference(self, user: Any) -> UserRegionPreferenceRead:
        reg_read: RegionRead | None = None
        if user.preferred_region_id:
            reg = await self.food_service.get_region_by_id(user.preferred_region_id)
            if reg:
                reg_read = RegionRead.model_validate(reg)
        return UserRegionPreferenceRead(
            user_id=user.id,
            preferred_region_id=user.preferred_region_id,
            region=reg_read,
        )

    async def set_user_region_preference(
        self, user_id: str, region_id: str | None
    ) -> UserRegionPreferenceRead:
        reg_read: RegionRead | None = None
        if region_id is not None:
            reg = await self.food_service.get_region_by_id(region_id)
            if not reg:
                raise NotFoundError("Région préférée introuvable.")
            reg_read = RegionRead.model_validate(reg)
        user = await self.identity_service.set_preferred_region(user_id, region_id)
        return UserRegionPreferenceRead(
            user_id=user.id,
            preferred_region_id=user.preferred_region_id,
            region=reg_read,
        )
