#!/usr/bin/env python3
"""Give Vintage60 opaque white backgrounds without changing the illustrations.

This is limited to the approved 12 WEBP icons, not the classic CuraCasa assets.
Run once in CI; files are deterministic and re-runs are safe.
"""
from pathlib import Path
from PIL import Image

directory = Path(__file__).resolve().parents[1] / "public" / "chore-skins" / "Vintage60"
icons = sorted(directory.glob("*.webp"))
if len(icons) != 12:
    raise RuntimeError(f"Expected 12 Vintage60 icons, found {len(icons)}")

for path in icons:
    with Image.open(path) as source:
        rgba = source.convert("RGBA")
        white = Image.new("RGB", rgba.size, (255, 255, 255))
        white.paste(rgba, mask=rgba.getchannel("A"))
        white.save(path, format="WEBP", lossless=True, method=6)
        print(f"{path.name}: {rgba.width}x{rgba.height}, opaque white base")
