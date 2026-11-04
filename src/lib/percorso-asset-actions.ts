import { PRESET_ASSET_IDS, PRESET_CHORE_TITLES } from "./percorso-asset-catalog.ts";
import { eligibleRoomNames, getRoomRule } from "./chore-rooms.ts";
import type { AppData, Chore, PresetChore } from "./store.ts";

/**
 * Distinct presets may describe operations on the SAME physical object.
 * Keep every old asset ID for existing saved rooms, but present one appliance
 * in the new furniture catalogue and collect its jobs in one touch menu.
 */
export const PHYSICAL_ASSET_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  "addolcitore-sale": "addolcitore-manutenzione",
  "lavastoviglie-sale": "lavastoviglie-manutenzione",
  "filtro-cappa": "cappa",
  "filtro-condizionatore": "condizionatore",
  "sifone-lavandino": "lavandino",
});

export function physicalAssetId(type: string): string {
  return PHYSICAL_ASSET_ALIASES[type] ?? type;
}

/** The immutable preset identity takes precedence if a user edits the icon. */
export function chorePresetIcon(chore: Pick<Chore, "icon" | "presetKey">): string | null {
  const source = typeof chore.presetKey === "string" ? chore.presetKey : "";
  const sep = source.lastIndexOf("::");
  const fromPreset = sep < 0 ? "" : source.slice(sep + 2).trim();
  if (Object.hasOwn(PRESET_ASSET_IDS, fromPreset)) return fromPreset;
  return Object.hasOwn(PRESET_ASSET_IDS, chore.icon) ? chore.icon : null;
}

export function physicalAssetForChore(chore: Pick<Chore, "icon" | "presetKey">): string | null {
  const icon = chorePresetIcon(chore);
  return icon ? physicalAssetId(PRESET_ASSET_IDS[icon]) : null;
}

/** All preset operations on one object, including separate maintenance/refill jobs. */
export function presetActionsForAsset(type: string): Array<{ icon: string; title: string }> {
  const target = physicalAssetId(type);
  return Object.entries(PRESET_ASSET_IDS)
    .filter(([, asset]) => physicalAssetId(asset) === target)
    .map(([icon]) => ({ icon, title: PRESET_CHORE_TITLES[icon] ?? icon }));
}

export type AssetAction = {
  key: string;
  icon: string;
  title: string;
  chore: Chore | null;
  preset: PresetChore | null;
};

/**
 * Only actions allowed in THIS room are interactive. An installed chore never
 * appears again as an "add" suggestion, even if its room rule excludes it here.
 * Multiple personal chores using the same icon remain separate actions.
 */
export function actionsForAsset(
  type: string, data: Pick<AppData, "rooms" | "roomDetails" | "chores">,
  roomName: string, availablePresets: readonly PresetChore[] = [],
): AssetAction[] {
  const assetId = physicalAssetId(type);
  const targetIcons = presetActionsForAsset(assetId);
  const installedIcons = new Set<string>();
  const actions: AssetAction[] = [];

  for (const chore of data.chores) {
    const icon = chorePresetIcon(chore);
    if (!icon || physicalAssetForChore(chore) !== assetId) continue;
    installedIcons.add(icon);
    if (!eligibleRoomNames(data.rooms, data.roomDetails, getRoomRule(chore)).includes(roomName)) continue;
    actions.push({ key: chore.id, icon, title: chore.title, chore, preset: null });
  }

  for (const candidate of targetIcons) {
    if (installedIcons.has(candidate.icon)) continue;
    const preset = availablePresets.find(item => item.icon === candidate.icon) ?? null;
    if (preset && !eligibleRoomNames(data.rooms, data.roomDetails, getRoomRule(preset)).includes(roomName))
      continue;
    actions.push({
      key: "preset:" + candidate.icon,
      icon: candidate.icon,
      title: preset?.title ?? candidate.title,
      chore: null, preset,
    });
  }
  return actions;
}
