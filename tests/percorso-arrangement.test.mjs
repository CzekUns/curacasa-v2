import test from "node:test";
import assert from "node:assert/strict";
import { newRoom, roomsOverlap } from "../src/lib/percorso.ts";
import { editHouseTile } from "../src/lib/percorso-grid.ts";
import {
  autoArrangeRooms, reconcileRoomArrangement, positionedRooms,
  changeRoomOrder, moveRoomInArrangement,
} from "../src/lib/percorso-arrangement.ts";

const create = () => ["Cucina","Salone","Bagno","Camera","Balcone"].map(newRoom);

test("house overview auto-layout does not require connected rooms",()=>{
  const rooms=create();
  const arrangement=autoArrangeRooms(rooms);
  const visible=positionedRooms(rooms,arrangement);
  assert.equal(visible.length,5);
  for(let i=0;i<visible.length;i++)
    for(let j=i+1;j<visible.length;j++)
      assert.equal(roomsOverlap(visible[i],visible[j]),false);
  assert.deepEqual(rooms[0].cells,newRoom("Cucina",0).cells);
});

test("changing room size never depends on the overview composition",()=>{
  const rooms=create();
  const arrangement=autoArrangeRooms(rooms);
  const positioned=positionedRooms(rooms,arrangement);
  const other=positioned.find(r=>r.name==="Salone");
  const edited=editHouseTile(rooms[0],positioned,5,1);
  assert.ok(edited.room);
  assert.equal(edited.room.width,6);
  assert.equal(edited.room.offsetX,rooms[0].offsetX);
  assert.deepEqual(arrangement.positions[other.id],{
    x:other.offsetX,y:other.offsetY,
  });
});

test("house dragging changes only overview positions, preserving tiles and furniture",()=>{
  const rooms=create();
  const salone=rooms[1];
  salone.furniture=[{id:"sofa",type:"divano",x:1,y:1,rotation:0}];
  const arrangement=autoArrangeRooms(rooms);
  const before=JSON.stringify(rooms);
  const moved=moveRoomInArrangement(rooms,arrangement,salone.id,25,25);
  assert.ok(moved.arrangement);
  assert.notDeepEqual(moved.arrangement.positions[salone.id],arrangement.positions[salone.id]);
  assert.equal(JSON.stringify(rooms),before);
  assert.equal(positionedRooms(rooms,moved.arrangement)[1].furniture[0].x,1);
});

test("manual overview placement rejects overlap without blocking room editing",()=>{
  const rooms=create();
  const arrangement=autoArrangeRooms(rooms);
  const [a,b]=positionedRooms(rooms,arrangement);
  const blocked=moveRoomInArrangement(rooms,arrangement,b.id,a.offsetX-b.offsetX,a.offsetY-b.offsetY);
  assert.equal(blocked.arrangement,null);
  const extended=editHouseTile(b,rooms,5,1);
  assert.ok(extended.room);
});

test("reordering rooms recomputes a legible approximate layout",()=>{
  const rooms=create();
  const layout=autoArrangeRooms(rooms);
  const moved=changeRoomOrder(rooms,layout,rooms[0].id,1);
  assert.equal(moved.order[1],rooms[0].id);
  assert.equal(moved.order[0],rooms[1].id);
  assert.deepEqual(new Set(moved.order),new Set(layout.order));
  assert.deepEqual(rooms[0],newRoom("Cucina",0));
});

test("restoring settings keeps user-defined positions while adding a new room",()=>{
  const rooms=create().slice(0,2);
  const layout=autoArrangeRooms(rooms);
  layout.positions[rooms[0].id]={x:17,y:11};
  const restored=reconcileRoomArrangement([...rooms,newRoom("Bagno",2)],layout);
  assert.deepEqual(restored.positions[rooms[0].id],{x:17,y:11});
  assert.ok(restored.positions.Bagno);
  assert.equal(restored.order.length,3);
});
