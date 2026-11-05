"""Tests for Cross-Origin Resource Sharing (CORS) security constraints."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from tsotsa_api.core.config import Settings
from tsotsa_api.main import create_app


@pytest.mark.asyncio
async def test_cors_allowed_origin() -> None:
    """Verify that allowed origin receives CORS response headers."""
    settings = Settings(
        APP_ENV="test",
        CORS_ALLOWED_ORIGINS="https://app.tsotsa-for-kids.com,https://admin.tsotsa-for-kids.com",
    )
    app = create_app(settings)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/v1/",
            headers={
                "Origin": "https://app.tsotsa-for-kids.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert (
            response.headers.get("access-control-allow-origin") == "https://app.tsotsa-for-kids.com"
        )


@pytest.mark.asyncio
async def test_cors_disallowed_origin() -> None:
    """Verify that unauthorized origin does NOT receive access-control-allow-origin."""
    settings = Settings(
        APP_ENV="test",
        CORS_ALLOWED_ORIGINS="https://app.tsotsa-for-kids.com",
    )
    app = create_app(settings)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/v1/",
            headers={
                "Origin": "https://evil-domain.example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert "access-control-allow-origin" not in response.headers
