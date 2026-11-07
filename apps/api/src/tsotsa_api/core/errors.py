"""Standardized application errors and exception handlers.

All API errors return a uniform envelope:
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description",
    "details": null | [...] | {...}
  }
}
"""

from __future__ import annotations

from typing import Any

from fastapi import Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException


class ErrorDetail(BaseModel):
    """Normalized payload representing an error."""

    code: str
    message: str
    details: Any = None


class ErrorEnvelope(BaseModel):
    """Top-level envelope for error responses."""

    error: ErrorDetail


class AppException(Exception):
    """Base application exception with standardized code and status."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Any = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class NotFoundError(AppException):
    """Resource not found (404)."""

    def __init__(self, message: str = "Resource not found", details: Any = None) -> None:
        super().__init__(
            code="NOT_FOUND",
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class UnauthorizedError(AppException):
    """Authentication required or invalid (401)."""

    def __init__(self, message: str = "Authentication required", details: Any = None) -> None:
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
        )


class ForbiddenError(AppException):
    """Insufficient privileges (403)."""

    def __init__(self, message: str = "Access forbidden", details: Any = None) -> None:
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
        )


class ValidationError(AppException):
    """Validation or business quality rule error (422)."""

    def __init__(self, message: str = "Validation failed", details: Any = None) -> None:
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=getattr(
                status, "HTTP_422_UNPROCESSABLE_CONTENT", status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            details=details,
        )


class ServiceUnavailableError(AppException):
    """Service temporarily unavailable (503)."""

    def __init__(self, message: str = "Service unavailable", details: Any = None) -> None:
        super().__init__(
            code="SERVICE_UNAVAILABLE",
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
        )


def make_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Any = None,
) -> JSONResponse:
    """Build a standardized JSON error response."""
    payload = {
        "error": {
            "code": code,
            "message": message,
            "details": details,
        }
    }
    return JSONResponse(status_code=status_code, content=payload)


async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    """Handle custom application exceptions."""
    return make_error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
    )


async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard Starlette/FastAPI HTTP exceptions."""
    code = f"HTTP_{exc.status_code}"
    return make_error_response(
        status_code=exc.status_code,
        code=code,
        message=str(exc.detail),
    )


async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request payload and parameter validation errors."""
    http_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)
    return make_error_response(
        status_code=http_422,
        code="VALIDATION_ERROR",
        message="Request validation failed",
        details=jsonable_encoder(exc.errors()),
    )


async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for unhandled server exceptions."""
    return make_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected server error occurred.",
        details=str(exc) if __debug__ else None,
    )
