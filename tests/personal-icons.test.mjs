import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const icons = readFileSync(new URL("../src/lib/icons.tsx", import.meta.url), "utf8");
const sprite = readFileSync(new URL("../public/personal-icons/symbols.svg", import.meta.url), "utf8");
const createPage = readFileSync(new URL("../src/routes/AddChore.tsx", import.meta.url), "utf8");
const editPage = readFileSync(new URL("../src/routes/Chores.tsx", import.meta.url), "utf8");

const section = icons.match(/export const personalIconOptions = \[([\s\S]*?)\] as const;/)?.[1] || "";
const personal = [...section.matchAll(/value: "(personale-[a-z-]+)"/g)].map((m) => m[1]);
const presetSection = icons.match(/export const choreIconImages = \{([\s\S]*?)\} as const;/)?.[1] || "";

test("User-created chores have a dedicated set of 18 neutral illustrations", () => {
  assert.equal(personal.length, 18);
  assert.equal(new Set(personal).size, personal.length);
  assert.ok(personal.every((name) => name.startsWith("personale-")));
  assert.ok(personal.every((name) => !presetSection.includes(name)), "Personal keys must not duplicate preset keys");
  assert.ok(personal.every((name) => sprite.includes(`id="${name}"`)), "Sprite must include every option");
  assert.equal((sprite.match(/<symbol /g) || []).length, 18);
});

test("New chores suggest a neutral title and default to a personal symbol", () => {
  assert.ok(createPage.includes('placeholder="Inserisci un titolo"'));
  assert.ok(createPage.includes("useState<PersonalIconName>(defaultPersonalIcon)"));
  assert.ok(createPage.includes("<PersonalIconPicker"));
  assert.ok(!createPage.includes("choreIconOptions.map"));
  assert.ok(!createPage.includes('placeholder="Pulizia filtri condizionatore"'));
});

test("Editing preserves existing icons and offers neutral alternatives", () => {
  assert.ok(editPage.includes("choreIconOptions.some"));
  assert.ok(editPage.includes("isPersonalIconName(icon)"));
  assert.ok(editPage.includes("<PersonalIconPicker"));
  assert.ok(!editPage.includes("choreIconOptions.map"));
});

test("Single SVG sprite powers user icons while Store images remain unchanged", () => {
  assert.ok(icons.includes("personal-icons/symbols.svg"));
  assert.ok(icons.includes("choreIconImages[name as PresetIconName]"));
  assert.ok(sprite.includes('xmlns="http://www.w3.org/2000/svg"'));
});
