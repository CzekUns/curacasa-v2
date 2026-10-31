/** Skin only alter illustrations of the 12 essential chores, never chore data or app colors. */
export type ChoreSkinId = "classic" | "vintage60" | "vintage80" | "ink30" | "claytoon" | "chibicasa";
export type ChoreSkinOption = { id: ChoreSkinId; label: string; description: string; folder: string | null };
export const CHORE_SKINS: readonly ChoreSkinOption[] = [
  { id: "classic", label: "Originale", description: "Le illustrazioni classiche di CuraCasa.", folder: null },
  { id: "vintage60", label: "Vintage60", description: "Illustrazioni domestiche ispirate agli anni Sessanta.", folder: "Vintage60" },
  { id: "vintage80", label: "Vintage80", description: "Pop-art anni Ottanta, forme geometriche e colori vivaci.", folder: "Vintage80" },
  { id: "ink30", label: "Ink30", description: "Cartoon in bianco e nero, personaggi originali.", folder: "Ink30" },
  { id: "claytoon", label: "ClayToon", description: "Oggetti e stanze in plastilina, effetto stop motion.", folder: "ClayToon" },
  { id: "chibicasa", label: "ChibiCasa", description: "Mini mascotte kawaii originali in colori pastello.", folder: "ChibiCasa" },
];
export const BASE_CHORE_SKIN_KEYS = [
  "casa", "scopa-elettrica", "scopa", "pavimento", "spolverino", "pattumiera",
  "piante", "bagno", "cucina", "letto", "soggiorno", "balcone",
] as const;
const BASE_ICON_SET: ReadonlySet<string> = new Set(BASE_CHORE_SKIN_KEYS);
const SKIN_STORAGE_KEY = "curacasa_v2_chore_skin";
export const DEFAULT_CHORE_SKIN: ChoreSkinId = "classic";
export function getChoreSkin(): ChoreSkinId {
  try {
    const saved = localStorage.getItem(SKIN_STORAGE_KEY);
    return CHORE_SKINS.find((option) => option.id === saved)?.id ?? DEFAULT_CHORE_SKIN;
  } catch { return DEFAULT_CHORE_SKIN; }
}
export function setChoreSkin(id: ChoreSkinId) {
  if (!CHORE_SKINS.some((option) => option.id === id)) return;
  try { localStorage.setItem(SKIN_STORAGE_KEY, id); } catch { /* Private browsing may block storage. */ }
  window.dispatchEvent(new Event("curacasa-skin-changed"));
}
export function subscribeChoreSkin(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("curacasa-skin-changed", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("curacasa-skin-changed", listener);
  };
}
export function getChoreSkinAsset(id: ChoreSkinId, iconName?: string): string | null {
  if (!iconName || !BASE_ICON_SET.has(iconName)) return null;
  const option = CHORE_SKINS.find((skin) => skin.id === id);
  return option?.folder ? `chore-skins/${option.folder}/${iconName}.webp` : null;
}
