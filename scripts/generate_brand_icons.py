#!/usr/bin/env python3
"""Create crisp install and browser icons from CuraCasa's vector brand assets."""
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
BRAND.mkdir(parents=True, exist_ok=True)


def render(source: str, target: str, size: int) -> None:
    cairosvg.svg2png(
        url=str(BRAND / source),
        write_to=str(BRAND / target),
        output_width=size,
        output_height=size,
    )


for size in (192, 512):
    render("app-icon.svg", f"icon-{size}.png", size)
render("app-icon-maskable.svg", "icon-maskable-512.png", 512)
render("app-icon.svg", "apple-touch-icon.png", 180)
render("mark.svg", "mark-512.png", 512)
render("logo.svg", "logo-horizontal-1024.png", 1024)
render("logo-stacked.svg", "logo-stacked-512.png", 512)
render("favicon.svg", "favicon-48.png", 48)
render("favicon.svg", "favicon-32.png", 32)
render("favicon.svg", "favicon-16.png", 16)

ico_frames = [
    Image.open(BRAND / f"favicon-{size}.png").convert("RGBA")
    for size in (16, 32, 48)
]
ico_frames[-1].save(
    BRAND / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=ico_frames[:-1],
)
print("CuraCasa: generated favicon, PWA and Apple touch assets")
