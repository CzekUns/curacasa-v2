#!/usr/bin/env python3
"""Remove only the coloured outer frame from CuraCasa chore icons.

The inner ivory background is sampled from EACH original image; no fixed white
or global colour is introduced. Does not touch the original illustration.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, binary_dilation

ROOT = Path("public/chore-icons")
changed = []
skipped = []

for path in sorted(ROOT.glob("*.jpg")):
    with Image.open(path) as im:
        source = np.asarray(im.convert("RGB"), dtype=np.float32)
    h, w, _ = source.shape
    if min(h, w) < 64:
        skipped.append((path.name, "too small"))
        continue

    # Robust colours from the original JPG. Pink is in the corners, ivory
    # occupies the middle of the upper strip inside the rounded rectangle.
    n = max(4, int(min(h, w) * .025))
    corners = np.concatenate([
        source[:n, :n].reshape(-1, 3),
        source[:n, -n:].reshape(-1, 3),
        source[-n:, :n].reshape(-1, 3),
        source[-n:, -n:].reshape(-1, 3),
    ])
    pink = np.median(corners, axis=0)
    ivory_samples = source[int(h*.12):int(h*.20), int(w*.40):int(w*.60)]
    ivory = np.median(ivory_samples.reshape(-1,3), axis=0)
    difference = np.linalg.norm(ivory - pink)
    # Never process images without the pink/ivory contrast.
    if difference < 65 or not (pink[0] > pink[1] + 15 and pink[0] > pink[2] + 12):
        skipped.append((path.name, "not a pink-framed icon"))
        continue

    # Pixels lying along the colour transition between the image's actual
    # outer pink and inner ivory, including the JPEG anti-aliasing.
    axis = pink - ivory
    portion = np.sum((source - ivory) * axis, axis=2) / np.sum(axis * axis)
    reconstructed = ivory[None,None,:] + np.clip(portion,0,1)[...,None] * axis
    residual = np.linalg.norm(source - reconstructed, axis=2)
    yy, xx = np.mgrid[:h,:w]
    # Only the outer margin can be changed. Inner drawing is untouched.
    margin = (xx < w*.23) | (xx > w*.77) | (yy < h*.23) | (yy > h*.77)
    candidate = (portion > .025) & (residual < 28) & margin

    # Keep only the actual external region joined to the canvas edge,
    # and its softened transition. Avoid isolated pink illustration details.
    from scipy.ndimage import label
    components, total = label(candidate)
    border_labels = np.unique(np.concatenate((
        components[0,:],components[-1,:],components[:,0],components[:,-1])))
    border_labels = border_labels[border_labels != 0]
    if len(border_labels) == 0:
        skipped.append((path.name, "no removable frame"))
        continue
    mask = np.isin(components, border_labels)
    if mask.mean() < .025 or mask.mean() > .45:
        skipped.append((path.name, "unexpected frame area"))
        continue

    # Nearest real ivory-background pixels extend to the canvas edges.
    # No hard-coded RGB colour and no new white.
    indices = distance_transform_edt(mask, return_distances=False,
                                     return_indices=True)
    output = source.copy()
    output[mask] = source[indices[0][mask], indices[1][mask]]
    result = Image.fromarray(np.clip(output,0,255).astype("uint8"), "RGB")
    result.save(path, format="JPEG", quality=96, subsampling=0)
    changed.append((path.name, round(float(mask.mean())*100,1)))

print("Updated icons:",len(changed))
for name, pct in changed:
    print(f"  {name}: outer frame {pct}%")
print("Skipped:", len(skipped))
for name, reason in skipped:
    print(f"  {name}: {reason}")
if not changed:
    raise SystemExit("No compatible icons found; no files were edited")
