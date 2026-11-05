"""Tests for database engine configuration and privileges isolation."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.config import Settings
from tsotsa_api.core.database import (
    build_connect_args,
    check_database_connection,
    create_ssl_context,
    get_engine,
)


def test_engine_never_uses_migrations_url() -> None:
    """Verify that get_engine uses DATABASE_URL and never DATABASE_MIGRATIONS_URL."""
    app_url = "mysql+asyncmy://tsotsa_app:secret1@127.0.0.1:3306/tsotsa_dev"
    migrator_url = "mysql+asyncmy://tsotsa_migrator:secret2@127.0.0.1:3306/tsotsa_dev"

    settings = Settings(
        APP_ENV="development",
        DATABASE_URL=app_url,
        DATABASE_MIGRATIONS_URL=migrator_url,
    )

    with patch("tsotsa_api.core.database.create_async_engine") as mock_create_engine:
        get_engine(settings)
        mock_create_engine.assert_called_once()
        passed_url = mock_create_engine.call_args[0][0]
        assert passed_url == app_url
        assert passed_url != migrator_url
        assert "tsotsa_app" in passed_url
        assert "tsotsa_migrator" not in passed_url


def test_build_connect_args_enforces_conventions() -> None:
    """Verify charset utf8mb4, UTC timezone and STRICT_TRANS_TABLES."""
    settings = Settings(APP_ENV="development")
    args = build_connect_args(settings)
    assert args["charset"] == "utf8mb4"
    assert "time_zone = '+00:00'" in args["init_command"]
    assert "STRICT_TRANS_TABLES" in args["init_command"]


def test_create_ssl_context() -> None:
    """Verify SSL context creation behavior."""
    assert create_ssl_context(None) is None


@pytest.mark.asyncio
async def test_check_database_connection(db_session: AsyncSession) -> None:
    """Verify that check_database_connection returns True on active session."""
    is_up = await check_database_connection(db_session)
    assert is_up is True
