import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getTheme, setTheme, applyTheme, THEMES } from "../src/lib/theme.ts";

const data = new Map();
globalThis.localStorage = {
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, String(value)),
};
globalThis.document = { documentElement: { dataset: {} } };
const events = [];
globalThis.window = { dispatchEvent: (event) => { events.push(event); return true; } };
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options) { this.type = type; this.detail = options?.detail; }
};

const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");

test("All five CuraCasa themes have stable, unique IDs", () => {
  assert.deepEqual(THEMES.map((theme) => theme.id),
    ["classico", "cipria", "giada", "ghiaccio", "corallo"]);
  for (const theme of THEMES) {
    assert.equal(theme.colors.length, 4);
    assert.ok(theme.colors.every((color) => /^#[0-9a-fA-F]{6}$/.test(color)));
  }
});

test("Pinterest 2026 original hues appear in the derived palettes", () => {
  const themes = Object.fromEntries(THEMES.map((theme) => [theme.id, theme]));
  assert.ok(themes.giada.colors.includes("#aeb8a0"));
  assert.ok(themes.ghiaccio.colors.includes("#d7efff"));
  assert.ok(themes.corallo.colors.includes("#ff5c34"));
  for (const name of ["giada", "ghiaccio", "corallo"]) {
    assert.equal(themes[name].inspiration, "Pinterest Palette 2026");
  }
});

test("Theme selection persists and does not modify the stored chores", () => {
  data.clear();
  data.set("curacasa_v2_data", '{"chores":[{"id":"must-not-change"}]}');
  assert.equal(getTheme(), "classico");
  for (const theme of THEMES) {
    setTheme(theme.id);
    assert.equal(getTheme(), theme.id);
    assert.equal(document.documentElement.dataset.theme, theme.id);
    assert.equal(data.get("curacasa_v2_data"), '{"chores":[{"id":"must-not-change"}]}');
    assert.equal(events.at(-1).detail, theme.id);
  }
  data.set("curacasa_v2_theme", "theme-not-supported");
  assert.equal(getTheme(), "classico");
  applyTheme("cipria");
  assert.equal(document.documentElement.dataset.theme, "cipria");
});

const linear = (hex) => {
  const a = hex.slice(1).match(/.{2}/g).map((v) => parseInt(v, 16) / 255);
  const c = a.map((v) => v <= 0.04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
};
const contrast = (fg, bg) => {
  const a = linear(fg), b = linear(bg);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
};

for (const [id, expected] of Object.entries({
  giada: "#446752",
  ghiaccio: "#315f7a",
  corallo: "#ad4128",
})) {
  test(`Theme ${id} keeps gradient layout and has readable CTA`, () => {
    const declaration = css.match(new RegExp(`:root\\[data-theme="${id}"\\] \\{([\\s\\S]*?)\\n\\}`));
    assert.ok(declaration, `CSS palette ${id} should exist`);
    const rule = declaration[1];
    assert.match(rule, /--app-backdrop: linear-gradient\(140deg, #[a-f0-9]{6} 0%, #[a-f0-9]{6} 57%, #[a-f0-9]{6} 100%\)/i);
    assert.match(rule, /--app-surface: linear-gradient\(145deg,/);
    assert.match(rule, /--app-surface-soft: linear-gradient\(140deg,/);
    assert.ok(rule.includes(`--theme-cta: ${expected}`));
    assert.ok(contrast("#ffffff", expected) >= 4.5, `${id} white CTA text contrast too weak`);
  });
}
