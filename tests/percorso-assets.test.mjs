import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FURNITURE, newRoom, validPlacement, reconcileHouse } from "../src/lib/percorso.ts";
import { ADDITIONAL_ASSETS, PRESET_ASSET_IDS } from "../src/lib/percorso-asset-catalog.ts";

const packs=JSON.parse(readFileSync(new URL("../public/chore-packs.json",import.meta.url),"utf-8")).packs;
const chores=packs.flatMap(pack=>pack.chores);
const registered=new Map(FURNITURE.map(entry=>[entry.id,entry]));

test("Every Shop preset has a real, selectable 3D asset",()=>{
  assert.equal(chores.length,67);
  assert.equal(new Set(chores.map(chore=>chore.icon)).size,67);
  for(const chore of chores){
    const assetId=PRESET_ASSET_IDS[chore.icon];
    assert.ok(assetId, `Missing asset for ${chore.title} (${chore.icon})`);
    assert.ok(registered.has(assetId), `Unregistered 3D asset ${assetId} for ${chore.title}`);
  }
});
test("Every procedural model has unique dimensions and a readable label",()=>{
  assert.equal(ADDITIONAL_ASSETS.length,58);
  assert.equal(registered.size,FURNITURE.length);
  for(const asset of ADDITIONAL_ASSETS){
    assert.ok(asset.label.trim());
    assert.ok(asset.icon.trim());
    assert.ok(asset.width>=1&&asset.height>=1&&asset.width<=2&&asset.height<=2);
    const room=newRoom("Stanza",0);
    const furniture={id:"new",type:asset.id,x:0,y:0,rotation:0};
    assert.ok(validPlacement(room,furniture),asset.id);
    assert.ok(validPlacement(room,{...furniture,rotation:1}),asset.id);
  }
});
test("Saved furniture survives adding the new asset catalogue",()=>{
  const room=newRoom("Bagno",0);
  room.furniture=[{id:"old",type:"lavatrice",x:0,y:0,rotation:0},
    {id:"new",type:"wc",x:2,y:0,rotation:1}];
  const restored=reconcileHouse(["Bagno"],{version:1,rooms:[room]});
  assert.deepEqual(restored.rooms[0].furniture,room.furniture);
});
