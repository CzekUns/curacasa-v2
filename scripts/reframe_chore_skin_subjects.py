#!/usr/bin/env python3
"""Reframe approved CuraCasa icon skins: smaller illustrations, extended backdrop.

Preserves original icon-to-chore mappings and the existing CSS pink overlay.
Run only once for this revision; a marker prevents repeated shrinking.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "chore-skins"
PACKS = ("Vintage60", "Vintage80", "Ink30", "ClayToon", "ChibiCasa")
ICONS = ("casa", "scopa-elettrica", "scopa", "pavimento", "spolverino",
         "pattumiera", "piante", "bagno", "cucina", "letto", "soggiorno", "balcone")
OUTPUT_SIZE = 320
SUBJECT_SCALE = 0.87
MARKER = ROOT / ".subjects-padded-v1.json"


def patch_color(arr: np.ndarray, y: int, x: int) -> np.ndarray:
    """Background color sampled away from illustrated rounded-corner cutouts."""
    return np.median(arr[y-8:y+8, x-8:x+8], axis=(0, 1))


def extending_background(src: Image.Image) -> Image.Image:
    """Extrapolate the four edge colors as a smooth backdrop.

    The background is independent of the central illustrated subject, so the
    shrunken art never leaves a smaller rectangular panel over the pink card.
    """
    pixels = np.asarray(src.convert("RGB"), dtype=np.float32)
    size = pixels.shape[0]
    a, b = round(size * 0.095), round(size * 0.905)
    tl, tr = patch_color(pixels, a, a), patch_color(pixels, a, b)
    bl, br = patch_color(pixels, b, a), patch_color(pixels, b, b)
    y, x = np.mgrid[0:size, 0:size].astype(np.float32) / (size - 1)
    out = (tl * ((1-x)*(1-y))[..., None]
           + tr * (x*(1-y))[..., None]
           + bl * ((1-x)*y)[..., None]
           + br * (x*y)[..., None])
    return Image.fromarray(np.uint8(np.clip(out, 0, 255))).convert("RGBA")


def shrink_and_extend(source: Image.Image, pack: str) -> Image.Image:
    original = source.convert("RGBA").resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS)
    if pack == "Vintage60":
        # The user requested white, not the app palette behind these drawings.
        base = Image.new("RGBA", (OUTPUT_SIZE, OUTPUT_SIZE), (255, 255, 255, 255))
    else:
        base = extending_background(original)

    new_size = round(OUTPUT_SIZE * SUBJECT_SCALE)
    layer = original.resize((new_size, new_size), Image.Resampling.LANCZOS)
    if pack != "Vintage60":
        # Smoothly hide the former rounded panel edges without cropping details.
        distance = np.minimum.reduce(np.broadcast_arrays(
            np.arange(new_size)[:, None], np.arange(new_size)[None, :],
            (new_size - 1 - np.arange(new_size))[:, None],
            (new_size - 1 - np.arange(new_size))[None, :]
        )).astype(np.float32)
        alpha = np.clip(distance / 13.0, 0.0, 1.0)
        alpha = alpha * alpha * (3.0 - 2.0 * alpha)
        pixels = np.array(layer)
        pixels[:, :, 3] = np.uint8(pixels[:, :, 3] * alpha)
        layer = Image.fromarray(pixels, "RGBA")

    base.alpha_composite(layer, ((OUTPUT_SIZE - new_size) // 2, (OUTPUT_SIZE - new_size) // 2))
    return base.convert("RGB")


def main():
    if MARKER.exists():
        print("Already processed; skipping to avoid resizing subjects twice.")
        return
    files = [(pack, ROOT / pack / (key + ".webp")) for pack in PACKS for key in ICONS]
    missing = [str(path) for _, path in files if not path.is_file()]
    if missing:
        raise SystemExit("Missing approved assets: " + ", ".join(missing))
    results = []
    for pack, path in files:
        with Image.open(path) as image:
            if image.size != (OUTPUT_SIZE, OUTPUT_SIZE) and pack != "Vintage60":
                raise ValueError(f"Unexpected icon dimensions for {path}: {image.size}")
            final = shrink_and_extend(image, pack)
            final.save(path, "WEBP", quality=92, method=6)
            results.append({"set": pack, "file": path.name,
                            "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
            print(f"Updated {pack}/{path.name}")
    MARKER.write_text(json.dumps({
        "version": 1, "scale": SUBJECT_SCALE,
        "background": "white for Vintage60, gradient-extended for other packs",
        "assets": results,
    }, indent=2) + "\n", encoding="utf-8")
    print("Reworked", len(results), "approved skin icons.")


if __name__ == "__main__":
    main()
