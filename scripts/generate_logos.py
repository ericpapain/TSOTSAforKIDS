"""Script to generate all brand logo assets for TSOTSA Kids.

Generates:
- Full brand logo (docs/references/logo/logo_tsotsa.png)
- Symbol mark (docs/references/logo/logo_tsotsa_symbol.png)
- Dark variant badge (docs/references/logo/logo_tsotsa_blanc.png)
- Web assets (apps/web/public/, apps/web/src/assets/)
- Mobile assets (apps/mobile/assets/)
"""

from collections import deque
import os
from PIL import Image, ImageFilter
import numpy as np


def main() -> None:
    src_path = r"C:\Users\mezat\.gemini\antigravity\brain\794a88a5-4107-4f3b-9f06-2bb971e09ff1\.user_uploaded\media_1795012066559_7dba62e0.jpg"
    img = Image.open(src_path).convert("RGB")
    w, h = img.size

    scale = 2
    img_hr = img.resize((w * scale, h * scale), Image.Resampling.LANCZOS)
    arr_hr = np.array(img_hr)
    hh, ww, _ = arr_hr.shape

    # Flood fill outer background
    visited = np.zeros((hh, ww), dtype=bool)
    queue = deque()
    for x in range(ww):
        queue.append((0, x))
        queue.append((hh - 1, x))
        visited[0, x] = True
        visited[hh - 1, x] = True
    for y in range(hh):
        queue.append((y, 0))
        queue.append((y, ww - 1))
        visited[y, 0] = True
        visited[y, ww - 1] = True

    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < hh and 0 <= nx < ww and not visited[ny, nx]:
                r, g, b = arr_hr[ny, nx]
                if r > 240 and g > 240 and b > 240:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

    rgba = np.zeros((hh, ww, 4), dtype=np.uint8)
    rgba[:, :, :3] = arr_hr
    rgba[:, :, 3] = np.where(visited, 0, 255)

    alpha_img = Image.fromarray(rgba[:, :, 3], mode="L")
    alpha_blurred = alpha_img.filter(ImageFilter.GaussianBlur(radius=0.7))
    rgba[:, :, 3] = np.array(alpha_blurred)

    full_logo = Image.fromarray(rgba, mode="RGBA")
    bbox_full = full_logo.getbbox()
    full_logo_trimmed = full_logo.crop(bbox_full)

    # Symbol only
    symbol_crop = full_logo.crop((0, 0, ww, int(330 * scale)))
    bbox_symbol = symbol_crop.getbbox()
    symbol_trimmed = symbol_crop.crop(bbox_symbol)

    # Targets to write
    dirs = [
        "docs/references/logo",
        "apps/web/public",
        "apps/web/src/assets",
        "apps/mobile/assets",
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    # 1. Full logo
    full_logo_trimmed.save("docs/references/logo/logo_tsotsa.png")
    full_logo_trimmed.save("apps/web/public/logo.png")
    full_logo_trimmed.save("apps/web/src/assets/logo.png")
    full_logo_trimmed.save("apps/mobile/assets/logo.png")

    # 2. Symbol mark
    symbol_trimmed.save("docs/references/logo/logo_tsotsa_symbol.png")
    symbol_trimmed.save("apps/web/public/logo_symbol.png")
    symbol_trimmed.save("apps/web/src/assets/logo_symbol.png")
    symbol_trimmed.save("apps/mobile/assets/logo_symbol.png")

    # 3. Square App Icon (1024x1024)
    icon_1024 = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))
    max_d = max(symbol_trimmed.size)
    icon_scale = 0.78
    iw = int(symbol_trimmed.width * (1024 * icon_scale) / max_d)
    ih = int(symbol_trimmed.height * (1024 * icon_scale) / max_d)
    resized_sym = symbol_trimmed.resize((iw, ih), Image.Resampling.LANCZOS)
    icon_1024.paste(resized_sym, ((1024 - iw) // 2, (1024 - ih) // 2), resized_sym)
    icon_1024.save("apps/mobile/assets/icon.png")

    # 4. Adaptive icon (1024x1024 with 0.65 scale foreground)
    adapt_1024 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    adapt_scale = 0.65
    aw = int(symbol_trimmed.width * (1024 * adapt_scale) / max_d)
    ah = int(symbol_trimmed.height * (1024 * adapt_scale) / max_d)
    resized_adapt = symbol_trimmed.resize((aw, ah), Image.Resampling.LANCZOS)
    adapt_1024.paste(resized_adapt, ((1024 - aw) // 2, (1024 - ah) // 2), resized_adapt)
    adapt_1024.save("apps/mobile/assets/adaptive-icon.png")

    # 5. Favicon (48x48)
    fav = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    fw = int(symbol_trimmed.width * 44 / max_d)
    fh = int(symbol_trimmed.height * 44 / max_d)
    fav_sym = symbol_trimmed.resize((fw, fh), Image.Resampling.LANCZOS)
    fav.paste(fav_sym, ((48 - fw) // 2, (48 - fh) // 2), fav_sym)
    fav.save("apps/mobile/assets/favicon.png")
    fav.save("apps/web/public/favicon.png")

    # 6. Splash screen (1242x2436, bg #EEF2F0, logo centered)
    splash = Image.new("RGBA", (1242, 2436), (238, 242, 240, 255))
    splash_w = 700
    splash_h = int(full_logo_trimmed.height * splash_w / full_logo_trimmed.width)
    resized_splash_logo = full_logo_trimmed.resize((splash_w, splash_h), Image.Resampling.LANCZOS)
    splash.paste(
        resized_splash_logo,
        ((1242 - splash_w) // 2, (2436 - splash_h) // 2 - 100),
        resized_splash_logo,
    )
    splash.save("apps/mobile/assets/splash.png")

    # 7. White disk / dark variant badge
    disk_size = 1024
    white_badge = Image.new("RGBA", (disk_size, disk_size), (255, 255, 255, 255))
    bw = int(full_logo_trimmed.width * 800 / max(full_logo_trimmed.size))
    bh = int(full_logo_trimmed.height * 800 / max(full_logo_trimmed.size))
    resized_badge = full_logo_trimmed.resize((bw, bh), Image.Resampling.LANCZOS)
    white_badge.paste(resized_badge, ((disk_size - bw) // 2, (disk_size - bh) // 2), resized_badge)
    white_badge.save("docs/references/logo/logo_tsotsa_blanc.png")

    # 8. Vector SVG with embedded high-res data URI
    import base64
    with open("docs/references/logo/logo_tsotsa.png", "rb") as f:
        b64_full = base64.b64encode(f.read()).decode("utf-8")
    fw, fh = full_logo_trimmed.size
    svg_content = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fw} {fh}" width="{fw}" height="{fh}">\n'
        f'  <image href="data:image/png;base64,{b64_full}" width="{fw}" height="{fh}" />\n'
        f'</svg>\n'
    )
    with open("docs/references/logo/logo_tsotsa.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)

    print("All logo assets generated successfully!")


if __name__ == "__main__":
    main()
