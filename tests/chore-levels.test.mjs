import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CHORE_LEVEL_LABELS, classifyChoreLevel, presetIdentity, updatedVacuumPresetTitle } from "../src/lib/chore-levels.ts";
import { createDefaultData, importPresets, loadData, saveData } from "../src/lib/store.ts";

const catalog = JSON.parse(readFileSync(new URL("../public/chore-packs.json", import.meta.url), "utf8"));
const presets = catalog.packs.flatMap((pack) => pack.chores);
const get = (icon) => presets.find((chore) => chore.icon === icon);
const pairs = [
  ["mocio-secchio", "Mocio e secchio", "Lavare pavimento 2"],
  ["finestra-tende", "Pulire finestra", "Pulire vetri 2"],
  ["tapparella-grande", "Pulire tapparella grande", "Pulire tapparelle 2"],
  ["doccia", "Pulire doccia", "Pulire soffione doccia"],
  ["biancheria-letto", "Biancheria letto", "Lavare biancheria da letto"],
];

test("Store offers exactly 67 separately selectable pills in BASE PRO SUPER SPECIALE", () => {
  assert.equal(presets.length, 67);
  const counts = { base: 0, pro: 0, super: 0, speciale: 0 };
  const unique = new Set();
  for (const chore of presets) {
    assert.ok(Object.hasOwn(counts, chore.level), chore.title);
    assert.equal(classifyChoreLevel(chore), chore.level, chore.title);
    assert.ok(!unique.has(presetIdentity(chore)), chore.title);
    unique.add(presetIdentity(chore));
    counts[chore.level]++;
  }
  assert.deepEqual(counts, { base: 29, pro: 23, super: 10, speciale: 5 });
  assert.deepEqual(Object.keys(CHORE_LEVEL_LABELS), ["base", "pro", "super", "speciale", "tua"]);
});

test("Store collections are grouped by category with the agreed 12 BASE essentials first", () => {
  const packs = catalog.packs;
  const essentialIcons = [
    "casa", "scopa-elettrica", "scopa", "pavimento", "spolverino", "pattumiera",
    "piante", "bagno", "cucina", "letto", "soggiorno", "balcone",
  ];
  assert.equal(packs[0].id, "base-essenziali");
  assert.equal(packs[0].title, "Le 12 essenziali");
  assert.equal(packs[0].category, "base");
  assert.deepEqual(packs[0].chores.map((chore) => chore.icon), essentialIcons);
  assert.equal(packs[0].chores.length, 12);
  assert.deepEqual([...new Set(packs.map((pack) => pack.category))], ["base", "pro", "super", "speciale"]);
  assert.deepEqual(packs.map((pack) => pack.chores.length), [12, 7, 10, 7, 5, 6, 5, 6, 4, 5]);
  const unique = new Set();
  for (const pack of packs) {
    assert.ok(pack.chores.length > 0, pack.id);
    for (const chore of pack.chores) {
      assert.equal(chore.level, pack.category, chore.title);
      assert.ok(!unique.has(chore.icon), chore.title);
      unique.add(chore.icon);
    }
  }
  assert.equal(unique.size, 67);
});

test("Legacy names keep their Store identity after renamed icon variants", () => {
  for (const [icon, oldTitle, newTitle] of pairs) {
    const preset = get(icon);
    assert.equal(preset.title, newTitle);
    assert.equal(presetIdentity(preset), presetIdentity({ title: oldTitle, icon }));
    const saved = { ...preset, title: oldTitle, id: "legacy:" + icon };
    const existing = { ...createDefaultData(), chores: [saved] };
    assert.equal(importPresets(existing, [preset]).added, 0, icon);
  }
  // Two different images of the same action are still two independent Store pills.
  const two = importPresets(createDefaultData(), [get("pavimento"), get("mocio-secchio")]);
  assert.equal(two.added, 2);
  assert.notEqual(two.data.chores[0].presetKey, two.data.chores[1].presetKey);
  assert.equal(importPresets(two.data, [get("pavimento"), get("mocio-secchio")]).added, 0);
});

test("Existing Store-specials convert from their older levels without touching TUA chores", () => {
  const specialIcons = ["dyson", "dyson-accessori", "folletto", "aspirapolvere", "robot-aspirapolvere"];
  for (const icon of specialIcons) {
    const preset = get(icon);
    assert.equal(preset.level, "speciale");
    assert.equal(classifyChoreLevel({ ...preset, level: "base" }), "speciale");
    assert.equal(classifyChoreLevel({ ...preset, level: "pro" }), "speciale");
    assert.equal(classifyChoreLevel({ ...preset, level: "super" }), "speciale");
    assert.equal(classifyChoreLevel({ ...preset, level: "pro", title: "Rinominata", presetKey: presetIdentity(preset) }), "speciale");
    assert.equal(classifyChoreLevel({ ...preset, level: "tua" }), "tua");
    assert.equal(classifyChoreLevel({ ...preset, level: undefined, title: "Mia macchina" }), "tua");
  }
});

test("An old simoneapps backup is normalized without deleting logs or renaming the user's rooms", () => {
  const raw = {
    rooms: ["Bagno", "Soggiorno", "Bagno di servizio", "Studio privato"],
    chores: [
      { id: "one", title: "Passare Dyson", icon: "dyson", type: "ordinaria", room: "Soggiorno",
        frequency: 7, estimatedMinutes: 12, description: "", notes: "", createdAt: "2026-01-01T12:00:00.000Z", updatedAt: "2026-01-01T12:00:00.000Z" },
      { id: "two", title: "Mia faccenda", icon: "home", type: "ordinaria", room: "Bagno di servizio",
        frequency: 7, estimatedMinutes: 5, description: "", notes: "", createdAt: "2026-01-01T12:00:00.000Z", updatedAt: "2026-01-01T12:00:00.000Z" },
    ],
    logs: [
      { id: "log1", choreId: "one", completedAt: "2026-01-02T12:00:00.000Z", durationMinutes: 12, note: "Ok", rooms: ["Soggiorno"] },
      { id: "log2", choreId: "one", completedAt: "2026-01-02T19:00:00.000Z", durationMinutes: 7, note: "Seconda volta", rooms: [] },
    ],
  };
  const storage = new Map([["curacasa_v2_data", JSON.stringify(raw)]]);
  const old = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  };
  try {
    const loaded = loadData();
    assert.deepEqual(loaded.rooms, raw.rooms);
    assert.equal(loaded.roomDetails.Soggiorno.kind, "salone");
    assert.equal(loaded.roomDetails["Studio privato"].kind, "altro");
    assert.deepEqual(loaded.chores.map(c => c.id), ["one", "two"]);
    assert.equal(loaded.chores[0].level, "speciale");
    assert.equal(loaded.chores[1].level, "tua");
    assert.equal(loaded.chores[1].icon, "casa");
    assert.deepEqual(loaded.chores[1].roomRule, { mode: "specific", names: ["Bagno di servizio"] });
    assert.equal(loaded.logs.length, 2);
    assert.deepEqual(loaded.logs[1], raw.logs[1]);
    saveData(loaded);
    assert.equal(loadData().logs.length, 2);
  } finally {
    globalThis.localStorage = old;
  }
});

test("Aspirapolvere vintage and modern use different icons and retain their legacy Store identities", () => {
  const vintage = get("aspirapolvere");
  const current = get("scopa-elettrica");
  assert.equal(vintage.title, "Aspirapolvere vintage");
  assert.equal(vintage.level, "speciale");
  assert.equal(current.title, "Aspirapolvere");
  assert.equal(current.level, "base");
  assert.equal(presetIdentity(vintage), "aspirapolvere::aspirapolvere");
  assert.equal(presetIdentity(current), "passare scopa elettrica::scopa-elettrica");
  assert.equal(classifyChoreLevel({ title:"Aspirapolvere",icon:"aspirapolvere",level:"base" }), "speciale");
  assert.equal(classifyChoreLevel({ title:"Passare scopa elettrica",icon:"scopa-elettrica",level:"speciale" }), "base");
  assert.equal(classifyChoreLevel({ ...current, level:"speciale" }), "base");
  assert.equal(classifyChoreLevel({ title:"La mia macchina",icon:"aspirapolvere",level:"tua" }), "tua");
  assert.equal(updatedVacuumPresetTitle({ title:"Aspirapolvere",icon:"aspirapolvere",level:"base" }), "Aspirapolvere vintage");
  assert.equal(updatedVacuumPresetTitle({ title:"Passare scopa elettrica",icon:"scopa-elettrica",level:"speciale" }), "Aspirapolvere");
  assert.equal(updatedVacuumPresetTitle({ title:"Modello mio",icon:"aspirapolvere",level:"base" }), "Modello mio");
  const existing = { ...createDefaultData(), chores: [
    { ...vintage, title:"Aspirapolvere", id:"old-vintage" },
    { ...current, title:"Passare scopa elettrica", id:"old-modern" },
  ] };
  assert.equal(importPresets(existing, [vintage,current]).added, 0);
});

test("Legacy vacuum chores migrate in local storage without losing IDs, room rules or logs", () => {
  const oldStorage = globalThis.localStorage;
  const raw = createDefaultData();
  raw.chores = [
    { ...get("aspirapolvere"), id:"old-vintage",title:"Aspirapolvere",level:"base",
      notes:"Non cambiare",createdAt:"2026-01-01T12:00:00.000Z",updatedAt:"2026-01-01T12:00:00.000Z" },
    { ...get("scopa-elettrica"), id:"old-modern",title:"Passare scopa elettrica",level:"speciale",
      notes:"Due stanze",createdAt:"2026-01-01T12:00:00.000Z",updatedAt:"2026-01-01T12:00:00.000Z" },
    { ...get("aspirapolvere"), id:"personal",title:"Il mio aspirapolvere",level:"tua",
      notes:"Personalizzato",createdAt:"2026-01-01T12:00:00.000Z",updatedAt:"2026-01-01T12:00:00.000Z" },
  ];
  raw.logs = [{ id:"test-log",choreId:"old-modern",completedAt:"2026-10-20T12:00:00.000Z",
    durationMinutes:14,note:"Conservare",rooms:["Cucina","Bagno"] }];
  const memory = new Map([["curacasa_v2_data",JSON.stringify(raw)]]);
  globalThis.localStorage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key,value) => memory.set(key,String(value)),
  };
  try {
    const loaded = loadData();
    assert.deepEqual(loaded.chores.map(x=>x.id),["old-vintage","old-modern","personal"]);
    assert.deepEqual(loaded.chores.map(x=>x.title),["Aspirapolvere vintage","Aspirapolvere","Il mio aspirapolvere"]);
    assert.deepEqual(loaded.chores.map(x=>x.level),["speciale","base","tua"]);
    assert.equal(loaded.chores[0].notes,"Non cambiare");
    assert.equal(loaded.chores[1].frequency,raw.chores[1].frequency);
    assert.deepEqual(loaded.logs,raw.logs);
  } finally {
    globalThis.localStorage=oldStorage;
  }
});
