import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  STORE_CATEGORY_ORDER, groupStoreActivities, normalizeStorePacks,
} from "../src/lib/shop-catalog.ts";

const catalog = JSON.parse(readFileSync(new URL("../public/chore-packs.json", import.meta.url), "utf8"));

test("Store: current JSON has 10 visible collections ordered BASE PRO SUPER SPECIALE", () => {
  const packs = normalizeStorePacks(catalog);
  assert.equal(packs.length, 10);
  assert.deepEqual(packs.map(p => p.category), [
    "base", "base", "base", "pro", "pro", "pro", "pro", "super", "super", "speciale",
  ]);
  assert.equal(packs[0].title, "Le 12 essenziali");
  assert.equal(packs[0].chores.length, 12);
  assert.equal(packs.reduce((s,p) => s+p.chores.length,0),67);
});

test("Store: activities are grouped under explicit category headers, without duplicates", () => {
  const groups = groupStoreActivities(normalizeStorePacks(catalog));
  assert.deepEqual(groups.map(g => g.category), STORE_CATEGORY_ORDER);
  assert.deepEqual(groups.map(g => g.chores.length), [29,23,10,5]);
  const icons = groups.flatMap(g => g.chores.map(c => c.icon));
  assert.equal(icons.length,67);
  assert.equal(new Set(icons).size,67);
  assert.equal(groups[0].chores[0].title,"Controllo generale casa");
});

test("Store: old cached catalogue without collection category no longer produces blank list", () => {
  const stale = {
    packs: catalog.packs.map(({ category: _removed, ...p }) => p),
  };
  const recovered = normalizeStorePacks(stale);
  assert.equal(recovered.length,10);
  assert.equal(recovered[0].category,"base");
  assert.deepEqual(groupStoreActivities(recovered).map(g => g.chores.length),[29,23,10,5]);
});

test("Store: cached thematic packs mixing chore levels split cleanly into groups", () => {
  const mixed = { packs: [{
    id: "bagno-acqua", title: "Bagno e acqua", description: "Legacy",
    chores: [catalog.packs[0].chores[0],catalog.packs[3].chores[0],catalog.packs[9].chores[0]],
  }] };
  const recovered = normalizeStorePacks(mixed);
  assert.deepEqual(recovered.map(p=>p.category),["base","pro","speciale"]);
  assert.deepEqual(groupStoreActivities(recovered).map(g=>g.chores.length),[1,1,1]);
});

test("Store: handles missing, malformed or empty catalogues",()=>{
  assert.deepEqual(normalizeStorePacks(null),[]);
  assert.deepEqual(normalizeStorePacks({}),[]);
  assert.deepEqual(normalizeStorePacks({packs:[null,{chores:[]},{id:"old",title:"Empty",chores:[]}]}),[]);
});
