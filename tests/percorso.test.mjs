import test from "node:test";
import assert from "node:assert/strict";
import {
  newRoom, toggleCell, resizeRoom, validPlacement, furnitureSize,
  roomsOverlap, snapRoom, canMoveRoom, reconcileHouse,
} from "../src/lib/percorso.ts";

test("A registered room is a separate 5x4 editable grid", () => {
  const room = newRoom("Cucina", 0);
  assert.equal(room.cells.length, 20);
  assert.equal(room.width, 5);
  assert.equal(room.height, 4);
  assert.equal(room.kind, "cucina");
  assert.equal(room.furniture.length, 0);
});
test("Irregular room shape supports notches but cannot split in two", () => {
  const room = newRoom("Camera", 0);
  const notched = toggleCell(room, 0, 0);
  assert.ok(notched);
  assert.equal(notched.cells.length, 19);
  assert.equal(toggleCell(notched, 0, 0)?.cells.length, 20);
  const narrow = { ...room, width: 3, height: 1, cells: ["0,0", "1,0", "2,0"] };
  assert.equal(toggleCell(narrow, 1, 0), null);
});
test("Furniture respects its rotated footprint and avoids overlaps", () => {
  const room = newRoom("Salone", 0);
  const sofa = { id: "a", type: "divano", x: 0, y: 0, rotation: 0 };
  const rotated = { ...sofa, rotation: 1 };
  assert.deepEqual(furnitureSize(sofa), { width: 2, height: 1 });
  assert.deepEqual(furnitureSize(rotated), { width: 1, height: 2 });
  assert.equal(validPlacement(room, sofa), true);
  const occupied = { ...room, furniture: [sofa] };
  assert.equal(validPlacement(occupied, { ...sofa, id: "b", x: 1 }), false);
  assert.equal(validPlacement(occupied, { ...sofa, id: "c", x: 2 }), true);
  assert.equal(validPlacement(occupied, { ...sofa, id: "d", x: 4 }), false);
});
test("Furniture cannot be placed over a removed floor tile", () => {
  const room = toggleCell(newRoom("Bagno", 0), 0, 0);
  assert.ok(room);
  assert.equal(validPlacement(room, { id: "a", type: "lavatrice", x: 0, y: 0, rotation: 0 }), false);
  const placed = { ...newRoom("Bagno", 0), furniture: [{ id: "a", type: "lavatrice", x: 0, y: 0, rotation: 0 }] };
  assert.equal(toggleCell(placed, 0, 0), null);
});
test("Adjacent rooms remain independent and collisions are blocked", () => {
  const a = newRoom("Cucina", 0);
  const b = snapRoom(newRoom("Salone", 1), a, "est");
  assert.equal(roomsOverlap(a, b), false);
  assert.equal(canMoveRoom([a, b], b), true);
  assert.equal(roomsOverlap(a, { ...b, offsetX: a.offsetX + 4 }), true);
});
test("Resizing adds tiles and preserves valid furniture", () => {
  const source = newRoom("Studio", 0);
  const large = resizeRoom(source, 7, 6);
  assert.equal(large.cells.length, 42);
  assert.equal(resizeRoom(large, 5, 4).cells.length, 20);
  assert.equal(resizeRoom(source, 0, 30).width, 2);
  assert.equal(resizeRoom(source, 0, 30).height, 12);
});
test("Saved room designs are reconciled with the registered room list", () => {
  const source = newRoom("Bagno", 0);
  source.floor = "cotto";
  source.offsetX = 17;
  const next = reconcileHouse(["Bagno", "Cucina"], { rooms: [source] });
  assert.equal(next.rooms.length, 2);
  assert.equal(next.rooms[0].floor, "cotto");
  assert.equal(next.rooms[0].offsetX, 17);
  assert.equal(next.rooms[1].name, "Cucina");
  assert.deepEqual(reconcileHouse(["Cucina"], next).rooms.map((r) => r.name), ["Cucina"]);
});
