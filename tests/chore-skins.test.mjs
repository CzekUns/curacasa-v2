import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { CHORE_SKINS, BASE_CHORE_SKIN_KEYS, getChoreSkin, setChoreSkin, getChoreSkinAsset } from "../src/lib/chore-skins.ts";
const data = new Map();
globalThis.localStorage = {
  getItem: key => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, String(value)),
};
const events = [];
globalThis.window = { dispatchEvent: event => { events.push(event.type); return true; } };
test("the classic option and five alternative skins are stable", () => {
  assert.deepEqual(CHORE_SKINS.map(x => x.id), ["classic","vintage60","vintage80","ink30","claytoon","chibicasa"]);
  assert.equal(new Set(BASE_CHORE_SKIN_KEYS).size, 12);
});
test("each alternative has 12 existing correctly named WebP files", () => {
  for (const skin of CHORE_SKINS.filter(x => x.folder)) {
    for (const icon of BASE_CHORE_SKIN_KEYS) {
      const asset = getChoreSkinAsset(skin.id, icon);
      assert.ok(asset?.endsWith("/" + icon + ".webp"));
      assert.ok(existsSync(new URL("../public/" + asset, import.meta.url)), asset);
    }
  }
});
test("skin selection persists without modifying chores or theme", () => {
  data.clear(); data.set("curacasa_v2_data", "DO-NOT-CHANGE"); data.set("curacasa_v2_theme", "giada");
  assert.equal(getChoreSkin(), "classic");
  for (const skin of CHORE_SKINS) {
    setChoreSkin(skin.id);
    assert.equal(getChoreSkin(), skin.id);
    assert.equal(data.get("curacasa_v2_data"), "DO-NOT-CHANGE");
    assert.equal(data.get("curacasa_v2_theme"), "giada");
    assert.equal(events.at(-1), "curacasa-skin-changed");
  }
  data.set("curacasa_v2_chore_skin", "not-a-skin");
  assert.equal(getChoreSkin(), "classic");
  assert.equal(getChoreSkinAsset("classic","casa"), null);
  assert.equal(getChoreSkinAsset("ink30","robot-aspirapolvere"), null);
  assert.equal(getChoreSkinAsset("ink30","personale-stella"), null);
});
