import { classifyChoreLevel, type ChoreLevel } from "./chore-levels.ts";
import type { PresetChore } from "./store.ts";

export type StoreCategory = Exclude<ChoreLevel, "tua">;
export const STORE_CATEGORY_ORDER: readonly StoreCategory[] = ["base", "pro", "super", "speciale"];

export type StorePack = {
  id: string;
  title: string;
  description: string;
  category: StoreCategory;
  chores: PresetChore[];
};

export type StoreActivity = PresetChore & { packTitle: string };

function hasChores(value: unknown): value is {
  id: string;
  title: string;
  description: string;
  category?: string;
  chores: PresetChore[];
} {
  if (typeof value !== "object" || !value) return false;
  const pack = value as Record<string, unknown>;
  return typeof pack.id === "string"
    && typeof pack.title === "string"
    && Array.isArray(pack.chores);
}

/**
 * Normalizes old and new Store JSON. Old versions lacked pack.category and
 * grouped chores by room rather than by BASE/PRO/SUPER/SPECIALE; don't render
 * a blank Collections tab just because a stale JSON response lacks category.
 * Every preset still belongs to one category, and no records are removed.
 */
export function normalizeStorePacks(file: unknown): StorePack[] {
  if (typeof file !== "object" || !file) return [];
  const source = (file as { packs?: unknown }).packs;
  if (!Array.isArray(source)) return [];

  const result: StorePack[] = [];
  for (const item of source) {
    if (!hasChores(item)) continue;
    const chores = item.chores.filter((chore): chore is PresetChore =>
      typeof chore === "object" && chore !== null
      && typeof chore.title === "string" && typeof chore.icon === "string");
    if (!chores.length) continue;

    // Current new collections already have one category. The source arrays
    // retain their intended pack order: "Le 12 essenziali" is first.
    if (STORE_CATEGORY_ORDER.includes(item.category as StoreCategory) &&
        chores.every((chore) => classifyChoreLevel(chore) === item.category)) {
      result.push({
        id: item.id, title: item.title,
        description: typeof item.description === "string" ? item.description : "",
        category: item.category as StoreCategory, chores,
      });
      continue;
    }

    // A cached legacy JSON may lack the category property. Split mixed
    // thematic collections so that each section always has visible cards.
    for (const category of STORE_CATEGORY_ORDER) {
      const matching = chores.filter((chore) => classifyChoreLevel(chore) === category);
      if (matching.length) result.push({
        id: `${item.id}-${category}`,
        title: item.title,
        description: typeof item.description === "string" ? item.description : "",
        category, chores: matching,
      });
    }
  }
  return result;
}

/** The Store groups all preset pills by category, regardless of collections. */
export function groupStoreActivities(packs: StorePack[]) {
  const seen = new Set<string>();
  const categories = STORE_CATEGORY_ORDER.map((category) => {
    const chores: StoreActivity[] = [];
    for (const pack of packs) {
      for (const chore of pack.chores) {
        if (classifyChoreLevel(chore) !== category) continue;
        const key = `${chore.title.normalize("NFKC").trim().toLocaleLowerCase("it-IT")}::${chore.icon}`;
        if (seen.has(key)) continue;
        seen.add(key);
        chores.push({ ...chore, packTitle: pack.title });
      }
    }
    return { category, chores };
  });
  return categories.filter((section) => section.chores.length > 0);
}
