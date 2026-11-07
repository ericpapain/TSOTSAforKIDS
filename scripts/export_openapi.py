#!/usr/bin/env python3
"""Export the OpenAPI schema of the FastAPI server to packages/api-client/openapi.json.

Usage:
    python scripts/export_openapi.py
    python scripts/export_openapi.py --check
    python scripts/export_openapi.py --output custom/path.json
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT_PATH = REPO_ROOT / "packages" / "api-client" / "openapi.json"
API_DIR = REPO_ROOT / "apps" / "api"


def get_openapi_dict() -> dict[str, Any]:
    """Retrieve OpenAPI specification dictionary from tsotsa_api.

    First tries direct in-process import, then falls back to uv run in apps/api.
    """
    api_src = str(API_DIR / "src")
    if api_src not in sys.path:
        sys.path.insert(0, api_src)

    try:
        from tsotsa_api.main import app

        return app.openapi()
    except (ImportError, ModuleNotFoundError):
        cmd = [
            "uv",
            "run",
            "--directory",
            str(API_DIR),
            "python",
            "-c",
            "import json; from tsotsa_api.main import app; print(json.dumps(app.openapi()))",
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return json.loads(res.stdout)


def serialize_openapi(spec: dict[str, Any]) -> str:
    """Format OpenAPI dictionary as deterministic formatted JSON with newline."""
    return json.dumps(spec, indent=2) + "\n"


def export_openapi(output_path: Path = DEFAULT_OUTPUT_PATH) -> Path:
    """Export the OpenAPI specification to disk."""
    spec = get_openapi_dict()
    rendered = serialize_openapi(spec)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(rendered)
    return output_path


def check_openapi(target_path: Path = DEFAULT_OUTPUT_PATH) -> bool:
    """Check whether the on-disk OpenAPI file matches the current server specification.

    Returns True if identical, False otherwise.
    """
    if not target_path.exists():
        return False
    current_content = target_path.read_text(encoding="utf-8")
    generated_content = serialize_openapi(get_openapi_dict())
    return current_content == generated_content


def main(argv: list[str] | None = None) -> int:
    """CLI entrypoint for export_openapi."""
    parser = argparse.ArgumentParser(description="Export or verify OpenAPI specification.")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Target output file path for openapi.json",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check if openapi.json is up-to-date without overwriting",
    )
    args = parser.parse_args(argv)

    if args.check:
        is_up_to_date = check_openapi(args.output)
        if not is_up_to_date:
            print(
                f"[ERREUR] Le fichier {args.output} est absent ou n'est pas à jour avec l'API.\n"
                "Exécutez 'make openapi' pour le régénérer.",
                file=sys.stderr,
            )
            return 1
        print(f"[OK] Le contrat OpenAPI ({args.output.name}) est conforme et à jour.")
        return 0

    saved_path = export_openapi(args.output)
    print(f"[OK] Contrat OpenAPI exporté avec succès vers {saved_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

