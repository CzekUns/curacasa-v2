import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eligibleRoomNames, getRoomRule, roomRuleFromLegacy, selectedRoomsAreValid } from "../src/lib/chore-rooms.ts";
import { normalizeRoomDetails } from "../src/lib/rooms.ts";

const packs = JSON.parse(readFileSync(new URL("../public/chore-packs.json", import.meta.url), "utf8")).packs;
const presets = packs.flatMap((pack) => pack.chores);
const find = (name) => presets.find((chore) => chore.title === name);

test("All 67 presets explicitly set a valid room rule", () => {
  assert.equal(presets.length, 67);
  for (const chore of presets) {
    assert.ok(chore.roomRule, chore.title);
    assert.ok(["any", "type"].includes(chore.roomRule.mode), chore.title);
    if (chore.roomRule.mode === "type") {
      assert.ok(["bagno", "cucina", "camera", "salone", "balcone"].includes(chore.roomRule.kind), chore.title);
    }
  }
});

test("Room-bound presets follow all same-type rooms, not only the original default name", () => {
  const rooms = ["Cucina", "Bagno", "Bagno di servizio", "Camera", "Camera bambini", "Salone", "Balcone"];
  const details = normalizeRoomDetails(rooms);
  for (const [name, expected] of [
    ["Pulire vasca", ["Bagno", "Bagno di servizio"]],
    ["Pulire WC", ["Bagno", "Bagno di servizio"]],
    ["Cambio letto", ["Camera", "Camera bambini"]],
    ["Pulire forno", ["Cucina"]],
    ["Sistemare balcone", ["Balcone"]],
  ]) {
    assert.deepEqual(eligibleRoomNames(rooms, details, getRoomRule(find(name))), expected);
  }
  assert.deepEqual(eligibleRoomNames(rooms, details, getRoomRule(find("Lavare pavimento"))), rooms);
});

test("Specific rooms cannot record an unrelated room", () => {
  const rooms = ["Bagno", "Bagno di servizio", "Camera"];
  const rule = getRoomRule(find("Pulire vasca"));
  assert.equal(selectedRoomsAreValid(rooms, undefined, rule, ["Bagno di servizio"]), true);
  assert.equal(selectedRoomsAreValid(rooms, undefined, rule, ["Camera"]), false);
  assert.equal(selectedRoomsAreValid(rooms, undefined, rule, []), false);
  assert.deepEqual(eligibleRoomNames(rooms, undefined, { mode: "specific", names: ["Camera"] }), ["Camera"]);
});

test("Older saved presets migrate by room type; unknown room names remain specific", () => {
  assert.deepEqual(roomRuleFromLegacy("Bagno"), { mode: "type", kind: "bagno" });
  assert.deepEqual(roomRuleFromLegacy("Soggiorno"), { mode: "type", kind: "salone" });
  assert.deepEqual(roomRuleFromLegacy("Tutta casa"), { mode: "any" });
  assert.deepEqual(roomRuleFromLegacy("Studio privato"), { mode: "specific", names: ["Studio privato"] });
  assert.deepEqual(roomRuleFromLegacy("Bagno di servizio"), { mode: "specific", names: ["Bagno di servizio"] });
});
