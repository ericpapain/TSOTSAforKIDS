"""Unit tests for Docker volume persistence checker (Étape 7)."""

from __future__ import annotations

from pathlib import Path

from scripts.test_docker_persistence import (
    is_docker_daemon_running,
    verify_compose_volume_declaration,
)


def test_verify_compose_volume_declaration_valid(tmp_path: Path):
    compose = tmp_path / "docker-compose.yml"
    compose.write_text(
        """
services:
  mysql:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
volumes:
  mysql_data:
""",
        encoding="utf-8",
    )
    valid, msg = verify_compose_volume_declaration(compose)
    assert valid is True
    assert "correctly declares" in msg


def test_verify_compose_volume_declaration_missing_mount(tmp_path: Path):
    compose = tmp_path / "docker-compose.yml"
    compose.write_text(
        """
services:
  mysql:
    image: mysql:8.0
    volumes: []
volumes:
  mysql_data:
""",
        encoding="utf-8",
    )
    valid, msg = verify_compose_volume_declaration(compose)
    assert valid is False
    assert "does not mount" in msg


def test_verify_compose_volume_declaration_missing_top_level(tmp_path: Path):
    compose = tmp_path / "docker-compose.yml"
    compose.write_text(
        """
services:
  mysql:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
""",
        encoding="utf-8",
    )
    valid, msg = verify_compose_volume_declaration(compose)
    assert valid is False
    assert "top-level" in msg


def test_is_docker_daemon_running_safe():
    # Calling this must return a boolean without throwing an unhandled exception
    res = is_docker_daemon_running()
    assert isinstance(res, bool)

