"""CLI entrypoint alias at apps/api root."""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure src/ is in sys.path
src_dir = Path(__file__).resolve().parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from tsotsa_api.cli import create_admin_account, main  # noqa: E402

__all__ = ["create_admin_account", "main"]

if __name__ == "__main__":
    main()
