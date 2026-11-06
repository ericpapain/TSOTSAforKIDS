"""Business logic service for Domain I (Intakes and 7-day compliance)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.consents.service import ConsentsService
from tsotsa_api.modules.intakes.models import Intake
from tsotsa_api.modules.intakes.repository import IntakesRepository
from tsotsa_api.modules.intakes.schemas import (
    ComplianceRateResponse,
    IntakeCreate,
    IntakeRead,
    IntakeSyncRequest,
    IntakeSyncResponse,
)
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.service import PersonsService


class IntakesService:
    """Manages intake tracking, idempotent offline sync, access checks, and adherence metrics."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = IntakesRepository(session)
        self.persons = PersonsService(session)
        self.consents = ConsentsService(session)
        self.organizations = OrganizationsService(session)
        self.audit = AuditService(session)

    async def verify_person_access(self, user_id: str, is_admin: bool, person_id: str) -> None:
        """Enforce strict access: Linked family OR caregiver with active consent."""
        if is_admin:
            return

        if not await self.persons.person_exists(person_id):
            raise NotFoundError("Personne suivie introuvable.")

        # 1. Check family relationship
        if await self.persons.is_person_linked_to_user(person_id=person_id, user_id=user_id):
            return

        # 2. Check medical caregiver attachment
        cg_org_id = await self.organizations.get_caregiver_organization_id(user_id)
        if cg_org_id:
            org_id = await self.persons.get_active_care_organization_id(person_id)
            if org_id == cg_org_id:
                if not await self.consents.has_active_consent(person_id):
                    raise ForbiddenError(
                        "Consentement non accordé ou retiré. Accès soignant refusé."
                    )
                return

        raise ForbiddenError("Accès refusé pour cette personne suivie.")

    async def record_single_intake(
        self,
        user_id: str,
        is_admin: bool,
        payload: IntakeCreate,
        ip: str | None = None,
    ) -> IntakeRead:
        """Record a single food/product intake. Idempotent on client-generated UUID."""
        await self.verify_person_access(user_id, is_admin, payload.person_id)

        # Idempotency check on client UUID
        if payload.id:
            existing = await self.repo.get_by_id(payload.id)
            if existing:
                return self._to_read(existing)

        intake = await self.repo.create_intake(
            intake_id=payload.id,
            person_id=payload.person_id,
            item_type=payload.item_type,
            item_id=payload.item_id,
            quantity=payload.quantity,
            unit=payload.unit,
            taken_at=payload.taken_at,
            consumption=payload.consumption,
            origin=payload.origin,
            schedule_time_id=payload.schedule_time_id,
            notes=payload.notes,
            recorded_by=user_id,
        )

        await self.audit.log(
            action="create",
            entity="intake",
            entity_id=intake.id,
            actor_user_id=user_id,
            ip=ip,
            details={
                "person_id": payload.person_id,
                "consumption": payload.consumption,
                "item_type": payload.item_type,
            },
        )

        return self._to_read(intake)

    async def sync_offline_intakes(
        self,
        user_id: str,
        is_admin: bool,
        payload: IntakeSyncRequest,
        ip: str | None = None,
    ) -> IntakeSyncResponse:
        """Synchronize an offline batch of intakes idempotently."""
        inserted_count = 0
        duplicates_count = 0
        results: list[IntakeRead] = []

        for item in payload.intakes:
            await self.verify_person_access(user_id, is_admin, item.person_id)

            if item.id:
                existing = await self.repo.get_by_id(item.id)
                if existing:
                    duplicates_count += 1
                    results.append(self._to_read(existing))
                    continue

            intake = await self.repo.create_intake(
                intake_id=item.id,
                person_id=item.person_id,
                item_type=item.item_type,
                item_id=item.item_id,
                quantity=item.quantity,
                unit=item.unit,
                taken_at=item.taken_at,
                consumption=item.consumption,
                origin=item.origin,
                schedule_time_id=item.schedule_time_id,
                notes=item.notes,
                recorded_by=user_id,
            )
            inserted_count += 1
            results.append(self._to_read(intake))

        await self.audit.log(
            action="sync",
            entity="intakes_batch",
            actor_user_id=user_id,
            ip=ip,
            details={
                "received": len(payload.intakes),
                "inserted": inserted_count,
                "duplicates": duplicates_count,
            },
        )

        return IntakeSyncResponse(
            received_count=len(payload.intakes),
            inserted_count=inserted_count,
            duplicates_skipped=duplicates_count,
            intakes=results,
        )

    async def list_intakes(
        self,
        user_id: str,
        is_admin: bool,
        person_id: str,
        item_type: str | None = None,
        consumption: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        limit: int = 50,
        offset: int = 0,
        ip: str | None = None,
    ) -> list[IntakeRead]:
        """List historical intakes for a followed person with filters."""
        await self.verify_person_access(user_id, is_admin, person_id)
        records = await self.repo.list_for_person(
            person_id=person_id,
            item_type=item_type,
            consumption=consumption,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset,
        )
        await self.audit.log(
            action="read",
            entity="person_intakes",
            entity_id=person_id,
            actor_user_id=user_id,
            ip=ip,
            details={"count": len(records)},
        )
        return [self._to_read(r) for r in records]

    async def calculate_7_day_compliance_rate(
        self,
        user_id: str,
        is_admin: bool,
        person_id: str,
        reference_dt: datetime | None = None,
    ) -> ComplianceRateResponse:
        """Compute the 7-day intake confirmation rate for caregiver/dashboard tracking."""
        await self.verify_person_access(user_id, is_admin, person_id)

        end_dt = reference_dt or datetime.now(UTC)
        start_dt = end_dt - timedelta(days=7)

        intakes = await self.repo.get_intakes_in_range(person_id, start_dt, end_dt)

        confirmed = 0
        refused = 0
        distribution: dict[str, int] = {}

        for it in intakes:
            day_key = it.taken_at.strftime("%Y-%m-%d")
            distribution[day_key] = distribution.get(day_key, 0) + 1

            if it.consumption in ("all", "half"):
                confirmed += 1
            elif it.consumption == "refused":
                refused += 1

        total = len(intakes)
        rate = (Decimal(confirmed) / Decimal(total) * Decimal(100)) if total > 0 else Decimal(0)

        return ComplianceRateResponse(
            person_id=person_id,
            period_days=7,
            total_recorded=total,
            confirmed_count=confirmed,
            refused_count=refused,
            compliance_rate_pct=round(rate, 2),
            daily_distribution=distribution,
        )

    def _to_read(self, r: Intake) -> IntakeRead:
        item_id = (r.food_id if r.item_type == "food" else r.product_id) or ""
        return IntakeRead(
            id=r.id,
            person_id=r.person_id,
            item_type=r.item_type,
            item_id=item_id,
            quantity=r.quantity,
            unit=r.unit,
            taken_at=r.taken_at,
            consumption=r.consumption,
            origin=r.origin,
            schedule_time_id=r.schedule_time_id,
            notes=r.notes,
            recorded_by=r.recorded_by,
            created_at=r.created_at,
        )
