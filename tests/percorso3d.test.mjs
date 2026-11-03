import test from "node:test";
import assert from "node:assert/strict";
import { sampleFurniture } from "../src/components/percorso/three-room-model.ts";
import { newRoom, validPlacement, toggleCell } from "../src/lib/percorso.ts";

for (const name of ["Bagno", "Camera", "Cucina", "Salone", "Balcone"]) {
  test("The " + name + " showcase is non-destructive and respects collision rules", () => {
    const room = newRoom(name, 0);
    const snapshot = JSON.stringify(room);
    const sample = sampleFurniture(room.kind, room);
    assert.ok(sample.length >= 2, name + " should open with a furnished example");
    const placed = { ...room, furniture: [] };
    for (const item of sample) {
      assert.equal(validPlacement(placed, item), true, item.type + " must be placeable");
      placed.furniture.push(item);
    }
    assert.equal(JSON.stringify(room), snapshot, "showcase must not mutate the saved design");
  });
}

test("Showcase avoids removed tiles and returns only placeable furniture", () => {
  const room = toggleCell(newRoom("Salone", 0), 0, 0);
  assert.ok(room);
  const placed = { ...room, furniture: [] };
  for (const item of sampleFurniture(room.kind, room)) {
    assert.equal(validPlacement(placed, item), true);
    placed.furniture.push(item);
  }
});
