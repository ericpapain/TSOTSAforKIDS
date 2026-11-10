"""Server-side localization templates and locale resolution for TSOTSA Kids."""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

SUPPORTED_LOCALES = ("fr", "en")
DEFAULT_LOCALE = "fr"
TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def normalize_locale(raw: str | None) -> str:
    """Normalize an arbitrary locale string or Accept-Language header to 'fr' or 'en'."""
    if not raw or not isinstance(raw, str):
        return DEFAULT_LOCALE
    first_tag = raw.split(",")[0].split(";")[0].strip().lower()
    if first_tag == "en" or first_tag.startswith("en-"):
        return "en"
    if first_tag == "fr" or first_tag.startswith("fr-"):
        return "fr"
    return DEFAULT_LOCALE


def resolve_request_locale(
    accept_language: str | None = None,
    user_preferred_locale: str | None = None,
) -> str:
    """Resolve locale for an HTTP request: Accept-Language -> preferred_locale -> 'fr'."""
    if accept_language and isinstance(accept_language, str):
        for part in accept_language.split(","):
            tag = part.split(";")[0].strip().lower()
            if tag == "en" or tag.startswith("en-"):
                return "en"
            if tag == "fr" or tag.startswith("fr-"):
                return "fr"
    if user_preferred_locale and user_preferred_locale in SUPPORTED_LOCALES:
        return user_preferred_locale
    return DEFAULT_LOCALE


def _load_domain_catalog(locale: str, domain: str, base_dir: Path | None = None) -> dict[str, Any]:
    root = base_dir or TEMPLATES_DIR
    path = root / locale / f"{domain}.json"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, dict) else {}


def _format_value(val: Any, params: dict[str, Any]) -> Any:
    if isinstance(val, str):
        try:
            return val.format(**params)
        except KeyError:
            return val
    if isinstance(val, dict):
        return {k: _format_value(v, params) for k, v in val.items()}
    if isinstance(val, list):
        return [_format_value(item, params) for item in val]
    return val


def render_template(
    domain: str,
    key: str,
    locale: str = DEFAULT_LOCALE,
    base_dir: Path | None = None,
    **params: Any,
) -> Any:
    """Render a server template in the recipient's locale, falling back to French ('fr')."""
    norm_loc = normalize_locale(locale)
    catalog = _load_domain_catalog(norm_loc, domain, base_dir=base_dir)
    raw = catalog.get(key)
    if raw is None and norm_loc != DEFAULT_LOCALE:
        fallback_catalog = _load_domain_catalog(DEFAULT_LOCALE, domain, base_dir=base_dir)
        raw = fallback_catalog.get(key)
    if raw is None:
        raise KeyError(
            f"Template '{domain}.{key}' not found in '{norm_loc}' or '{DEFAULT_LOCALE}'."
        )
    return _format_value(deepcopy(raw), params)
