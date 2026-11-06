"""In-app notification center delivery channel."""

from __future__ import annotations

from collections.abc import Sequence

from tsotsa_api.modules.notifications.channels.base import ChannelSendResult, NotificationChannel
from tsotsa_api.modules.notifications.models import Notification


class InAppChannel(NotificationChannel):
    """Delivers notification directly to the in-app notification center."""

    @property
    def name(self) -> str:
        return "in_app"

    async def send_batch(
        self,
        notifications: Sequence[Notification],
        user_tokens: dict[str, list[str]],
    ) -> list[ChannelSendResult]:
        results: list[ChannelSendResult] = []
        for notif in notifications:
            results.append(
                ChannelSendResult(
                    notification_id=notif.id,
                    success=True,
                    ticket_id=f"inapp-{notif.id[:8]}",
                )
            )
        return results
