import { guessRoomKind, type RoomKind } from "./rooms";

export type Tile = { x: number; y: number };
export type Direction = 0 | 1 | 2 | 3;
export type FloorStyle = "parquet" | "piastrelle" | "cotto" | "terrazzo" | "pietra";
export type WallStyle = "avorio" | "salvia" | "cipria" | "righe" | "carta";
export type FurnitureType = "divano" | "letto" | "tavolo" | "sedia" | "armadio" | "lavatrice" | "vasca" | "pianta" | "tappeto" | "frigo";
export type FurnitureSpec = { id: FurnitureType; label: string; width: number; height: number; elevation: number; color: string; accent: string; icon: string };
export type Furniture = { id: string; type: FurnitureType; x: number; y: number; rotation: Direction };
export type HouseRoom = {
  id: string;
  name: string;
  kind: RoomKind;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  cells: string[];
  floor: FloorStyle;
  wall: WallStyle;
  furniture: Furniture[];
};
export type HouseLayout = { version: 1; rooms: HouseRoom[] };
export const FLOOR_STYLES: { id: FloorStyle; label: string }[] = [
  { id: "parquet", label: "Parquet" }, { id: "piastrelle", label: "Piastrelle" },
  { id: "cotto", label: "Cotto" }, { id: "terrazzo", label: "Terrazzo" },
  { id: "pietra", label: "Pietra" },
];
export const WALL_STYLES: { id: WallStyle; label: string }[] = [
  { id: "avorio", label: "Avorio" }, { id: "salvia", label: "Salvia" },
  { id: "cipria", label: "Cipria" }, { id: "righe", label: "Righe" },
  { id: "carta", label: "Carta da parati" },
];
export const FURNITURE: FurnitureSpec[] = [
  { id: "divano", label: "Divano", width: 2, height: 1, elevation: 35, color: "#be8c82", accent: "#ead5ca", icon: "🛋" },
  { id: "letto", label: "Letto", width: 2, height: 2, elevation: 23, color: "#bda4ac", accent: "#fff5e9", icon: "🛏" },
  { id: "tavolo", label: "Tavolo", width: 2, height: 2, elevation: 38, color: "#b18c65", accent: "#efdbad", icon: "▤" },
  { id: "sedia", label: "Sedia", width: 1, height: 1, elevation: 29, color: "#a58b70", accent: "#f6dfb0", icon: "♧" },
  { id: "armadio", label: "Armadio", width: 2, height: 1, elevation: 70, color: "#b7a18c", accent: "#ebd6ae", icon: "▥" },
  { id: "lavatrice", label: "Lavatrice", width: 1, height: 1, elevation: 43, color: "#9cb0b7", accent: "#edf6f6", icon: "◉" },
  { id: "vasca", label: "Vasca", width: 2, height: 1, elevation: 24, color: "#8bb9c3", accent: "#eaf9fc", icon: "◠" },
  { id: "pianta", label: "Pianta", width: 1, height: 1, elevation: 43, color: "#63917c", accent: "#c9e1a6", icon: "✿" },
  { id: "tappeto", label: "Tappeto", width: 2, height: 2, elevation: 3, color: "#d8a49b", accent: "#fff0d9", icon: "✧" },
  { id: "frigo", label: "Frigorifero", width: 1, height: 1, elevation: 62, color: "#92afb0", accent: "#edf2ea", icon: "▥" },
];
const KEY = "curacasa_percorso_lab_v1";
const cellKey = (x: number, y: number) => `${x},${y}`;
const allCells = (width: number, height: number) =>
  Array.from({ length: width * height }, (_, index) => cellKey(index % width, Math.floor(index / width)));
const finiteInt = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isInteger(value) && Math.abs(value) <= 300 ? value : fallback;
export function newRoom(name: string, index: number): HouseRoom {
  return {
    id: name, name, kind: guessRoomKind(name), width: 5, height: 4,
    offsetX: (index % 3) * 7, offsetY: Math.floor(index / 3) * 6,
    cells: allCells(5, 4), floor: "parquet", wall: "avorio", furniture: [],
  };
}
export function furnitureSize(item: Furniture) {
  const spec = FURNITURE.find((part) => part.id === item.type)!;
  return item.rotation % 2
    ? { width: spec.height, height: spec.width }
    : { width: spec.width, height: spec.height };
}
export function validPlacement(room: HouseRoom, item: Furniture, skipId?: string): boolean {
  const cells = new Set(room.cells);
  const size = furnitureSize(item);
  for (let y = item.y; y < item.y + size.height; y++) {
    for (let x = item.x; x < item.x + size.width; x++) {
      if (!cells.has(cellKey(x, y))) return false;
    }
  }
  return !room.furniture.some((other) => {
    if (other.id === skipId) return false;
    const a = furnitureSize(other);
    return item.x < other.x + a.width && item.x + size.width > other.x &&
      item.y < other.y + a.height && item.y + size.height > other.y;
  });
}
function validConnected(cells: string[]): boolean {
  if (!cells.length) return false;
  const available = new Set(cells);
  const seen = new Set<string>([cells[0]]);
  const pending = [cells[0]];
  while (pending.length) {
    const [x, y] = pending.pop()!.split(",").map(Number);
    for (const key of [cellKey(x + 1, y), cellKey(x - 1, y), cellKey(x, y + 1), cellKey(x, y - 1)]) {
      if (available.has(key) && !seen.has(key)) { seen.add(key); pending.push(key); }
    }
  }
  return seen.size === cells.length;
}
export function toggleCell(room: HouseRoom, x: number, y: number): HouseRoom | null {
  if (x < 0 || x >= room.width || y < 0 || y >= room.height) return null;
  const key = cellKey(x, y);
  const cells = room.cells.includes(key) ? room.cells.filter((entry) => entry !== key) : [...room.cells, key];
  if (!validConnected(cells)) return null;
  const next = { ...room, cells };
  if (room.furniture.some((item) => !validPlacement(next, item, item.id))) return null;
  return next;
}
export function resizeRoom(room: HouseRoom, width: number, height: number): HouseRoom {
  const nextWidth = Math.max(2, Math.min(12, width));
  const nextHeight = Math.max(2, Math.min(12, height));
  const previous = new Set(room.cells);
  const cells = allCells(nextWidth, nextHeight).filter((key) => {
    const [x, y] = key.split(",").map(Number);
    return x >= room.width || y >= room.height || previous.has(key);
  });
  const next = { ...room, width: nextWidth, height: nextHeight, cells };
  return { ...next, furniture: room.furniture.filter((item) => validPlacement(next, item, item.id)) };
}
export function roomsOverlap(a: HouseRoom, b: HouseRoom): boolean {
  const cells = new Set(a.cells.map((key) => {
    const [x, y] = key.split(",").map(Number);
    return cellKey(x + a.offsetX, y + a.offsetY);
  }));
  return b.cells.some((key) => {
    const [x, y] = key.split(",").map(Number);
    return cells.has(cellKey(x + b.offsetX, y + b.offsetY));
  });
}
export function canMoveRoom(rooms: HouseRoom[], moved: HouseRoom): boolean {
  return rooms.every((room) => room.id === moved.id || !roomsOverlap(room, moved));
}
export function snapRoom(room: HouseRoom, target: HouseRoom, side: "nord" | "est" | "sud" | "ovest"): HouseRoom {
  if (side === "est") return { ...room, offsetX: target.offsetX + target.width, offsetY: target.offsetY };
  if (side === "ovest") return { ...room, offsetX: target.offsetX - room.width, offsetY: target.offsetY };
  if (side === "sud") return { ...room, offsetX: target.offsetX, offsetY: target.offsetY + target.height };
  return { ...room, offsetX: target.offsetX, offsetY: target.offsetY - room.height };
}
function isFurnitureType(value: string): value is FurnitureType {
  return FURNITURE.some((entry) => entry.id === value);
}
export function reconcileHouse(savedNames: string[], saved: unknown): HouseLayout {
  const previous = saved && typeof saved === "object" && "rooms" in saved && Array.isArray(saved.rooms)
    ? saved.rooms as Partial<HouseRoom>[] : [];
  const rooms: HouseRoom[] = savedNames.map((name, index) => {
    const initial = newRoom(name, index);
    const old = previous.find((entry) => entry && entry.name === name);
    if (!old) return initial;
    const width = Math.max(2, Math.min(12, finiteInt(old.width, 5)));
    const height = Math.max(2, Math.min(12, finiteInt(old.height, 4)));
    const cells = Array.isArray(old.cells)
      ? [...new Set(old.cells.filter((key): key is string => typeof key === "string" && /^\\d+,\\d+$/.test(key))
        .filter((key) => { const [x, y] = key.split(",").map(Number); return x < width && y < height; }))]
      : allCells(width, height);
    const room: HouseRoom = {
      ...initial, width, height,
      offsetX: finiteInt(old.offsetX, initial.offsetX),
      offsetY: finiteInt(old.offsetY, initial.offsetY),
      cells: validConnected(cells) ? cells : allCells(width, height),
      floor: FLOOR_STYLES.some((value) => value.id === old.floor) ? old.floor! : initial.floor,
      wall: WALL_STYLES.some((value) => value.id === old.wall) ? old.wall! : initial.wall,
    };
    room.furniture = Array.isArray(old.furniture)
      ? old.furniture.filter((item): item is Furniture => !!item && typeof item.id === "string" && isFurnitureType(item.type as string) &&
        Number.isInteger(item.x) && Number.isInteger(item.y) && [0, 1, 2, 3].includes(item.rotation as number))
        .reduce<Furniture[]>((accepted, item) => {
          if (validPlacement({ ...room, furniture: accepted }, item)) accepted.push(item);
          return accepted;
        }, [])
      : [];
    return room;
  });
  return { version: 1, rooms };
}
export function loadHouse(names: string[]): HouseLayout {
  try { return reconcileHouse(names, JSON.parse(localStorage.getItem(KEY) ?? "null")); }
  catch { return reconcileHouse(names, null); }
}
export function saveHouse(layout: HouseLayout): void {
  localStorage.setItem(KEY, JSON.stringify(layout));
}
