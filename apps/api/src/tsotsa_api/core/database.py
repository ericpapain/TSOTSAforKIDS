"""Database connection and session management using SQLAlchemy 2 and asyncmy.

Conforms to docs/TSOTSA_Kids_Configuration.md Section 4.3:
- Driver: asyncmy
- Charset: utf8mb4
- Session timezone: +00:00 (UTC)
- SQL Mode: STRICT_TRANS_TABLES
- Connection pool: pool_pre_ping=True, pool_recycle=1800
- TLS verification when DATABASE_SSL_CA_PATH is provided or in staging/production
"""

from __future__ import annotations

import ssl
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from tsotsa_api.core.config import Settings, get_settings


def create_ssl_context(ca_path: str | None) -> ssl.SSLContext | None:
    """Create an SSL context verifying the provided CA certificate."""
    if not ca_path:
        return None
    context = ssl.create_default_context(cafile=ca_path)
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    return context


def build_connect_args(settings: Settings) -> dict[str, Any]:
    """Build driver-specific connection arguments for MySQL."""
    connect_args: dict[str, Any] = {
        "charset": "utf8mb4",
        "init_command": "SET time_zone = '+00:00', sql_mode = 'STRICT_TRANS_TABLES'",
    }
    if settings.DATABASE_SSL_CA_PATH:
        ssl_ctx = create_ssl_context(settings.DATABASE_SSL_CA_PATH)
        if ssl_ctx:
            connect_args["ssl"] = ssl_ctx
    return connect_args


def get_engine(settings: Settings | None = None) -> AsyncEngine:
    """Create and return the asynchronous engine using DATABASE_URL."""
    cfg = settings or get_settings()

    # The application runtime strictly uses DATABASE_URL (tsotsa_app user).
    # DATABASE_MIGRATIONS_URL is reserved exclusively for Alembic migrations.
    url = cfg.DATABASE_URL
    is_sqlite = url.startswith("sqlite")

    if is_sqlite:
        return create_async_engine(url, echo=False)

    connect_args = build_connect_args(cfg)
    return create_async_engine(
        url,
        echo=False,
        pool_size=cfg.DATABASE_POOL_SIZE,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=1800,
        connect_args=connect_args,
    )


# Module-level engine and sessionmaker
engine: AsyncEngine = get_engine()
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency providing an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def check_database_connection(session: AsyncSession) -> bool:
    """Execute a simple query to verify database connectivity."""
    try:
        result = await session.execute(text("SELECT 1"))
        return result.scalar() == 1
    except Exception:
        return False
