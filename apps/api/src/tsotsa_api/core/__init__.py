"""Core shared infrastructure for TSOTSA Kids API."""

from tsotsa_api.core.config import Settings, get_settings
from tsotsa_api.core.database import check_database_connection, get_db_session
from tsotsa_api.core.errors import (
    AppException,
    ErrorEnvelope,
    NotFoundError,
    ServiceUnavailableError,
    UnauthorizedError,
)
from tsotsa_api.core.logging import get_logger, setup_logging
from tsotsa_api.core.pagination import PaginatedResponse, PaginationParams
from tsotsa_api.core.security import hash_password, verify_password

__all__ = [
    "AppException",
    "ErrorEnvelope",
    "NotFoundError",
    "PaginatedResponse",
    "PaginationParams",
    "ServiceUnavailableError",
    "Settings",
    "UnauthorizedError",
    "check_database_connection",
    "get_db_session",
    "get_logger",
    "get_settings",
    "hash_password",
    "setup_logging",
    "verify_password",
]
