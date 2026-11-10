"""Pydantic validation schemas for the identity and authentication module."""

from __future__ import annotations

import re
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# E.164 phone format validation: + followed by 7 to 15 digits
PHONE_E164_REGEX = re.compile(r"^\+[1-9]\d{6,14}$")


def validate_e164(phone: str) -> str:
    cleaned = phone.strip()
    if not PHONE_E164_REGEX.match(cleaned):
        raise ValueError(
            "Phone number must be in valid international E.164 format (e.g. +237699000000)."
        )
    return cleaned


class GoogleLoginRequest(BaseModel):
    """Google OAuth Identity Token login request."""

    id_token: Annotated[
        str, Field(min_length=10, description="Google OpenID Connect identity token")
    ]


class PhoneOtpRequest(BaseModel):
    """Request to generate and send an SMS OTP code."""

    phone_e164: Annotated[str, Field(description="Phone number in E.164 format")]

    @field_validator("phone_e164")
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_e164(v)


class PhoneOtpVerifyRequest(BaseModel):
    """Verify received SMS OTP code and authenticate."""

    phone_e164: Annotated[str, Field(description="Phone number in E.164 format")]
    code: Annotated[str, Field(min_length=6, max_length=6, description="6-digit numeric OTP code")]
    display_name: Annotated[str | None, Field(max_length=150, default=None)] = None

    @field_validator("phone_e164")
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_e164(v)

    @field_validator("code")
    @classmethod
    def check_code(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP code must consist of exactly 6 digits.")
        return v


class EmailRegisterRequest(BaseModel):
    """User registration with email and password."""

    email: EmailStr
    password: Annotated[
        str,
        Field(
            min_length=8,
            max_length=72,
            description="Password between 8 and 72 characters",
        ),
    ]
    display_name: Annotated[str, Field(min_length=2, max_length=150)]


class EmailLoginRequest(BaseModel):
    """User login with email and password."""

    email: EmailStr
    password: Annotated[
        str,
        Field(
            min_length=8,
            max_length=72,
            description="Password between 8 and 72 characters",
        ),
    ]


class EmailVerifyRequest(BaseModel):
    """Verify email address with one-time token."""

    token: Annotated[str, Field(min_length=16, description="One-time verification token")]


class PasswordForgotRequest(BaseModel):
    """Request password reset link for an email."""

    email: EmailStr


class PasswordResetRequest(BaseModel):
    """Reset password using one-time token."""

    token: Annotated[str, Field(min_length=16, description="One-time reset token")]
    new_password: Annotated[
        str,
        Field(
            min_length=8,
            max_length=72,
            description="New password between 8 and 72 characters",
        ),
    ]


class TokenRefreshRequest(BaseModel):
    """Request a fresh access token using a valid refresh token."""

    refresh_token: Annotated[str, Field(min_length=20, description="Refresh token string")]


class LogoutRequest(BaseModel):
    """Revoke a refresh token on logout."""

    refresh_token: Annotated[str, Field(min_length=20, description="Refresh token to revoke")]


class UserProfileResponse(BaseModel):
    """Public user identity and profile view."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    display_name: str
    language: str
    preferred_locale: Literal["fr", "en"] = "fr"
    status: str
    roles: list[str] = Field(default_factory=list)
    is_verified_caregiver: bool = False


class UserProfileUpdateRequest(BaseModel):
    """Payload to update the current authenticated user's profile."""

    preferred_locale: Literal["fr", "en"] | None = None
    display_name: Annotated[str | None, Field(min_length=1, max_length=150)] = None


class TokenResponse(BaseModel):
    """Standard authentication token response."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = Field(description="Access token TTL in seconds")
    user: UserProfileResponse


class OtpRequestResponse(BaseModel):
    """Response returned upon OTP code generation."""

    message: str
    expires_in_seconds: int = 600


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str
