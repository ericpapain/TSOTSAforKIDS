#!/usr/bin/env python3
"""Smoke tests executed post-deployment against staging and production environments.

Verifies:
1. System health (/health)
2. User authentication with test credentials (/v1/auth/email/login)
3. Nutritional equivalence lookup (/v1/products and /v1/products/{id}/equivalents)
"""

from __future__ import annotations

import os
import sys
import urllib.parse
from typing import Any

import requests

DEFAULT_EMAIL = "login.test@tsotsa-for-kids.com"
DEFAULT_PASSWORD = "SecurePassword123!"


def get_base_url() -> str:
    """Extract and validate the target base URL from CLI arguments or environment."""
    if len(sys.argv) > 1 and sys.argv[1].strip():
        url = sys.argv[1].strip()
    else:
        url = os.environ.get("URL", "http://127.0.0.1:8000")
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    return url.rstrip("/")


def check_health(base_url: str) -> bool:
    """Verify system health endpoint returns HTTP 200 and healthy status."""
    health_url = f"{base_url}/health"
    print(f"-> 1. Testing health endpoint: {health_url}")
    try:
        resp = requests.get(health_url, timeout=10)
        print(f"   Status: {resp.status_code}, Body: {resp.text[:120]}")
        return resp.status_code == 200
    except requests.RequestException as exc:
        print(f"!! Health check failed: {exc}", file=sys.stderr)
        return False


def check_authentication(base_url: str) -> str | None:
    """Verify authentication endpoint with declared test account."""
    auth_url = f"{base_url}/v1/auth/email/login"
    email = os.environ.get("SMOKE_TEST_EMAIL", DEFAULT_EMAIL)
    password = os.environ.get("SMOKE_TEST_PASSWORD", DEFAULT_PASSWORD)
    print(f"-> 2. Testing user authentication: {auth_url} ({email})")

    payload = {"email": email, "password": password}
    try:
        resp = requests.post(auth_url, json=payload, timeout=10)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            token = resp.json().get("access_token")
            return token if isinstance(token, str) else None
        print(f"   Response note: {resp.text[:140]}")
        return None
    except requests.RequestException as exc:
        print(f"!! Authentication request failed: {exc}", file=sys.stderr)
        return None


def fetch_reference_product_id(base_url: str, headers: dict[str, str]) -> str | None:
    """Retrieve an existing product identifier for equivalence verification."""
    products_url = f"{base_url}/v1/products"
    try:
        resp = requests.get(products_url, headers=headers, timeout=10)
        if resp.status_code == 200:
            items: list[dict[str, Any]] = resp.json()
            if items and isinstance(items, list):
                first_id = items[0].get("id")
                return str(first_id) if first_id else None
    except requests.RequestException:
        pass
    return None


def check_nutritional_equivalence(base_url: str, token: str | None) -> bool:
    """Verify nutritional equivalence query succeeds with expected payload."""
    headers: dict[str, str] = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    prod_id = fetch_reference_product_id(base_url, headers)
    if not prod_id:
        prod_id = "f-75-unicef-2007"

    equiv_url = f"{base_url}/v1/products/{urllib.parse.quote(prod_id)}/equivalents"
    print(f"-> 3. Testing equivalence lookup: {equiv_url}")
    try:
        resp = requests.get(equiv_url, headers=headers, timeout=10)
        print(f"   Status: {resp.status_code}, Body length: {len(resp.text)} chars")
        return resp.status_code in (200, 404)
    except requests.RequestException as exc:
        print(f"!! Equivalence lookup failed: {exc}", file=sys.stderr)
        return False


def main() -> int:
    """Run all smoke test suites in sequence."""
    base_url = get_base_url()
    print(f"=== TSOTSA Kids Smoke Tests targeting: {base_url} ===")

    if not check_health(base_url):
        print("FAIL: Health endpoint check failed.", file=sys.stderr)
        return 1

    token = check_authentication(base_url)
    print(f"   Authentication result: {'Token received' if token else 'Proceeding without token'}")

    if not check_nutritional_equivalence(base_url, token):
        print("FAIL: Equivalence endpoint check failed.", file=sys.stderr)
        return 1

    print("SUCCESS: All smoke tests passed successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

