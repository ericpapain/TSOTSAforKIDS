"""Tests for health check and basic system endpoints."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_success(client: AsyncClient) -> None:
    """Verify that /health returns 200 and connected status when database is reachable."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_health_check_failure(client: AsyncClient) -> None:
    """Verify that /health returns 503 when the database check fails."""
    with patch(
        "tsotsa_api.main.check_database_connection",
        new=AsyncMock(return_value=False),
    ):
        response = await client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_v1_root(client: AsyncClient) -> None:
    """Verify that /v1/ returns basic service status."""
    response = await client.get("/v1/")
    assert response.status_code == 200
    assert response.json()["status"] == "active"


@pytest.mark.asyncio
async def test_openapi_docs(client: AsyncClient) -> None:
    """Verify that OpenAPI documentation endpoints are available."""
    docs_resp = await client.get("/docs")
    assert docs_resp.status_code == 200

    openapi_resp = await client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    assert "openapi" in openapi_resp.json()
