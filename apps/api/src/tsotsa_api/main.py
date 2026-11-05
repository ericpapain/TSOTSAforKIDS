"""Application factory and root API routes for TSOTSA Kids backend."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import APIRouter, Depends, FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.exceptions import HTTPException as StarletteHTTPException

from tsotsa_api.core.config import Settings, get_settings
from tsotsa_api.core.database import check_database_connection, get_db_session
from tsotsa_api.core.errors import (
    AppException,
    ServiceUnavailableError,
    app_exception_handler,
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from tsotsa_api.core.logging import get_logger, setup_logging
from tsotsa_api.modules.identity import auth_router

logger = get_logger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create and configure the FastAPI application instance."""
    cfg = settings or get_settings()

    # Enforce strict validation in production environments
    if cfg.is_production:
        cfg.check_production_requirements()

    setup_logging(cfg)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> Any:
        logger.info("Application starting up", env=cfg.APP_ENV)
        yield
        logger.info("Application shutting down", env=cfg.APP_ENV)

    app = FastAPI(
        title="TSOTSA Kids API",
        version="0.1.0",
        description="Infant nutrition platform backend API",
        docs_url="/docs",
        redoc_url=None,
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register error handlers
    app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, generic_exception_handler)

    # System Health Check endpoint
    @app.get("/health", tags=["System"])
    async def health_check(session: AsyncSession = Depends(get_db_session)) -> dict[str, Any]:
        is_healthy = await check_database_connection(session)
        if not is_healthy:
            raise ServiceUnavailableError("Database unreachable")
        return {"status": "ok", "database": "connected"}

    # V1 API Router
    v1_router = APIRouter(prefix="/v1")

    @v1_router.get("/", tags=["Root"])
    async def v1_root() -> dict[str, str]:
        return {"message": "TSOTSA Kids API v1", "status": "active"}

    v1_router.include_router(auth_router)
    app.include_router(v1_router)

    return app


app = create_app()
