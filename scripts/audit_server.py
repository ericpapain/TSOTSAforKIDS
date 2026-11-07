#!/usr/bin/env python3
"""Audit script for TSOTSA Kids server before interface implementation.

Extracts:
1. Top largest files.
2. All API endpoints with method, path, and security/role.
3. Test mapping and detection of endpoints without tests.
4. Generates docs/API_RESUME.md.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
OPENAPI_FILE = REPO_ROOT / "packages" / "api-client" / "openapi.json"
TESTS_DIR = REPO_ROOT / "apps" / "api" / "tests"
OUTPUT_MD = REPO_ROOT / "docs" / "API_RESUME.md"

IGNORED_DIRS = {
    "node_modules",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    "generated",
    ".git",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "__pycache__",
}


def get_top_files(count: int = 10) -> list[tuple[int, Path]]:
    """Return top largest source files in the repository."""
    files: list[tuple[int, Path]] = []
    for p in REPO_ROOT.rglob("*"):
        if p.suffix not in {".py", ".ts", ".tsx", ".js"}:
            continue
        if any(part in IGNORED_DIRS or "generated" in part.lower() for part in p.parts):
            continue
        try:
            lines = sum(1 for _ in open(p, encoding="utf-8", errors="replace"))
            files.append((lines, p.relative_to(REPO_ROOT)))
        except OSError:
            pass
    files.sort(key=lambda x: x[0], reverse=True)
    return files[:count]


def load_openapi_spec() -> dict[str, Any]:
    """Load openapi.json from disk."""
    if not OPENAPI_FILE.exists():
        from scripts.export_openapi import get_openapi_dict

        return get_openapi_dict()
    return json.loads(OPENAPI_FILE.read_text(encoding="utf-8"))


def determine_required_role(path: str, method: str, op: dict[str, Any]) -> str:
    """Infer the role or permission requirement for an endpoint."""
    security = op.get("security", [])
    has_bearer = any("OAuth2PasswordBearer" in s or "BearerAuth" in s for s in security)
    summary = (op.get("summary") or "").lower()
    description = (op.get("description") or "").lower()
    tags = [t.lower() for t in op.get("tags", [])]

    # Public endpoints
    if not has_bearer:
        if path.startswith("/auth/invitations"):
            return "Public (Jeton d'invitation)"
        if path in {"/health", "/v1/modules", "/v1/regions", "/openapi.json", "/docs"}:
            return "Public"
        if path.startswith("/v1/auth/login") or path.startswith("/v1/auth/otp"):
            return "Public"
        if path.startswith("/v1/auth/register") or path.startswith("/v1/auth/password"):
            return "Public"
        if path.startswith("/v1/auth/google") or path.startswith("/v1/auth/refresh"):
            return "Public"
        if path.startswith("/v1/nutrients") and method == "get":
            return "Public"
        if path.startswith("/v1/products") and method == "get":
            return "Public (Produits publiés)"
        if path.startswith("/v1/pricing") and method == "get":
            return "Public"
        return "Public"

    # Authenticated endpoints
    if "/admin" in path or "admin" in tags:
        return "Administrateur (`admin`)"
    if "caregiver" in description or "soignant" in description:
        return "Soignant vérifié (`caregiver` approuvé)"
    if path.startswith("/v1/clinical"):
        return "Soignant vérifié (`caregiver` approuvé)"
    if path.startswith("/v1/schedules") and method in {"post", "put", "patch", "delete"}:
        return "Soignant vérifié (`caregiver` approuvé)"
    if path.startswith("/v1/monitoring/dashboard") or path.startswith("/v1/monitoring/alerts"):
        return "Soignant vérifié (`caregiver` approuvé)"

    return "Utilisateur authentifié (`user` / `caregiver` / `admin`)"


def collect_test_calls() -> list[tuple[str, str]]:
    """Scan all test files in apps/api/tests to find client HTTP calls."""
    calls: list[tuple[str, str]] = []
    for test_file in TESTS_DIR.glob("*.py"):
        content = test_file.read_text(encoding="utf-8")
        for method in ["get", "post", "put", "patch", "delete"]:
            # Match client.<method>(f"..." or f'...' or "..." or '...')
            # Using separate patterns for double quotes and single quotes to handle nested quotes
            pattern_dq = rf'client\.{method}\(\s*(?:f)?"([^"\n]+)"'
            pattern_sq = rf"client\.{method}\(\s*(?:f)?'([^'\n]+)'"
            for match in list(re.finditer(pattern_dq, content)) + list(re.finditer(pattern_sq, content)):
                raw_path = match.group(1).split("?")[0].rstrip("/")
                # Replace f-string interpolations {something} with a concrete placeholder
                normalized = re.sub(r"\{[^{}]*\}", "placeholder", raw_path)
                calls.append((method.upper(), normalized))
    return calls


def is_endpoint_tested(method: str, path: str, recorded_calls: list[tuple[str, str]]) -> bool:
    """Check if an endpoint pattern matches recorded test client calls."""
    clean_path = path.rstrip("/")
    # Build regex from path template: /v1/users/{id} -> ^/v1/users/[^/]+$
    regex_pattern = "^" + re.sub(r"\{[^}]+\}", r"[^/]+", clean_path) + "$"
    matcher = re.compile(regex_pattern)

    for call_method, call_path in recorded_calls:
        if call_method == method and matcher.match(call_path):
            return True
    return False


def generate_api_resume(endpoints: list[dict[str, str]]) -> str:
    """Generate Markdown document for docs/API_RESUME.md."""
    lines = [
        "# Répertoire des Endpoints de l'API – TSOTSA Kids",
        "",
        "Ce document recense l'intégralité des endpoints HTTP exposés par le serveur FastAPI (`apps/api`),",
        "leur méthode, chemin d'accès, rôle requis et module métier associé.",
        "",
        f"**Nombre total d'endpoints** : {len(endpoints)}",
        "",
        "| Méthode | Chemin | Rôle Requis | Description | Module |",
        "|---|---|---|---|---|",
    ]
    for ep in endpoints:
        lines.append(
            f"| `{ep['method']}` | `{ep['path']}` | {ep['role']} | {ep['summary']} | `{ep['module']}` |"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    """Run the audit and write results."""
    top_files = get_top_files(10)
    print("=== LES 10 PLUS GROS FICHIERS (LIGNES) ===")
    for lines, p in top_files:
        print(f"  {lines:>4} lignes : {p}")

    spec = load_openapi_spec()
    paths = spec.get("paths", {})
    recorded_calls = collect_test_calls()

    endpoints: list[dict[str, str]] = []
    untested: list[str] = []

    for path, methods in sorted(paths.items()):
        for method, op in sorted(methods.items()):
            if method not in {"get", "post", "put", "patch", "delete"}:
                continue
            m = method.upper()
            role = determine_required_role(path, method, op)
            summary = op.get("summary") or op.get("operationId") or ""
            tags = op.get("tags", ["system"])
            module = tags[0] if tags else "system"

            endpoints.append(
                {
                    "method": m,
                    "path": path,
                    "role": role,
                    "summary": summary,
                    "module": module,
                }
            )

            if not is_endpoint_tested(m, path, recorded_calls):
                untested.append(f"{m} {path}")

    print(f"\n=== TOTAL ENDPOINTS : {len(endpoints)} ===")
    print(f"=== ENDPOINTS SANS TEST DIRECT : {len(untested)} ===")
    for u in untested:
        print(f"  - {u}")

    OUTPUT_MD.write_text(generate_api_resume(endpoints), encoding="utf-8")
    print(f"\n[OK] Fichier {OUTPUT_MD.relative_to(REPO_ROOT)} généré avec succès.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
