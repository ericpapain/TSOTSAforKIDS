"""Unit tests for check_file_length script."""

from __future__ import annotations

from pathlib import Path

from scripts.check_file_length import (
    count_file_lines,
    main,
    scan_files,
    should_ignore,
)


def test_should_ignore() -> None:
    """Verify that ignored directory patterns are properly detected."""
    assert should_ignore(Path("node_modules/pkg/index.js"))
    assert should_ignore(Path(".venv/lib/site-packages/module.py"))
    assert should_ignore(Path("apps/api/dist/main.js"))
    assert should_ignore(Path("packages/api-client/src/generated/api.ts"))
    assert not should_ignore(Path("apps/api/src/main.py"))
    assert not should_ignore(Path("scripts/check_file_length.py"))


def test_count_file_lines(tmp_path: Path) -> None:
    """Verify line counting accuracy."""
    test_file = tmp_path / "sample.py"
    test_file.write_text("line 1\nline 2\nline 3\n", encoding="utf-8")
    assert count_file_lines(test_file) == 3


def test_scan_files_thresholds(tmp_path: Path) -> None:
    """Verify ok, warning, and error classifications."""
    ok_file = tmp_path / "ok.py"
    ok_file.write_text("\n".join(f"print({i})" for i in range(100)), encoding="utf-8")

    warn_file = tmp_path / "warn.ts"
    warn_file.write_text("\n".join(f"const x{i} = {i};" for i in range(350)), encoding="utf-8")

    error_file = tmp_path / "error.tsx"
    error_file.write_text("\n".join(f"const y{i} = {i};" for i in range(505)), encoding="utf-8")

    errors, warnings = scan_files(tmp_path)

    error_names = [p.name for p, _ in errors]
    warning_names = [p.name for p, _ in warnings]

    assert "error.tsx" in error_names
    assert "warn.ts" in warning_names
    assert "ok.py" not in error_names
    assert "ok.py" not in warning_names


def test_scan_files_ignores_extensions_and_dirs(tmp_path: Path) -> None:
    """Verify that unsupported extensions and ignored directories are skipped."""
    txt_file = tmp_path / "notes.txt"
    txt_file.write_text("\n".join(f"line {i}" for i in range(600)), encoding="utf-8")

    ignored_dir = tmp_path / "node_modules"
    ignored_dir.mkdir()
    ignored_file = ignored_dir / "dep.js"
    ignored_file.write_text("\n".join(f"line {i}" for i in range(600)), encoding="utf-8")

    errors, warnings = scan_files(tmp_path)
    assert len(errors) == 0
    assert len(warnings) == 0


def test_main_cli(tmp_path: Path) -> None:
    """Verify CLI exit codes."""
    clean_dir = tmp_path / "clean"
    clean_dir.mkdir()
    (clean_dir / "file.py").write_text("print('hello')\n", encoding="utf-8")

    assert main([str(clean_dir)]) == 0

    bad_dir = tmp_path / "bad"
    bad_dir.mkdir()
    (bad_dir / "too_long.py").write_text("\n".join(f"val_{i} = {i}" for i in range(510)), encoding="utf-8")

    assert main([str(bad_dir)]) == 1
