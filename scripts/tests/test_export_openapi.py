"""Unit tests for scripts/export_openapi.py."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

from scripts.export_openapi import (
    check_openapi,
    export_openapi,
    main,
    serialize_openapi,
)


def test_serialize_openapi_formatting() -> None:
    sample = {"openapi": "3.1.0", "info": {"title": "Test API", "version": "1.0.0"}}
    rendered = serialize_openapi(sample)
    assert rendered.endswith("\n")
    loaded = json.loads(rendered)
    assert loaded == sample


def test_export_openapi_writes_file(tmp_path: Path) -> None:
    dummy_spec = {"openapi": "3.1.0", "info": {"title": "Dummy", "version": "0.1"}}
    target = tmp_path / "openapi.json"

    with patch("scripts.export_openapi.get_openapi_dict", return_value=dummy_spec):
        saved = export_openapi(target)
        assert saved == target
        assert target.exists()
        assert json.loads(target.read_text(encoding="utf-8")) == dummy_spec


def test_check_openapi_contract(tmp_path: Path) -> None:
    dummy_spec = {"openapi": "3.1.0", "info": {"title": "Dummy", "version": "0.1"}}
    target = tmp_path / "openapi.json"

    with patch("scripts.export_openapi.get_openapi_dict", return_value=dummy_spec):
        # File doesn't exist yet -> False
        assert check_openapi(target) is False

        # File written with identical content -> True
        export_openapi(target)
        assert check_openapi(target) is True

        # File modified with difference -> False
        target.write_text('{"openapi": "3.0.0"}\n', encoding="utf-8")
        assert check_openapi(target) is False


def test_main_cli_modes(tmp_path: Path) -> None:
    dummy_spec = {"openapi": "3.1.0", "info": {"title": "Dummy", "version": "0.1"}}
    target = tmp_path / "openapi.json"

    with patch("scripts.export_openapi.get_openapi_dict", return_value=dummy_spec):
        # Export mode
        ret_export = main(["--output", str(target)])
        assert ret_export == 0
        assert target.exists()

        # Check mode OK
        ret_check_ok = main(["--output", str(target), "--check"])
        assert ret_check_ok == 0

        # Corrupt and check mode KO
        target.write_text("{}", encoding="utf-8")
        ret_check_ko = main(["--output", str(target), "--check"])
        assert ret_check_ko == 1

