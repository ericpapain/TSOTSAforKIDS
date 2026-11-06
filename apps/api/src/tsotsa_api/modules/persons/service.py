"""Service layer for Domain C (Persons, Family Links, and Multi-Account Sharing)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError, ValidationError
from tsotsa_api.core.security import generate_random_token, hash_token
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.persons.care_service import PersonsCareService
from tsotsa_api.modules.persons.models import Person, PersonCare, PersonLink
from tsotsa_api.modules.persons.repository import PersonsRepository
from tsotsa_api.modules.persons.schemas import (
    CaregiverPersonRead,
    PersonCreate,
    PersonRead,
    PersonUpdate,
    SecondParentInviteRequest,
    SecondParentInviteResponse,
)


class PersonsService:
    """Manages followed persons, multi-account family links, and delegations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = PersonsRepository(session)
        self.audit = AuditService(session)
        self.care_service = PersonsCareService(session)

    async def create_family_member(
        self, user_id: str, payload: PersonCreate, ip: str | None = None
    ) -> PersonRead:
        person = await self.repo.create_person(
            first_name=payload.first_name,
            birth_date=payload.birth_date,
            sex=payload.sex,
            region_id=payload.region_id,
            created_by=user_id,
        )
        link = await self.repo.create_person_link(
            person_id=person.id,
            user_id=user_id,
            relation=payload.relation,
            is_primary=True,
        )
        await self.audit.log(
            action="create",
            entity="person",
            entity_id=person.id,
            actor_user_id=user_id,
            ip=ip,
            details={"pseudonym": person.pseudonym, "relation": payload.relation},
        )
        return self._person_to_read(person, link)

    async def list_family_members(self, user_id: str, ip: str | None = None) -> list[PersonRead]:
        links = await self.repo.list_person_links_for_user(user_id)
        await self.audit.log(
            action="read",
            entity="family_members",
            actor_user_id=user_id,
            ip=ip,
            details={"count": len(links)},
        )
        return [self._person_to_read(link_item.person, link_item) for link_item in links]

    async def get_family_member(
        self, user_id: str, person_id: str, ip: str | None = None
    ) -> PersonRead:
        link = await self.repo.get_person_link(person_id=person_id, user_id=user_id)
        if not link or link.person.deleted_at is not None:
            raise ForbiddenError("Accès refusé : cette personne n'est pas liée à votre compte.")
        await self.audit.log(
            action="read",
            entity="person",
            entity_id=person_id,
            actor_user_id=user_id,
            ip=ip,
        )
        return self._person_to_read(link.person, link)

    async def update_family_member(
        self, user_id: str, person_id: str, payload: PersonUpdate, ip: str | None = None
    ) -> PersonRead:
        link = await self.repo.get_person_link(person_id=person_id, user_id=user_id)
        if not link or link.person.deleted_at is not None:
            raise ForbiddenError("Accès refusé : cette personne n'est pas liée à votre compte.")
        updated = await self.repo.update_person(
            person=link.person,
            first_name=payload.first_name,
            birth_date=payload.birth_date,
            sex=payload.sex,
            region_id=payload.region_id,
        )
        await self.audit.log(
            action="update",
            entity="person",
            entity_id=person_id,
            actor_user_id=user_id,
            ip=ip,
        )
        return self._person_to_read(updated, link)

    async def remove_family_member(
        self, user_id: str, person_id: str, ip: str | None = None
    ) -> None:
        link = await self.repo.get_person_link(person_id=person_id, user_id=user_id)
        if not link or link.person.deleted_at is not None:
            raise ForbiddenError("Accès refusé : cette personne n'est pas liée à votre compte.")
        await self.repo.delete_person_link(person_id=person_id, user_id=user_id)
        if await self.repo.count_active_links_for_person(person_id) == 0:
            await self.repo.soft_delete_person(person_id)
        await self.audit.log(
            action="delete",
            entity="family_member",
            entity_id=person_id,
            actor_user_id=user_id,
            ip=ip,
        )

    async def invite_second_parent(
        self,
        user_id: str,
        person_id: str,
        payload: SecondParentInviteRequest,
        ip: str | None = None,
    ) -> SecondParentInviteResponse:
        link = await self.repo.get_person_link(person_id=person_id, user_id=user_id)
        if not link or link.person.deleted_at is not None:
            raise ForbiddenError("Accès refusé : vous devez être lié à la personne pour l'inviter.")
        raw_token = generate_random_token(32)
        expires_at = datetime.now(UTC) + timedelta(days=7)
        inv = await self.repo.create_invitation(
            person_id=person_id,
            invited_by_user_id=user_id,
            phone_or_email=payload.phone_or_email,
            relation=payload.relation,
            token_hash=hash_token(raw_token),
            expires_at=expires_at,
        )
        await self.audit.log(
            action="invite",
            entity="person_link",
            entity_id=person_id,
            actor_user_id=user_id,
            ip=ip,
            details={"recipient": payload.phone_or_email},
        )
        return SecondParentInviteResponse(
            invitation_id=inv.id,
            token=raw_token,
            expires_at=expires_at,
            phone_or_email=payload.phone_or_email,
        )

    async def accept_second_parent_invitation(
        self, second_user_id: str, token_str: str, ip: str | None = None
    ) -> PersonRead:
        inv = await self.repo.get_active_invitation_by_token_hash(hash_token(token_str))
        if not inv:
            raise NotFoundError("Invitation invalide ou expirée.")
        existing_link = await self.repo.get_person_link(inv.person_id, second_user_id)
        if existing_link:
            raise ValidationError("Votre compte est déjà lié à cette personne suivie.")
        person = await self.repo.get_person_by_id(inv.person_id)
        if not person:
            raise NotFoundError("Personne suivie introuvable.")
        link = await self.repo.create_person_link(
            person_id=inv.person_id,
            user_id=second_user_id,
            relation=inv.relation,
            is_primary=False,
        )
        await self.repo.mark_invitation_accepted(inv)
        await self.audit.log(
            action="accept_invite",
            entity="person_link",
            entity_id=inv.person_id,
            actor_user_id=second_user_id,
            ip=ip,
        )
        return self._person_to_read(person, link)

    async def register_person_in_care(
        self,
        org_id: str,
        pseudonym: str,
        first_name: str,
        birth_date: Any,
        sex: str,
        region_id: str | None = None,
        actor_user_id: str | None = None,
        is_admin: bool = False,
        ip: str | None = None,
    ) -> CaregiverPersonRead:
        return await self.care_service.register_person_in_care(
            org_id=org_id,
            pseudonym=pseudonym,
            first_name=first_name,
            birth_date=birth_date,
            sex=sex,
            region_id=region_id,
            actor_user_id=actor_user_id,
            is_admin=is_admin,
            ip=ip,
        )

    async def attach_person_to_organization(
        self,
        person_id: str,
        organization_id: str,
        primary_caregiver_id: str | None = None,
        actor_user_id: str | None = None,
        ip: str | None = None,
    ) -> PersonCare:
        return await self.care_service.attach_person_to_organization(
            person_id=person_id,
            organization_id=organization_id,
            primary_caregiver_id=primary_caregiver_id,
            actor_user_id=actor_user_id,
            ip=ip,
        )

    async def list_establishment_persons(
        self,
        caregiver_user_id: str,
        organization_id: str,
        is_admin: bool = False,
        ip: str | None = None,
    ) -> list[CaregiverPersonRead]:
        return await self.care_service.list_establishment_persons(
            caregiver_user_id=caregiver_user_id,
            organization_id=organization_id,
            is_admin=is_admin,
            ip=ip,
        )

    async def get_establishment_person(
        self,
        caregiver_user_id: str,
        organization_id: str,
        person_id: str,
        is_admin: bool = False,
        ip: str | None = None,
    ) -> CaregiverPersonRead:
        return await self.care_service.get_establishment_person(
            caregiver_user_id=caregiver_user_id,
            organization_id=organization_id,
            person_id=person_id,
            is_admin=is_admin,
            ip=ip,
        )

    def _person_to_read(self, person: Person, link: PersonLink) -> PersonRead:
        return PersonRead(
            id=person.id,
            pseudonym=person.pseudonym,
            first_name=person.first_name,
            birth_date=person.birth_date,
            sex=person.sex,  # type: ignore[arg-type]
            region_id=person.region_id,
            relation=link.relation,
            is_primary=link.is_primary,
            created_at=person.created_at,
        )
