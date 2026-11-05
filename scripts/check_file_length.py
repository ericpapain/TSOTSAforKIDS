#!/usr/bin/env python3
"""Script to verify that source files do not exceed maximum line lengths.

Rules:
- Files with > 500 lines trigger a fatal error (exit code 1).
- Files with > 300 lines trigger a warning.
- Scans *.py, *.ts, *.tsx, *.js files.
- Ignores: node_modules, .venv, venv, dist, build, generated, .git.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

MAX_LINES = 500
WARN_LINES = 300

TARGET_EXTENSIONS = {".py", ".ts", ".tsx", ".js"}

DEFAULT_IGNORE_DIRS = {
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
    ".expo",
    "__pycache__",
}


def should_ignore(path: Path, ignore_dirs: set[str] | None = None) -> bool:
    """Check if a given path should be excluded from checking."""
    ignored = ignore_dirs or DEFAULT_IGNORE_DIRS
    for part in path.parts:
        if part in ignored:
            return True
        if "generated" in part.lower():
            return True
    return False


def count_file_lines(file_path: Path) -> int:
    """Count the number of lines in a file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return sum(1 for _ in f)
    except OSError as err:
        print(f"Warning: unable to read {file_path}: {err}", file=sys.stderr)
        return 0


def scan_files(
    root: Path,
    max_lines: int = MAX_LINES,
    warn_lines: int = WARN_LINES,
    ignore_dirs: set[str] | None = None,
) -> tuple[list[tuple[Path, int]], list[tuple[Path, int]]]:
    """Scan directory and return lists of (path, line_count) for errors and warnings."""
    import os

    errors: list[tuple[Path, int]] = []
    warnings: list[tuple[Path, int]] = []
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
        if path.suffix not in TARGET_EXTENSIONS:
            continue
        if should_ignore(path, ignore_dirs):
            continue

        lines = count_file_lines(path)
        if lines > max_lines:
            errors.append((path, lines))
        elif lines > warn_lines:
            warnings.append((path, lines))

    return errors, warnings


def main(argv: list[str] | None = None) -> int:
    """Run file length checks and report status."""
    parser = argparse.ArgumentParser(description="Check source file lengths.")
    parser.add_argument(
        "paths",
        nargs="*",
        default=["."],
        help="Directories or files to check (default: current directory)",
    )
    parser.add_argument(
        "--max-lines",
        type=int,
        default=MAX_LINES,
        help=f"Maximum allowed lines per file (default: {MAX_LINES})",
    )
    parser.add_argument(
        "--warn-lines",
        type=int,
        default=WARN_LINES,
        help=f"Warning threshold for lines per file (default: {WARN_LINES})",
    )
    args = parser.parse_args(argv)

    total_errors: list[tuple[Path, int]] = []
    total_warnings: list[tuple[Path, int]] = []

    for target_path in args.paths:
        target = Path(target_path)
        if not target.exists():
            print(f"Error: path does not exist: {target}", file=sys.stderr)
            return 1
        errs, warns = scan_files(
            root=target,
            max_lines=args.max_lines,
            warn_lines=args.warn_lines,
        )
        total_errors.extend(errs)
        total_warnings.extend(warns)

    if total_warnings:
        print(f"[WARN] {len(total_warnings)} file(s) exceed {args.warn_lines} lines (target limit):")
        for p, count in total_warnings:
            print(f"  - {p} ({count} lines)")

    if total_errors:
        print(
            f"[ERROR] {len(total_errors)} file(s) exceed hard limit of {args.max_lines} lines:",
            file=sys.stderr,
        )
        for p, count in total_errors:
            print(f"  - {p} ({count} lines)", file=sys.stderr)
        return 1

    print(f"[OK] File length check passed (max allowed: {args.max_lines} lines).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

