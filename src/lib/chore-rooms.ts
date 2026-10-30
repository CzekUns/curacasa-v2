import { guessRoomKind, normalizeRoomDetails, type RoomKind, type RoomDetails } from "./rooms.ts";

/** Assigned by us for presets; editable by the user for personal chores. */
export type ChoreRoomRule =
  | { mode: "any" }
  | { mode: "type"; kind: Exclude<RoomKind, "altro"> }
  | { mode: "specific"; names: string[] };

export function roomRuleFromLegacy(room?: string): ChoreRoomRule {
  const raw = (room ?? "").trim();
  if (!raw || raw.toLocaleLowerCase("it-IT") === "tutta casa" || raw.toLocaleLowerCase("it-IT") === "tutta la casa") {
    return { mode: "any" };
  }
  // Only the canonical names used by historical presets indicate a room category.
  // "Bagno di servizio" written manually by an older user means one specific bathroom.
  const normalized = raw.toLocaleLowerCase("it-IT");
  if (["cucina", "bagno", "camera", "soggiorno", "salone", "balcone"].includes(normalized)) {
    const kind = guessRoomKind(raw);
    if (kind !== "altro") return { mode: "type", kind };
  }
  return { mode: "specific", names: [raw] };
}

export function getRoomRule(chore: { room?: string; roomRule?: ChoreRoomRule }): ChoreRoomRule {
  const value = chore.roomRule;
  if (!value) return roomRuleFromLegacy(chore.room);
  if (value.mode === "type" && ["cucina", "bagno", "camera", "salone", "balcone"].includes(value.kind)) return value;
  if (value.mode === "specific" && Array.isArray(value.names)) return { mode: "specific", names: value.names.filter((s) => typeof s === "string") };
  return { mode: "any" };
}

export function eligibleRoomNames(
  rooms: string[],
  details: RoomDetails | undefined,
  rule: ChoreRoomRule,
): string[] {
  if (rule.mode === "any") return [...rooms];
  if (rule.mode === "specific") return rooms.filter((name) => rule.names.includes(name));
  const normalized = normalizeRoomDetails(rooms, details);
  return rooms.filter((name) => normalized[name]?.kind === rule.kind);
}

export function locationRuleLabel(rule: ChoreRoomRule) {
  if (rule.mode === "any") return "Tutta casa";
  if (rule.mode === "specific") return rule.names.length ? rule.names.join(", ") : "Scegli le stanze";
  return ({
    cucina: "Cucina", bagno: "Bagno", camera: "Camera",
    salone: "Salone", balcone: "Balcone",
  } as const)[rule.kind];
}

export function roomRuleToLegacy(roomRule: ChoreRoomRule) {
  if (roomRule.mode === "any") return "Tutta casa";
  if (roomRule.mode === "specific") return roomRule.names[0] || "Tutta casa";
  return locationRuleLabel(roomRule);
}

export function selectedRoomsAreValid(
  rooms: string[],
  details: RoomDetails | undefined,
  rule: ChoreRoomRule,
  selected: string[],
) {
  const allowed = new Set(eligibleRoomNames(rooms, details, rule));
  return selected.length > 0 && selected.every((name) => allowed.has(name));
}
