"""Periodic scheduled monitoring scan across active children."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.clinical.service import ClinicalService
from tsotsa_api.modules.intakes.service import IntakesService
from tsotsa_api.modules.monitoring.engine import (
    evaluate_late_evaluation_rule,
    evaluate_reminders_disabled_rule,
    evaluate_unconfirmed_intakes_rule,
)
from tsotsa_api.modules.monitoring.repository import MonitoringRepository
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.service import PersonsService


class DailyMonitoringScan:
    """Evaluates trailing compliance, overdue consultations, and disabled reminders."""

    def __init__(
        self,
        session: AsyncSession,
        repo: MonitoringRepository,
        orgs: OrganizationsService,
        persons: PersonsService,
        clinical: ClinicalService,
        intakes: IntakesService,
    ) -> None:
        self.session = session
        self.repo = repo
        self.orgs = orgs
        self.persons = persons
        self.clinical = clinical
        self.intakes = intakes

    async def run(self, organization_id: str | None = None) -> int:
        orgs = await self.orgs.list_organizations(only_active=True)
        target_org_ids = [organization_id] if organization_id else [o.id for o in orgs]

        rule_late = await self.repo.get_rule_by_code("late_evaluation")
        rule_reminders = await self.repo.get_rule_by_code("reminders_disabled")
        rule_intakes = await self.repo.get_rule_by_code("unconfirmed_intakes")
        now = datetime.now(UTC)
        total_alerts = 0

        for oid in target_org_ids:
            persons = await self.persons.care_service.list_establishment_persons(
                caregiver_user_id="", organization_id=oid, is_admin=True
            )
            for p in persons:
                # 1. Late evaluation check
                if rule_late and rule_late.is_active:
                    eval_data = await self.clinical.get_latest_evaluation_summary(p.id)
                    days_since = 999
                    if eval_data:
                        measured = eval_data.measured_at
                        if measured.tzinfo is None:
                            measured = measured.replace(tzinfo=UTC)
                        days_since = (now - measured).days
                    trig, msg, det = evaluate_late_evaluation_rule(rule_late.parameters, days_since)
                    if trig:
                        await self.repo.create_or_update_open_alert(p.id, oid, rule_late, msg, det)
                        total_alerts += 1

                # 2. Unconfirmed intakes check
                if rule_intakes and rule_intakes.is_active:
                    period = int(rule_intakes.parameters.get("period_days", 2))
                    refused = await self.intakes.get_unconfirmed_intakes_count(p.id, period)
                    trig, msg, det = evaluate_unconfirmed_intakes_rule(
                        rule_intakes.parameters, refused
                    )
                    if trig:
                        await self.repo.create_or_update_open_alert(
                            p.id, oid, rule_intakes, msg, det
                        )
                        total_alerts += 1

                # 3. Reminders disabled check
                if rule_reminders and rule_reminders.is_active:
                    reminders_ok = await self.repo.is_reminders_enabled_for_person(p.id)
                    trig, msg, det = evaluate_reminders_disabled_rule(
                        rule_reminders.parameters, reminders_ok
                    )
                    if trig:
                        await self.repo.create_or_update_open_alert(
                            p.id, oid, rule_reminders, msg, det
                        )
                        total_alerts += 1

        return total_alerts
