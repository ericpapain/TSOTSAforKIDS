"""Dashboard queries and metrics aggregation for establishment caregivers."""

from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.clinical.service import ClinicalService
from tsotsa_api.modules.consents.service import ConsentsService
from tsotsa_api.modules.intakes.service import IntakesService
from tsotsa_api.modules.monitoring.repository import MonitoringRepository
from tsotsa_api.modules.monitoring.schemas import (
    DashboardMetricsResponse,
    DashboardPersonItem,
    DashboardScheduledEvaluationItem,
)
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.service import PersonsService


class MonitoringDashboardService:
    """Computes high-level clinical metrics, overdue consultations, and child registers."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = MonitoringRepository(session)
        self.orgs = OrganizationsService(session)
        self.persons = PersonsService(session)
        self.consents = ConsentsService(session)
        self.clinical = ClinicalService(session)
        self.intakes = IntakesService(session)
        self.audit = AuditService(session)

    async def get_metrics(
        self,
        caregiver_user_id: str,
        organization_id: str,
        is_admin: bool = False,
        ip: str | None = None,
    ) -> DashboardMetricsResponse:
        scoped_org = await self.orgs._enforce_establishment_isolation(
            caregiver_user_id, is_admin, organization_id
        )
        persons = await self.persons.care_service.list_establishment_persons(
            caregiver_user_id, scoped_org, is_admin
        )

        total_persons = len(persons)
        compliance_sum = 0.0
        compliance_count = 0
        late_evals = 0
        now = datetime.now(UTC)

        for p in persons:
            eval_data = await self.clinical.get_latest_evaluation_summary(p.id)
            if eval_data:
                measured = eval_data.measured_at
                if measured.tzinfo is None:
                    measured = measured.replace(tzinfo=UTC)
                if (now - measured).days > 14:
                    late_evals += 1
            else:
                late_evals += 1

            comp = await self.intakes.calculate_7_day_compliance_rate(
                user_id=caregiver_user_id, is_admin=is_admin, person_id=p.id
            )
            if comp.total_recorded > 0:
                compliance_sum += float(comp.compliance_rate_pct)
                compliance_count += 1

        avg_compliance = (compliance_sum / compliance_count) if compliance_count > 0 else 0.0
        urgent_count = await self.repo.count_open_alerts(scoped_org, priorities=["urgent"])
        priority_count = await self.repo.count_open_alerts(
            scoped_org, priorities=["urgent", "high"]
        )
        total_open = await self.repo.count_open_alerts(scoped_org)

        await self.audit.log(
            action="read",
            entity="dashboard_metrics",
            organization_id=scoped_org,
            actor_user_id=caregiver_user_id,
            ip=ip,
            details={"total_persons": total_persons, "open_alerts": total_open},
        )

        return DashboardMetricsResponse(
            organization_id=scoped_org,
            total_persons_followed=total_persons,
            intakes_compliance_7d_pct=round(avg_compliance, 2),
            priority_alerts_count=priority_count,
            urgent_alerts_count=urgent_count,
            late_evaluations_count=late_evals,
            open_alerts_count=total_open,
        )

    async def list_scheduled_evaluations(
        self,
        caregiver_user_id: str,
        organization_id: str,
        is_admin: bool = False,
    ) -> list[DashboardScheduledEvaluationItem]:
        scoped_org = await self.orgs._enforce_establishment_isolation(
            caregiver_user_id, is_admin, organization_id
        )
        persons = await self.persons.care_service.list_establishment_persons(
            caregiver_user_id, scoped_org, is_admin
        )
        now = datetime.now(UTC)
        results: list[DashboardScheduledEvaluationItem] = []

        for p in persons:
            eval_data = await self.clinical.get_latest_evaluation_summary(p.id)
            days_since = None
            measured_dt = None
            status = None
            if eval_data:
                measured = eval_data.measured_at
                measured_dt = measured.replace(tzinfo=UTC) if measured.tzinfo is None else measured
                days_since = (now - measured_dt).days
                status = eval_data.proposed_status

            is_overdue = days_since is None or days_since > 14
            results.append(
                DashboardScheduledEvaluationItem(
                    person_id=p.id,
                    pseudonym=p.pseudonym,
                    first_name=p.first_name,
                    last_evaluation_date=measured_dt,
                    days_since_last_evaluation=days_since,
                    status=status,
                    is_overdue=is_overdue,
                )
            )

        results.sort(key=lambda x: (not x.is_overdue, -(x.days_since_last_evaluation or 999)))
        return results

    async def list_dashboard_persons(
        self,
        caregiver_user_id: str,
        organization_id: str,
        status: str | None = None,
        region_id: str | None = None,
        min_age_months: int | None = None,
        max_age_months: int | None = None,
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
        is_admin: bool = False,
    ) -> list[DashboardPersonItem]:
        scoped_org = await self.orgs._enforce_establishment_isolation(
            caregiver_user_id, is_admin, organization_id
        )
        persons = await self.persons.care_service.list_establishment_persons(
            caregiver_user_id, scoped_org, is_admin
        )
        today = date.today()
        items: list[DashboardPersonItem] = []

        for p in persons:
            if region_id and p.region_id != region_id:
                continue

            age_months = (today.year - p.birth_date.year) * 12 + (today.month - p.birth_date.month)
            if min_age_months is not None and age_months < min_age_months:
                continue
            if max_age_months is not None and age_months > max_age_months:
                continue

            if search:
                q = search.lower().strip()
                if q not in p.pseudonym.lower() and q not in p.first_name.lower():
                    continue

            eval_data = await self.clinical.get_latest_evaluation_summary(p.id)
            nutr_status = eval_data.proposed_status if eval_data else None
            if status and (nutr_status or "").upper() != status.upper():
                continue

            open_alerts = await self.repo.count_open_alerts_for_person(p.id)
            has_urgent = await self.repo.has_urgent_alert_for_person(p.id)
            comp = await self.intakes.calculate_7_day_compliance_rate(
                user_id=caregiver_user_id, is_admin=is_admin, person_id=p.id
            )

            items.append(
                DashboardPersonItem(
                    person_id=p.id,
                    pseudonym=p.pseudonym,
                    first_name=p.first_name,
                    birth_date=p.birth_date,
                    age_months=max(0, age_months),
                    sex=p.sex,
                    region_id=p.region_id,
                    current_nutritional_status=nutr_status,
                    last_evaluation_date=eval_data.measured_at if eval_data else None,
                    last_weight_kg=float(eval_data.weight_kg) if eval_data else None,
                    open_alerts_count=open_alerts,
                    has_urgent_alert=has_urgent,
                    intakes_compliance_7d_pct=float(comp.compliance_rate_pct)
                    if comp.total_recorded > 0
                    else None,
                )
            )

        return items[offset : offset + limit]
