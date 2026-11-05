"""Unit tests for check_no_mock script."""

from __future__ import annotations

from pathlib import Path

from scripts.check_no_mock import (
    check_file_content,
    is_allowed_test_path,
    main,
    scan_for_forbidden_words,
    should_skip_path,
)


def test_is_allowed_test_path() -> None:
    """Verify test directory and filename detection."""
    assert is_allowed_test_path(Path("tests/test_service.py"))
    assert is_allowed_test_path(Path("apps/web/__tests__/button.test.tsx"))
    assert is_allowed_test_path(Path("e2e/flows/login.spec.ts"))
    assert is_allowed_test_path(Path("src/components/card.test.js"))
    assert not is_allowed_test_path(Path("apps/api/src/service.py"))
    assert not is_allowed_test_path(Path("apps/web/src/App.tsx"))


def test_should_skip_path() -> None:
    """Verify skip paths for dependencies and binaries."""
    assert should_skip_path(Path("node_modules/pkg/index.js"))
    assert should_skip_path(Path(".venv/lib/site.py"))
    assert should_skip_path(Path("docs/references/mobile/icon.png"))
    assert should_skip_path(Path("scripts/check_no_mock.py"))
    assert not should_skip_path(Path("apps/api/src/modules/food/service.py"))


def test_check_file_content_catches_forbidden_words(tmp_path: Path) -> None:
    """Verify detection of forbidden tokens."""
    f = tmp_path / "app.py"
    # Create text containing forbidden tokens without writing them directly in code
    m_word = "m" + "ock"
    f_word = "f" + "ake"
    l_word = "l" + "orem"
    d_word = "d" + "ummy"
    f.write_text(
        f"patient = '{m_word}_data'\n"
        f"price = '{f_word}_price'\n"
        f"desc = '{l_word} ipsum'\n"
        f"item = '{d_word}_id'\n"
        "valid_var = 123\n",
        encoding="utf-8",
    )
    matches = check_file_content(f)
    assert len(matches) == 4
    matched_words = [w.lower() for _, w, _ in matches]
    assert m_word in matched_words
    assert f_word in matched_words
    assert l_word in matched_words
    assert d_word in matched_words


def test_scan_for_forbidden_words_allows_in_test_folder(tmp_path: Path) -> None:
    """Verify that forbidden words inside test directories are allowed."""
    test_dir = tmp_path / "tests"
    test_dir.mkdir()
    test_file = test_dir / "test_user.py"
    m_word = "m" + "ock"
    test_file.write_text(f"val = '{m_word}_data'", encoding="utf-8")

    violations = scan_for_forbidden_words(tmp_path)
    assert len(violations) == 0


def test_main_cli(tmp_path: Path) -> None:
    """Verify CLI exit status codes."""
    clean_dir = tmp_path / "clean"
    clean_dir.mkdir()
    (clean_dir / "service.py").write_text("def run(): return 42\n", encoding="utf-8")
    assert main([str(clean_dir)]) == 0

    bad_dir = tmp_path / "bad"
    bad_dir.mkdir()
    d_word = "d" + "ummy"
    (bad_dir / "service.py").write_text(f"val = '{d_word}'\n", encoding="utf-8")
    assert main([str(bad_dir)]) == 1
