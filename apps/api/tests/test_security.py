"""Tests for password hashing and authentication tokens."""

from __future__ import annotations

from pathlib import Path

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from tsotsa_api.core.config import Settings
from tsotsa_api.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hashing_and_verification() -> None:
    """Verify that bcrypt hashes correctly and verifies matching passwords."""
    raw_pw = "SecureHealthPass123!"
    hashed = hash_password(raw_pw, rounds=4)
    assert hashed.startswith("$2b$")
    assert verify_password(raw_pw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password(raw_pw, "invalid_hash_string") is False


def test_jwt_create_and_decode_hs256() -> None:
    """Verify that JWT tokens round-trip properly with subject and claims."""
    token = create_access_token(
        subject="user-uuid-12345",
        claims={"role": "caregiver"},
    )
    payload = decode_access_token(token)
    assert payload["sub"] == "user-uuid-12345"
    assert payload["role"] == "caregiver"
    assert payload["iss"] == "tsotsa-kids-api"


def test_jwt_create_and_decode_rs256(tmp_path: Path) -> None:
    """Verify that JWT tokens round-trip with RS256 keys."""
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    priv_file = tmp_path / "private.pem"
    pub_file = tmp_path / "public.pem"
    priv_file.write_bytes(private_pem)
    pub_file.write_bytes(public_pem)

    settings = Settings(
        APP_ENV="test",
        JWT_PRIVATE_KEY_PATH=str(priv_file),
        JWT_PUBLIC_KEY_PATH=str(pub_file),
    )

    token = create_access_token(
        subject="doctor-789",
        claims={"scope": "clinical"},
        settings=settings,
    )
    payload = decode_access_token(token, settings=settings)
    assert payload["sub"] == "doctor-789"
    assert payload["scope"] == "clinical"


def test_jwt_invalid_signature_fails() -> None:
    """Verify that tampered or invalid tokens raise decoding errors."""
    with pytest.raises(jwt.PyJWTError):
        decode_access_token("invalid.tampered.token")
