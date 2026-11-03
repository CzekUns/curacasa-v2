import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { THEMES } from "../src/lib/theme.ts";
import { readSceneTheme } from "../src/components/percorso/three-room-model.ts";

const css=readFileSync(new URL("../src/routes/percorso3d.css",import.meta.url),"utf8");
const globalCss=readFileSync(new URL("../src/styles/global.css",import.meta.url),"utf8");

test("all five CuraCasa themes define shared visual tokens",()=>{
  assert.deepEqual(THEMES.map(t=>t.id),
    ["classico","cipria","giada","ghiaccio","corallo"]);
  for (const theme of THEMES)
    assert.ok(globalCss.includes(':root[data-theme="'+theme.id+'"]'),theme.id);
  for(const token of ["--theme-cta","--theme-cta-hover","--theme-focus",
    "--theme-finish","--theme-finish-light","--app-backdrop","--app-surface"])
    assert.ok(globalCss.includes(token+":"),token);
});

test("La mia Casa uses the global backdrop, surfaces, accents and dock colors",()=>{
  for(const token of ["--app-backdrop","--app-surface","--nav-surface",
    "--nav-muted","--theme-cta","--theme-cta-hover","--theme-focus",
    "--theme-finish","--theme-finish-light","--rose-soft","--paper"])
    assert.ok(css.includes("var("+token+")"),token+" must be used");
  assert.doesNotMatch(css,/#[0-9a-fA-F]{3,8}\b/,
    "3D UI must not introduce another fixed color palette");
  assert.match(css,/\.game3d-tabs button\.active\s*\{[^}]*--theme-cta/s);
  assert.match(css,/\.game3d-stage\s*\{[^}]*--app-backdrop/s);
});

test("3D scene colors read the currently applied theme",()=>{
  const prevDoc=globalThis.document,prevGet=globalThis.getComputedStyle;
  try {
    globalThis.document={documentElement:{}};
    for (const theme of THEMES) {
      const accent=theme.colors[3];
      const tokens={
        "--theme-cta":accent,
        "--theme-finish":theme.colors[3],
        "--rose-soft":theme.colors[1],
        "--paper":theme.colors[2],
      };
      globalThis.getComputedStyle=()=>({
        getPropertyValue:(key)=>tokens[key]??"",
      });
      const colors=readSceneTheme();
      assert.equal(colors.accent,accent,theme.id);
      assert.equal(colors.soft,theme.colors[1],theme.id);
      assert.equal(colors.paper,theme.colors[2],theme.id);
    }
  } finally {
    if(prevDoc===undefined)delete globalThis.document;
    else globalThis.document=prevDoc;
    if(prevGet===undefined)delete globalThis.getComputedStyle;
    else globalThis.getComputedStyle=prevGet;
  }
});
