import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { THEMES } from "../src/lib/theme.ts";

const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");
const match = css.match(/:root\[data-theme="classico"\]\s*\{([^}]+)\}/);
assert.ok(match, "Original Classico palette must be present");
const block = match[1];

function value(name) {
  const found = block.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
  assert.ok(found, `Missing --${name} in Classic`);
  return found[1].trim();
}

const ORIGINAL_CSS = {
  ink: "#1a1a1a",
  muted: "rgba(26, 26, 26, .58)",
  soft: "rgba(26, 26, 26, .08)",
  silk: "#faf7f2",
  paper: "#fffdf9",
  dust: "#e6eeed",
  rose: "#b8878d",
  "rose-deep": "#8f5960",
  "rose-soft": "#ead2d5",
  sage: "#8d9684",
  frame: "#171718",
  champagne: "#5d5124",
  shadow: "0 22px 46px -30px rgba(26, 26, 26, .42)",
};

test("Classico contains the exact original CuraCasa CSS tokens", () => {
  for (const [name, original] of Object.entries(ORIGINAL_CSS)) {
    assert.equal(value(name), original, `--${name} differs from the original source`);
  }
});

test("Classico uses original colors without changing gradient layout", () => {
  assert.equal(value("page-base"), ORIGINAL_CSS.dust);
  assert.equal(
    value("app-backdrop"),
    "linear-gradient(140deg, #e6eeed 0%, #ead2d5 57%, #faf7f2 100%)",
  );
  assert.match(value("app-surface"), /^linear-gradient\(145deg,/);
  assert.match(value("app-surface-soft"), /^linear-gradient\(140deg,/);
  assert.equal(value("nav-surface"), ORIGINAL_CSS.frame);
  assert.equal(value("nav-muted"), "rgba(255, 253, 249, .52)");
  assert.equal(value("theme-cta"), ORIGINAL_CSS.rose);
  assert.equal(value("theme-cta-hover"), ORIGINAL_CSS["rose-deep"]);
  assert.equal(value("theme-finish"), ORIGINAL_CSS.sage);
});

test("Classico Store preview uses the original four highlight colors", () => {
  const classic = THEMES.find((theme) => theme.id === "classico");
  assert.ok(classic);
  assert.deepEqual(classic.colors, ["#e6eeed", "#ead2d5", "#faf7f2", "#b8878d"]);
});

test("The other four themes and their gradient directions still exist", () => {
  const otherThemes = ["cipria", "giada", "ghiaccio", "corallo"];
  for (const id of otherThemes) {
    assert.ok(THEMES.some((theme) => theme.id === id));
    const palette = css.match(new RegExp(`:root\\[data-theme="${id}"\\] \\{([^}]+)\\}`));
    assert.ok(palette, `Missing theme ${id}`);
    assert.match(palette[1], /--app-backdrop: linear-gradient\(140deg,/);
  }
});
