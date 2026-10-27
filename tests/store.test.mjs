import test from "node:test";
import assert from "node:assert/strict";
import { addLog, createDefaultData, hasCompletedOnDay, hasCompletedToday, importPresets, loadData, presetSignature, saveData } from "../src/lib/store.ts";

const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
};

const activity = (title, icon) => ({
  title, icon, type: "ordinaria", room: "Tutta casa",
  frequency: 7, estimatedMinutes: 15, description: "", notes: "",
});

test("Store: single preset cannot be imported twice, even after title edited", () => {
  const first = importPresets(createDefaultData(), [activity("Pulire bagno", "bagno")]);
  assert.equal(first.added, 1);
  const again = importPresets(first.data, [activity("Pulire bagno", "bagno")]);
  assert.equal(again.added, 0);
  assert.equal(again.data, first.data);
  assert.equal(first.data.chores.length, 1);

  const edited = {
    ...first.data,
    chores: [{ ...first.data.chores[0], title: "Bagno principale" }],
  };
  assert.equal(importPresets(edited, [activity("Pulire bagno", "bagno")]).added, 0);
});

test("Store: importing an overlapping collection adds only missing presets", () => {
  const one = activity("Aspirapolvere", "aspirapolvere");
  const two = activity("Spolverare", "spolverino");
  const partial = importPresets(createDefaultData(), [one]);
  const full = importPresets(partial.data, [one, two, one]);
  assert.equal(full.added, 1);
  assert.equal(full.data.chores.length, 2);
  assert.equal(importPresets(full.data, [one, two]).added, 0);
});

test("Store: old imported chores with no presetKey remain recognized", () => {
  const chore = { ...activity("  Pulire    vasca  ", "vasca"),
    id: "legacy", createdAt: "", updatedAt: "" };
  const data = { rooms: [], chores: [chore], logs: [] };
  assert.equal(presetSignature(chore), presetSignature(activity("pulire vasca", "vasca")));
  assert.equal(importPresets(data, [activity("pulire vasca", "vasca")]).added, 0);
});

test("Store: data is never silently deleted when preset title equals a legacy default", () => {
  memory.clear();
  const single = importPresets(createDefaultData(), [activity("Aspirapolvere", "aspirapolvere")]);
  saveData(single.data);
  const stored = loadData();
  assert.equal(stored.chores.length, 1);
  assert.equal(stored.chores[0].title, "Aspirapolvere");
});

test("Logs: same chore one completion per calendar day across quick clicks and Calendar", () => {
  const first = importPresets(createDefaultData(), [activity("Pulire bagno", "bagno")]);
  const id = first.data.chores[0].id;
  const today = new Date();
  const done = addLog(first.data, id);
  assert.equal(done.logs.length, 1);
  assert.equal(hasCompletedToday(done, id), true);
  assert.equal(addLog(done, id), done);

  const key = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  assert.equal(addLog(done, id, { completedAt: key + "T12:00:00" }), done);
  assert.equal(hasCompletedOnDay(done, id, key), true);

  const historical = addLog(done, id, { completedAt: "2025-06-20T12:00:00" });
  assert.equal(historical.logs.length, 2);
  assert.equal(addLog(historical, id, { completedAt: "2025-06-20T19:00:00" }), historical);
  assert.equal(addLog(historical, "unknown-id"), historical);
});
