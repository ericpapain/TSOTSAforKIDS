"""Care service layer for establishment attachment, caregiver listing, and access control."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError, ValidationError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.consents.service import ConsentsService
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.models import Person, PersonCare
from tsotsa_api.modules.persons.repository import PersonsRepository
from tsotsa_api.modules.persons.schemas import CaregiverPersonRead


class PersonsCareService:
    """Manages establishment care attachment, caregiver visibility, and consent enforcement."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = PersonsRepository(session)
        self.audit = AuditService(session)
        self.consents = ConsentsService(session)
        self.orgs = OrganizationsService(session)

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
        scoped_org_id = await self.orgs._enforce_establishment_isolation(
            actor_user_id or "", is_admin, org_id
        )
        if await self.repo.get_person_by_pseudonym(pseudonym):
            raise ValidationError(f"Le pseudonyme '{pseudonym}' est déjà attribué.")
        person = await self.repo.create_person(
            first_name=first_name,
            birth_date=birth_date,
            sex=sex,
            region_id=region_id,
            pseudonym=pseudonym,
            created_by=actor_user_id,
        )
        care = await self.attach_person_to_organization(
            person_id=person.id,
            organization_id=scoped_org_id,
            primary_caregiver_id=actor_user_id if not is_admin else None,
            actor_user_id=actor_user_id,
            ip=ip,
        )
        # Register explicit medical consent upon establishment admission
        if actor_user_id:
            await self.consents.give_consent(
                person_id=person.id,
                user_id=actor_user_id,
                legal_guardian=True,
                ip=ip,
            )
        return self._care_to_read(person, care)

    async def attach_person_to_organization(
        self,
        person_id: str,
        organization_id: str,
        primary_caregiver_id: str | None = None,
        actor_user_id: str | None = None,
        ip: str | None = None,
    ) -> PersonCare:
        await self.orgs.get_organization(organization_id)
        person = await self.repo.get_person_by_id(person_id)
        if not person:
            raise NotFoundError("Personne suivie introuvable.")
        active_care = await self.repo.get_active_person_care(person_id)
        if active_care and active_care.organization_id == organization_id:
            return active_care
        care = await self.repo.create_person_care(
            person_id=person_id,
            organization_id=organization_id,
            primary_caregiver_id=primary_caregiver_id,
        )
        await self.audit.log(
            action="create",
            entity="person_care",
            entity_id=person_id,
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            ip=ip,
        )
        return care

    async def list_establishment_persons(
        self,
        caregiver_user_id: str,
        organization_id: str,
        is_admin: bool = False,
        ip: str | None = None,
    ) -> list[CaregiverPersonRead]:
        scoped_org_id = await self.orgs._enforce_establishment_isolation(
            caregiver_user_id, is_admin, organization_id
        )
        persons = await self.repo.list_persons_for_organization(scoped_org_id)
        results: list[CaregiverPersonRead] = []
        for person in persons:
            if await self.consents.has_active_consent(person.id):
                care = await self.repo.get_active_person_care(person.id)
                if care:
                    results.append(self._care_to_read(person, care))
        await self.audit.log(
            action="read",
            entity="establishment_persons",
            organization_id=scoped_org_id,
            actor_user_id=caregiver_user_id or None,
            ip=ip,
            details={"count": len(results)},
        )
        return results

    async def get_establishment_person(
        self,
        caregiver_user_id: str,
        organization_id: str,
        person_id: str,
        is_admin: bool = False,
        ip: str | None = None,
    ) -> CaregiverPersonRead:
        scoped_org_id = await self.orgs._enforce_establishment_isolation(
            caregiver_user_id, is_admin, organization_id
        )
        person = await self.repo.get_person_for_organization(person_id, scoped_org_id)
        if not person:
            raise ForbiddenError(
                "Accès refusé : personne suivie introuvable dans votre établissement."
            )
        care = await self.repo.get_active_person_care(person.id)
        if not care:
            raise NotFoundError("Suivi médical introuvable pour cette personne.")
        if not await self.consents.has_active_consent(person.id):
            raise ForbiddenError("Consentement non accordé ou retiré. Accès soignant refusé.")
        await self.audit.log(
            action="read",
            entity="person",
            entity_id=person_id,
            organization_id=scoped_org_id,
            actor_user_id=caregiver_user_id,
            ip=ip,
        )
        return self._care_to_read(person, care)

    def _care_to_read(self, person: Person, care: PersonCare) -> CaregiverPersonRead:
        return CaregiverPersonRead(
            id=person.id,
            pseudonym=person.pseudonym,
            first_name=person.first_name,
            birth_date=person.birth_date,
            sex=person.sex,  # type: ignore[arg-type]
            region_id=person.region_id,
            organization_id=care.organization_id,
            primary_caregiver_id=care.primary_caregiver_id,
            care_started_at=care.started_at,
            created_at=person.created_at,
            has_active_consent=True,
        )
