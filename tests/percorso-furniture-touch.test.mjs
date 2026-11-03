import test from "node:test";
import assert from "node:assert/strict";
import { newRoom } from "../src/lib/percorso.ts";
import {
  canDragFurniture, draggedFurniturePosition, tappedFurniturePosition,
} from "../src/lib/percorso-furniture-touch.ts";

const furnished = () => {
  const room=newRoom("Salone",0);
  room.furniture=[
    {id:"sofa",type:"divano",x:1,y:1,rotation:0},
    {id:"plant",type:"pianta",x:4,y:1,rotation:0},
  ];
  return room;
};

test("dragging a furniture item preserves the exact finger pickup offset",()=>{
  const room=furnished(), sofa=room.furniture[0];
  const a=draggedFurniturePosition(room,sofa,{x:2.2,z:1.6},{x:2.4,z:1.8});
  assert.deepEqual(a,{x:1,y:1,valid:true},"small movements do not snap to an unrelated tile");
  const b=draggedFurniturePosition(room,sofa,{x:2.2,z:1.6},{x:3.2,z:2.6});
  assert.deepEqual(b,{x:2,y:2,valid:true},"one-cell drag uses delta from pickup, not mouse center");
  assert.equal(sofa.x,1);
  assert.equal(sofa.y,1);
});

test("dragging rejects a collision, removed tiles or out-of-bounds destination",()=>{
  const room=furnished(), sofa=room.furniture[0];
  const hit=draggedFurniturePosition(room,sofa,{x:2,z:1.5},{x:4,z:1.5});
  assert.equal(hit.valid,false,"the sofa cannot overlap the plant");
  const outside=draggedFurniturePosition(room,sofa,{x:2,z:1.5},{x:10,z:1.5});
  assert.equal(outside.valid,false);
  const hole={...room,cells:room.cells.filter(cell=>cell!=="2,2")};
  const removed=draggedFurniturePosition(hole,sofa,{x:2,z:1.5},{x:3,z:2.5});
  assert.equal(removed.valid,false);
});

test("tap-to-move compensates for room overview offsets",()=>{
  const room=furnished();
  room.offsetX=17;room.offsetY=-6;
  const item=room.furniture[0];
  const move=tappedFurniturePosition(room,item,{x:17+3+1,z:-6+2+.5});
  assert.deepEqual(move,{x:3,y:2,valid:true});
  assert.equal(room.furniture[0].x,1,"a preview never changes the original position");
});

test("tap-to-move respects rotated furniture footprints",()=>{
  const room=newRoom("Cucina",0);
  const item={id:"cab",type:"armadio",x:1,y:1,rotation:1};
  room.furniture=[item];
  const result=tappedFurniturePosition(room,item,{x:3.5,z:2});
  assert.equal(result.x,3);
  assert.equal(result.y,1);
  assert.equal(result.valid,true);
});

test("normal camera drags cannot accidentally move furniture",()=>{
  assert.equal(canDragFurniture("sofa","play",null,false,false),false);
  assert.equal(canDragFurniture(null,"play",null,false,false),false);
  assert.equal(canDragFurniture("sofa","play","sofa",false,false),true);
  assert.equal(canDragFurniture("plant","play","sofa",false,false),false);
  assert.equal(canDragFurniture("sofa","furniture",null,false,false),true);
  assert.equal(canDragFurniture("sofa","furniture",null,true,false),false);
  assert.equal(canDragFurniture("sofa","furniture",null,false,true),false);
  assert.equal(canDragFurniture("sofa","tiles","sofa",false,true),false);
});
