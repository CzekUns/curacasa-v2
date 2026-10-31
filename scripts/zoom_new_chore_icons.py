#!/usr/bin/env python3
"""Enlarge four recently added chore images by 20%, without touching sun awnings.

Always reads approved source from a pinned commit, so a re-run does not
accumulate zoom or shrink the card. Output stays the original square size (192x192) and opaque WebP.
"""
from io import BytesIO
from pathlib import Path
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_REVISION = "567d79b35e1a1c227435644903457697af02066a"
NAMES = ("mobiletti-esterni", "divano", "tappeto", "materasso")
ZOOM = 1.20

for name in NAMES:
    path = f"public/chore-icons/{name}.webp"
    source = subprocess.check_output(
        ["git", "show", f"{SOURCE_REVISION}:{path}"], cwd=ROOT
    )
    with Image.open(BytesIO(source)) as img:
        img = img.convert("RGB")
        w, h = img.size
        if w != h or w < 128:
            raise ValueError(f"Unexpected dimensions {name}: {w} x {h}")
        crop_size = round(w / ZOOM)
        offset = (w - crop_size) // 2
        zoomed = img.crop(
            (offset, offset, offset + crop_size, offset + crop_size)
        ).resize((w, h), resample=Image.Resampling.LANCZOS)
        zoomed.save(ROOT / path, format="WEBP", quality=96, method=6)
    with Image.open(ROOT / path) as check:
        assert check.size == (w, h)
    print(f"Zoomed {name}: x{ZOOM}, {w}x{h} opaque WebP")

print("Done. tende-esterno.webp was intentionally left untouched.")
