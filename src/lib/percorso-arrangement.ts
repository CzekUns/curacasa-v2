import { canMoveRoom, roomsOverlap, type HouseRoom } from "./percorso.ts";

/**
 * House layout is a presentation layer. Room geometry and furniture do not
 * depend on where an independent room is placed in the overview.
 */
export type RoomPosition = { x: number; y: number };
export type RoomArrangement = {
  version: 1;
  order: string[];
  positions: Record<string, RoomPosition>;
};

const KEY = "curacasa_percorso3d_arrangement_v1";
const GRID_GAP = 2;

function validPosition(value: unknown): value is RoomPosition {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<RoomPosition>;
  return Number.isInteger(p.x) && Number.isInteger(p.y) &&
    Math.abs(p.x!) <= 500 && Math.abs(p.y!) <= 500;
}

export function autoArrangeRooms(
  rooms: HouseRoom[],
  requestedOrder?: string[],
): RoomArrangement {
  const ids = new Set(rooms.map(room => room.id));
  const ordered = [
    ...(requestedOrder ?? []).filter((id, i, arr) => ids.has(id) && arr.indexOf(id) === i),
    ...rooms.map(r => r.id).filter(id => !(requestedOrder ?? []).includes(id)),
  ];
  const byId = new Map(rooms.map(room => [room.id, room]));
  const totalArea = rooms.reduce((sum, r) => sum + (r.width + GRID_GAP) * (r.height + GRID_GAP), 0);
  const rowLimit = Math.max(13, Math.ceil(Math.sqrt(totalArea) * 1.45));
  const positions: RoomArrangement["positions"] = {};
  let x = 0, y = 0, maxRowHeight = 0;
  for (const id of ordered) {
    const room = byId.get(id);
    if (!room) continue;
    if (x > 0 && x + room.width > rowLimit) {
      x = 0;
      y += maxRowHeight + GRID_GAP;
      maxRowHeight = 0;
    }
    positions[id] = { x, y };
    x += room.width + GRID_GAP;
    maxRowHeight = Math.max(maxRowHeight, room.height);
  }
  return { version: 1, order: ordered, positions };
}

export function reconcileRoomArrangement(rooms: HouseRoom[], saved: unknown): RoomArrangement {
  const previous = saved && typeof saved === "object" ? saved as Partial<RoomArrangement> : {};
  const defaults = autoArrangeRooms(rooms, Array.isArray(previous.order) ?
    previous.order.filter((id): id is string => typeof id === "string") : undefined);
  const oldPositions = previous.positions && typeof previous.positions === "object"
    ? previous.positions : {};
  return {
    ...defaults,
    positions: Object.fromEntries(defaults.order.map(id => [
      id, validPosition(oldPositions[id]) ? { ...oldPositions[id] } : defaults.positions[id],
    ])),
  };
}

/** Keep an existing house composition when it was saved by the former editor. */
export function migrateLegacyArrangement(rooms: HouseRoom[]): RoomArrangement {
  const base=autoArrangeRooms(rooms);
  const legacy:RoomArrangement={
    ...base,
    positions:Object.fromEntries(rooms.map(r=>[r.id,{x:r.offsetX,y:r.offsetY}])),
  };
  if(rooms.every(r=>validPosition(legacy.positions[r.id])) &&
    rooms.every((a,i)=>rooms.slice(i+1).every(b=>!roomsOverlap(a,b))))
    return legacy;
  return base;
}

export function loadRoomArrangement(rooms: HouseRoom[]): RoomArrangement {
  try {
    const data=localStorage.getItem(KEY);
    return data===null ? migrateLegacyArrangement(rooms) :
      reconcileRoomArrangement(rooms, JSON.parse(data));
  } catch {
    return migrateLegacyArrangement(rooms);
  }
}

export function saveRoomArrangement(arrangement: RoomArrangement): void {
  localStorage.setItem(KEY, JSON.stringify(arrangement));
}

export function positionedRooms(rooms: HouseRoom[], arrangement: RoomArrangement): HouseRoom[] {
  return rooms.map(room => {
    const position = arrangement.positions[room.id];
    return { ...room, offsetX: position?.x ?? 0, offsetY: position?.y ?? 0 };
  });
}

export function changeRoomOrder(
  rooms: HouseRoom[], arrangement: RoomArrangement, roomId: string, shift: -1 | 1,
): RoomArrangement {
  const index = arrangement.order.indexOf(roomId), nextIndex = index + shift;
  if (index < 0 || nextIndex < 0 || nextIndex >= arrangement.order.length)
    return arrangement;
  const order = [...arrangement.order];
  [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
  return autoArrangeRooms(rooms, order);
}

/**
 * Dragging affects overview positions only, and can never move or resize any
 * tile/furniture inside the actual room.
 */
export function moveRoomInArrangement(
  rooms: HouseRoom[], arrangement: RoomArrangement,
  roomId: string, deltaX: number, deltaY: number,
): { arrangement: RoomArrangement | null; reason: string } {
  if (!Number.isInteger(deltaX) || !Number.isInteger(deltaY) ||
      Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30)
    return { arrangement: null, reason: "Spostamento non valido." };
  const current = positionedRooms(rooms, arrangement);
  const target = current.find(room => room.id === roomId);
  if (!target) return { arrangement: null, reason: "Stanza non trovata." };
  const moved = { ...target, offsetX: target.offsetX + deltaX, offsetY: target.offsetY + deltaY };
  if (!canMoveRoom(current, moved))
    return { arrangement: null, reason: "Questa posizione si sovrappone a un'altra stanza." };
  return {
    arrangement: { ...arrangement, positions: {
      ...arrangement.positions,
      [roomId]: { x: moved.offsetX, y: moved.offsetY },
    } },
    reason: "Posizione della stanza aggiornata.",
  };
}
