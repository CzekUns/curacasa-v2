#!/usr/bin/env python3
"""Remove the baked-in pink/beige *outside* selected CuraCasa preset illustrations.

Unlike the old JPG frame repair, this script makes the outside genuinely transparent,
so switching to Giada/Ghiaccio/etc cannot reveal the old palette. It preserves
the artwork and ivory panel inside a conservative rounded-rectangle mask.

Rerunnable: a previously processed transparent image is left unchanged.
Only the named source icons below are touched; there is no global CSS crop.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "public" / "chore-icons"
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

# The existing ivory panel starts ~4-6% from the outer image edges.
# Inset slightly more (7%) to ensure *none* of the pink or beige antialias remains.
# The original illustrations are well inside these bounds.
INSET = 0.07
CORNER_RADIUS = 0.12
OVERSAMPLE = 4

changed = []
for name in TARGETS:
    path = ROOT / f"{name}.webp"
    if not path.exists():
        raise FileNotFoundError(path)
    with Image.open(path) as src:
        image = src.convert("RGBA")
    width, height = image.size
    if min(width, height) < 128:
        raise ValueError(f"{name}: unexpected small illustration {image.size}")

    old_alpha = image.getchannel("A")
    corners = [old_alpha.getpixel(p) for p in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1))]
    if max(corners) == 0:
        print(f"Already transparent: {name}")
        continue

    # High-resolution mask gives smooth antialiased edges in the final WebP.
    scale = OVERSAMPLE
    high = Image.new("L", (width * scale, height * scale), 0)
    draw = ImageDraw.Draw(high)
    xy = (
        round(width * INSET * scale),
        round(height * INSET * scale),
        round((width * (1 - INSET)) * scale) - 1,
        round((height * (1 - INSET)) * scale) - 1,
    )
    draw.rounded_rectangle(xy, radius=round(min(width, height) * CORNER_RADIUS * scale), fill=255)
    mask = high.resize((width, height), Image.Resampling.LANCZOS)
    alpha = ImageChops.multiply(old_alpha, mask)

    # Transparent pixels receive the artwork's own cream background RGB to
    # prevent chromatic halos in WebP's lossy color interpolation at the edge.
    # This does not change any opaque pixels in the image.
    rgb = image.convert("RGB")
    panel_color = rgb.getpixel((width // 2, round(height * 0.11)))
    cream = Image.new("RGB", image.size, panel_color)
    # For fully transparent pixels, paint RGB as the original panel colour.
    white_zone = mask.point(lambda a: 255 if a == 0 else 0)
    merged_rgb = Image.composite(cream, rgb, white_zone)
    result = merged_rgb.convert("RGBA")
    result.putalpha(alpha)

    # WebP supports an alpha plane; retain its transparency, not a new beige fill.
    result.save(path, format="WEBP", quality=93, alpha_quality=100, method=6, exact=True)
    with Image.open(path) as test:
        rgba = test.convert("RGBA")
        assert rgba.size == (width, height)
        assert rgba.getpixel((0, 0))[3] == 0, name
        assert rgba.getpixel((width - 1, height - 1))[3] == 0, name
        assert rgba.getpixel((width // 2, height // 2))[3] == 255, name
    changed.append(name)

print(f"Cleaned {len(changed)} / {len(TARGETS)} selected icons:", ", ".join(changed))
