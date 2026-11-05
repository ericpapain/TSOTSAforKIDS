"""Rate limiting mechanisms for authentication endpoints."""

from __future__ import annotations

import time
from collections import defaultdict
from typing import ClassVar

from tsotsa_api.core.errors import AppException


class RateLimiter:
    """Sliding-window in-memory rate limiter per IP address and identifier."""

    _attempts: ClassVar[dict[str, list[float]]] = defaultdict(list)

    @classmethod
    def check_limit(
        cls,
        key: str,
        max_attempts: int = 5,
        window_seconds: int = 60,
    ) -> None:
        """Check if an action is within allowed rate limits, otherwise raise 429."""
        now = time.time()
        cutoff = now - window_seconds
        records = [ts for ts in cls._attempts[key] if ts > cutoff]
        if len(records) >= max_attempts:
            retry_after = int(window_seconds - (now - records[0]))
            raise AppException(
                status_code=429,
                code="RATE_LIMIT_EXCEEDED",
                message=f"Too many attempts. Please try again in {max(retry_after, 1)} seconds.",
                details={"retry_after_seconds": max(retry_after, 1)},
            )
        records.append(now)
        cls._attempts[key] = records

    @classmethod
    def reset(cls) -> None:
        """Clear all rate limit records (useful for test isolation)."""
        cls._attempts.clear()

    @classmethod
    def clear(cls) -> None:
        """Alias for reset."""
        cls.reset()
