"""Base notification channel interfaces and data transfer objects."""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Sequence
from dataclasses import dataclass, field

from tsotsa_api.modules.notifications.models import Notification


@dataclass
class ChannelSendResult:
    """Result of transmitting a single notification."""

    notification_id: str
    success: bool
    ticket_id: str | None = None
    error_message: str | None = None
    invalid_tokens: list[str] = field(default_factory=list)


class NotificationChannel(ABC):
    """Abstract notification delivery channel."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the channel, e.g. 'push', 'sms', 'email', 'in_app'."""
        raise NotImplementedError

    @abstractmethod
    async def send_batch(
        self,
        notifications: Sequence[Notification],
        user_tokens: dict[str, list[str]],
    ) -> list[ChannelSendResult]:
        """Dispatch a batch of notifications over this channel."""
        raise NotImplementedError
