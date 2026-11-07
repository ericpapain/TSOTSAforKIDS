"""Tests unitaires pour scripts/compare_mobile_screens.py."""

from pathlib import Path
import struct
import pytest

from scripts.compare_mobile_screens import (
    SCREEN_CATALOG,
    get_png_dimensions,
    compute_image_shift_and_diff,
    evaluate_screen,
    generate_markdown_report,
)


def _create_minimal_png_header(width: int, height: int) -> bytes:
    """Génère les 24 premiers octets standard d'un fichier PNG."""
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr_length = b"\x00\x00\x00\r"
    ihdr_type = b"IHDR"
    dims = struct.pack(">II", width, height)
    return sig + ihdr_length + ihdr_type + dims


def test_screen_catalog_has_all_31_screens() -> None:
    assert len(SCREEN_CATALOG) == 31
    ids = [item["id"] for item in SCREEN_CATALOG]
    assert "M01" in ids
    assert "M31" in ids


def test_get_png_dimensions(tmp_path: Path) -> None:
    fake_png = tmp_path / "test.png"
    fake_png.write_bytes(_create_minimal_png_header(390, 746))

    dims = get_png_dimensions(fake_png)
    assert dims == (390, 746)


def test_get_png_dimensions_corrupted(tmp_path: Path) -> None:
    fake_file = tmp_path / "corrupted.png"
    fake_file.write_bytes(b"not-a-png-file")
    assert get_png_dimensions(fake_file) is None


def test_evaluate_screen_missing_ref(tmp_path: Path) -> None:
    item = {"id": "M01", "ref": "not_found.png", "route": "/u-welcome", "title": "Test"}
    res = evaluate_screen(item, tmp_path, None)
    assert res.status == "REF_MANQUANTE"


def test_generate_markdown_report(tmp_path: Path) -> None:
    ref_dir = tmp_path / "refs"
    ref_dir.mkdir()
    sample_ref = ref_dir / "u_welcome.png"
    sample_ref.write_bytes(_create_minimal_png_header(390, 746))

    item = {"id": "M01", "ref": "u_welcome.png", "route": "/u-welcome", "title": "Accueil"}
    res = evaluate_screen(item, ref_dir, None)

    out_file = tmp_path / "report.md"
    generate_markdown_report([res], out_file)
    assert out_file.exists()
    content = out_file.read_text(encoding="utf-8")
    assert "M01" in content
    assert "390x746" in content


def test_compute_image_shift_and_diff_with_pil(tmp_path: Path) -> None:
    try:
        from PIL import Image
    except ImportError:
        pytest.skip("Pillow non installé")

    img1_path = tmp_path / "img1.png"
    img2_path = tmp_path / "img2.png"
    Image.new("RGB", (390, 746), color=(255, 255, 255)).save(img1_path)
    Image.new("RGB", (390, 746), color=(255, 255, 255)).save(img2_path)

    shift, sim = compute_image_shift_and_diff(img1_path, img2_path)
    assert shift == 0
    assert sim == 100.0
