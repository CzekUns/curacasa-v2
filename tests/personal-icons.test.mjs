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

test("User-created chores have 18 abstract and 24 cleaning-themed original illustrations", () => {
  assert.equal(personal.length, 42);
  assert.equal(new Set(personal).size, personal.length);
  assert.ok(personal.every((name) => name.startsWith("personale-")));
  assert.ok(personal.every((name) => !presetSection.includes(name)), "Personal keys must not duplicate preset keys");
  assert.ok(personal.every((name) => sprite.includes(`id="${name}"`)), "Sprite must include every option");
  assert.equal((sprite.match(/<symbol /g) || []).length, 42);
  const groups = [...section.matchAll(/group: "(Pulizie|Generiche)"/g)].map((m) => m[1]);
  assert.equal(groups.filter((group) => group === "Pulizie").length, 24);
  assert.equal(groups.filter((group) => group === "Generiche").length, 18);
  assert.equal(groups.length, personal.length);
  assert.ok(personal.every((name) => sprite.includes(`<symbol id="${name}" viewBox="0 0 96 96">`)));
  assert.ok(!/<script|foreignObject|onload=/i.test(sprite), "Never embed executable HTML or scripts in icon art");

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

test("Visual picker groups cleaning and generic symbols without hiding legacy task icons", () => {
  const picker = readFileSync(new URL("../src/components/PersonalIconPicker.tsx", import.meta.url), "utf8");
  const preview = readFileSync(new URL("../public/personal-icons/preview.html", import.meta.url), "utf8");
  assert.ok(picker.includes('["Pulizie", "Generiche"]'));
  assert.ok(picker.includes("icon.group === group"));
  assert.ok(picker.includes("choreIconOptions.find"));
  assert.equal((preview.match(/<article class="card">/g) || []).length, 42);
  assert.ok(preview.includes('A tema pulizie'));
  assert.ok(preview.includes('Simboli generici'));
  assert.ok(preview.includes("personale-tergivetro"));
});
