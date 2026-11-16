"""Server-side internationalization (i18n) utilities."""

from tsotsa_api.i18n.service import (
    DEFAULT_LOCALE,
    SUPPORTED_LOCALES,
    TEMPLATES_DIR,
    normalize_locale,
    render_template,
    resolve_request_locale,
)

__all__ = [
    "DEFAULT_LOCALE",
    "SUPPORTED_LOCALES",
    "TEMPLATES_DIR",
    "normalize_locale",
    "render_template",
    "resolve_request_locale",
]
