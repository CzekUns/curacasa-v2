import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { FURNITURE, newRoom, reconcileHouse, validPlacement } from "../src/lib/percorso.ts";
import {
  FURNITURE_SKINS, DEFAULT_FURNITURE_SKIN, isFurnitureSkinId, normalizeFurnitureSkinId
} from "../src/lib/percorso-furniture-skins.ts";
import { createFurniture } from "../src/components/percorso/three-room-model.ts";

test("Seven separately selectable visual styles exist for all catalogue objects",()=>{
  assert.equal(FURNITURE_SKINS.length,7);
  assert.equal(DEFAULT_FURNITURE_SKIN,"illustrata");
  assert.equal(new Set(FURNITURE_SKINS.map(s=>s.id)).size,7);
  assert.equal(FURNITURE.length,106);
  for(const style of FURNITURE_SKINS){
    assert.ok(isFurnitureSkinId(style.id));
    assert.ok(style.label);
    assert.ok(/^#[0-9a-fA-F]{6}$/.test(style.swatch));
  }
  assert.equal(normalizeFurnitureSkinId("invalid"),"illustrata");
  assert.equal(normalizeFurnitureSkinId(undefined),"illustrata");
});

test("House saves keep independent skins on each piece without changing its grid footprint",()=>{
  const room=newRoom("Salone",0);
  const pieces=[
    {id:"a",type:"divano",x:0,y:0,rotation:0,skin:"illustrata"},
    {id:"b",type:"poltrona",x:3,y:0,rotation:1,skin:"vintage60"},
    {id:"c",type:"pianta",x:4,y:3,rotation:0,skin:"claytoon"},
  ];
  room.furniture=pieces;
  const restored=reconcileHouse(["Salone"],{version:1,rooms:[room]});
  assert.deepEqual(restored.rooms[0].furniture,pieces);
  for(const piece of pieces)assert.ok(validPlacement(restored.rooms[0],piece,piece.id));
  const invalid=reconcileHouse(["Salone"],{version:1,rooms:[{...room,furniture:[{...pieces[0],skin:"not-a-skin"}]}]});
  assert.equal(invalid.rooms[0].furniture[0].skin,undefined);
});

test("The illustrated material has actual outlines and softened models, original mode stays standard",()=>{
  const basic={id:"sample",type:"frigo",x:0,y:0,rotation:0};
  const illustrated=createFurniture({...basic,skin:"illustrata"});
  const original=createFurniture({...basic,skin:"originale"});
  const materials=(root)=>{const all=[];root.traverse(n=>{if(n instanceof THREE.Mesh) all.push(n.material);});return all;};
  const outlines=(root)=>{let total=0;root.traverse(n=>{if(n instanceof THREE.LineSegments)total++;});return total;};
  assert.ok(materials(illustrated).some(m=>m instanceof THREE.MeshToonMaterial));
  assert.ok(outlines(illustrated)>0);
  assert.ok(materials(original).every(m=>m instanceof THREE.MeshStandardMaterial));
  assert.equal(outlines(original),0);
  assert.deepEqual(illustrated.position.toArray(),original.position.toArray());
});

test("All seven skins render individual legacy and newly added 3D objects",()=>{
  for(const style of FURNITURE_SKINS){
    for(const type of ["divano","letto","lavatrice","wc","addolcitore-manutenzione",
      "robot-aspirapolvere","poltrona","tende-esterno"]){
      const group=createFurniture({id:"asset",type,x:1,y:1,rotation:3,skin:style.id});
      let meshCount=0;
      group.traverse(node=>{if(node instanceof THREE.Mesh){
        meshCount++;
        assert.ok(node.material,"Each rendered piece has a material");
      }});
      assert.ok(meshCount>0,style.id+" / "+type);
    }
  }
});
