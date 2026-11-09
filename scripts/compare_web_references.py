"""Visual comparison script between Playwright captures and reference images.

Compares 1440x673 web captures against official reference screenshots in
docs/TSOTSA_Kids_References_Interfaces/references/web.
Reports discrepancies greater than 2 px.
"""

from __future__ import annotations

import os
from pathlib import Path
from PIL import Image, ImageChops

ROOT_DIR = Path(__file__).resolve().parent.parent
REF_DIR = ROOT_DIR / "docs" / "TSOTSA_Kids_References_Interfaces" / "references" / "web"
SCREENSHOT_DIR = ROOT_DIR / "apps" / "web" / "e2e" / "screenshots"
DIFF_DIR = ROOT_DIR / "apps" / "web" / "e2e" / "diffs"

TARGET_WIDTH = 1440
TARGET_HEIGHT = 673
TOLERANCE_PX = 2


def ensure_diff_dir() -> None:
    DIFF_DIR.mkdir(parents=True, exist_ok=True)


def load_images(name: str) -> tuple[Image.Image, Image.Image] | None:
    ref_path = REF_DIR / name
    cap_path = SCREENSHOT_DIR / name
    if not ref_path.exists() or not cap_path.exists():
        return None
    ref_img = Image.open(ref_path).convert("RGB")
    cap_img = Image.open(cap_path).convert("RGB")
    return ref_img, cap_img


def check_dimensions(ref_img: Image.Image, cap_img: Image.Image) -> tuple[bool, str]:
    rw, rh = ref_img.size
    cw, ch = cap_img.size
    if (rw, rh) != (TARGET_WIDTH, TARGET_HEIGHT):
        return False, f"Ref dimension mismatch: expected (1440, 673), got ({rw}, {rh})"
    if (cw, ch) != (TARGET_WIDTH, TARGET_HEIGHT):
        return False, f"Capture dimension mismatch: expected (1440, 673), got ({cw}, {ch})"
    return True, "Dimensions match (1440x673)"


def analyze_header_and_sidebar(
    cap_img: Image.Image,
) -> dict[str, int]:
    """Measure header height and sidebar width by color change detection."""
    # Header is at top: detect y where color changes from header color to body
    header_px = cap_img.getpixel((10, 10))
    header_height = 0
    for y in range(cap_img.height):
        px = cap_img.getpixel((10, y))
        if px != header_px:
            header_height = y
            break

    # Sidebar is below header on the left: check bottom area free of items
    sidebar_width = 0
    if cap_img.width >= 300:
        y_bottom = cap_img.height - 20
        sidebar_px = cap_img.getpixel((10, y_bottom))
        for x in range(10, 350):
            if cap_img.getpixel((x, y_bottom)) != sidebar_px:
                sidebar_width = x
                break

    return {"header_height": header_height, "sidebar_width": sidebar_width}


def compare_image_pair(name: str) -> dict[str, object]:
    result: dict[str, object] = {
        "name": name,
        "valid": False,
        "diff_px": 0,
        "diff_ratio": 0.0,
        "header_height": 0,
        "sidebar_width": 0,
        "discrepancies": [],
    }
    loaded = load_images(name)
    if not loaded:
        result["discrepancies"] = [f"Missing image for {name}"]
        return result

    ref_img, cap_img = loaded
    dim_ok, dim_msg = check_dimensions(ref_img, cap_img)
    if not dim_ok:
        result["discrepancies"] = [dim_msg]
        return result

    metrics = analyze_header_and_sidebar(cap_img)
    result["header_height"] = metrics["header_height"]
    result["sidebar_width"] = metrics["sidebar_width"]

    # Target header is 63px (tolerance +-2px)
    h_diff = abs(metrics["header_height"] - 63)
    if h_diff > TOLERANCE_PX:
        result["discrepancies"].append(
            f"Header height delta > {TOLERANCE_PX}px: got {metrics['header_height']}, expected 63"
        )

    # Pixel diff using Pillow ImageChops
    diff = ImageChops.difference(ref_img, cap_img)
    bbox = diff.getbbox()
    if bbox:
        diff_path = DIFF_DIR / f"diff_{name}"
        diff.save(diff_path)

    result["valid"] = len(result["discrepancies"]) == 0
    return result


def run_comparisons() -> list[dict[str, object]]:
    ensure_diff_dir()
    image_names = sorted([f for f in os.listdir(REF_DIR) if f.endswith(".png")])
    results = []
    print(f"Comparing {len(image_names)} reference images...")
    for name in image_names:
        res = compare_image_pair(name)
        status = "OK" if res["valid"] else "DELTA"
        print(
            f"[{status}] {name:20s} | Header: {res['header_height']}px | "
            f"Sidebar: {res['sidebar_width']}px | Issues: {len(res['discrepancies'])}"
        )
        results.append(res)
    return results


if __name__ == "__main__":
    run_comparisons()

