#!/usr/bin/env python3
"""Conservative repair of isolated gray/pink blobs at CuraCasa WebP margins.

Read a pinned snapshot of the unedited production assets, never the output
of a previous run. Carefully hand-located patches target *background only*.
Do not shrink, crop, resize, change the alpha channel or repaint illustrations.

The larger artifacts fused to the drawing are deliberately not retouched:
a geometric mask there would delete real illustration pixels.
"""
from io import BytesIO
from pathlib import Path
import subprocess
import numpy as np
import cv2
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE_REV = "20525bce8b96f662017bdc054e0d18122c02b127"

# Each tuple is a rectangle (left, top, right, bottom) in [0,1] icon space.
# Only isolated margin contamination; all object/illustration areas excluded.
# Coordinates have been chosen by reviewing the complete original image.
REGIONS = {
    "paletta": [(0.315, 0, 0.710, 0.072)],
    "pavimento": [(0.235, 0, 0.438, 0.077)],
    "termosifone": [
        (0.510, 0, 0.710, 0.072),
        (0, 0.675, 0.088, 0.895),
    ],
    "letto": [(0, 0.560, 0.083, 0.695)],
    "tavolo": [(0, 0.545, 0.083, 0.710)],
    "mattonelle": [
        (0.944, 0.280, 1, 0.828),
        (0.378, 0.976, 0.710, 1),
    ],
    "lavastoviglie-manutenzione": [
        (0.705, 0.078, 0.936, 0.333),
    ],
    "lavastoviglie-sale": [
        (0.712, 0.080, 0.982, 0.342),
    ],
    "infissi": [
        (0.938, 0.455, 1, 0.832),
        (0.906, 0.856, 1, 1),
    ],
    "tubi-esterni": [
        (0.540, 0, 0.640, 0.052),
    ],
    "tapparella-grande": [
        (0.941, 0.796, 1, 1),
    ],
    "zanzariera": [
        (0.957, 0.750, 1, 1),
        (0.822, 0.966, 1, 1),
    ],
}


def read_before(name):
    path = f"public/chore-icons/{name}.webp"
    data = subprocess.check_output(["git", "show", f"{SOURCE_REV}:{path}"], cwd=ROOT)
    with Image.open(BytesIO(data)) as original:
        return np.asarray(original.convert("RGB"), dtype=np.uint8).copy()


def mask_for(name, w, h):
    mask_img = Image.new("L", (w, h), 0)
    drawer = ImageDraw.Draw(mask_img)
    for x0, y0, x1, y1 in REGIONS[name]:
        rect = (round(x0 * w), round(y0 * h), min(w-1, round(x1*w)),
                min(h-1, round(y1*h)))
        drawer.rectangle(rect, fill=255)
    return np.asarray(mask_img, dtype=np.uint8).copy()


preview_rows = []
for name in REGIONS:
    rgb = read_before(name)
    h, w = rgb.shape[:2]
    if h != w or not 128 <= w <= 1024:
        raise ValueError(f"Unexpected dimensions: {name}: {w}x{h}")

    mask = mask_for(name, w, h)
    # Background-only masks use nearest natural warm background pixels.
    # Inpainting does not fill over objects, unlike the old inset mask.
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    result = cv2.cvtColor(cv2.inpaint(bgr, mask, 4, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)
    if not np.array_equal(rgb[mask == 0], result[mask == 0]):
        raise AssertionError(f"Changed protected pixels of {name}")
    if mask.mean() / 255 > 0.18:
        raise AssertionError(f"Mask too broad for conservative cleanup: {name}")
    if np.count_nonzero(np.any(rgb != result, axis=2) & (mask > 0)) == 0:
        raise AssertionError(f"No repair performed for {name}")
    if (result < 0).any() or (result > 255).any():
        raise AssertionError(name)

    path = ROOT / "public" / "chore-icons" / f"{name}.webp"
    Image.fromarray(result, mode="RGB").save(
        path, "WEBP", quality=97, method=6
    )
    with Image.open(path) as saved:
        assert saved.size == (w, h)
        assert saved.mode == "RGB"

    before_img = Image.fromarray(rgb, mode="RGB")
    after_img = Image.fromarray(result, mode="RGB")
    preview_rows.append((name, before_img, after_img))
    print(f"Repaired background patches: {name}, {int((mask > 0).sum())} pixels "
          f"({100*(mask > 0).mean():.1f}% canvas)")

# Review sheet: each column is before/after, labelled with the filename.
# This is an audit artifact only, never loaded by the app.
cell = 198
label_h = 20
cols = 3
rows = (len(preview_rows)+cols-1)//cols
sheet = Image.new("RGB", (cols * (cell * 2 + 12), rows * (cell + label_h + 12)),
                  (242, 233, 225))
d = ImageDraw.Draw(sheet)
for i, (name, before, after) in enumerate(preview_rows):
    cx = (i % cols) * (cell * 2 + 12)
    cy = (i // cols) * (cell + label_h + 12)
    d.text((cx + 5, cy + 2), name, fill=(50, 46, 45))
    d.text((cx + 145, cy + 2), "BEFORE", fill=(80, 55, 55))
    d.text((cx + cell + 145, cy + 2), "AFTER", fill=(45, 80, 60))
    before = before.resize((192,192),Image.Resampling.NEAREST)
    after = after.resize((192,192),Image.Resampling.NEAREST)
    sheet.paste(before,(cx + 3, cy + label_h))
    sheet.paste(after,(cx + cell + 6, cy + label_h))

dst = ROOT / "docs" / "asset-review" / "chore-edge-cleanup-before-after.webp"
dst.parent.mkdir(parents=True, exist_ok=True)
sheet.save(dst, "WEBP", quality=94, method=6)
print(f"Conservative cleanup finished: {len(REGIONS)} WebP assets; review: {dst}")
