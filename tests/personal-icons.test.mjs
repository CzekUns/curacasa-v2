import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const icons = readFileSync(new URL("../src/lib/icons.tsx", import.meta.url), "utf8");
const sprite = readFileSync(new URL("../public/personal-icons/symbols.svg", import.meta.url), "utf8");
const picker = readFileSync(new URL("../src/components/PersonalIconPicker.tsx", import.meta.url), "utf8");
const preview = readFileSync(new URL("../public/personal-icons/preview.html", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");
const createPage = readFileSync(new URL("../src/routes/AddChore.tsx", import.meta.url), "utf8");
const editPage = readFileSync(new URL("../src/routes/Chores.tsx", import.meta.url), "utf8");

const options = icons.match(/export const personalIconOptions = \[([\s\S]*?)\] as const;/)?.[1] || "";
const personal = [...options.matchAll(/value: "(personale-[a-z-]+)"/g)].map((m) => m[1]);
const presetSection = icons.match(/export const choreIconImages = \{([\s\S]*?)\} as const;/)?.[1] || "";

test("42 personal IDs are stable, distinct from Store WebP artwork", () => {
  assert.equal(personal.length, 42);
  assert.equal(new Set(personal).size, 42);
  assert.ok(personal.every((id) => !presetSection.includes(id)));
  assert.equal((sprite.match(/<symbol id=/g) || []).length, 42);
  for (const id of personal) assert.ok(sprite.includes(`<symbol id="${id}" viewBox="0 0 96 96">`), id);
  assert.equal([...options.matchAll(/group: "Pulizie"/g)].length, 24);
  assert.equal([...options.matchAll(/group: "Generiche"/g)].length, 18);
});

test("SVGs are single-color currentColor drawings with NO baked-in background", () => {
  assert.ok(sprite.includes('fill="currentColor"'));
  assert.ok(sprite.includes('stroke="currentColor"'));
  assert.doesNotMatch(sprite, /#[a-fA-F0-9]{3,8}\b/);
  assert.doesNotMatch(sprite, /<rect[^>]*width="96"[^>]*height="96"/);
  assert.doesNotMatch(sprite, /<script|foreignObject|onload=/i);
  assert.ok(icons.includes("personal-icons/symbols.svg"));
  assert.ok(icons.includes("data-tone={tone}"));
  assert.ok(icons.includes("choreIconImages[name as PresetIconName]"));
});

test("Custom SVGs inherit the exact rose frame and dimensions of preset WebP tiles", () => {
  const outerIndex = styles.indexOf(".icon-tile {");
  const innerIndex = styles.indexOf(".chore-icon-personal {");
  assert.ok(outerIndex >= 0 && innerIndex >= 0);
  const outer = styles.slice(outerIndex, styles.indexOf("}", outerIndex));
  const inner = styles.slice(innerIndex, styles.indexOf("}", innerIndex));
  assert.ok(outer.includes("width: 48px") && outer.includes("height: 48px"),
    "Both kinds of chores share the same 48px container");
  assert.ok(outer.includes("border: 1px solid rgba(184, 135, 141, .7)"),
    "Both kinds of chores share the same pink 48px frame");
  assert.ok(outer.includes("background: var(--rose)"),
    "Both kinds of chores share the same rose-colored rim");
  assert.ok(!styles.includes(".icon-tile:has(> .chore-icon-personal)"),
    "Custom chores must not override the default WebP frame");
  assert.ok(inner.includes("background: #fff"), "The SVG has the same white inset as the preset image");
  assert.ok(inner.includes("border: 0"), "The SVG has no extra inner outline");
  assert.ok(inner.includes("border-radius: 13px"), "Inset has the same rounding as a WebP");
  assert.ok(styles.includes("width: 40px !important") && styles.includes("height: 40px !important"),
    "SVG and WebP render at the same inset size");
  for (const theme of ["classico", "cipria", "giada", "ghiaccio", "corallo"]) {
    const start = styles.lastIndexOf(`:root[data-theme="${theme}"]`);
    assert.ok(start >= 0, `Missing theme ${theme}`);
    const themeBlock = styles.slice(start, styles.indexOf("}", start));
    assert.ok(themeBlock.includes("--personal-rose:"));
    assert.ok(themeBlock.includes("--personal-sage:"));
    assert.ok(themeBlock.includes("--personal-accent:"));
  }
});

test("Aggiungi/Modifica preserve existing data and show compact emoji picker", () => {
  assert.ok(createPage.includes('placeholder="Inserisci un titolo"'));
  assert.ok(createPage.includes("useState<PersonalIconName>(defaultPersonalIcon)"));
  assert.ok(createPage.includes("<PersonalIconPicker"));
  assert.ok(editPage.includes("choreIconOptions.some"));
  assert.ok(editPage.includes("isPersonalIconName(icon)"));
  assert.ok(editPage.includes("<PersonalIconPicker"));
  assert.ok(!picker.includes("<span>{icon.label}</span>"));
  assert.ok(!picker.includes("icon.group === group"));
  assert.ok(picker.includes("aria-label={icon.label}"));
  assert.ok(picker.includes('event.key !== "Escape"'));
  assert.ok(picker.includes("pointerdown"));
  assert.ok(picker.includes("setOpen(false)"));
  assert.ok(styles.includes("grid-template-columns: repeat(6, minmax(0, 1fr))"));
  assert.ok(styles.includes("max-height: 220px"));
  assert.ok(styles.includes("width: min(264px, calc(100vw - 32px))"));
});

test("Standalone icon board shows 42 unlabeled SVGs and all five palette previews", () => {
  assert.equal((preview.match(/class="glyph-tile"/g) || []).length, 42);
  assert.ok(preview.includes('symbols.svg#personale-tergivetro'));
  assert.ok(!preview.includes("<strong>Scintilla</strong>"));
  assert.ok(!preview.includes("<small>Personale</small>"));
  for (const theme of ["classico", "cipria", "giada", "ghiaccio", "corallo"]) {
    assert.ok(preview.includes(`data-theme="${theme}"`));
  }
});


test("Only the inconsistent symbols use canonical Lucide geometry", () => {
  const corrected = [...sprite.matchAll(/<!-- Lucide: ([a-z0-9-]+) -->/g)].map((match) => match[1]);
  assert.equal(corrected.length, 21, "Replace only 21 awkward shapes, not the entire library");
  assert.equal(new Set(corrected).size, corrected.length);
  for (const name of ["spray-can", "brush-cleaning", "broom-sparkles", "soap-dispenser-droplet", "recycle", "refresh-cw"]) {
    assert.ok(corrected.includes(name), `Expected Lucide glyph: ${name}`);
  }
  const untouched = ["scintilla", "stella", "cuore", "goccia", "spugna", "panno", "secchiello"];
  for (const id of untouched) {
    const match = sprite.match(new RegExp(`<symbol id="personale-${id}"[\\s\\S]*?<\\/symbol>`));
    assert.ok(match, `Missing original glyph: ${id}`);
    assert.ok(!match[0].includes("<!-- Lucide:"), `Do not replace the already-good glyph: ${id}`);
  }
  const license = readFileSync(new URL("../public/personal-icons/LUCIDE_LICENSE.txt", import.meta.url), "utf8");
  assert.ok(license.includes("Lucide Icons and Contributors"));
  assert.ok(license.includes("Cole Bemis"));
});

test("The compact personal icon picker keeps its unobtrusive style", () => {
  assert.ok(styles.includes(".personal-icon-picker__trigger .chore-icon-personal,"));
  assert.ok(styles.includes(".personal-icon-picker__choice .chore-icon-personal"));
  assert.ok(styles.includes("grid-template-columns: repeat(6, minmax(0, 1fr))"));
});
