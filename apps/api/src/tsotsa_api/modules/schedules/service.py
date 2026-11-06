"""Service layer for Domain J: Intake Schedules orchestration."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.consents.service import ConsentsService
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.service import PersonsService
from tsotsa_api.modules.schedules.models import IntakeSchedule
from tsotsa_api.modules.schedules.repository import SchedulesRepository
from tsotsa_api.modules.schedules.schemas import (
    IntakeScheduleCreate,
    IntakeScheduleDetail,
    IntakeScheduleRead,
    IntakeScheduleUpdate,
    ScheduleTimeRead,
)


class SchedulesService:
    """Orchestrates intake schedules, verifying caregiver permissions and active consent."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = SchedulesRepository(session)
        self.persons_service = PersonsService(session)
        self.consents_service = ConsentsService(session)
        self.orgs_service = OrganizationsService(session)
        self.audit_service = AuditService(session)

    async def _verify_caregiver_access(
        self, person_id: str, actor_user_id: str, roles: list[str]
    ) -> None:
        """Ensure actor is an approved caregiver of establishment with active consent."""
        if "admin" in roles:
            return
        if "caregiver" not in roles:
            raise ForbiddenError(
                "Seul un soignant vérifié ou un administrateur peut prescrire un plan de prises."
            )

        if not await self.persons_service.person_exists(person_id):
            raise NotFoundError("Personne suivie introuvable.")

        cg_org_id = await self.orgs_service.get_caregiver_organization_id(actor_user_id)
        if not cg_org_id:
            raise ForbiddenError("Soignant non rattaché à un établissement actif.")

        person_org = await self.persons_service.get_active_care_organization_id(person_id)
        if person_org != cg_org_id:
            raise ForbiddenError("La personne suivie n'est pas rattachée à votre établissement.")

        if not await self.consents_service.has_active_consent(person_id):
            raise ForbiddenError(
                "Consentement médical non accordé ou retiré. Accès soignant refusé."
            )

    async def _verify_read_access(
        self, person_id: str, actor_user_id: str, roles: list[str]
    ) -> None:
        """Ensure the actor is either a legal guardian or an authorized caregiver."""
        if "admin" in roles:
            return
        if not await self.persons_service.person_exists(person_id):
            raise NotFoundError("Personne suivie introuvable.")

        if await self.persons_service.is_person_linked_to_user(
            person_id=person_id, user_id=actor_user_id
        ):
            return

        if "caregiver" in roles:
            cg_org_id = await self.orgs_service.get_caregiver_organization_id(actor_user_id)
            person_org = await self.persons_service.get_active_care_organization_id(person_id)
            if cg_org_id and person_org == cg_org_id:
                if not await self.consents_service.has_active_consent(person_id):
                    raise ForbiddenError(
                        "Consentement médical non accordé ou retiré. Accès soignant refusé."
                    )
                return

        raise ForbiddenError("Accès interdit aux plans de prises de cette personne.")

    def _to_read(self, schedule: IntakeSchedule) -> IntakeScheduleRead:
        return IntakeScheduleRead(
            id=schedule.id,
            person_id=schedule.person_id,
            created_by=schedule.created_by,
            product_id=schedule.product_id,
            food_id=schedule.food_id,
            product_name=schedule.product_name,
            quantity=schedule.quantity,
            unit=schedule.unit,
            start_date=schedule.start_date,
            end_date=schedule.end_date,
            status=schedule.status,
            origin=schedule.origin,
            timezone=schedule.timezone,
            created_at=schedule.created_at,
            updated_at=schedule.updated_at,
            times_count=len(schedule.schedule_times) if schedule.schedule_times else 0,
        )

    def _to_detail(self, schedule: IntakeSchedule) -> IntakeScheduleDetail:
        times = [
            ScheduleTimeRead(
                id=t.id, local_time=t.local_time, days_of_week=t.days_of_week, enabled=t.enabled
            )
            for t in (schedule.schedule_times or [])
        ]
        return IntakeScheduleDetail(
            id=schedule.id,
            person_id=schedule.person_id,
            created_by=schedule.created_by,
            product_id=schedule.product_id,
            food_id=schedule.food_id,
            product_name=schedule.product_name,
            quantity=schedule.quantity,
            unit=schedule.unit,
            start_date=schedule.start_date,
            end_date=schedule.end_date,
            status=schedule.status,
            origin=schedule.origin,
            timezone=schedule.timezone,
            created_at=schedule.created_at,
            updated_at=schedule.updated_at,
            times_count=len(times),
            schedule_times=times,
        )

    async def create_schedule(
        self, payload: IntakeScheduleCreate, actor_user_id: str, roles: list[str]
    ) -> IntakeScheduleDetail:
        await self._verify_caregiver_access(payload.person_id, actor_user_id, roles)
        schedule = await self.repo.create_schedule(payload, created_by=actor_user_id)
        await self.audit_service.log(
            action="create",
            entity="intake_schedules",
            entity_id=schedule.id,
            actor_user_id=actor_user_id,
            details={
                "person_id": payload.person_id,
                "times": [t.local_time for t in payload.times],
            },
        )
        return self._to_detail(schedule)

    async def get_schedule(
        self, schedule_id: str, actor_user_id: str, roles: list[str]
    ) -> IntakeScheduleDetail:
        schedule = await self.repo.get_schedule(schedule_id)
        if not schedule:
            raise NotFoundError("Plan de prises introuvable.")
        await self._verify_read_access(schedule.person_id, actor_user_id, roles)
        return self._to_detail(schedule)

    async def list_person_schedules(
        self, person_id: str, actor_user_id: str, roles: list[str], status: str | None = None
    ) -> list[IntakeScheduleDetail]:
        await self._verify_read_access(person_id, actor_user_id, roles)
        schedules = await self.repo.list_schedules_for_person(person_id, status=status)
        return [self._to_detail(s) for s in schedules]

    async def update_schedule(
        self, schedule_id: str, payload: IntakeScheduleUpdate, actor_user_id: str, roles: list[str]
    ) -> IntakeScheduleDetail:
        schedule = await self.repo.get_schedule(schedule_id)
        if not schedule:
            raise NotFoundError("Plan de prises introuvable.")
        await self._verify_caregiver_access(schedule.person_id, actor_user_id, roles)
        updated = await self.repo.update_schedule(schedule, payload)
        await self.audit_service.log(
            action="update",
            entity="intake_schedules",
            entity_id=schedule.id,
            actor_user_id=actor_user_id,
            details={"status": updated.status},
        )
        return self._to_detail(updated)

    async def cancel_schedule(self, schedule_id: str, actor_user_id: str, roles: list[str]) -> None:
        schedule = await self.repo.get_schedule(schedule_id)
        if not schedule:
            raise NotFoundError("Plan de prises introuvable.")
        await self._verify_caregiver_access(schedule.person_id, actor_user_id, roles)
        await self.repo.delete_schedule(schedule)
        await self.audit_service.log(
            action="delete",
            entity="intake_schedules",
            entity_id=schedule.id,
            actor_user_id=actor_user_id,
            details={"status": "cancelled"},
        )
