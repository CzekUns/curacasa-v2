import {
  canMoveRoom, toggleCell, type HouseRoom,
} from "./percorso.ts";

export type TileEditResult = { room: HouseRoom | null; reason: string };
const key = (x: number, y: number) => x + "," + y;
const neighbors = (x: number, y: number) =>
  [key(x-1,y),key(x+1,y),key(x,y-1),key(x,y+1)];

/**
 * A tile at the edge can extend an independent room by one row or column.
 * Its shape is never constrained by other rooms' overview positions.
 * Furniture remains at the same position relative to the existing tiles.
 */
export function editHouseTile(room: HouseRoom, _all: HouseRoom[], x: number, y: number): TileEditResult {
  // Keep the historical signature for callers, but never couple room geometry
  // to the purely illustrative placement of other rooms in the overview.
  void _all;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < -1 || y < -1 ||
    x > room.width || y > room.height) return {room:null,reason:"Casella non valida."};
  const expandX = x === -1 || x === room.width;
  const expandY = y === -1 || y === room.height;
  if (expandX && expandY) return {room:null,reason:"Aggiungi prima una casella sul lato."};
  const alreadyThere = room.cells.includes(key(x,y));
  if (!expandX && !expandY) {
    const changed = toggleCell(room,x,y);
    if (!changed) return {room:null,reason:alreadyThere
      ? "Non puoi dividere la stanza o togliere una casella sotto un mobile."
      : "La casella deve toccarne un'altra."};
    return {room:changed,reason:alreadyThere?"Casella rimossa.":"Casella aggiunta."};
  }
  if ((expandX && room.width >= 12) || (expandY && room.height >= 12))
    return {room:null,reason:"Dimensione massima della stanza: 12 tile per lato."};
  const filled = new Set(room.cells);
  if (!neighbors(x,y).some(cell=>filled.has(cell)))
    return {room:null,reason:"La nuova casella deve essere collegata al pavimento."};
  const shiftX = x===-1?1:0,shiftY = y===-1?1:0;
  const expanded: HouseRoom = {
    ...room,
    width:room.width+(expandX?1:0),
    height:room.height+(expandY?1:0),
    cells:room.cells.map(cell=>{
      const [cx,cy]=cell.split(",").map(Number);
      return key(cx+shiftX,cy+shiftY);
    }),
    furniture:room.furniture.map(item=>({...item,x:item.x+shiftX,y:item.y+shiftY})),
  };
  const changed=toggleCell(expanded,x+shiftX,y+shiftY);
  if (!changed) return {room:null,reason:"Non è possibile aggiungere questa casella."};
  return {room:changed,reason:"Stanza ampliata di una casella."};
}

/** Ghost placeholders on holes + the one-tile border, never over other cells. */
export function editableTileSlots(room: HouseRoom): Array<{x:number;y:number}> {
  const filled=new Set(room.cells);
  const slots=new Set<string>();
  for(const entry of room.cells){
    const [x,y]=entry.split(",").map(Number);
    for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
      if(nx < -1 || ny < -1 || nx > room.width || ny > room.height)continue;
      if((nx<0||nx>=room.width) && (ny<0||ny>=room.height))continue;
      if(!filled.has(key(nx,ny)))slots.add(key(nx,ny));
    }
  }
  return [...slots].map(entry=>{
    const [x,y]=entry.split(",").map(Number);
    return {x,y};
  });
}

export function moveHouseRoom(room:HouseRoom, all:HouseRoom[], deltaX:number, deltaY:number): TileEditResult {
  if(!Number.isInteger(deltaX)||!Number.isInteger(deltaY)||
    Math.abs(deltaX)>30||Math.abs(deltaY)>30)
    return {room:null,reason:"Spostamento fuori dai limiti."};
  const moved={...room,offsetX:room.offsetX+deltaX,offsetY:room.offsetY+deltaY};
  if(!canMoveRoom(all,moved)) return {room:null,reason:"Le stanze non possono sovrapporsi."};
  return {room:moved,reason:"Stanza spostata."};
}
