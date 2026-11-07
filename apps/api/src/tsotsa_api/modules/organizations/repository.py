"""Repository layer for Domain B (Organizations)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.organizations.models import Organization


class OrganizationsRepository:
    """Database access for health establishments (hospitals, CMAs, health centers, NGOs)."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_organization(
        self,
        name: str,
        org_type: str,
        region_id: str | None = None,
        address: str | None = None,
        status: str = "active",
        created_by: str | None = None,
    ) -> Organization:
        org = Organization(
            name=name.strip(),
            type=org_type,
            region_id=region_id,
            address=address.strip() if address else None,
            status=status,
            created_by=created_by,
        )
        self.session.add(org)
        await self.session.flush()
        return org

    async def get_organization_by_id(self, org_id: str) -> Organization | None:
        stmt = select(Organization).where(Organization.id == org_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_organizations(
        self, region_id: str | None = None, only_active: bool = True
    ) -> list[Organization]:
        stmt = select(Organization)
        if only_active:
            stmt = stmt.where(Organization.status == "active")
        if region_id:
            stmt = stmt.where(Organization.region_id == region_id)
        stmt = stmt.order_by(Organization.name.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def update_organization(
        self,
        org: Organization,
        name: str | None = None,
        org_type: str | None = None,
        region_id: str | None = None,
        address: str | None = None,
        status: str | None = None,
    ) -> Organization:
        if name is not None:
            org.name = name.strip()
        if org_type is not None:
            org.type = org_type
        if region_id is not None:
            org.region_id = region_id
        if address is not None:
            org.address = address.strip()
        if status is not None:
            org.status = status
        org.updated_at = datetime.now(UTC)
        await self.session.flush()
        return org
