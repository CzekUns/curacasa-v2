#!/usr/bin/env python3
"""Remove ONLY the old baked-in action symbols from four equipment WebPs.

The equipment, plants and salt sacks remain pixel-perfect outside the upper
right background region. Replacement vector action badges are separate SVGs,
added by ChoreIcon at display time.

Pinned pre-edit originals make this routine repeatable without accumulating
lossy re-encoding. Never crop, mask the icon outline or change its dimensions.
"""
from io import BytesIO
from pathlib import Path
import subprocess

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE_REV = "3598e76d5d84c19a16ec6cff20cd2e26d202af58"
ICONS = (
    "lavastoviglie-manutenzione",
    "lavastoviglie-sale",
    "addolcitore-manutenzione",
    "addolcitore-sale",
)

# The old badges were all in the otherwise blank upper-right corner.
# Protect the illustrated appliance at <= 68.0% of the canvas width, and
# the separate plant/salt at >= 39% of the height.
UPPER_RIGHT = (0.685, 0.025, 1.0, 0.352)

rows = []
for name in ICONS:
    relative = f"public/chore-icons/{name}.webp"
    source = subprocess.check_output(
        ["git", "show", f"{SOURCE_REV}:{relative}"], cwd=ROOT
    )
    with Image.open(BytesIO(source)) as img:
        rgb = np.asarray(img.convert("RGB"), dtype=np.uint8).copy()

    h, w = rgb.shape[:2]
    if not (128 <= h <= 2000 and 128 <= w <= 2000):
        raise AssertionError(f"Unexpected canvas size: {name} {w}x{h}")

    # The mask is limited to the known blank upper-right sky. No product pixels
    # lie in this region. Every pixel outside it is kept exactly in the working
    # RGB array prior to compression.
    x0, y0, x1, y1 = UPPER_RIGHT
    area = (int(round(w*x0)), int(round(h*y0)),
            min(w-1, int(round(w*x1))), min(h-1, int(round(h*y1))))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rectangle(area, fill=255)
    mask_array = np.asarray(mask, dtype=np.uint8).copy()
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    cleaned = cv2.cvtColor(
        cv2.inpaint(bgr, mask_array, inpaintRadius=6, flags=cv2.INPAINT_TELEA),
        cv2.COLOR_BGR2RGB
    )

    assert cleaned.shape == rgb.shape
    assert np.array_equal(rgb[mask_array == 0], cleaned[mask_array == 0])
    assert (mask_array > 0).mean() < 0.13
    path = ROOT / relative
    Image.fromarray(cleaned, mode="RGB").save(
        path, "WEBP", quality=97, method=6
    )
    with Image.open(path) as check:
        assert check.size == (w, h)
        assert check.mode == "RGB"
    rows.append((name, Image.fromarray(rgb), Image.fromarray(cleaned)))
    print(f"Removed old upper-right badge: {name} ({w}x{h}); main art preserved")

# Store a small side-by-side preview for visual review. This review is not
# rendered by CuraCasa itself.
thumb = (240, 240)
sheet = Image.new("RGB", (2*thumb[0]+28, len(rows)*(thumb[1]+28)), "#f3ece5")
labels = ImageDraw.Draw(sheet)
for i, (name, before, after) in enumerate(rows):
    y = i*(thumb[1]+28)
    labels.text((6, y+2), name+"  ORIGINAL", fill="#5a514b")
    labels.text((thumb[0]+15, y+2), "OLD BADGE REMOVED", fill="#41665c")
    sheet.paste(before.resize(thumb, Image.Resampling.LANCZOS), (4, y+24))
    sheet.paste(after.resize(thumb, Image.Resampling.LANCZOS),
                (thumb[0]+14, y+24))

destination = ROOT / "docs/asset-review/equipment-original-symbol-removal.webp"
destination.parent.mkdir(parents=True, exist_ok=True)
sheet.save(destination, "WEBP", quality=95, method=6)
print("Wrote symbol removal comparison:", destination)
