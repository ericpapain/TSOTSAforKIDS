"""CLI entrypoint alias for python -m app.cli."""

from __future__ import annotations

from tsotsa_api.cli import create_admin_account, main

__all__ = ["create_admin_account", "main"]

if __name__ == "__main__":
    main()
