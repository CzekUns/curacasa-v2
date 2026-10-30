import test from "node:test";
import assert from "node:assert/strict";
import { availableRoomColors, normalizeRoomDetails, roomLabel } from "../src/lib/rooms.ts";

test("New rooms receive distinct colors from the eight-slot palette", () => {
  const rooms = ["Cucina", "Bagno", "Camera", "Salone", "Balcone"];
  const details = normalizeRoomDetails(rooms);
  assert.deepEqual(rooms.map((name) => details[name].color), [0, 1, 2, 3, 4]);
  assert.deepEqual(rooms.map((name) => details[name].kind), ["cucina", "bagno", "camera", "salone", "balcone"]);
});

test("Several rooms of the same type keep unique identification slots", () => {
  const rooms = ["Bagno", "Bagno di servizio", "Bagno ospiti", "Camera", "Camera bambini"];
  const details = normalizeRoomDetails(rooms);
  assert.equal(new Set(rooms.slice(0, 3).map((name) => details[name].color)).size, 3);
  const unavailable = new Set(rooms.slice(0, 3).map((name) => details[name].color));
  assert.ok(availableRoomColors(rooms, details, "bagno").every((color) => !unavailable.has(color)));
  assert.equal(availableRoomColors(rooms, details, "bagno").length, 5);
  assert.equal(availableRoomColors(rooms, details, "camera").length, 6);
});

test("Existing saved room metadata and unrecognized custom room names are preserved", () => {
  const rooms = ["Bagno principale", "Studio"];
  const saved = { "Bagno principale": { kind: "bagno", color: 7, note: "principale" } };
  const details = normalizeRoomDetails(rooms, saved);
  assert.deepEqual(details["Bagno principale"], saved["Bagno principale"]);
  assert.equal(details.Studio.kind, "altro");
  assert.equal(roomLabel("bagno", "di servizio"), "Bagno di servizio");
});
