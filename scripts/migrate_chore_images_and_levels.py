#!/usr/bin/env python3
"""One-time, atomic CuraCasa chore WebP + level-label migration.

Executed by a GitHub Actions workflow. No brand / favicon assets are touched.
All source images remain recoverable through Git history.
"""
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "public/chore-icons"
PACKS = ROOT / "public/chore-packs.json"
BASE = set("""casa aspirapolvere scopa pavimento mocio-secchio paletta spolverino
pattumiera piante bagno doccia vasca wc lavandino asciugamani cucina tavolo
macchina-caffe letto biancheria-letto cuscini lavatrice tappeto soggiorno divano
specchio mensole maniglie balcone folletto scopa-elettrica robot-aspirapolvere""".split())
SUPER = set("""sifone-lavandino tubi-esterni addolcitore-manutenzione addolcitore-sale
filtro-cappa pareti zanzariera dyson-accessori mobiletti-esterni
tapparella-grande filtro-condizionatore""".split())

def replace_once(path, old, new):
    file = ROOT / path
    content = file.read_text(encoding="utf-8")
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old[:65]!r}")
    file.write_text(content.replace(old, new), encoding="utf-8")

data = json.loads(PACKS.read_text(encoding="utf-8"))
chores = [chore for pack in data["packs"] for chore in pack["chores"]]
assert len(chores) == 67, f"Unexpected number of preset chores: {len(chores)}"
assert len({(c["title"],c["icon"]) for c in chores}) == 67
assert len({c["icon"] for c in chores}) == 67
assert BASE.isdisjoint(SUPER)
assert BASE | SUPER <= {c["icon"] for c in chores}
for chore in chores:
    chore["level"] = "base" if chore["icon"] in BASE else "super" if chore["icon"] in SUPER else "pro"
PACKS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

entries = []
for chore in chores:
    signature = f'{chore["title"].casefold()}::{chore["icon"].casefold()}'
    entries.append(f"  {json.dumps(signature, ensure_ascii=False)}: {json.dumps(chore['level'])},")
level_ts = """/**
 * CuraCasa cleaning depth: independent from ordinary/extraordinary cadence.
 * The original 67 Store presets are classified by their exact title + icon;
 * an existing manually created task is TUA even if it uses a preset icon.
 */
export type ChoreLevel = "base" | "pro" | "super" | "tua";
const PRESET_LEVELS: Record<string, Exclude<ChoreLevel, "tua">> = {
""" + "\n".join(entries) + """
};
const normalize = (value: string) =>
  value.normalize("NFKC").trim().replace(/\\s+/g, " ").toLocaleLowerCase("it-IT");

export function classifyChoreLevel(chore: {
  title: string;
  icon: string;
  level?: string;
  presetKey?: string;
}): ChoreLevel {
  if (chore.level === "base" || chore.level === "pro" ||
      chore.level === "super" || chore.level === "tua") {
    return chore.level;
  }
  // Preserve the Store identity when the owner edits the task's title.
  const currentSignature = normalize(chore.title) + "::" + normalize(chore.icon);
  return PRESET_LEVELS[chore.presetKey || ""] ??
    PRESET_LEVELS[currentSignature] ?? "tua";
}
"""
(ROOT / "src/lib/chore-levels.ts").write_text(level_ts, encoding="utf-8")

component = """import { Check, Crown, Pencil, Sparkles } from "lucide-react";
import type { ChoreLevel } from "../lib/chore-levels";

const LABELS = {
  base: { text: "BASE", icon: Check },
  pro: { text: "PRO", icon: Sparkles },
  super: { text: "SUPER", icon: Crown },
  tua: { text: "TUA", icon: Pencil },
} as const;

export function ChoreLevelTag({ level }: { level: ChoreLevel }) {
  const { text, icon: Icon } = LABELS[level];
  return (
    <span className="task-level-tag" aria-label={"Faccenda " + text.toLowerCase()}>
      <Icon aria-hidden="true" size={12} strokeWidth={2.1} />
      {text}
    </span>
  );
}
"""
(ROOT / "src/components/ChoreLevelTag.tsx").write_text(component, encoding="utf-8")

replace_once("src/lib/store.ts",
    'export type ChoreType = "ordinaria" | "straordinaria";',
    'import { classifyChoreLevel, type ChoreLevel } from "./chore-levels";\n\nexport type ChoreType = "ordinaria" | "straordinaria";')
replace_once("src/lib/store.ts",
    "  type: ChoreType;\n  room: string;",
    "  type: ChoreType;\n  /** Cleaning depth, separate from routine/extraordinary frequency. */\n  level?: ChoreLevel;\n  room: string;")
replace_once("src/lib/store.ts",
    'parsed.chores.map((chore) => ({ ...chore, icon: LEGACY_ICON_MAP[chore.icon] || chore.icon }))',
    'parsed.chores.map((chore) => {\n          const icon = LEGACY_ICON_MAP[chore.icon] || chore.icon;\n          return { ...chore, icon, level: classifyChoreLevel({ ...chore, icon }) };\n        })')
replace_once("src/lib/store.ts",
    '      presetKey: key,\n      notes: preset.notes || "",',
    '      presetKey: key,\n      level: classifyChoreLevel(preset),\n      notes: preset.notes || "",')
replace_once("src/routes/AddChore.tsx",
    '      type: String(form.get("type") || "ordinaria") as ChoreType,',
    '      type: String(form.get("type") || "ordinaria") as ChoreType,\n      level: "tua",')
replace_once("src/routes/Chores.tsx",
    'import { ActionFeedback, useActionFeedback } from "../components/ActionFeedback";',
    'import { ActionFeedback, useActionFeedback } from "../components/ActionFeedback";\nimport { ChoreLevelTag } from "../components/ChoreLevelTag";\nimport { classifyChoreLevel } from "../lib/chore-levels";')
replace_once("src/routes/Chores.tsx",
    '                  </div>\n                </article>\n                {editingId === chore.id ? (',
    '                  </div>\n                  <ChoreLevelTag level={classifyChoreLevel(chore)} />\n                </article>\n                {editingId === chore.id ? (')
# Preserve original palette and controls. Only add a small ear beneath them.
css = """
/* A subtle cleaning-depth ear, under the edit/complete buttons.
   Shared colour on all four labels; do not override due-state colours. */
.task-list {
  row-gap: 20px;
}
.task-edit-group {
  row-gap: 19px;
}
.task-row {
  position: relative;
  overflow: visible;
}
.task-level-tag {
  position: absolute;
  right: 14px;
  bottom: -12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 21px;
  padding: 3px 8px;
  border: 1px solid rgba(184, 135, 141, .43);
  border-radius: 5px 5px 10px 10px;
  background: var(--paper);
  box-shadow: 0 4px 9px rgba(93, 65, 59, .09);
  color: var(--rose-deep);
  font-family: Montserrat, Arial, sans-serif;
  font-size: .58rem;
  font-weight: 900;
  letter-spacing: .06em;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
}
.task-level-tag svg {
  flex: 0 0 auto;
}
"""
with (ROOT / "src/styles/global.css").open("a", encoding="utf-8") as f:
    f.write(css)

images = sorted([*ICONS.glob("*.jpg"), *ICONS.glob("*.jpeg"), *ICONS.glob("*.png")])
assert len(images) == 66, f"Expected 66 raster chore icons; found {len(images)}"
original_bytes = sum(p.stat().st_size for p in images)
webp_bytes = 0
for image_path in images:
    output = image_path.with_suffix(".webp")
    with Image.open(image_path) as src:
        src.load()
        dimensions = src.size
        for quality in (90, 86, 82, 78):
            src.save(output, "WEBP", quality=quality, method=6)
            if output.stat().st_size <= image_path.stat().st_size:
                break
    with Image.open(output) as check:
        check.verify()
    with Image.open(output) as check:
        assert check.size == dimensions and check.format == "WEBP"
    webp_bytes += output.stat().st_size
    image_path.unlink()

icons_ts = ROOT / "src/lib/icons.tsx"
icons_code = icons_ts.read_text(encoding="utf-8")
assert icons_code.count(".jpg") == len(images), f"Unmatched icon paths: {icons_code.count('.jpg')} vs {len(images)}"
icons_code = icons_code.replace(".jpg", ".webp")
icons_ts.write_text(icons_code, encoding="utf-8")
# Validate every Store reference resolves and no JPG references remain in UI.
for chore in chores:
    icon = chore["icon"]
    assert (ICONS / f"{icon}.webp").exists() or (ICONS / f"{icon}.svg").exists(), icon
assert "/chore-icons/" in icons_code and ".jpg" not in icons_code

from collections import Counter
levels = Counter(c["level"] for c in chores)
assert levels == {"base": 32, "pro": 24, "super": 11}, levels
print(f"Converted {len(images)} chore JPGs to WebP: {original_bytes} -> {webp_bytes} bytes")
print(f"Saved {100 * (original_bytes - webp_bytes) / original_bytes:.1f}%")
print(f"Classifications: {dict(levels)}; TUA is used for manual chores")
print("Existing tasks inferred from original preset signatures and keys.")

# Trigger one-time migration after the workflow has been registered.
