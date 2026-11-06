"""Repository layer for Domain B (Organizations) with strict organization isolation."""

from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.organizations.models import Organization, Person, PersonCare


class OrganizationsRepository:
    """Database access for health establishments and strictly isolated person care records."""

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

    async def get_person_by_pseudonym(self, pseudonym: str) -> Person | None:
        stmt = select(Person).where(Person.pseudonym == pseudonym.strip())
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create_person_with_care(
        self,
        organization_id: str,
        pseudonym: str,
        first_name: str,
        birth_date: date,
        sex: str,
        region_id: str | None = None,
        primary_caregiver_id: str | None = None,
        created_by: str | None = None,
    ) -> Person:
        person = Person(
            pseudonym=pseudonym.strip(),
            first_name=first_name.strip(),
            birth_date=birth_date,
            sex=sex,
            region_id=region_id,
            created_by=created_by,
        )
        self.session.add(person)
        await self.session.flush()

        care = PersonCare(
            person_id=person.id,
            organization_id=organization_id,
            primary_caregiver_id=primary_caregiver_id,
        )
        self.session.add(care)
        await self.session.flush()
        return person

    async def list_persons_for_organization(self, organization_id: str) -> list[Person]:
        """Strictly filter followed persons by organization_id in the SQL repository query."""
        stmt = (
            select(Person)
            .join(PersonCare, PersonCare.person_id == Person.id)
            .where(
                PersonCare.organization_id == organization_id,
                PersonCare.ended_at.is_(None),
                Person.deleted_at.is_(None),
            )
            .order_by(Person.created_at.desc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_person_for_organization(
        self, person_id: str, organization_id: str
    ) -> Person | None:
        """Strictly fetch a single person ONLY if linked to the given organization_id."""
        stmt = (
            select(Person)
            .join(PersonCare, PersonCare.person_id == Person.id)
            .where(
                Person.id == person_id,
                PersonCare.organization_id == organization_id,
                PersonCare.ended_at.is_(None),
                Person.deleted_at.is_(None),
            )
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()
