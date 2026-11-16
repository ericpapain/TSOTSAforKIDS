"""Pytest configuration and shared fixtures for TSOTSA Kids API tests."""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

import tsotsa_api.modules.health.models  # noqa: F401
from tsotsa_api.core.config import Settings
from tsotsa_api.core.database import Base, get_db_session
from tsotsa_api.main import create_app
from tsotsa_api.modules.identity.rate_limit import RateLimiter


def get_test_settings() -> Settings:
    """Return test settings overriding database URL for tests."""
    test_db_url = os.getenv(
        "DATABASE_URL_TEST",
        "sqlite+aiosqlite:///:memory:",
    )
    return Settings(
        APP_ENV="test",
        DATABASE_URL=test_db_url,
        DATABASE_MIGRATIONS_URL=test_db_url,
        DATABASE_SSL_CA_PATH=None,
        BCRYPT_ROUNDS=4,
        CORS_ALLOWED_ORIGINS="http://localhost:3000,https://app.tsotsa-for-kids.com",
    )


@pytest_asyncio.fixture
async def test_engine() -> AsyncGenerator[AsyncEngine, None]:
    """Provide a test database engine (MySQL if running, SQLite fallback)."""
    settings = get_test_settings()
    test_url = settings.DATABASE_URL

    try:
        temp_engine = create_async_engine(test_url, pool_pre_ping=True)
        async with temp_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        actual_engine = temp_engine
    except Exception:
        # Fallback to in-memory sqlite if Docker MySQL is not active
        try:
            await temp_engine.dispose()
        except Exception:
            pass
        actual_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    async with actual_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield actual_engine

    async with actual_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await actual_engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """Provide an isolated database session per test."""
    RateLimiter.clear()
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session

    async with test_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an asynchronous test HTTP client with overridden database session."""
    settings = get_test_settings()
    app = create_app(settings)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session
        await db_session.commit()

    app.dependency_overrides[get_db_session] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
