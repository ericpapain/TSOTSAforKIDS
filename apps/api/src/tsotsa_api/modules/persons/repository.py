"""Repository layer for Domain C (Persons, Family Links, Care, and Invitations)."""

from __future__ import annotations

import re
from datetime import UTC, date, datetime

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.persons.models import (
    Person,
    PersonCare,
    PersonInvitation,
    PersonLink,
)


class PersonsRepository:
    """Database access for followed persons, family account links, and care assignments."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def generate_next_pseudonym(self) -> str:
        """Generate next sequential pseudonym formatted as #A-001, #A-002, etc."""
        stmt = (
            select(Person.pseudonym)
            .where(Person.pseudonym.like("#%"))
            .order_by(desc(Person.created_at))
            .limit(10)
        )
        res = await self.session.execute(stmt)
        candidates = list(res.scalars().all())

        prefix_letter = "A"
        next_num = 1
        for p in candidates:
            m = re.match(r"^#([A-Z])-(\d{3,4})$", p)
            if m:
                prefix_letter = m.group(1)
                num = int(m.group(2))
                if num >= 999:
                    prefix_letter = chr(ord(prefix_letter) + 1) if prefix_letter < "Z" else "A"
                    next_num = 1
                else:
                    next_num = num + 1
                break

        pseudo = f"#{prefix_letter}-{next_num:03d}"
        while await self.get_person_by_pseudonym(pseudo):
            next_num += 1
            pseudo = f"#{prefix_letter}-{next_num:03d}"
        return pseudo

    async def create_person(
        self,
        first_name: str,
        birth_date: date,
        sex: str,
        region_id: str | None = None,
        pseudonym: str | None = None,
        created_by: str | None = None,
    ) -> Person:
        pseudo = pseudonym.strip() if pseudonym else await self.generate_next_pseudonym()
        person = Person(
            pseudonym=pseudo,
            first_name=first_name.strip(),
            birth_date=birth_date,
            sex=sex.strip().upper(),
            region_id=region_id,
            created_by=created_by,
        )
        self.session.add(person)
        await self.session.flush()
        return person

    async def get_person_by_id(self, person_id: str) -> Person | None:
        stmt = select(Person).where(Person.id == person_id, Person.deleted_at.is_(None))
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_person_by_pseudonym(self, pseudonym: str) -> Person | None:
        stmt = select(Person).where(Person.pseudonym == pseudonym.strip())
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def update_person(
        self,
        person: Person,
        first_name: str | None = None,
        birth_date: date | None = None,
        sex: str | None = None,
        region_id: str | None = None,
    ) -> Person:
        if first_name is not None:
            person.first_name = first_name.strip()
        if birth_date is not None:
            person.birth_date = birth_date
        if sex is not None:
            person.sex = sex.strip().upper()
        if region_id is not None:
            person.region_id = region_id
        person.updated_at = datetime.now(UTC)
        await self.session.flush()
        return person

    async def soft_delete_person(self, person_id: str) -> None:
        person = await self.get_person_by_id(person_id)
        if person:
            person.deleted_at = datetime.now(UTC)
            await self.session.flush()

    async def create_person_link(
        self,
        person_id: str,
        user_id: str,
        relation: str = "child",
        is_primary: bool = True,
    ) -> PersonLink:
        link = PersonLink(
            person_id=person_id,
            user_id=user_id,
            relation=relation.strip().lower(),
            is_primary=is_primary,
            created_at=datetime.now(UTC),
        )
        self.session.add(link)
        await self.session.flush()
        return link

    async def get_person_link(self, person_id: str, user_id: str) -> PersonLink | None:
        stmt = (
            select(PersonLink)
            .options(selectinload(PersonLink.person))
            .where(PersonLink.person_id == person_id, PersonLink.user_id == user_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_person_links_for_user(self, user_id: str) -> list[PersonLink]:
        stmt = (
            select(PersonLink)
            .join(Person, Person.id == PersonLink.person_id)
            .options(selectinload(PersonLink.person))
            .where(PersonLink.user_id == user_id, Person.deleted_at.is_(None))
            .order_by(PersonLink.created_at.desc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def count_active_links_for_person(self, person_id: str) -> int:
        stmt = select(func.count(PersonLink.id)).where(PersonLink.person_id == person_id)
        res = await self.session.execute(stmt)
        return int(res.scalar() or 0)

    async def delete_person_link(self, person_id: str, user_id: str) -> None:
        link = await self.get_person_link(person_id, user_id)
        if link:
            await self.session.delete(link)
            await self.session.flush()

    async def create_person_care(
        self,
        person_id: str,
        organization_id: str,
        primary_caregiver_id: str | None = None,
    ) -> PersonCare:
        care = PersonCare(
            person_id=person_id,
            organization_id=organization_id,
            primary_caregiver_id=primary_caregiver_id,
            started_at=datetime.now(UTC),
        )
        self.session.add(care)
        await self.session.flush()
        return care

    async def get_active_person_care(self, person_id: str) -> PersonCare | None:
        stmt = (
            select(PersonCare)
            .where(PersonCare.person_id == person_id, PersonCare.ended_at.is_(None))
            .order_by(desc(PersonCare.started_at))
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_persons_for_organization(self, organization_id: str) -> list[Person]:
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

    async def create_invitation(
        self,
        person_id: str,
        invited_by_user_id: str,
        phone_or_email: str,
        relation: str,
        token_hash: str,
        expires_at: datetime,
    ) -> PersonInvitation:
        inv = PersonInvitation(
            person_id=person_id,
            invited_by_user_id=invited_by_user_id,
            phone_or_email=phone_or_email.strip(),
            relation=relation.strip().lower(),
            token_hash=token_hash,
            status="pending",
            expires_at=expires_at,
            created_at=datetime.now(UTC),
        )
        self.session.add(inv)
        await self.session.flush()
        return inv

    async def get_active_invitation_by_token_hash(self, token_hash: str) -> PersonInvitation | None:
        stmt = select(PersonInvitation).where(
            PersonInvitation.token_hash == token_hash,
            PersonInvitation.status == "pending",
            PersonInvitation.expires_at > datetime.now(UTC),
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def mark_invitation_accepted(self, invitation: PersonInvitation) -> None:
        invitation.status = "accepted"
        await self.session.flush()
