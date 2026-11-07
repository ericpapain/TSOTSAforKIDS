#!/usr/bin/env python3
"""Script to verify that forbidden mock/fake/lorem/dummy keywords do not appear

in application code outside of test directories.

Rules:
- Forbidden words: mock, fake, lorem, dummy (case-insensitive).
- Allowed only in: tests/, __tests__/, e2e/, *.test.*, *.spec.*.
- Application code checked: Python, TypeScript, JavaScript, SQL, JSON, HTML, CSS.
- Ignores: node_modules, .venv, venv, dist, build, generated, .git, .github, docs, scripts.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

FORBIDDEN_WORDS = ("m" + "ock", "f" + "ake", "l" + "orem", "d" + "ummy")
FORBIDDEN_PATTERN = re.compile(
    rf"(?i)(?<![a-z0-9])({'|'.join(FORBIDDEN_WORDS)})(?![a-z0-9])",
    re.IGNORECASE,
)

DEFAULT_IGNORE_DIRS = {
    "node_modules",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    "generated",
    ".git",
    ".github",
    "docs",
    "scripts",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".expo",
    "coverage",
    "htmlcov",
    "__pycache__",
}

IGNORE_FILES = {
    "Makefile",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    ".gitignore",
    ".editorconfig",
}

IGNORE_EXTENSIONS = {
    ".md",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
}


def is_allowed_test_path(path: Path) -> bool:
    """Check if the file is in an allowed test location."""
    for part in path.parts:
        if part in {"tests", "__tests__", "e2e"}:
            return True
    name = path.name.lower()
    return ".test." in name or ".spec." in name


def should_skip_path(path: Path, ignore_dirs: set[str] | None = None) -> bool:
    """Check if the path should be skipped entirely."""
    if path.name in IGNORE_FILES:
        return True
    if "check_no_mock" in path.name:
        return True
    if path.suffix.lower() in IGNORE_EXTENSIONS:
        return True
    ignored = ignore_dirs or DEFAULT_IGNORE_DIRS
    for part in path.parts:
        if part in ignored:
            return True
        if "generated" in part.lower():
            return True
    return False


def check_file_content(path: Path) -> list[tuple[int, str, str]]:
    """Scan file lines for forbidden words.

    Returns a list of (line_number, matched_word, line_text).
    """
    matches: list[tuple[int, str, str]] = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line_no, line in enumerate(f, start=1):
                found = FORBIDDEN_PATTERN.search(line)
                if found:
                    matches.append((line_no, found.group(1), line.strip()))
    except OSError as err:
        print(f"Warning: unable to read {path}: {err}", file=sys.stderr)
    return matches


def scan_for_forbidden_words(
    root: Path,
    ignore_dirs: set[str] | None = None,
) -> list[tuple[Path, int, str, str]]:
    """Scan directory for forbidden words in non-test files.

    Returns a list of (file_path, line_no, matched_word, line_text).
    """
    import os

    violations: list[tuple[Path, int, str, str]] = []
    ignored = ignore_dirs or DEFAULT_IGNORE_DIRS

    candidates: list[Path] = []
    if root.is_file():
        candidates = [root]
    else:
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in ignored and "generated" not in d.lower()]
            for f in filenames:
                candidates.append(Path(dirpath) / f)

    for path in sorted(candidates):
        if should_skip_path(path, ignore_dirs):
            continue
        if is_allowed_test_path(path):
            continue

        file_matches = check_file_content(path)
        for line_no, word, text in file_matches:
            violations.append((path, line_no, word, text))

    return violations


def main(argv: list[str] | None = None) -> int:
    """Run check_no_mock script and return status."""
    parser = argparse.ArgumentParser(description="Check for forbidden mock words in code.")
    parser.add_argument(
        "paths",
        nargs="*",
        default=["."],
        help="Directories or files to check (default: current directory)",
    )
    args = parser.parse_args(argv)

    all_violations: list[tuple[Path, int, str, str]] = []

    for target_path in args.paths:
        target = Path(target_path)
        if not target.exists():
            print(f"Error: path does not exist: {target}", file=sys.stderr)
            return 1
        violations = scan_for_forbidden_words(target)
        all_violations.extend(violations)

    if all_violations:
        print(
            f"[ERROR] Found {len(all_violations)} violation(s) of zero-mock rule in application code:",
            file=sys.stderr,
        )
        for p, line_no, word, text in all_violations:
            print(f"  - {p}:{line_no} [{word}]: {text}", file=sys.stderr)
        return 1

    print("[OK] Zero forbidden mock keywords found in application code.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
