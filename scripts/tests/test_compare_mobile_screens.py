"""Tests unitaires pour scripts/compare_mobile_screens.py."""

from pathlib import Path
from PIL import Image
import pytest

from scripts.compare_mobile_screens import (
    SCREEN_CATALOG,
    compute_image_shift_and_diff,
    evaluate_screen,
    generate_markdown_report,
)


def test_screen_catalog_has_all_31_screens() -> None:
    assert len(SCREEN_CATALOG) == 31
    ids = [item["id"] for item in SCREEN_CATALOG]
    assert "M01" in ids
    assert "M31" in ids


def test_compute_image_shift_and_diff_identical() -> None:
    img1 = Image.new("RGB", (390, 746), color=(255, 255, 255))
    img2 = Image.new("RGB", (390, 746), color=(255, 255, 255))
    shift, similarity = compute_image_shift_and_diff(img1, img2)
    assert shift == 0
    assert similarity == 100.0


def test_compute_image_shift_and_diff_different() -> None:
    img1 = Image.new("RGB", (100, 100), color=(0, 0, 0))
    img2 = Image.new("RGB", (100, 100), color=(255, 255, 255))
    shift, similarity = compute_image_shift_and_diff(img1, img2)
    assert similarity < 10.0


def test_evaluate_screen_missing_ref(tmp_path: Path) -> None:
    item = {"id": "M01", "ref": "not_found.png", "route": "/u-welcome", "title": "Test"}
    res = evaluate_screen(item, tmp_path, None)
    assert res.status == "REF_MANQUANTE"


def test_generate_markdown_report(tmp_path: Path) -> None:
    ref_dir = tmp_path / "refs"
    ref_dir.mkdir()
    sample_ref = ref_dir / "u_welcome.png"
    Image.new("RGB", (390, 746), color=(255, 255, 255)).save(sample_ref)

    item = {"id": "M01", "ref": "u_welcome.png", "route": "/u-welcome", "title": "Accueil"}
    res = evaluate_screen(item, ref_dir, None)

    out_file = tmp_path / "report.md"
    generate_markdown_report([res], out_file)
    assert out_file.exists()
    content = out_file.read_text(encoding="utf-8")
    assert "M01" in content
    assert "390x746" in content

