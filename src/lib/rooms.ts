/** Identity of a room is its saved name; the type chooses its SVG, not its identity. */
export const ROOM_TYPES = [
  { id: "cucina", label: "Cucina" },
  { id: "bagno", label: "Bagno" },
  { id: "camera", label: "Camera" },
  { id: "salone", label: "Salone" },
  { id: "balcone", label: "Balcone" },
] as const;

export type RoomKind = (typeof ROOM_TYPES)[number]["id"] | "altro";
export type RoomDetail = { kind: RoomKind; note: string; color: number };
export type RoomDetails = Record<string, RoomDetail>;
export const ROOM_COLOR_COUNT = 8;

export function guessRoomKind(name: string): RoomKind {
  const lower = name.trim().toLocaleLowerCase("it-IT");
  if (lower.includes("cucin")) return "cucina";
  if (lower.includes("bagn")) return "bagno";
  if (lower.includes("camer") || lower.includes("letto")) return "camera";
  if (lower.includes("salon") || lower.includes("soggiorn")) return "salone";
  if (lower.includes("balcon") || lower.includes("terrazz")) return "balcone";
  return "altro"; // Preserve older custom rooms without inventing a room type.
}

export function roomLabel(kind: Exclude<RoomKind, "altro">, note: string) {
  const label = ROOM_TYPES.find((item) => item.id === kind)!.label;
  return note.trim() ? `${label} ${note.trim()}` : label;
}

export function normalizeRoomDetails(rooms: string[], saved?: RoomDetails): RoomDetails {
  const result: RoomDetails = {};
  const used = new Map<RoomKind, Set<number>>();
  rooms.forEach((name, index) => {
    const previous = saved?.[name];
    const kind: RoomKind = previous && (ROOM_TYPES.some((item) => item.id === previous.kind) || previous.kind === "altro")
      ? previous.kind : guessRoomKind(name);
    const colors = used.get(kind) ?? new Set<number>();
    const proposed = previous?.color;
    // Spread new/legacy rooms across palette slots rather than making all five defaults the same color.
    const candidates = Array.from({ length: ROOM_COLOR_COUNT }, (_, offset) => (index + offset) % ROOM_COLOR_COUNT);
    let color = Number.isInteger(proposed) && proposed! >= 0 && proposed! < ROOM_COLOR_COUNT && !colors.has(proposed!)
      ? proposed! : candidates.find((i) => !colors.has(i));
    if (color === undefined) color = index % ROOM_COLOR_COUNT; // Legacy: do not drop a ninth room.
    colors.add(color);
    used.set(kind, colors);
    result[name] = { kind, note: previous?.note ?? "", color };
  });
  return result;
}

export function availableRoomColors(rooms: string[], details: RoomDetails, kind: RoomKind) {
  const occupied = new Set(rooms.filter((name) => details[name]?.kind === kind).map((name) => details[name].color));
  return Array.from({ length: ROOM_COLOR_COUNT }, (_, i) => i).filter((i) => !occupied.has(i));
}
