import type { Direction } from "./percorso.ts";

/** Convert projected SVG delta to unrotated tile delta. Pure: does not depend on viewport zoom. */
export function isoDeltaToTiles(dx: number, dy: number, view: Direction): { x: number; y: number } {
  const a = (dx / 35 + dy / 17.5) / 2;
  const b = (dy / 17.5 - dx / 35) / 2;
  if (view === 1) return { x: b, y: -a };
  if (view === 2) return { x: -a, y: -b };
  if (view === 3) return { x: -b, y: a };
  return { x: a, y: b };
}
export function clampStageZoom(zoom: number): number {
  return Math.min(3.5, Math.max(0.8, Number.isFinite(zoom) ? zoom : 1));
}
export function pinchCamera(
  startZoom: number, startPan: { x: number; y: number }, startDistance: number,
  startMidpoint: { x: number; y: number }, distance: number,
  midpoint: { x: number; y: number }, viewportCenter: { x: number; y: number },
) {
  const zoom = clampStageZoom(startZoom * distance / Math.max(1, startDistance));
  const ratio = zoom / startZoom;
  return {
    zoom,
    pan: {
      x: midpoint.x - viewportCenter.x - ratio * (startMidpoint.x - viewportCenter.x - startPan.x),
      y: midpoint.y - viewportCenter.y - ratio * (startMidpoint.y - viewportCenter.y - startPan.y),
    },
  };
}
