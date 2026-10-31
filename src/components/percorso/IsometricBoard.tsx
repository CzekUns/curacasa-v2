import type { ReactNode } from "react";
import { FURNITURE, furnitureSize, type Direction, type Furniture, type HouseRoom, type FurnitureSpec } from "../../lib/percorso";

type Props = {
  rooms: HouseRoom[];
  activeRoomId: string;
  view: Direction;
  showAll: boolean;
  sculpt: boolean;
  selectedObject: string | null;
  onCell: (roomId: string, x: number, y: number) => void;
  onObject: (roomId: string, id: string) => void;
};
type Vec = { x: number; y: number };
const cellKey = (x: number, y: number) => `${x},${y}`;
const P = (x: number, y: number, z: number, view: Direction): Vec => {
  const turns = [ [x, y], [-y, x], [-x, -y], [y, -x] ];
  const [a, b] = turns[view];
  return { x: (a - b) * 35, y: (a + b) * 17.5 - z };
};
const pts = (points: Vec[]) => points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
function polygon(x: number, y: number, w: number, h: number, z: number, view: Direction) {
  return [P(x, y, z, view), P(x + w, y, z, view), P(x + w, y + h, z, view), P(x, y + h, z, view)];
}
function transformNormal(x: number, y: number, view: Direction): Vec {
  const normals = [{ x, y }, { x: -y, y: x }, { x: -x, y: -y }, { x: y, y: -x }];
  return normals[view];
}
function Box3D({ x, y, w, d, bottom = 0, top, base, topColor, view, label }: {
  x: number; y: number; w: number; d: number; bottom?: number; top: number;
  base: string; topColor: string; view: Direction; label?: string;
}) {
  const high = polygon(x, y, w, d, top, view);
  const low = polygon(x, y, w, d, bottom, view);
  const normals = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  return <g>
    {normals.map((normal, i) => {
      const facing = transformNormal(normal.x, normal.y, view);
      if (facing.x <= 0 && facing.y <= 0) return null;
      const quad = [high[i], high[(i + 1) % 4], low[(i + 1) % 4], low[i]];
      return <polygon key={i} points={pts(quad)} fill={base} stroke="#4b45414d" strokeWidth="1"
        opacity={i === 2 || i === 1 ? 0.89 : 0.72} />;
    })}
    <polygon points={pts(high)} fill={topColor} stroke="#574a424f" strokeWidth="1.15" strokeLinejoin="round" />
    {label ? <text x={P(x + w / 2, y + d / 2, top, view).x} y={P(x + w / 2, y + d / 2, top, view).y + 4}
      textAnchor="middle" fontSize={Math.min(20, 12 + w * 2)} fontWeight="700" fill="#3f4b46"
      style={{ pointerEvents: "none" }}>{label}</text> : null}
  </g>;
}
function Furniture3D({ item, room, view, selected }: { item: Furniture; room: HouseRoom; view: Direction; selected: boolean }) {
  const spec: FurnitureSpec = FURNITURE.find((entry) => entry.id === item.type)!;
  const size = furnitureSize(item);
  const x = room.offsetX + item.x, y = room.offsetY + item.y, w = size.width, d = size.height;
  const draw = (left: number, up: number, width: number, depth: number, bottom: number, top: number, base: string, face: string, label?: string) =>
    <Box3D x={left} y={up} w={width} d={depth} bottom={bottom} top={top}
      base={base} topColor={face} view={view} label={label} />;
  const back = (height: number, color: string): ReactNode => {
    if (item.rotation === 0) return draw(x + .06, y + .05, w - .12, .22, 17, height, color, color);
    if (item.rotation === 1) return draw(x + w - .27, y + .06, .22, d - .12, 17, height, color, color);
    if (item.rotation === 2) return draw(x + .06, y + d - .27, w - .12, .22, 17, height, color, color);
    return draw(x + .05, y + .06, .22, d - .12, 17, height, color, color);
  };
  const topCenter = P(x + w / 2, y + d / 2, spec.elevation + 3, view);
  let parts: ReactNode = draw(x + .09, y + .09, w - .18, d - .18, 0, spec.elevation, spec.color, spec.accent, spec.icon);
  if (item.type === "divano") parts = <>
    {draw(x + .09, y + .1, w - .18, d - .2, 0, 22, spec.color, "#d9b0a3")}
    {back(39, "#ab736f")}
    {draw(x + .2, y + .29, w - .4, d - .43, 22, 27, "#b88480", spec.accent, "✦")}
  </>;
  if (item.type === "letto") parts = <>
    {draw(x + .05, y + .06, w - .1, d - .12, 0, 19, "#b99a8a", "#f8e7d9")}
    {back(33, "#b88f9a")}
    {draw(x + .2, y + .3, w - .4, d - .5, 19, 21, "#d2bfbb", "#fffaf2", "✧")}
  </>;
  if (item.type === "tavolo") parts = <>
    {draw(x + .24, y + .24, .2, .2, 0, 34, "#917055", "#aa8a68")}
    {draw(x + w - .44, y + d - .44, .2, .2, 0, 34, "#917055", "#aa8a68")}
    {draw(x + .06, y + .06, w - .12, d - .12, 34, 39, spec.color, spec.accent, "✳")}
  </>;
  if (item.type === "sedia") parts = <>
    {draw(x + .15, y + .15, .7, .7, 0, 23, spec.color, "#f0d5a2")}
    {back(39, "#a58b70")}
  </>;
  if (item.type === "armadio") parts = <>
    {draw(x + .04, y + .04, w - .08, d - .08, 0, 70, "#ad9680", "#dfc3a0")}
    {draw(x + .12, y + .12, w - .24, d - .24, 70, 71, "#d1b593", "#e1c5a1", "▥")}
  </>;
  if (item.type === "lavatrice") parts = draw(x + .08, y + .08, .84, .84, 0, 40, "#9bb1bc", "#e9f6f4", "◉");
  if (item.type === "frigo") parts = draw(x + .06, y + .06, .88, .88, 0, 62, "#8ba8ae", "#e1efec", "❄");
  if (item.type === "vasca") parts = <>
    {draw(x + .06, y + .06, w - .12, d - .12, 0, 21, "#8fb6bc", "#f6ffff")}
    {draw(x + .23, y + .21, w - .46, d - .42, 21, 22, "#bfe3e5", "#83b9c6", "≈")}
  </>;
  if (item.type === "pianta") parts = <>
    {draw(x + .29, y + .29, .42, .42, 0, 17, "#b88d72", "#d9b09a")}
    {draw(x + .1, y + .1, .8, .8, 17, 43, "#5d9074", "#99cb9f", "✿")}
  </>;
  if (item.type === "tappeto") parts = <>
    {draw(x + .03, y + .03, w - .06, d - .06, 0, 3, "#d19a9a", "#f3d2ba")}
    {draw(x + .22, y + .22, w - .44, d - .44, 3, 3.5, "#bd898a", "#e4b0a7", "✧")}
  </>;
  const footprint = polygon(x + .04, y + .04, w - .08, d - .08, 1, view);
  return <g role="img" aria-label={spec.label}>
    {selected && <polygon points={pts(footprint)} fill="none" stroke="#1e7569" strokeWidth="5"
      strokeLinejoin="round" strokeDasharray="9 3" opacity=".9" />}
    <ellipse cx={topCenter.x} cy={P(x + w / 2, y + d / 2, 0, view).y + 6}
      rx={24 * w} ry={8 * d} opacity=".11" fill="#273f3b" />
    {parts}
  </g>;
}
const floorColor: Record<HouseRoom["floor"], string> = {
  parquet: "#d8b891", piastrelle: "#e3ede8", cotto: "#d8a18a",
  terrazzo: "#e1d4cf", pietra: "#b8c8c4",
};
const wallColor: Record<HouseRoom["wall"], string> = {
  avorio: "#f8ecdc", salvia: "#c9d9c6", cipria: "#ecd2d1",
  righe: "#f3e3d4", carta: "#d9e6dd",
};
export function IsometricBoard({ rooms, activeRoomId, view, showAll, sculpt, selectedObject, onCell, onObject }: Props) {
  const visible = showAll ? rooms : rooms.filter((room) => room.id === activeRoomId);
  const vertices = visible.flatMap((room) => [
    P(room.offsetX, room.offsetY, 70, view),
    P(room.offsetX + room.width, room.offsetY, 70, view),
    P(room.offsetX, room.offsetY + room.height, 70, view),
    P(room.offsetX + room.width, room.offsetY + room.height, 70, view),
    P(room.offsetX, room.offsetY, 0, view),
    P(room.offsetX + room.width, room.offsetY + room.height, 0, view),
  ]);
  const xMin = Math.min(...(vertices.length ? vertices.map((p) => p.x) : [0])) - (visible.length ? 65 : 140);
  const xMax = Math.max(...(vertices.length ? vertices.map((p) => p.x) : [0])) + (visible.length ? 65 : 140);
  const yMin = Math.min(...(vertices.length ? vertices.map((p) => p.y) : [0])) - 45;
  const yMax = Math.max(...(vertices.length ? vertices.map((p) => p.y) : [0])) + 90;
  const width = Math.max(260, xMax - xMin), height = Math.max(240, yMax - yMin);
  const tiles = visible.flatMap((room) => room.cells.map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { room, x, y };
  }));
  tiles.sort((a, b) => {
    const pa = P(a.room.offsetX + a.x + .5, a.room.offsetY + a.y + .5, 0, view);
    const pb = P(b.room.offsetX + b.x + .5, b.room.offsetY + b.y + .5, 0, view);
    return pa.y - pb.y;
  });
  const furniture = visible.flatMap((room) => room.furniture.map((item) => ({ room, item })));
  furniture.sort((a, b) => {
    const sA = furnitureSize(a.item), sB = furnitureSize(b.item);
    const pa = P(a.room.offsetX + a.item.x + sA.width / 2, a.room.offsetY + a.item.y + sA.height / 2, 0, view);
    const pb = P(b.room.offsetX + b.item.x + sB.width / 2, b.room.offsetY + b.item.y + sB.height / 2, 0, view);
    return pa.y - pb.y;
  });
  return <svg className="percorso-scene" viewBox={`${xMin} ${yMin} ${width} ${height}`}
    preserveAspectRatio="xMidYMid meet" role="img" aria-label="Planimetria isometrica interattiva">
    <defs>
      <pattern id="pc-floor-parquet" width="42" height="24" patternUnits="userSpaceOnUse">
        <path d="M0 0H42M0 12H42M14 0V12M31 12V24" fill="none" stroke="#896745" strokeWidth="1.3" opacity=".38" />
      </pattern>
      <pattern id="pc-floor-piastrelle" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M0 0H28M0 0V28" fill="none" stroke="#8ea9a3" strokeWidth="2" opacity=".45" />
      </pattern>
      <pattern id="pc-floor-cotto" width="32" height="18" patternUnits="userSpaceOnUse">
        <path d="M0 0H32M0 9H32M16 0V9M0 9V18" fill="none" stroke="#a57560" strokeWidth="1.4" opacity=".45" />
      </pattern>
      <pattern id="pc-floor-terrazzo" width="38" height="34" patternUnits="userSpaceOnUse">
        <path d="M5 6l5 -3 4 4 -6 3z M23 24l7 -2 2 5 -4 3z M28 6l4 4 -4 2z" fill="#ac9994" opacity=".48" />
      </pattern>
      <pattern id="pc-floor-pietra" width="40" height="30" patternUnits="userSpaceOnUse">
        <path d="M0 12L19 8 26 0M19 8l5 22M0 25l24 -4 16 6" stroke="#78958d" opacity=".32" fill="none" />
      </pattern>
      <pattern id="pc-wall-righe" width="17" height="18" patternUnits="userSpaceOnUse">
        <path d="M0 0V18M8 0V18" stroke="#d5a8a5" strokeWidth="3" opacity=".53" />
      </pattern>
      <pattern id="pc-wall-carta" width="28" height="34" patternUnits="userSpaceOnUse">
        <path d="M14 4q-12 12 0 23 12 -11 0 -23z" fill="none" stroke="#86ab97" strokeWidth="1.5" opacity=".45" />
        <circle cx="14" cy="15" r="2.5" fill="#9aab91" opacity=".55" />
      </pattern>
      <pattern id="pc-wall-basic" width="35" height="25" patternUnits="userSpaceOnUse">
        <path d="M0 24H35" stroke="#ffffff" strokeWidth="1" opacity=".35" />
      </pattern>
    </defs>
    {tiles.map(({ room, x, y }) => {
      const wx = room.offsetX + x, wy = room.offsetY + y;
      const top = polygon(wx, wy, 1, 1, 0, view);
      const bottom = polygon(wx, wy, 1, 1, -7, view);
      const key = `${room.id}/${x}/${y}`;
      return <g key={key} className={room.id === activeRoomId ? "pc-tile-active" : "pc-tile-passive"}
        onClick={() => onCell(room.id, x, y)} role="button" tabIndex={room.id === activeRoomId ? 0 : -1}
        aria-label={`${room.name}: casella ${x + 1}, ${y + 1}`}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onCell(room.id, x, y); } }}>
        <polygon points={pts([top[1], top[2], bottom[2], bottom[1]])} fill="#ad9481" />
        <polygon points={pts([top[2], top[3], bottom[3], bottom[2]])} fill="#927f73" />
        <polygon points={pts(top)} fill={floorColor[room.floor]} stroke="#ffffff9e" strokeWidth=".9" />
        <polygon points={pts(top)} fill={`url(#pc-floor-${room.floor})`} opacity=".76" pointerEvents="none" />
      </g>;
    })}
    {sculpt && visible.filter((room) => room.id === activeRoomId).flatMap((room) => {
      const active = new Set(room.cells);
      return Array.from({ length: room.width * room.height }, (_, i) => {
        const x = i % room.width, y = Math.floor(i / room.width);
        if (active.has(cellKey(x, y))) return null;
        const footprint = polygon(room.offsetX + x, room.offsetY + y, 0.99, .99, 0, view);
        return <polygon key={`void-${x}-${y}`} points={pts(footprint)}
          fill="#ecf6eb" opacity=".4" stroke="#538976" strokeDasharray="4 4" strokeWidth="2"
          onClick={() => onCell(room.id, x, y)} role="button" aria-label={`Aggiungi casella ${x + 1}, ${y + 1}`} />;
      });
    })}
    {tiles.flatMap(({ room, x, y }) => {
      const occupied = new Set(room.cells);
      const sides = [
        { dx: 0, dy: -1, normal: { x: 0, y: -1 }, a: [x, y], b: [x + 1, y] },
        { dx: 1, dy: 0, normal: { x: 1, y: 0 }, a: [x + 1, y], b: [x + 1, y + 1] },
        { dx: 0, dy: 1, normal: { x: 0, y: 1 }, a: [x + 1, y + 1], b: [x, y + 1] },
        { dx: -1, dy: 0, normal: { x: -1, y: 0 }, a: [x, y + 1], b: [x, y] },
      ];
      return sides.flatMap((side, i) => {
        const normal = transformNormal(side.normal.x, side.normal.y, view);
        if (occupied.has(cellKey(x + side.dx, y + side.dy)) || (normal.x > 0 || normal.y > 0)) return [];
        const a = side.a, b = side.b, wx = room.offsetX, wy = room.offsetY;
        const quad = [P(wx + a[0], wy + a[1], 0, view), P(wx + b[0], wy + b[1], 0, view),
          P(wx + b[0], wy + b[1], 64, view), P(wx + a[0], wy + a[1], 64, view)];
        return [<g key={`wall-${room.id}-${x}-${y}-${i}`} pointerEvents="none">
          <polygon points={pts(quad)} fill={wallColor[room.wall]} stroke="#8d837c60" strokeWidth="1.2" />
          <polygon points={pts(quad)} fill={`url(#pc-wall-${room.wall === "righe" || room.wall === "carta" ? room.wall : "basic"})`} opacity=".8" />
          <path d={`M ${quad[0].x} ${quad[3].y} L ${quad[1].x} ${quad[2].y}`} fill="none" stroke="#fff" strokeWidth="2" opacity=".65" />
        </g>];
      });
    })}
    {furniture.map(({ room, item }) => <g key={item.id} className="pc-furniture" role="button" tabIndex={0}
      aria-label={`Seleziona ${FURNITURE.find((spec) => spec.id === item.type)?.label} in ${room.name}`}
      onClick={(event) => { event.stopPropagation(); onObject(room.id, item.id); }}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onObject(room.id, item.id); } }}>
      <Furniture3D item={item} room={room} view={view} selected={selectedObject === item.id} />
    </g>)}
    {!visible.length && <text x="0" y="0" textAnchor="middle" fontSize="17" fill="#587269">Aggiungi una stanza su CuraCasa</text>}
  </svg>;
}
