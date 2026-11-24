"""Service layer for patient validation and caregiver assignment workflows."""

from __future__ import annotations

from datetime import UTC, datetime
import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.core.errors import AppException, ForbiddenError, NotFoundError
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.models_roles import UserRole
from tsotsa_api.modules.identity.permissions_service import PermissionsService
from tsotsa_api.modules.persons.models import Person, PersonCare


class PatientValidationService:
    """Enforces permissions and logic for patient validation and care assignment."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.permissions = PermissionsService(session)

    async def _require_perm(self, actor: User, perm: str) -> None:
        perms = await self.permissions.get_effective_permissions(actor.id)
        if perm not in perms:
            raise ForbiddenError(f"Droit insuffisant : '{perm}' requis pour cette action.")

    async def list_pending_patients(self, actor: User) -> list[Person]:
        """List patients awaiting validation (requires patients.validate)."""
        await self._require_perm(actor, "patients.validate")
        stmt = (
            select(Person)
            .options(selectinload(Person.links))
            .where(Person.status == "pending", Person.deleted_at.is_(None))
            .order_by(Person.created_at.desc())
        )
        res = await self.session.execute(stmt)
        persons = list(res.scalars().all())

        # Enrich creator names
        creator_ids = {p.created_by for p in persons if p.created_by}
        creators: dict[str, tuple[str, str]] = {}
        if creator_ids:
            u_stmt = (
                select(User)
                .options(selectinload(User.user_roles).selectinload(UserRole.role))
                .where(User.id.in_(creator_ids))
            )
            u_res = await self.session.execute(u_stmt)
            for u in u_res.scalars().all():
                role_name = "Agent de terrain" if any(ur.role and ur.role.code == "field_agent" for ur in u.user_roles) else "Parent"
                creators[u.id] = (u.display_name or f"{u.first_name} {u.last_name}".strip(), role_name)

        result: list[dict] = []
        for p in persons:
            c_info = creators.get(p.created_by, ("Parent (Auto-inscription)", "Parent"))
            result.append({
                "id": p.id,
                "pseudonym": p.pseudonym,
                "first_name": p.first_name,
                "birth_date": p.birth_date,
                "sex": p.sex,
                "region_id": p.region_id,
                "status": p.status,
                "created_at": p.created_at,
                "validated_at": p.validated_at,
                "refusal_reason": p.refusal_reason,
                "registered_by_name": c_info[0],
                "registered_by_role": c_info[1],
            })
        return result

    async def validate_patient(
        self,
        actor: User,
        person_id: str,
        decision: str,
        refusal_reason: str | None = None,
    ) -> Person:
        """Validate or refuse a pending patient registration."""
        await self._require_perm(actor, "patients.validate")

        if decision not in ("validated", "refused"):
            raise AppException(
                status_code=400,
                code="INVALID_DECISION",
                message="Décision invalide ('validated' ou 'refused').",
            )

        if decision == "refused" and not refusal_reason:
            raise AppException(
                status_code=400,
                code="REASON_REQUIRED",
                message="Le motif de refus est obligatoire.",
            )

        person = await self.session.get(Person, person_id)
        if not person or person.deleted_at is not None:
            raise NotFoundError("Patient introuvable.")

        now = datetime.now(UTC)
        if decision == "validated":
            person.status = "validated"
            person.validated_by = actor.id
            person.validated_at = now
            person.refusal_reason = None
        else:
            person.status = "refused"
            person.validated_by = actor.id
            person.validated_at = now
            person.refusal_reason = refusal_reason

        person.updated_at = now
        await self.session.flush()
        return person

    async def assign_patient_caregiver(
        self,
        actor: User,
        person_id: str,
        caregiver_id: str,
        organization_id: str,
        reason: str | None = None,
    ) -> PersonCare:
        """Assign a patient to a validated caregiver (requires patients.assign)."""
        await self._require_perm(actor, "patients.assign")

        person = await self.session.get(Person, person_id)
        if not person or person.deleted_at is not None:
            raise NotFoundError("Patient introuvable.")

        # Ensure target caregiver is active and approved
        cg_stmt = (
            select(User)
            .options(selectinload(User.caregiver_profile))
            .where(User.id == caregiver_id, User.status == "active", User.deleted_at.is_(None))
        )
        cg_res = await self.session.execute(cg_stmt)
        caregiver = cg_res.scalar_one_or_none()
        if (
            not caregiver
            or not caregiver.caregiver_profile
            or caregiver.caregiver_profile.verification_status != "approved"
        ):
            raise AppException(
                status_code=400,
                code="INVALID_CAREGIVER",
                message="Le soignant doit être actif et validé pour lui assigner un patient.",
            )

        # Resolve valid organization
        final_org_id = organization_id if organization_id else None
        if caregiver.caregiver_profile and caregiver.caregiver_profile.organization_id:
            final_org_id = str(caregiver.caregiver_profile.organization_id)
        if not final_org_id:
            try:
                org_row = (await self.session.execute(text("SELECT HEX(id) FROM organizations LIMIT 1"))).scalar_one_or_none()
                if org_row:
                    h = str(org_row).lower()
                    final_org_id = f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"
            except Exception:
                pass

        # Check existing active care link
        care_stmt = select(PersonCare).where(
            PersonCare.person_id == person_id,
            PersonCare.organization_id == final_org_id,
            PersonCare.ended_at.is_(None),
        )
        care_res = await self.session.execute(care_stmt)
        existing_care = care_res.scalar_one_or_none()

        now = datetime.now(UTC)
        if existing_care:
            existing_care.primary_caregiver_id = caregiver_id
            existing_care.assigned_by = actor.id
            existing_care.reason = reason
            await self.session.flush()
            return existing_care

        new_care = PersonCare(
            person_id=person_id,
            organization_id=final_org_id,
            primary_caregiver_id=caregiver_id,
            assigned_by=actor.id,
            reason=reason,
            started_at=now,
        )
        self.session.add(new_care)
        await self.session.flush()
        return new_care

    async def validate_and_assign_patient(
        self,
        actor: User,
        person_id: str,
        decision: str,
        doctor_id: str | None = None,
        field_agent_id: str | None = None,
        organization_id: str | None = None,
        notes: str | None = None,
    ) -> Person:
        """Validate or refuse patient and simultaneously assign attending doctor and field agent."""
        person = await self.validate_patient(actor, person_id, decision, refusal_reason=notes)
        if decision == "validated":
            if doctor_id:
                await self.assign_patient_caregiver(
                    actor=actor,
                    person_id=person_id,
                    caregiver_id=doctor_id,
                    organization_id=organization_id or "",
                    reason=notes or "Attribution lors de la validation clinique",
                )
            if field_agent_id:
                try:
                    person.assigned_field_agent_id = field_agent_id
                    await self.session.flush()
                except Exception:
                    pass
        return person

    async def delete_patient_with_reason(
        self, actor: User, person_id: str, reason: str
    ) -> None:
        """Archive/delete a patient with an explicit clinical or administrative reason."""
        await self._require_perm(actor, "patients.validate")
        person = await self.session.get(Person, person_id)
        if not person or person.deleted_at is not None:
            raise NotFoundError("Patient introuvable.")

        now = datetime.now(UTC)
        person.deleted_at = now
        person.deleted_by = actor.id
        person.refusal_reason = reason
        person.status = "archived"
        person.updated_at = now
        await self.session.flush()
