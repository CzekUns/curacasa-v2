import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/icons.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");
const maintenance = readFileSync(new URL("../public/chore-icons/badges/manutenzione.svg", import.meta.url), "utf8");
const salt = readFileSync(new URL("../public/chore-icons/badges/sale.svg", import.meta.url), "utf8");

test("four equipment chores use dedicated standalone action SVGs, with no catalog or ID changes", () => {
  const names = [
    "lavastoviglie-manutenzione", "lavastoviglie-sale",
    "addolcitore-manutenzione", "addolcitore-sale",
  ];
  const mapping = src.split("const EQUIPMENT_OPERATION_BADGES:")[1].split("};")[0];
  for (const name of names) assert.ok(mapping.includes(`"${name}"`), name);
  assert.equal((mapping.match(/": "(?:manutenzione|sale)"/g) || []).length, 4);
  assert.ok(src.includes("chore-icon-with-operation"));
  assert.ok(src.includes("chore-operation-badge"));
  assert.ok(src.includes('equipment-pictograms-removed-v1'));
  assert.ok(css.includes("position: absolute"));
  assert.ok(css.includes(".chore-icon-with-operation > .chore-operation-badge"));
});

test("maintenance and salt vector badges contain distinct pictograms", () => {
  for (const svg of [maintenance, salt]) {
    assert.match(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /viewBox="0 0 48 48"/);
    assert.match(svg, /<circle /);
    assert.match(svg, /<path /);
    assert.doesNotMatch(svg, /<script|foreignObject|onload=/i);
  }
  assert.notEqual(maintenance, salt);
  assert.match(maintenance, /aria-label="Manutenzione"/);
  assert.match(salt, /aria-label="Caricamento sale"/);
});
