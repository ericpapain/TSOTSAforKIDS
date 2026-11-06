"""Data access layer for Domain Monitoring, Alerts, and Notification Preferences."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.monitoring.models import Alert, AlertRule, NotificationPreference


class MonitoringRepository:
    """Manages database persistence for alert rules, active alerts, and preferences."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_rule_by_code(self, code: str) -> AlertRule | None:
        stmt = select(AlertRule).where(AlertRule.code == code)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_rule_by_id(self, rule_id: str) -> AlertRule | None:
        stmt = select(AlertRule).where(AlertRule.id == rule_id)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_rules(self, only_active: bool = False) -> list[AlertRule]:
        stmt = select(AlertRule).order_by(AlertRule.code.asc())
        if only_active:
            stmt = stmt.where(AlertRule.is_active.is_(True))
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def update_rule(
        self,
        rule: AlertRule,
        parameters: dict[str, Any] | None = None,
        priority: str | None = None,
        is_active: bool | None = None,
    ) -> AlertRule:
        if parameters is not None:
            rule.parameters = parameters
        if priority is not None:
            rule.priority = priority
        if is_active is not None:
            rule.is_active = is_active
        rule.updated_at = datetime.now(UTC)
        await self.session.flush()
        return rule

    async def get_open_alert(self, person_id: str, rule_code: str) -> Alert | None:
        stmt = select(Alert).where(
            and_(
                Alert.person_id == person_id,
                Alert.rule_code == rule_code,
                Alert.status == "open",
            )
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_or_update_open_alert(
        self,
        person_id: str,
        organization_id: str,
        rule: AlertRule,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> Alert:
        existing = await self.get_open_alert(person_id=person_id, rule_code=rule.code)
        if existing:
            existing.message = message
            existing.priority = rule.priority
            existing.details = details
            existing.organization_id = organization_id
            await self.session.flush()
            return existing

        alert = Alert(
            person_id=person_id,
            organization_id=organization_id,
            rule_id=rule.id,
            rule_code=rule.code,
            priority=rule.priority,
            status="open",
            message=message,
            details=details,
            opened_at=datetime.now(UTC),
        )
        self.session.add(alert)
        await self.session.flush()
        return alert

    async def get_alert_by_id(self, alert_id: str) -> Alert | None:
        stmt = select(Alert).where(Alert.id == alert_id)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_alerts(
        self,
        organization_id: str,
        status: str | None = None,
        priority: str | None = None,
        person_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Alert]:
        priority_order = case(
            (Alert.priority == "urgent", 1),
            (Alert.priority == "high", 2),
            (Alert.priority == "normal", 3),
            else_=4,
        )
        stmt = select(Alert).where(Alert.organization_id == organization_id)
        if status:
            stmt = stmt.where(Alert.status == status)
        if priority:
            stmt = stmt.where(Alert.priority == priority)
        if person_id:
            stmt = stmt.where(Alert.person_id == person_id)

        stmt = stmt.order_by(priority_order.asc(), Alert.opened_at.desc())
        stmt = stmt.limit(limit).offset(offset)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def handle_alert(
        self,
        alert: Alert,
        handled_by: str,
        notes: str | None = None,
    ) -> Alert:
        alert.status = "handled"
        alert.handled_by = handled_by
        alert.handled_at = datetime.now(UTC)
        alert.handling_notes = notes
        await self.session.flush()
        return alert

    async def count_open_alerts(
        self,
        organization_id: str,
        priorities: list[str] | None = None,
    ) -> int:
        stmt = select(func.count(Alert.id)).where(
            and_(Alert.organization_id == organization_id, Alert.status == "open")
        )
        if priorities:
            stmt = stmt.where(Alert.priority.in_(priorities))
        res = await self.session.execute(stmt)
        return int(res.scalar() or 0)

    async def count_open_alerts_for_person(self, person_id: str) -> int:
        stmt = select(func.count(Alert.id)).where(
            and_(Alert.person_id == person_id, Alert.status == "open")
        )
        res = await self.session.execute(stmt)
        return int(res.scalar() or 0)

    async def has_urgent_alert_for_person(self, person_id: str) -> bool:
        stmt = select(func.count(Alert.id)).where(
            and_(
                Alert.person_id == person_id,
                Alert.status == "open",
                Alert.priority == "urgent",
            )
        )
        res = await self.session.execute(stmt)
        return int(res.scalar() or 0) > 0

    async def get_notification_preference(
        self,
        user_id: str,
        person_id: str | None,
        notification_type: str = "reminders",
    ) -> NotificationPreference | None:
        stmt = select(NotificationPreference).where(
            and_(
                NotificationPreference.user_id == user_id,
                NotificationPreference.person_id == person_id,
                NotificationPreference.notification_type == notification_type,
            )
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def set_notification_preference(
        self,
        user_id: str,
        person_id: str | None,
        notification_type: str,
        channel: str,
        enabled: bool,
    ) -> NotificationPreference:
        pref = await self.get_notification_preference(user_id, person_id, notification_type)
        if pref:
            pref.enabled = enabled
            pref.channel = channel
            pref.updated_at = datetime.now(UTC)
            await self.session.flush()
            return pref

        pref = NotificationPreference(
            user_id=user_id,
            person_id=person_id,
            notification_type=notification_type,
            channel=channel,
            enabled=enabled,
        )
        self.session.add(pref)
        await self.session.flush()
        return pref

    async def is_reminders_enabled_for_person(self, person_id: str) -> bool:
        stmt = select(NotificationPreference.enabled).where(
            and_(
                NotificationPreference.person_id == person_id,
                NotificationPreference.notification_type == "reminders",
            )
        )
        res = await self.session.execute(stmt)
        rows = list(res.scalars().all())
        if not rows:
            return True
        return all(rows)
