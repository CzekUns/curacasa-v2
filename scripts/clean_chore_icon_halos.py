#!/usr/bin/env python3
"""Restore full-size CuraCasa chore art, then EXTEND its ivory background.

This replaces the previous alpha/rounded-mask crop. The illustration is never
scaled, pasted onto a smaller panel, or made transparent. We start from the
original files from BEFORE the destructive trim, preserving the original
object size, then extend clean ivory pixels from inside the panel outwards.

The nearest interior pixel fills each exterior coordinate, maintaining the
original card's natural off-white shade/gradient without hard-coded white.
Only the listed assets are changed.
"""
from io import BytesIO
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt

ROOT = Path(__file__).resolve().parents[1]
PRE_CROP_REVISION = "527fa34aedd775a2b64cc9093b2e592b05ea63f3"
TARGETS = (
    "addolcitore-manutenzione",
    "addolcitore-sale",
    "armadio",
    "cappa",
    "deumidificatore",
    "infissi",
    "lampadario",
    "lavatrice",
    "macchina-caffe",
    "tapparella-grande",
    "tapparelle",
    "telecomando-batterie",
    "tende",
    "zanzariera",
)

# A safe part of the original cream panel; NOT a crop of the final picture.
# Everything inside this mask is copied pixel-for-pixel from the original.
# Everything outside receives the nearest original cream pixel, never alpha.
INSET = 0.075
CORNER_RADIUS = 0.12

for name in TARGETS:
    rel = f"public/chore-icons/{name}.webp"
    original_bytes = subprocess.check_output(
        ["git", "show", f"{PRE_CROP_REVISION}:{rel}"], cwd=ROOT
    )
    with Image.open(BytesIO(original_bytes)) as source:
        original = np.asarray(source.convert("RGB"), dtype=np.uint8)
    height, width = original.shape[:2]
    if min(height, width) < 128:
        raise RuntimeError(f"Unexpected icon dimensions for {name}: {width}x{height}")

    # Main panel: safely INSIDE the old round-corner edges and OUTSIDE
    # all the illustrations. It is a seed region, not a smaller output card.
    seed = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(seed)
    left = round(width * INSET)
    top = round(height * INSET)
    right = round(width * (1 - INSET)) - 1
    bottom = round(height * (1 - INSET)) - 1
    draw.rounded_rectangle(
        (left, top, right, bottom),
        radius=round(min(width, height) * CORNER_RADIUS),
        fill=255,
    )
    preserve = np.asarray(seed) == 255

    # In the outside fringe, continue the colour already on the panel edge.
    # Unlike replacing the whole exterior with one approximate solid colour,
    # this respects small warm gradients in each original panel.
    _, index = distance_transform_edt(~preserve, return_indices=True)
    result = original.copy()
    fringe = ~preserve
    result[fringe] = original[index[0][fringe], index[1][fringe]]

    assert np.array_equal(result[preserve], original[preserve]), name
    assert result.shape == original.shape, name
    assert np.all(result[0, 0] > 225), f"Corner should be ivory, not pink: {name}"

    target = ROOT / rel
    Image.fromarray(result, "RGB").save(
        target, format="WEBP", quality=96, method=6
    )
    with Image.open(target) as image:
        assert image.size == (width, height)
        assert image.convert("RGBA").getpixel((0, 0))[3] == 255
        assert image.convert("RGBA").getpixel((width - 1, height - 1))[3] == 255
    print(f"RESTORED {name}: {width}x{height}, "
          f"preserved artwork ({preserve.mean() * 100:.1f}% pixel area); "
          "extended original ivory to edges")

print(f"Done: {len(TARGETS)} full-size opaque illustrations restored.")
