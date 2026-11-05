"""Shared custom SQLAlchemy types and utilities for TSOTSA Kids."""

from __future__ import annotations

import os
import time
import uuid
from typing import Any

from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.types import CHAR, TypeDecorator


def generate_uuid7() -> str:
    """Generate a RFC 9562 UUID v7 (timestamp-ordered UUID)."""
    now_ms = int(time.time() * 1000)
    rand_bytes = os.urandom(10)
    time_high = (now_ms >> 16) & 0xFFFFFFFF
    time_mid = now_ms & 0xFFFF
    ver_and_rand = 0x7000 | (int.from_bytes(rand_bytes[:2], "big") & 0x0FFF)
    var_and_rand = 0x8000 | (int.from_bytes(rand_bytes[2:4], "big") & 0x3FFF)
    node = int.from_bytes(rand_bytes[4:], "big")
    return str(
        uuid.UUID(
            fields=(
                time_high,
                time_mid,
                ver_and_rand,
                var_and_rand >> 8,
                var_and_rand & 0xFF,
                node,
            )
        )
    )


class BinaryUUID(TypeDecorator[str]):
    """SQLAlchemy TypeDecorator for UUID v7.

    Stores BINARY(16) on MySQL 8 and CHAR(36) on SQLite.
    Always produces and accepts standard UUID strings in Python.
    """

    impl = BINARY(16)
    cache_ok = True

    def load_dialect_impl(self, dialect: Any) -> Any:
        if dialect.name == "sqlite":
            return dialect.type_descriptor(CHAR(36))
        return dialect.type_descriptor(BINARY(16))

    def process_bind_param(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, str):
            value = uuid.UUID(value)
        if isinstance(value, uuid.UUID):
            if dialect.name == "sqlite":
                return str(value)
            return value.bytes
        return value

    def process_result_value(self, value: Any, dialect: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return str(value)
        if isinstance(value, bytes):
            return str(uuid.UUID(bytes=value))
        return str(value)
