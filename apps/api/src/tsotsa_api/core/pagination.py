"""Pagination models and query parameter helpers."""

from __future__ import annotations

import math
from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams:
    """Dependency for standard pagination query parameters."""

    def __init__(
        self,
        page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
        limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    ) -> None:
        self.page = page
        self.limit = limit

    @property
    def offset(self) -> int:
        """Calculate the SQL offset for the current page and limit."""
        return (self.page - 1) * self.limit


class PaginatedResponse(BaseModel, Generic[T]):
    """Standardized paginated list response."""

    items: list[T]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    limit: int = Field(ge=1)
    total_pages: int = Field(ge=0)

    @classmethod
    def create(cls, items: list[T], total: int, params: PaginationParams) -> PaginatedResponse[T]:
        """Factory method computing total pages from items and params."""
        total_pages = math.ceil(total / params.limit) if params.limit > 0 else 0
        return cls(
            items=items,
            total=total,
            page=params.page,
            limit=params.limit,
            total_pages=total_pages,
        )
