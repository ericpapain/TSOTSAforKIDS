"""Tests for pagination helpers and response models."""

from __future__ import annotations

from tsotsa_api.core.pagination import PaginatedResponse, PaginationParams


def test_pagination_params_offset() -> None:
    """Verify offset computation from page and limit."""
    p1 = PaginationParams(page=1, limit=20)
    assert p1.offset == 0

    p2 = PaginationParams(page=3, limit=15)
    assert p2.offset == 30


def test_paginated_response_calculation() -> None:
    """Verify total pages calculation in PaginatedResponse."""
    params = PaginationParams(page=2, limit=10)
    items = ["item1", "item2"]
    resp = PaginatedResponse.create(items=items, total=25, params=params)

    assert resp.items == items
    assert resp.total == 25
    assert resp.page == 2
    assert resp.limit == 10
    assert resp.total_pages == 3
