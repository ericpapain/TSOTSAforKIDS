"""Security primitives: password hashing and JWT token handling.

Uses native bcrypt with BCRYPT_ROUNDS and pyjwt for RS256 authentication tokens.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from tsotsa_api.core.config import Settings, get_settings


def hash_password(password: str, rounds: int | None = None) -> str:
    """Hash a plaintext password using bcrypt."""
    cfg = get_settings()
    actual_rounds = rounds or cfg.BCRYPT_ROUNDS
    salt = bcrypt.gensalt(rounds=actual_rounds)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def create_access_token(
    subject: str,
    claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
    settings: Settings | None = None,
) -> str:
    """Create a signed JWT access token."""
    cfg = settings or get_settings()
    now = datetime.now(UTC)
    delta = expires_delta or timedelta(minutes=cfg.JWT_ACCESS_TTL_MINUTES)
    expire = now + delta

    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "tsotsa-kids-api",
    }
    if claims:
        payload.update(claims)

    if cfg.JWT_PRIVATE_KEY_PATH:
        with open(cfg.JWT_PRIVATE_KEY_PATH, encoding="utf-8") as f:
            private_key = f.read()
        return jwt.encode(payload, private_key, algorithm="RS256")

    # Fallback to dev secret HMAC for local development / testing
    return jwt.encode(payload, "dev-insecure-secret-key-32-bytes!!", algorithm="HS256")


def decode_access_token(token: str, settings: Settings | None = None) -> dict[str, Any]:
    """Decode and validate a JWT access token."""
    cfg = settings or get_settings()
    if cfg.JWT_PUBLIC_KEY_PATH:
        with open(cfg.JWT_PUBLIC_KEY_PATH, encoding="utf-8") as f:
            public_key = f.read()
        return jwt.decode(token, public_key, algorithms=["RS256"], issuer="tsotsa-kids-api")

    return jwt.decode(
        token,
        "dev-insecure-secret-key-32-bytes!!",
        algorithms=["HS256"],
        issuer="tsotsa-kids-api",
    )


def generate_random_token(length: int = 32) -> str:
    """Generate a secure cryptographically random hex token."""
    return secrets.token_hex(length)


def generate_numeric_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP code."""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def hash_token(token: str) -> str:
    """Compute standard SHA-256 digest of a token string."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
