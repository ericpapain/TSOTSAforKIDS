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
from tsotsa_api.modules.audit import audit_admin_router
from tsotsa_api.modules.consents import (
    admin_consents_router,
    consents_router,
    person_consents_router,
)
from tsotsa_api.modules.custom_products import (
    custom_products_admin_router,
    custom_products_router,
)
from tsotsa_api.modules.food_database import food_admin_router, foods_router
from tsotsa_api.modules.identity import auth_router
from tsotsa_api.modules.modules_registry import (
    admin_router as modules_admin_router,
)
from tsotsa_api.modules.modules_registry import (
    public_router as modules_public_router,
)
from tsotsa_api.modules.nutrients import nutrients_router
from tsotsa_api.modules.organizations import (
    admin_router as organizations_admin_router,
)
from tsotsa_api.modules.organizations import (
    organizations_router,
    regions_router,
    users_region_router,
)
from tsotsa_api.modules.orkg_sync import orkg_sync_admin_router
from tsotsa_api.modules.persons import caregiver_persons_router, family_router
from tsotsa_api.modules.reference_products import (
    products_router,
    reference_products_admin_router,
)

logger = get_logger(__name__)


def _build_v1_router() -> APIRouter:
    """Create and configure the /v1 API router."""
    v1_router = APIRouter(prefix="/v1")

    @v1_router.get("/", tags=["Root"])
    async def v1_root() -> dict[str, str]:
        return {"message": "TSOTSA Kids API v1", "status": "active"}

    v1_router.include_router(auth_router)
    v1_router.include_router(nutrients_router)
    v1_router.include_router(food_admin_router)
    v1_router.include_router(foods_router)
    v1_router.include_router(products_router)
    v1_router.include_router(reference_products_admin_router)
    v1_router.include_router(custom_products_router)
    v1_router.include_router(custom_products_admin_router)
    v1_router.include_router(orkg_sync_admin_router)
    v1_router.include_router(modules_public_router)
    v1_router.include_router(modules_admin_router)
    v1_router.include_router(organizations_router)
    v1_router.include_router(regions_router)
    v1_router.include_router(users_region_router)
    v1_router.include_router(organizations_admin_router)
    v1_router.include_router(family_router)
    v1_router.include_router(caregiver_persons_router)
    v1_router.include_router(consents_router)
    v1_router.include_router(admin_consents_router)
    v1_router.include_router(person_consents_router)
    v1_router.include_router(audit_admin_router)
    return v1_router


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create and configure the FastAPI application instance."""
    cfg = settings or get_settings()
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

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, generic_exception_handler)

    @app.get("/health", tags=["System"])
    async def health_check(session: AsyncSession = Depends(get_db_session)) -> dict[str, Any]:
        is_healthy = await check_database_connection(session)
        if not is_healthy:
            raise ServiceUnavailableError("Database unreachable")
        return {"status": "ok", "database": "connected"}

    app.include_router(_build_v1_router())
    return app


app = create_app()
