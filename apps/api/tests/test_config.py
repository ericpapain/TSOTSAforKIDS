"""Tests for environment configuration and startup validation."""

from __future__ import annotations

import pytest

from tsotsa_api.core.config import Settings
from tsotsa_api.main import create_app


def test_development_config_valid() -> None:
    """Verify that development configuration starts cleanly with defaults."""
    settings = Settings(APP_ENV="development")
    assert not settings.is_production
    assert settings.DATABASE_POOL_SIZE == 10
    assert len(settings.cors_origins_list) > 0


def test_production_missing_ca_certificate_rejected() -> None:
    """Verify that production fails if DATABASE_SSL_CA_PATH is missing."""
    with pytest.raises(ValueError, match="DATABASE_SSL_CA_PATH"):
        Settings(
            APP_ENV="production",
            DATABASE_SSL_CA_PATH=None,
            JWT_PRIVATE_KEY_PATH="/secrets/private.pem",
            JWT_PUBLIC_KEY_PATH="/secrets/public.pem",
            CORS_ALLOWED_ORIGINS="https://app.tsotsa-for-kids.com",
        )


def test_production_missing_jwt_keys_rejected() -> None:
    """Verify that production fails if JWT public/private key paths are missing."""
    with pytest.raises(ValueError, match="JWT_PRIVATE_KEY_PATH"):
        Settings(
            APP_ENV="production",
            DATABASE_SSL_CA_PATH="/secrets/ca.pem",
            JWT_PRIVATE_KEY_PATH=None,
            JWT_PUBLIC_KEY_PATH=None,
            CORS_ALLOWED_ORIGINS="https://app.tsotsa-for-kids.com",
        )


def test_production_missing_cors_rejected() -> None:
    """Verify that production fails if CORS_ALLOWED_ORIGINS is empty."""
    with pytest.raises(ValueError, match="CORS_ALLOWED_ORIGINS"):
        Settings(
            APP_ENV="production",
            DATABASE_SSL_CA_PATH="/secrets/ca.pem",
            JWT_PRIVATE_KEY_PATH="/secrets/private.pem",
            JWT_PUBLIC_KEY_PATH="/secrets/public.pem",
            CORS_ALLOWED_ORIGINS="",
        )


def test_create_app_enforces_production_validation() -> None:
    """Verify that create_app stops startup when production settings are invalid."""
    with pytest.raises(ValueError, match="Missing mandatory production"):
        invalid_prod_settings = Settings.model_construct(
            APP_ENV="production",
            DATABASE_SSL_CA_PATH=None,
            JWT_PRIVATE_KEY_PATH=None,
            JWT_PUBLIC_KEY_PATH=None,
            CORS_ALLOWED_ORIGINS="",
        )
        create_app(invalid_prod_settings)
