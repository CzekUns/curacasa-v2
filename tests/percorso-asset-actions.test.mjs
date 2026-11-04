import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FURNITURE } from "../src/lib/percorso.ts";
import { PRESET_ASSET_IDS } from "../src/lib/percorso-asset-catalog.ts";
import {
  PHYSICAL_ASSET_ALIASES, physicalAssetId, chorePresetIcon,
  presetActionsForAsset, actionsForAsset,
} from "../src/lib/percorso-asset-actions.ts";
import { importPresets, addLog, hasCompletedToday } from "../src/lib/store.ts";

const storeFile=JSON.parse(readFileSync(new URL("../public/chore-packs.json",import.meta.url),"utf8"));
const templates=storeFile.packs.flatMap(pack=>pack.chores);
const byIcon=new Map(templates.map(chore=>[chore.icon,chore]));
const data=()=>({rooms:["Cucina","Bagno","Salone","Camera","Balcone"],chores:[],logs:[]});
const installed=(icon,override={})=>({
  ...byIcon.get(icon),id:"chore_"+icon,presetKey:"original::"+icon,
  createdAt:"2026-01-01T00:00:00.000Z",updatedAt:"2026-01-01T00:00:00.000Z",
  ...override,
});

test("all 67 Shop presets resolve to a real physical 3D object and an action",()=>{
  assert.equal(templates.length,67);
  const ids=new Set(FURNITURE.map(part=>part.id));
  for(const preset of templates){
    const asset=physicalAssetId(PRESET_ASSET_IDS[preset.icon]);
    assert.ok(ids.has(asset),preset.icon+" missing 3D object");
    assert.ok(presetActionsForAsset(asset).some(action=>action.icon===preset.icon),
      preset.icon+" missing linked action");
  }
});

test("one addolcitore includes salt refill AND maintenance, also for old saved IDs",()=>{
  const expected=["addolcitore-manutenzione","addolcitore-sale"];
  assert.deepEqual(presetActionsForAsset("addolcitore-manutenzione").map(a=>a.icon),expected);
  assert.deepEqual(presetActionsForAsset("addolcitore-sale").map(a=>a.icon),expected);
  const actions=actionsForAsset("addolcitore-manutenzione",data(),"Bagno",templates);
  assert.deepEqual(actions.map(a=>a.icon),expected);
  assert.ok(actions.every(a=>a.preset&&!a.chore));
  assert.match(actions[0].title,/Manutenzione/i);
  assert.match(actions[1].title,/sale/i);
});

test("dishwasher, hood, air conditioning and sink group tasks on a single item",()=>{
  const groups=[
    ["lavastoviglie-manutenzione",["lavastoviglie-manutenzione","lavastoviglie-sale"]],
    ["cappa",["cappa","filtro-cappa"]],
    ["condizionatore",["condizionatore","filtro-condizionatore"]],
    ["lavandino",["lavandino","sifone-lavandino"]],
  ];
  for(const [asset,icons] of groups){
    assert.deepEqual(new Set(presetActionsForAsset(asset).map(a=>a.icon)),new Set(icons));
  }
  assert.equal(Object.keys(PHYSICAL_ASSET_ALIASES).length,5);
  // Still distinguish an actual box shower from the shower head, and the mop
  // from a tile representing the floor.
  assert.notEqual(physicalAssetId("doccia"),physicalAssetId("box-doccia"));
  assert.notEqual(physicalAssetId("pavimento"),physicalAssetId("mocio-secchio"));
});

test("existing chores show their personal titles and no duplicate add prompts",()=>{
  const house=data();
  house.chores=[installed("addolcitore-sale",{title:"Riempire sale fino alla tacca"})];
  const actions=actionsForAsset("addolcitore-manutenzione",house,"Bagno",templates);
  assert.equal(actions.length,2);
  assert.equal(actions[0].icon,"addolcitore-sale");
  assert.equal(actions[0].title,"Riempire sale fino alla tacca");
  assert.equal(actions[0].chore.id,"chore_addolcitore-sale");
  assert.equal(actions[1].icon,"addolcitore-manutenzione");
  assert.equal(actions[1].chore,null);
});

test("edited preset icons remain linked by persistent presetKey",()=>{
  const house=data();
  house.chores=[installed("addolcitore-sale",{icon:"custom-neutral",title:"Sale blu"})];
  const actions=actionsForAsset("addolcitore-manutenzione",house,"Salone",templates);
  assert.equal(chorePresetIcon(house.chores[0]),"addolcitore-sale");
  assert.ok(actions.some(a=>a.chore?.title==="Sale blu"));
});

test("ineligible room rules are never bypassed or added twice",()=>{
  const house=data();
  let actions=actionsForAsset("lavastoviglie-manutenzione",house,"Bagno",templates);
  assert.deepEqual(actions,[]);
  house.chores=[installed("lavastoviglie-manutenzione")];
  actions=actionsForAsset("lavastoviglie-manutenzione",house,"Cucina",templates);
  assert.deepEqual(actions.map(a=>a.icon),["lavastoviglie-manutenzione","lavastoviglie-sale"]);
  actions=actionsForAsset("lavastoviglie-manutenzione",house,"Bagno",templates);
  assert.deepEqual(actions,[]);
});

test("import and complete through the 3D action use CuraCasa's ordinary log and wallet",()=>{
  const original=data();
  const result=importPresets(original,[byIcon.get("addolcitore-sale")]);
  assert.equal(result.added,1);
  const chore=result.data.chores[0];
  assert.equal(chore.icon,"addolcitore-sale");
  const first=addLog(result.data,chore.id,{rooms:["Bagno"]});
  assert.equal(first.logs.length,1);
  assert.equal(first.logs[0].rooms[0],"Bagno");
  assert.equal(first.wallet.balance,1);
  assert.equal(first.wallet.lifetimeEarned,1);
  assert.equal(hasCompletedToday(first,chore.id),true);
  assert.strictEqual(addLog(first,chore.id,{rooms:["Bagno"]}),first,
    "no double logging or double reward for repeat taps");
});

test("unmapped decorative furniture does not accidentally claim unrelated chores",()=>{
  const house=data();
  house.chores=[installed("addolcitore-sale")];
  assert.deepEqual(actionsForAsset("poltrona",house,"Bagno",templates),[]);
});
