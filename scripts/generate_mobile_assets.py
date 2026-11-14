import os
import math
from PIL import Image, ImageDraw

os.makedirs("apps/mobile/assets", exist_ok=True)

# Brand colors
BG_COLOR = (238, 242, 240, 255) # #EEF2F0
BRAND_ORANGE = (242, 97, 66, 255) # #F26142
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)
DARK_TEXT = (23, 48, 42, 255) # #17302A

def draw_brand_symbol(draw, center_x, center_y, radius, color):
    # Main outer circle
    draw.ellipse(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        fill=color
    )
    # The signature TSOTSA crosscuts
    # Vertical cut
    v_width = radius * 0.15
    draw.rectangle(
        [center_x - v_width / 2, center_y - radius - 5, center_x + v_width / 2, center_y + radius + 5],
        fill=BG_COLOR
    )
    # Center circle cutout
    inner_r = radius * 0.28
    draw.ellipse(
        [center_x - inner_r, center_y - inner_r, center_x + inner_r, center_y + inner_r],
        fill=BG_COLOR
    )
    # Horizontal right cut
    h_height = radius * 0.17
    draw.rectangle(
        [center_x, center_y - h_height / 2, center_x + radius + 5, center_y + h_height / 2],
        fill=BG_COLOR
    )

# 1. icon.png (1024x1024)
icon = Image.new("RGBA", (1024, 1024), BG_COLOR)
draw = ImageDraw.Draw(icon)
draw_brand_symbol(draw, 512, 512, 380, BRAND_ORANGE)
icon.save("apps/mobile/assets/icon.png", "PNG")
print("Saved apps/mobile/assets/icon.png")

# 2. adaptive-icon.png (1024x1024 with transparent bg for Android foreground)
adaptive = Image.new("RGBA", (1024, 1024), TRANSPARENT)
draw_adapt = ImageDraw.Draw(adaptive)
# In adaptive icon foreground, cutouts can use transparent or white
# Main circle
draw_adapt.ellipse([512 - 300, 512 - 300, 512 + 300, 512 + 300], fill=BRAND_ORANGE)
# Cuts
draw_adapt.rectangle([512 - 25, 512 - 310, 512 + 25, 512 + 310], fill=TRANSPARENT)
draw_adapt.ellipse([512 - 85, 512 - 85, 512 + 85, 512 + 85], fill=TRANSPARENT)
draw_adapt.rectangle([512, 512 - 27, 512 + 310, 512 + 27], fill=TRANSPARENT)
adaptive.save("apps/mobile/assets/adaptive-icon.png", "PNG")
print("Saved apps/mobile/assets/adaptive-icon.png")

# 3. splash.png (1242x2436)
splash = Image.new("RGBA", (1242, 2436), BG_COLOR)
draw_splash = ImageDraw.Draw(splash)
draw_brand_symbol(draw_splash, 621, 1218, 220, BRAND_ORANGE)
splash.save("apps/mobile/assets/splash.png", "PNG")
print("Saved apps/mobile/assets/splash.png")

# 4. favicon.png (48x48)
fav = icon.resize((48, 48), Image.Resampling.LANCZOS)
fav.save("apps/mobile/assets/favicon.png", "PNG")
print("Saved apps/mobile/assets/favicon.png")

