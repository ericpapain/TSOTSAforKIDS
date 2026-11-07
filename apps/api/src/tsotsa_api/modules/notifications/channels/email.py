"""Transactional email notification channel implementation."""

from __future__ import annotations

import logging
from collections.abc import Sequence

from tsotsa_api.modules.notifications.channels.base import ChannelSendResult, NotificationChannel
from tsotsa_api.modules.notifications.models import Notification

logger = logging.getLogger(__name__)


class EmailChannel(NotificationChannel):
    """Dispatches transactional email notifications."""

    def __init__(self, smtp_host: str | None = None) -> None:
        self.smtp_host = smtp_host

    @property
    def name(self) -> str:
        return "email"

    async def send_batch(
        self,
        notifications: Sequence[Notification],
        user_tokens: dict[str, list[str]],
    ) -> list[ChannelSendResult]:
        results: list[ChannelSendResult] = []
        for notif in notifications:
            logger.info("Envoi Email vers utilisateur %s : %s", notif.user_id, notif.title)
            results.append(
                ChannelSendResult(
                    notification_id=notif.id,
                    success=True,
                    ticket_id=f"email-{notif.id[:8]}",
                )
            )
        return results
