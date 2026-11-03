import {
  furnitureSize, validPlacement,
  type Furniture, type HouseRoom,
} from "./percorso.ts";

export type GroundPoint = { x: number; z: number };
export type FurnitureCandidate = { x: number; y: number; valid: boolean };

/** Round translation at the end, so a dragged item retains its pickup offset. */
export function draggedFurniturePosition(
  room: HouseRoom, item: Furniture,
  pickedAt: GroundPoint, fingerAt: GroundPoint,
): FurnitureCandidate {
  const x = item.x + Math.round(fingerAt.x - pickedAt.x);
  const y = item.y + Math.round(fingerAt.z - pickedAt.z);
  return { x, y, valid: validPlacement(room, { ...item, x, y }, item.id) };
}

/** Tap-to-place for the explicit "Sposta" tool, without needing to drag. */
export function tappedFurniturePosition(
  room: HouseRoom, item: Furniture, ground: GroundPoint,
): FurnitureCandidate {
  const size = furnitureSize(item);
  const x = Math.round(ground.x - room.offsetX - size.width / 2);
  const y = Math.round(ground.z - room.offsetY - size.height / 2);
  return { x, y, valid: validPlacement(room, { ...item, x, y }, item.id) };
}


export function canDragFurniture(
  itemId: string | null,
  mode: "play"|"furniture"|"finishes"|"tiles",
  movingFurnitureId: string | null,
  addingFurniture: boolean,
  showroomPreview: boolean,
): boolean {
  if (!itemId || addingFurniture || showroomPreview) return false;
  return mode==="furniture" || itemId===movingFurnitureId;
}
