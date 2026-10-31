import test from "node:test";
import assert from "node:assert/strict";
import { isoDeltaToTiles, clampStageZoom, pinchCamera } from "../src/lib/percorso-gestures.ts";

test("Drag vectors map to cardinal tile directions under every camera rotation", () => {
  const orientations = [
    [[35, 17.5], [-35, 17.5]],
    [[-35, 17.5], [-35, -17.5]],
    [[-35, -17.5], [35, -17.5]],
    [[35, -17.5], [35, 17.5]],
  ];
  orientations.forEach((axes, view) => {
    for (let coordinate = 0; coordinate < 2; coordinate++) {
      const [dx, dy] = axes[coordinate];
      const value = isoDeltaToTiles(dx, dy, view);
      assert.ok(Math.abs(value.x - (coordinate === 0 ? 1 : 0)) < 1e-8);
      assert.ok(Math.abs(value.y - (coordinate === 1 ? 1 : 0)) < 1e-8);
    }
  });
});
test("Pinch zoom keeps the touched midpoint anchored", () => {
  const camera = pinchCamera(1, { x: 0, y: 0 }, 100, { x: 140, y: 200 }, 200, { x: 160, y: 190 }, { x: 200, y: 200 });
  assert.equal(camera.zoom, 2);
  assert.deepEqual(camera.pan, { x: 80, y: -10 });
  assert.equal(clampStageZoom(8), 3.5);
  assert.equal(clampStageZoom(0.2), 0.8);
});
