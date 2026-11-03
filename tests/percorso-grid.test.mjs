import test from "node:test";
import assert from "node:assert/strict";
import { newRoom } from "../src/lib/percorso.ts";
import { editHouseTile, editableTileSlots, moveHouseRoom } from "../src/lib/percorso-grid.ts";

test("tile editing removes and restores one tile without losing the rest",()=>{
  const room=newRoom("Salone",0);
  const removed=editHouseTile(room,[room],0,0);
  assert.ok(removed.room);
  assert.equal(removed.room.cells.length,19);
  assert.equal(room.cells.length,20);
  assert.ok(editableTileSlots(removed.room).some(v=>v.x===0&&v.y===0));
  const restored=editHouseTile(removed.room,[removed.room],0,0);
  assert.ok(restored.room);
  assert.deepEqual(new Set(restored.room.cells),new Set(room.cells));
});

test("editing an outside tile extends east without filling the entire new column",()=>{
  const room=newRoom("Cucina",0);
  const changed=editHouseTile(room,[room],5,1);
  assert.ok(changed.room);
  assert.equal(changed.room.width,6);
  assert.equal(changed.room.cells.length,21);
  assert.ok(changed.room.cells.includes("5,1"));
  assert.ok(!changed.room.cells.includes("5,0"));
});

test("expansion to north and west preserves original absolute coordinates and furniture",()=>{
  const room=newRoom("Salone",0);
  room.furniture=[{id:"sofa",type:"divano",x:1,y:1,rotation:0}];
  const x=editHouseTile(room,[room],-1,1);
  assert.ok(x.room);
  assert.equal(x.room.offsetX,-1);
  assert.equal(x.room.furniture[0].x,2);
  assert.ok(x.room.cells.includes("1,1"));
  const y=editHouseTile(x.room,[x.room],1,-1);
  assert.ok(y.room);
  assert.equal(y.room.offsetY,-1);
  assert.equal(y.room.furniture[0].y,2);
});

test("cannot remove tile underneath furniture or split a room",()=>{
  const room=newRoom("Salone",0);
  room.furniture=[{id:"seat",type:"sedia",x:1,y:1,rotation:0}];
  assert.equal(editHouseTile(room,[room],1,1).room,null);
  const bridge={...newRoom("Balcone",0),width:3,height:1,cells:["0,0","1,0","2,0"]};
  assert.equal(editHouseTile(bridge,[bridge],1,0).room,null);
});

test("expansion rejects overlap with adjacent room",()=>{
  const a=newRoom("Cucina",0), b=newRoom("Salone",1);
  b.offsetX=5;b.offsetY=0;
  assert.equal(editHouseTile(a,[a,b],5,1).room,null);
});

test("whole-house room drag stays collision safe and keeps furniture local",()=>{
  const a=newRoom("Cucina",0), b=newRoom("Salone",1);
  b.furniture=[{id:"sofa",type:"divano",x:1,y:1,rotation:0}];
  const moved=moveHouseRoom(b,[a,b],2,-1);
  assert.ok(moved.room);
  assert.equal(moved.room.offsetX,b.offsetX+2);
  assert.equal(moved.room.furniture[0].x,1);
  assert.equal(moveHouseRoom(b,[a,b],-4,0).room,null);
});

test("tile previews do not include existing tiles and reach the outer boundary",()=>{
  const room=newRoom("Camera",0);
  const slots=editableTileSlots(room);
  assert.ok(slots.some(s=>s.x===room.width&&s.y===1));
  assert.ok(slots.some(s=>s.x===-1&&s.y===1));
  assert.ok(slots.every(s=>!room.cells.includes(s.x+","+s.y)));
});
