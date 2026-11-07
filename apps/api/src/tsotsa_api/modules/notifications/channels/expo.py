"""Expo Push notification channel implementation."""

from __future__ import annotations

import logging
from collections.abc import Sequence
from typing import Any

import httpx

from tsotsa_api.modules.notifications.channels.base import ChannelSendResult, NotificationChannel
from tsotsa_api.modules.notifications.models import Notification

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
MAX_EXPO_BATCH_SIZE = 100


class ExpoPushChannel(NotificationChannel):
    """Transmits push notifications to Android/iOS devices via Expo Push API."""

    def __init__(self, endpoint_url: str = EXPO_PUSH_URL) -> None:
        self.endpoint_url = endpoint_url

    @property
    def name(self) -> str:
        return "push"

    async def send_batch(
        self,
        notifications: Sequence[Notification],
        user_tokens: dict[str, list[str]],
    ) -> list[ChannelSendResult]:
        results: list[ChannelSendResult] = []
        messages_to_send: list[dict[str, Any]] = []
        map_idx_to_meta: list[tuple[str, str]] = []  # (notification_id, push_token)

        for notif in notifications:
            tokens = user_tokens.get(notif.user_id, [])
            if not tokens:
                results.append(
                    ChannelSendResult(
                        notification_id=notif.id,
                        success=False,
                        error_message="Aucun jeton d'appareil actif pour cet utilisateur.",
                    )
                )
                continue

            for token in tokens:
                payload = notif.payload or {}
                msg = {
                    "to": token,
                    "title": notif.title,
                    "body": notif.body,
                    "sound": "default",
                    "priority": "high",
                    "channelId": "reminders",
                    "_category": "reminder",
                    "data": {
                        "notification_id": notif.id,
                        "person_id": notif.person_id,
                        "schedule_id": notif.schedule_id,
                        "type": notif.type,
                        **payload,
                    },
                }
                messages_to_send.append(msg)
                map_idx_to_meta.append((notif.id, token))

        if not messages_to_send:
            return results

        # Send in chunks of 100 max
        for i in range(0, len(messages_to_send), MAX_EXPO_BATCH_SIZE):
            chunk = messages_to_send[i : i + MAX_EXPO_BATCH_SIZE]
            meta_chunk = map_idx_to_meta[i : i + MAX_EXPO_BATCH_SIZE]
            chunk_results = await self._dispatch_chunk(chunk, meta_chunk)
            results.extend(chunk_results)

        return results

    async def _dispatch_chunk(
        self,
        chunk: list[dict[str, Any]],
        meta_chunk: list[tuple[str, str]],
    ) -> list[ChannelSendResult]:
        chunk_results: list[ChannelSendResult] = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.endpoint_url, json=chunk)
                if resp.status_code != 200:
                    for notif_id, _ in meta_chunk:
                        chunk_results.append(
                            ChannelSendResult(
                                notification_id=notif_id,
                                success=False,
                                error_message=f"HTTP {resp.status_code}: {resp.text[:100]}",
                            )
                        )
                    return chunk_results

                data = resp.json().get("data", [])
                for idx, ticket in enumerate(data):
                    notif_id, token = meta_chunk[idx]
                    status_str = ticket.get("status")
                    if status_str == "ok":
                        chunk_results.append(
                            ChannelSendResult(
                                notification_id=notif_id,
                                success=True,
                                ticket_id=ticket.get("id"),
                            )
                        )
                    else:
                        details = ticket.get("details", {})
                        err_code = details.get("error")
                        invalid = [token] if err_code == "DeviceNotRegistered" else []
                        chunk_results.append(
                            ChannelSendResult(
                                notification_id=notif_id,
                                success=False,
                                error_message=ticket.get("message") or str(err_code),
                                invalid_tokens=invalid,
                            )
                        )
        except Exception as exc:
            logger.warning("Erreur lors de l'envoi Expo Push : %s", exc)
            for notif_id, _ in meta_chunk:
                chunk_results.append(
                    ChannelSendResult(
                        notification_id=notif_id,
                        success=False,
                        error_message=str(exc),
                    )
                )
        return chunk_results
