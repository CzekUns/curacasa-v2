#!/usr/bin/env python3
"""Remove the dark JPEG halo surrounding CuraCasa's rounded cream icon cards.

The artwork and interior line drawings are untouched; only pixels outside the
bright cream card are replaced with the original dusty-rose backdrop.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def clean(path: Path) -> None:
    with Image.open(path) as image:
        rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)

    h, w = rgb.shape[:2]

    # Sample the flat pink background safely outside the rounded card.
    patch = max(5, int(min(w, h) * 0.025))
    corners = np.concatenate(
        [rgb[:patch, :patch].reshape(-1, 3),
         rgb[:patch, -patch:].reshape(-1, 3),
         rgb[-patch:, :patch].reshape(-1, 3),
         rgb[-patch:, -patch:].reshape(-1, 3)]
    )
    pink = np.median(corners, axis=0).astype(np.float32)

    red = rgb[:, :, 0]
    green = rgb[:, :, 1]
    blue = rgb[:, :, 2]

    # The cream interior is bright; the pink exterior and dark halo are not.
    cream = ((red > 207) & (green > 201) & (blue > 183)).astype(np.uint8)
    cream = cv2.morphologyEx(
        cream, cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
    )

    n, labels, stats, _ = cv2.connectedComponentsWithStats(cream, 8)
    if n < 2:
        raise ValueError(f"No cream card detected in {path}")
    biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    coverage = stats[biggest, cv2.CC_STAT_AREA] / (w * h)
    if not 0.30 < coverage < 0.93:
        raise ValueError(f"Unexpected card coverage {coverage:.2%} in {path}")

    ys, xs = np.where(labels == biggest)
    hull = cv2.convexHull(np.column_stack((xs, ys)).astype(np.int32))
    card = np.zeros((h, w), dtype=np.uint8)
    cv2.fillConvexPoly(card, hull, 255)

    # A small anti-alias softens the corrected boundary without dark outlines.
    alpha = cv2.GaussianBlur(card, (7, 7), 1.4).astype(np.float32) / 255.0
    corrected = (
        rgb.astype(np.float32) * alpha[:, :, None]
        + pink[None, None, :] * (1 - alpha[:, :, None])
    ).clip(0, 255).astype(np.uint8)
    Image.fromarray(corrected, "RGB").save(path, quality=96, subsampling=0, optimize=True)
    print(f"{path.name}: card coverage {coverage:.1%}, pink {tuple(pink.astype(int))}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args()
    for path in args.files:
        clean(path)


if __name__ == "__main__":
    main()
