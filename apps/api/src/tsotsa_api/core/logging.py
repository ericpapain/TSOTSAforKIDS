"""Structured JSON logging configuration using structlog."""

from __future__ import annotations

import logging
import sys
from typing import Any, cast

import structlog

from tsotsa_api.core.config import Settings


def setup_logging(settings: Settings) -> None:
    """Configure structlog and standard logging based on environment."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    common_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    formatter_processor: Any
    if settings.is_production:
        formatter_processor = structlog.processors.JSONRenderer()
    else:
        formatter_processor = structlog.dev.ConsoleRenderer(colors=False)

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            *common_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=common_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            formatter_processor,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)


def get_logger(name: str = "tsotsa_api") -> structlog.stdlib.BoundLogger:
    """Return a configured structured logger instance."""
    return cast(structlog.stdlib.BoundLogger, structlog.get_logger(name))
