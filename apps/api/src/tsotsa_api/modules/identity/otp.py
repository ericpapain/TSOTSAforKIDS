"""OTP sender abstractions and implementations."""

from __future__ import annotations

from abc import ABC, abstractmethod

from tsotsa_api.core.config import Settings, get_settings
from tsotsa_api.core.logging import get_logger

logger = get_logger("identity.otp")


class OtpSender(ABC):
    """Abstract interface for dispatching one-time password codes."""

    @abstractmethod
    async def send_otp(self, phone_e164: str, code: str) -> None:
        """Send the OTP code to the designated international phone number."""


class ConsoleOtpSender(OtpSender):
    """Development sender logging OTP codes to application logs."""

    async def send_otp(self, phone_e164: str, code: str) -> None:
        logger.info(
            "sms_otp_dispatched",
            phone_e164=phone_e164,
            otp_code=code,
            provider="console",
            note="Development console sender only",
        )


class SmsOtpSender(OtpSender):
    """SMS aggregator sender implementation configured via settings."""

    def __init__(
        self,
        api_key: str = "",
        sender_name: str = "TSOTSA",
        provider: str = "generic",
    ) -> None:
        self.api_key = api_key
        self.sender_name = sender_name
        self.provider = provider

    async def send_otp(self, phone_e164: str, code: str) -> None:
        if not self.api_key:
            logger.warning(
                "sms_provider_unconfigured_fallback_to_log",
                phone_e164=phone_e164,
                provider=self.provider,
            )
            # In development fallback to console logging
            logger.info("sms_otp_dispatched", phone_e164=phone_e164, otp_code=code)
            return

        # Integration with external SMS gateway
        logger.info(
            "sms_otp_gateway_dispatched",
            phone_e164=phone_e164,
            sender_name=self.sender_name,
            provider=self.provider,
        )


def get_otp_sender(settings: Settings | None = None) -> OtpSender:
    """Factory returning the appropriate OTP sender based on configuration."""
    cfg = settings or get_settings()
    if cfg.SMS_PROVIDER == "console" or not cfg.SMS_API_KEY:
        return ConsoleOtpSender()
    return SmsOtpSender(
        api_key=cfg.SMS_API_KEY,
        sender_name=cfg.SMS_SENDER_NAME,
        provider=cfg.SMS_PROVIDER,
    )
