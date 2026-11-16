"""Standardized application errors and exception handlers.

Uniform envelope with stable i18n code, params, and detail.
"""

from __future__ import annotations

from typing import Any

from fastapi import Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

LEGACY_TO_I18N_CODE: dict[str, str] = {
    "OTP_MAX_ATTEMPTS_EXCEEDED": "auth.otp_max_attempts",
    "EMAIL_ALREADY_EXISTS": "auth.email_already_exists",
    "ACCOUNT_ALREADY_EXISTS": "auth.account_already_exists",
    "CARE_GIVER_NOT_VERIFIED": "auth.caregiver_not_verified",
    "RATE_LIMIT_EXCEEDED": "auth.rate_limit_exceeded",
    "REGION_ALREADY_EXISTS": "region.already_exists",
    "UNAUTHORIZED": "auth.unauthorized",
    "FORBIDDEN": "auth.forbidden",
    "NOT_FOUND": "common.not_found",
    "HTTP_404": "common.not_found",
    "HTTP_401": "auth.unauthorized",
    "HTTP_403": "auth.forbidden",
    "VALIDATION_ERROR": "common.validation_error",
    "SERVICE_UNAVAILABLE": "common.service_unavailable",
    "INTERNAL_SERVER_ERROR": "common.internal_error",
}

REASON_TO_I18N_CODE: dict[str, str] = {
    "otp_expired_or_absent": "auth.otp_expired",
    "invalid_code": "auth.otp_invalid",
    "invalid_credentials": "auth.invalid_credentials",
    "invalid_google_token": "auth.invalid_google_token",
    "unverified_google_email": "auth.unverified_google_email",
    "inactive_user": "auth.inactive_user",
    "invalid_token": "auth.invalid_token",
}


def resolve_i18n_error_code(code: str, message: str, details: Any = None) -> str:
    """Resolve a canonical hierarchical i18n error code from legacy code/details/message."""
    if "." in code:
        return code
    if isinstance(details, dict):
        reason = details.get("reason")
        if isinstance(reason, str) and reason in REASON_TO_I18N_CODE:
            return REASON_TO_I18N_CODE[reason]
    msg_lower = message.lower()
    if "autre personne" in msg_lower and "lot" in msg_lower:
        return "food.self_review_forbidden"
    if "source obligatoire manquante" in msg_lower:
        return "food.missing_source"
    if "invitation a expiré" in msg_lower:
        return "auth.invitation_expired"
    return LEGACY_TO_I18N_CODE.get(code, f"errors.{code.lower()}")


class ErrorDetail(BaseModel):
    """Normalized payload representing an error."""

    code: str
    i18n_code: str = "common.unknown_error"
    params: dict[str, Any] = Field(default_factory=dict)
    message: str
    detail: str = ""
    details: Any = None


class ErrorEnvelope(BaseModel):
    """Top-level envelope for error responses."""

    code: str
    params: dict[str, Any] = Field(default_factory=dict)
    detail: str
    error: ErrorDetail


class AppException(Exception):
    """Base application exception with standardized code, params, and status."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Any = None,
        i18n_code: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        self.i18n_code = i18n_code or resolve_i18n_error_code(code, message, details)
        if params is not None:
            self.params = params
        elif isinstance(details, dict):
            self.params = dict(details)
        else:
            self.params = {}


class NotFoundError(AppException):
    """Resource not found (404)."""

    def __init__(
        self,
        message: str = "Resource not found",
        details: Any = None,
        i18n_code: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            code="NOT_FOUND",
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
            i18n_code=i18n_code,
            params=params,
        )


class UnauthorizedError(AppException):
    """Authentication required or invalid (401)."""

    def __init__(
        self,
        message: str = "Authentication required",
        details: Any = None,
        i18n_code: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
            i18n_code=i18n_code,
            params=params,
        )


class ForbiddenError(AppException):
    """Insufficient privileges (403)."""

    def __init__(
        self,
        message: str = "Access forbidden",
        details: Any = None,
        i18n_code: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
            i18n_code=i18n_code,
            params=params,
        )


class ValidationError(AppException):
    """Validation or business quality rule error (422)."""

    def __init__(
        self,
        message: str = "Validation failed",
        details: Any = None,
        i18n_code: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=getattr(
                status, "HTTP_422_UNPROCESSABLE_CONTENT", status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            details=details,
            i18n_code=i18n_code,
            params=params,
        )


class ServiceUnavailableError(AppException):
    """Service temporarily unavailable (503)."""

    def __init__(
        self,
        message: str = "Service unavailable",
        details: Any = None,
        i18n_code: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            code="SERVICE_UNAVAILABLE",
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
            i18n_code=i18n_code,
            params=params,
        )


def make_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Any = None,
    i18n_code: str | None = None,
    params: dict[str, Any] | None = None,
) -> JSONResponse:
    """Build a standardized JSON error response with stable i18n code and params."""
    resolved_i18n = i18n_code or resolve_i18n_error_code(code, message, details)
    resolved_params = (
        params if params is not None else (dict(details) if isinstance(details, dict) else {})
    )
    payload = {
        "code": resolved_i18n,
        "params": resolved_params,
        "detail": message,
        "error": {
            "code": code,
            "i18n_code": resolved_i18n,
            "params": resolved_params,
            "message": message,
            "detail": message,
            "details": details,
        },
    }
    return JSONResponse(status_code=status_code, content=payload)


async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    """Handle custom application exceptions."""
    return make_error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
        i18n_code=exc.i18n_code,
        params=exc.params,
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
    encoded_errors = jsonable_encoder(exc.errors())
    first_field = None
    if encoded_errors and isinstance(encoded_errors[0], dict):
        loc = encoded_errors[0].get("loc", [])
        if loc:
            first_field = str(loc[-1])
    return make_error_response(
        status_code=http_422,
        code="VALIDATION_ERROR",
        message="Request validation failed",
        details=encoded_errors,
        i18n_code="common.validation_error",
        params={"field": first_field} if first_field else {},
    )


async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for unhandled server exceptions."""
    return make_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected server error occurred.",
        details=str(exc) if __debug__ else None,
        i18n_code="common.internal_error",
        params={},
    )
