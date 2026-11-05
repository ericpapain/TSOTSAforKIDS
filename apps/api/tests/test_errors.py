"""Tests for normalized error formats across the API."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from tsotsa_api.core.config import Settings
from tsotsa_api.core.errors import ForbiddenError, NotFoundError, UnauthorizedError
from tsotsa_api.main import create_app


@pytest.mark.asyncio
async def test_not_found_endpoint(client: AsyncClient) -> None:
    """Verify that a nonexistent route returns a normalized 404 envelope."""
    response = await client.get("/nonexistent/endpoint")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert "code" in data["error"]
    assert "message" in data["error"]
    assert data["error"]["code"] == "HTTP_404"


@pytest.mark.asyncio
async def test_custom_app_exceptions() -> None:
    """Verify that custom application exceptions serialize properly into responses."""
    settings = Settings(APP_ENV="test")
    app = create_app(settings)

    @app.get("/test/not-found")
    async def trigger_not_found():
        raise NotFoundError("Entity was missing", details={"entity_id": 42})

    @app.get("/test/unauthorized")
    async def trigger_unauthorized():
        raise UnauthorizedError("Invalid token")

    @app.get("/test/forbidden")
    async def trigger_forbidden():
        raise ForbiddenError("Admin only")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        r1 = await test_client.get("/test/not-found")
        assert r1.status_code == 404
        assert r1.json()["error"]["code"] == "NOT_FOUND"
        assert r1.json()["error"]["details"] == {"entity_id": 42}

        r2 = await test_client.get("/test/unauthorized")
        assert r2.status_code == 401
        assert r2.json()["error"]["code"] == "UNAUTHORIZED"

        r3 = await test_client.get("/test/forbidden")
        assert r3.status_code == 403
        assert r3.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_validation_error_format() -> None:
    """Verify that pydantic request validation produces normalized error envelopes."""
    from pydantic import BaseModel

    class ItemPayload(BaseModel):
        name: str
        quantity: int

    settings = Settings(APP_ENV="test")
    app = create_app(settings)

    @app.post("/test/validate")
    async def trigger_validation(_: ItemPayload):
        return {"ok": True}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        response = await test_client.post("/test/validate", json={"quantity": "not_a_number"})
        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert isinstance(data["error"]["details"], list)

