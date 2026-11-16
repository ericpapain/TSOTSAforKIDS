"""SQLAlchemy 2 repository for health events, symptoms and clinical evaluations."""

from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.health.models import (
    ClinicalAssessment,
    HealthEvent,
    HealthEventAction,
    HealthEventSymptom,
    SymptomCatalog,
)


class HealthRepository:
    """Repository handling all database interactions for child health."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_symptom_catalog(self, only_active: bool = True) -> list[SymptomCatalog]:
        """Fetch all symptoms sorted by display order."""
        stmt = select(SymptomCatalog).order_by(SymptomCatalog.display_order)
        if only_active:
            stmt = stmt.where(SymptomCatalog.is_active.is_(True))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_symptom_by_code(self, code: str) -> SymptomCatalog | None:
        """Fetch a specific symptom by unique code."""
        stmt = select(SymptomCatalog).where(SymptomCatalog.code == code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_health_event(
        self,
        event: HealthEvent,
        symptoms: list[HealthEventSymptom],
    ) -> HealthEvent:
        """Persist a health event and its associated symptoms atomically."""
        self.session.add(event)
        for sym in symptoms:
            self.session.add(sym)
        await self.session.flush()
        return await self.get_health_event_by_id(event.id)  # type: ignore[return-value]

    async def get_health_event_by_id(self, event_id: str) -> HealthEvent | None:
        """Fetch a health event with eager-loaded related collections."""
        stmt = (
            select(HealthEvent)
            .where(HealthEvent.id == event_id)
            .options(
                selectinload(HealthEvent.symptoms),
                selectinload(HealthEvent.assessments),
                selectinload(HealthEvent.actions),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_events_by_person(
        self,
        person_id: str,
        status: str | None = None,
        priority: str | None = None,
    ) -> list[HealthEvent]:
        """List health events for a specific child, sorted by created date desc."""
        stmt = (
            select(HealthEvent)
            .where(HealthEvent.person_id == person_id)
            .options(
                selectinload(HealthEvent.symptoms),
                selectinload(HealthEvent.assessments),
                selectinload(HealthEvent.actions),
            )
            .order_by(desc(HealthEvent.created_at))
        )
        if status:
            stmt = stmt.where(HealthEvent.status == status)
        if priority:
            stmt = stmt.where(HealthEvent.priority == priority)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_assessment(self, assessment: ClinicalAssessment) -> ClinicalAssessment:
        """Add a medical evaluation to a health event."""
        self.session.add(assessment)
        await self.session.flush()
        return assessment

    async def add_action(
        self,
        action: HealthEventAction,
        new_event_status: str | None = None,
    ) -> HealthEventAction:
        """Record an action and optionally transition the event status."""
        self.session.add(action)
        if new_event_status:
            stmt = select(HealthEvent).where(HealthEvent.id == action.health_event_id)
            result = await self.session.execute(stmt)
            event = result.scalar_one_or_none()
            if event:
                event.status = new_event_status
        await self.session.flush()
        return action

    async def list_open_alerts(
        self,
        organization_id: str | None = None,
        priorities: list[str] | None = None,
    ) -> list[HealthEvent]:
        """Fetch unresolved health events for alert boards."""
        stmt = (
            select(HealthEvent)
            .where(HealthEvent.status.in_(["open", "under_review", "submitted"]))
            .options(
                selectinload(HealthEvent.symptoms),
                selectinload(HealthEvent.assessments),
                selectinload(HealthEvent.actions),
            )
            .order_by(desc(HealthEvent.created_at))
        )
        if organization_id:
            stmt = stmt.where(HealthEvent.organization_id == organization_id)
        if priorities:
            stmt = stmt.where(HealthEvent.priority.in_(priorities))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
