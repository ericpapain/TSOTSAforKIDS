"""Service layer for Domain Monitoring, Alert Evaluation, and Alert Management."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.clinical.service import ClinicalService
from tsotsa_api.modules.consents.service import ConsentsService
from tsotsa_api.modules.intakes.service import IntakesService
from tsotsa_api.modules.monitoring.daily_scan import DailyMonitoringScan
from tsotsa_api.modules.monitoring.dashboard_service import MonitoringDashboardService
from tsotsa_api.modules.monitoring.engine import (
    evaluate_edema_rule,
    evaluate_insufficient_weight_gain_rule,
    evaluate_severe_zone_rule,
    evaluate_unconfirmed_intakes_rule,
    evaluate_weight_loss_rule,
)
from tsotsa_api.modules.monitoring.models import Alert, AlertRule
from tsotsa_api.modules.monitoring.repository import MonitoringRepository
from tsotsa_api.modules.monitoring.schemas import (
    AlertRead,
    AlertRuleRead,
    AlertRuleUpdate,
    NotificationPreferenceRead,
    NotificationPreferenceSetRequest,
)
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.service import PersonsService


class MonitoringService:
    """Orchestrates event-driven alert triggers, periodic scans, and caregiver alerts."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = MonitoringRepository(session)
        self.orgs = OrganizationsService(session)
        self.persons = PersonsService(session)
        self.consents = ConsentsService(session)
        self.clinical = ClinicalService(session)
        self.intakes = IntakesService(session)
        self.audit = AuditService(session)
        self.dashboard = MonitoringDashboardService(session)

    # -------------------------------------------------------------------------
    # Event-Driven Triggers
    # -------------------------------------------------------------------------

    async def on_intake_recorded(self, person_id: str) -> None:
        """Triggered upon new intake creation or batch sync."""
        org_id = await self.persons.get_active_care_organization_id(person_id)
        if not org_id or not await self.consents.has_active_consent(person_id):
            return

        rule = await self.repo.get_rule_by_code("unconfirmed_intakes")
        if not rule or not rule.is_active:
            return

        period_days = int(rule.parameters.get("period_days", 2))
        refused = await self.intakes.get_unconfirmed_intakes_count(person_id, period_days)
        triggered, msg, details = evaluate_unconfirmed_intakes_rule(rule.parameters, refused)

        if triggered:
            await self.repo.create_or_update_open_alert(person_id, org_id, rule, msg, details)

    async def on_clinical_evaluation_recorded(self, evaluation: Any) -> None:
        """Triggered when a caregiver records an anthropometric evaluation."""
        person_id = str(evaluation.person_id)
        org_id = str(evaluation.organization_id)

        # 1. Edema check
        rule_edema = await self.repo.get_rule_by_code("edema")
        if rule_edema and rule_edema.is_active:
            trig, msg, det = evaluate_edema_rule(rule_edema.parameters, evaluation.edema)
            if trig:
                await self.repo.create_or_update_open_alert(person_id, org_id, rule_edema, msg, det)

        # 2. Severe malnutrition zone check
        rule_sz = await self.repo.get_rule_by_code("severe_zone")
        if rule_sz and rule_sz.is_active:
            scores = [{"indicator": s.indicator, "z_score": s.z_score} for s in evaluation.scores]
            trig, msg, det = evaluate_severe_zone_rule(
                rule_sz.parameters, evaluation.proposed_status, scores, evaluation.muac_mm
            )
            if trig:
                await self.repo.create_or_update_open_alert(person_id, org_id, rule_sz, msg, det)

        # 3. Weight loss check
        rule_loss = await self.repo.get_rule_by_code("weight_loss")
        if rule_loss and rule_loss.is_active:
            trig, msg, det = evaluate_weight_loss_rule(
                rule_loss.parameters, evaluation.weight_gain_velocity, evaluation.edema
            )
            if trig:
                await self.repo.create_or_update_open_alert(person_id, org_id, rule_loss, msg, det)

        # 4. Insufficient weight gain check
        rule_gain = await self.repo.get_rule_by_code("insufficient_weight_gain")
        if rule_gain and rule_gain.is_active:
            trig, msg, det = evaluate_insufficient_weight_gain_rule(
                rule_gain.parameters, evaluation.weight_gain_velocity, evaluation.edema
            )
            if trig:
                await self.repo.create_or_update_open_alert(person_id, org_id, rule_gain, msg, det)

    # -------------------------------------------------------------------------
    # Scheduled Daily Monitoring Scan
    # -------------------------------------------------------------------------

    async def run_daily_monitoring_check(self, organization_id: str | None = None) -> int:
        """Run daily automated check across all registered children with active care."""
        scanner = DailyMonitoringScan(
            session=self.session,
            repo=self.repo,
            orgs=self.orgs,
            persons=self.persons,
            clinical=self.clinical,
            intakes=self.intakes,
        )
        return await scanner.run(organization_id)

    # -------------------------------------------------------------------------
    # Alert Listing and Handling
    # -------------------------------------------------------------------------

    async def list_alerts(
        self,
        caregiver_user_id: str,
        organization_id: str,
        status: str | None = "open",
        priority: str | None = None,
        person_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
        is_admin: bool = False,
        ip: str | None = None,
    ) -> list[AlertRead]:
        scoped_org = await self.orgs._enforce_establishment_isolation(
            caregiver_user_id, is_admin, organization_id
        )
        alerts = await self.repo.list_alerts(
            organization_id=scoped_org,
            status=status,
            priority=priority,
            person_id=person_id,
            limit=limit,
            offset=offset,
        )
        await self.audit.log(
            action="read",
            entity="alerts_list",
            organization_id=scoped_org,
            actor_user_id=caregiver_user_id,
            ip=ip,
            details={"count": len(alerts), "status": status, "priority": priority},
        )
        return [self._alert_to_read(a) for a in alerts]

    async def handle_alert(
        self,
        caregiver_user_id: str,
        alert_id: str,
        notes: str | None = None,
        is_admin: bool = False,
        ip: str | None = None,
    ) -> AlertRead:
        alert = await self.repo.get_alert_by_id(alert_id)
        if not alert:
            raise NotFoundError("Alerte introuvable.")

        await self.orgs._enforce_establishment_isolation(
            caregiver_user_id, is_admin, alert.organization_id
        )
        handled = await self.repo.handle_alert(alert, handled_by=caregiver_user_id, notes=notes)

        await self.audit.log(
            action="update",
            entity="alert",
            entity_id=alert_id,
            organization_id=alert.organization_id,
            actor_user_id=caregiver_user_id,
            ip=ip,
            details={"status": "handled", "notes": notes},
        )
        return self._alert_to_read(handled)

    # -------------------------------------------------------------------------
    # Administration: Alert Rules
    # -------------------------------------------------------------------------

    async def list_alert_rules(self, is_admin: bool) -> list[AlertRuleRead]:
        if not is_admin:
            raise ForbiddenError("Accès réservé aux administrateurs.")
        rules = await self.repo.list_rules()
        return [self._rule_to_read(r) for r in rules]

    async def update_alert_rule(
        self,
        admin_user_id: str,
        rule_id: str,
        payload: AlertRuleUpdate,
        is_admin: bool,
        ip: str | None = None,
    ) -> AlertRuleRead:
        if not is_admin:
            raise ForbiddenError("Accès réservé aux administrateurs.")
        rule = await self.repo.get_rule_by_id(rule_id)
        if not rule:
            raise NotFoundError("Règle d'alerte introuvable.")

        updated = await self.repo.update_rule(
            rule=rule,
            parameters=payload.parameters,
            priority=payload.priority,
            is_active=payload.is_active,
        )
        await self.audit.log(
            action="update",
            entity="alert_rule",
            entity_id=rule_id,
            actor_user_id=admin_user_id,
            ip=ip,
            details=payload.model_dump(exclude_unset=True),
        )
        return self._rule_to_read(updated)

    # -------------------------------------------------------------------------
    # Notification Preferences
    # -------------------------------------------------------------------------

    async def set_notification_preference(
        self, user_id: str, payload: NotificationPreferenceSetRequest
    ) -> NotificationPreferenceRead:
        pref = await self.repo.set_notification_preference(
            user_id=user_id,
            person_id=payload.person_id,
            notification_type=payload.notification_type,
            channel=payload.channel,
            enabled=payload.enabled,
        )
        return NotificationPreferenceRead.model_validate(pref)

    # -------------------------------------------------------------------------
    # Serializers
    # -------------------------------------------------------------------------

    def _alert_to_read(self, a: Alert) -> AlertRead:
        return AlertRead(
            id=a.id,
            person_id=a.person_id,
            organization_id=a.organization_id,
            rule_id=a.rule_id,
            rule_code=a.rule_code,
            priority=a.priority,  # type: ignore[arg-type]
            status=a.status,  # type: ignore[arg-type]
            message=a.message,
            details=a.details,
            opened_at=a.opened_at,
            handled_at=a.handled_at,
            handled_by=a.handled_by,
            handling_notes=a.handling_notes,
        )

    def _rule_to_read(self, r: AlertRule) -> AlertRuleRead:
        return AlertRuleRead(
            id=r.id,
            code=r.code,
            name=r.name,
            description=r.description,
            parameters=r.parameters,
            priority=r.priority,  # type: ignore[arg-type]
            is_active=r.is_active,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
