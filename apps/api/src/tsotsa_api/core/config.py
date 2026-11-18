"""Application configuration using Pydantic Settings.

Matches exact variable names from docs/TSOTSA_Kids_Configuration.md (Section 5.1).
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["development", "test", "staging", "production"]


class Settings(BaseSettings):
    """Configuration settings for TSOTSA for Kids API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    APP_ENV: AppEnv = "development"
    APP_TIMEZONE_DEFAULT: str = "Africa/Douala"
    API_BASE_URL: str = "http://localhost:8000"
    WEB_APP_URL: str = "http://localhost:3000"
    ADMIN_APP_URL: str = "http://localhost:3001"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    DATABASE_URL: str = "mysql+asyncmy://tsotsa_app:test@127.0.0.1:3306/tsotsa_dev"
    DATABASE_MIGRATIONS_URL: str = "mysql+asyncmy://tsotsa_migrator:test@127.0.0.1:3306/tsotsa_dev"
    DATABASE_SSL_CA_PATH: str | None = None
    DATABASE_POOL_SIZE: int = Field(default=10, ge=1)

    JWT_PRIVATE_KEY_PATH: str | None = None
    JWT_PUBLIC_KEY_PATH: str | None = None
    JWT_ACCESS_TTL_MINUTES: int = Field(default=15, ge=1)
    JWT_REFRESH_TTL_DAYS: int = Field(default=30, ge=1)
    BCRYPT_ROUNDS: int = Field(default=12, ge=4, le=31)

    GOOGLE_CLIENT_IDS: str = ""

    OTP_TTL_MINUTES: int = Field(default=10, ge=1)
    OTP_MAX_ATTEMPTS: int = Field(default=5, ge=1)
    SMS_PROVIDER: str = "console"
    SMS_API_KEY: str = ""
    SMS_SENDER_NAME: str = "TSOTSA"

    EMAIL_PROVIDER: str = "console"
    EMAIL_API_KEY: str = ""
    EMAIL_FROM: str = "TSOTSA for Kids <no-reply@tsotsa-for-kids.com>"

    EXPO_ACCESS_TOKEN: str = ""
    NOTIFICATION_REMINDER_DELAY_MINUTES: int = Field(default=30, ge=1)
    NOTIFICATION_QUIET_HOURS: str = "21:00-06:00"

    UPLOAD_MAX_MB: int = Field(default=10, ge=1)
    LOG_LEVEL: str = "INFO"
    SENTRY_DSN: str | None = None

    @property
    def cors_origins_list(self) -> list[str]:
        """Return CORS allowed origins as a parsed list of clean strings."""
        if not self.CORS_ALLOWED_ORIGINS:
            return []
        return [orig.strip() for orig in self.CORS_ALLOWED_ORIGINS.split(",") if orig.strip()]

    @property
    def google_client_ids_list(self) -> list[str]:
        """Return allowed Google Client IDs as a parsed list of clean strings."""
        if not self.GOOGLE_CLIENT_IDS:
            return []
        return [cid.strip() for cid in self.GOOGLE_CLIENT_IDS.split(",") if cid.strip()]

    @property
    def is_production(self) -> bool:
        """Check if environment is production or staging."""
        return self.APP_ENV in {"production", "staging"}

    def check_production_requirements(self) -> None:
        """Enforce strict production configuration checks."""
        if self.is_production:
            missing: list[str] = []
            is_local_db = any(h in (self.DATABASE_URL or "") for h in ("@mysql:", "@127.0.0.1", "@localhost"))
            if not self.DATABASE_SSL_CA_PATH and not is_local_db:
                missing.append("DATABASE_SSL_CA_PATH (TLS CA certificate is mandatory for external database)")
            if not self.JWT_PRIVATE_KEY_PATH:
                missing.append("JWT_PRIVATE_KEY_PATH")
            if not self.JWT_PUBLIC_KEY_PATH:
                missing.append("JWT_PUBLIC_KEY_PATH")
            if not self.CORS_ALLOWED_ORIGINS:
                missing.append("CORS_ALLOWED_ORIGINS")

            if missing:
                msg = f"Missing mandatory production configuration settings: {', '.join(missing)}"
                raise ValueError(msg)

    @model_validator(mode="after")
    def validate_production_requirements(self) -> Settings:
        """Run validation on model initialization."""
        self.check_production_requirements()
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
