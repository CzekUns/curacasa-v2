import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { buildRoom, createFurniture, readSceneTheme, type RoomVisual } from "./three-room-model";
import {
  furnitureSize, validPlacement, type Direction, type Furniture,
  type FurnitureType, type HouseRoom,
} from "../../lib/percorso";
import { moveHouseRoom } from "../../lib/percorso-grid";
import { draggedFurniturePosition, tappedFurniturePosition, canDragFurniture } from "../../lib/percorso-furniture-touch";

export type GameMode = "play" | "furniture" | "finishes" | "tiles";
export type House3DHandle = {
  turn: (direction:-1|1)=>void;
  zoom: (factor:number)=>void;
  fit: ()=>void;
};
type Props = {
  room:HouseRoom;
  rooms:HouseRoom[];
  items:Furniture[];
  showAll:boolean;
  mode:GameMode;
  movingRooms:boolean;
  adding:FurnitureType|null;
  rotation:Direction;
  selectedId:string|null;
  movingFurnitureId:string|null;
  isShowcasePreview:boolean;
  showWalls:boolean;
  panelOpen:boolean;
  onPlace:(item:Furniture)=>void;
  onMove:(id:string,x:number,y:number)=>void;
  onSelect:(id:string|null)=>void;
  onPickRoom:(id:string)=>void;
  onMoveRoom:(id:string,dx:number,dy:number)=>void;
  onTile:(id:string,x:number,y:number)=>void;
  onFinish:(part:"floor"|"wall")=>void;
  onError:(message:string)=>void;
};
type Point = {x:number;y:number};
type Pick = {
  kind:"floor"|"missing"|"furniture"|"wall"|"label";
  roomId:string;
  itemId?:string;
  tile?:{x:number;y:number};
};
type Candidate = {x:number;y:number;valid:boolean};
type Gesture = {
  pointerId:number;start:Point;last:Point;moved:boolean;
  objectId:string|null;roomId:string|null;
  startWorld:THREE.Vector3|null;candidate:Candidate|null;
};
type Runtime = {
  turn:(direction:-1|1)=>void;
  zoom:(factor:number)=>void;
  fit:()=>void;
  rebuild:()=>void;
  preview:()=>void;
  selection:()=>void;
  draw:()=>void;
  dispose:()=>void;
};

/** One WebGL canvas for both a single room and the connected whole-house view. */
export const Room3DHouseScene = forwardRef<House3DHandle,Props>(function Room3DHouseScene(props,ref) {
  const hostRef=useRef<HTMLDivElement|null>(null);
  const runtimeRef=useRef<Runtime|null>(null);
  const current=useRef(props);
  current.current=props;
  const [error,setError]=useState("");

  useImperativeHandle(ref,()=>({
    turn:(direction)=>runtimeRef.current?.turn(direction),
    zoom:(factor)=>runtimeRef.current?.zoom(factor),
    fit:()=>runtimeRef.current?.fit(),
  }),[]);

  useEffect(()=>{
    const host=hostRef.current;
    if(!host)return;
    let renderer:THREE.WebGLRenderer;
    try {
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"low-power"});
    } catch {
      setError("Grafica 3D non disponibile in questo browser. Torna alla Home di CuraCasa.");
      return;
    }
    renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
    renderer.setClearColor(0xffffff,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.27;
    const canvas=renderer.domElement;
    canvas.className="game3d-canvas";
    canvas.setAttribute("aria-label","Casa isometrica: un dito ruota, due dita ingrandiscono o spostano. In Tile tocca le caselle.");
    host.append(canvas);
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-5,5,5,-5,.1,150);
    scene.add(new THREE.AmbientLight(0xffffff,2));
    const sun=new THREE.DirectionalLight(0xffffff,2);
    sun.position.set(-3,9,8);scene.add(sun);
    const fill=new THREE.DirectionalLight(0xfce6d8,.65);
    fill.position.set(8,5,-3);scene.add(fill);
    let activeColors=readSceneTheme();
    const groundGeo=new THREE.CircleGeometry(32,64);
    const groundMat=new THREE.MeshBasicMaterial({
      color:activeColors.soft,transparent:true,opacity:.13,depthWrite:false,
    });
    const ground=new THREE.Mesh(groundGeo,groundMat);
    ground.rotation.x=-Math.PI/2;ground.position.y=-.22;scene.add(ground);

    const models=new Map<string,RoomVisual>();
    let ghost:THREE.Group|null=null;
    let selection:THREE.Mesh|null=null;
    let frame=0,disposed=false;
    let yaw=Math.PI/4,targetYaw=yaw,pitch=.85;
    let zoom=1,targetZoom=1;
    const pan=new THREE.Vector3();
    let viewport={width:1,height:1};
    const pointers=new Map<number,Point>();
    let gesture:Gesture|null=null;
    let pinch:{distance:number;mid:Point;zoom:number}|null=null;
    const raycaster=new THREE.Raycaster();
    const point2=new THREE.Vector2();
    const floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const intersectPoint=new THREE.Vector3();

    const visibleRooms=()=>{
      const p=current.current;
      return p.showAll?p.rooms:[p.room];
    };
    function frameCamera() {
      const p=current.current;
      const rooms=visibleRooms();
      if(!rooms.length)return;
      const minX=Math.min(...rooms.map(r=>r.offsetX));
      const maxX=Math.max(...rooms.map(r=>r.offsetX+r.width));
      const minZ=Math.min(...rooms.map(r=>r.offsetY));
      const maxZ=Math.max(...rooms.map(r=>r.offsetY+r.height));
      const center=new THREE.Vector3((minX+maxX)/2,.56,(minZ+maxZ)/2).add(pan);
      const direction=new THREE.Vector3(Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch),Math.sin(yaw)*Math.cos(pitch));
      camera.position.copy(center).addScaledVector(direction,35);
      camera.lookAt(center);
      camera.updateMatrixWorld(true);
      const projected:THREE.Vector3[]=[];
      for(const x of [minX,maxX])for(const z of [minZ,maxZ])for(const y of [-.15,3.25]){
        projected.push(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
      }
      const xSpan=Math.max(...projected.map(p=>p.x))-Math.min(...projected.map(p=>p.x));
      const ySpan=Math.max(...projected.map(p=>p.y))-Math.min(...projected.map(p=>p.y));
      const aspect=viewport.width/Math.max(1,viewport.height);
      const freeSpace=p.panelOpen?.62:.83;
      const worldHeight=Math.max(ySpan/freeSpace,xSpan/Math.max(.2,aspect)/.88,5.4)/
        Math.max(.55,Math.min(3,zoom));
      camera.left=-worldHeight*aspect/2;camera.right=worldHeight*aspect/2;
      camera.top=worldHeight/2;camera.bottom=-worldHeight/2;
      camera.updateProjectionMatrix();
      if(p.panelOpen){
        const vertical=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
        camera.position.addScaledVector(vertical,-worldHeight*.13);
        camera.updateMatrixWorld(true);
      }
    }
    function requestDraw(){
      if(disposed||frame)return;
      frame=requestAnimationFrame(()=>{frame=0;render();});
    }
    function render(){
      if(disposed)return;
      if(Math.abs(targetYaw-yaw)>.002 || Math.abs(targetZoom-zoom)>.002){
        yaw+=(targetYaw-yaw)*.24;
        zoom+=(targetZoom-zoom)*.22;
        requestDraw();
      } else {yaw=targetYaw;zoom=targetZoom;}
      frameCamera();
      const p=current.current;
      const facing=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw));
      models.forEach((model,id)=>{
        model.objects.forEach(obj=>{obj.visible=p.mode!=="tiles";});
        model.walls.forEach(({mesh,normal})=>{
          const faded=facing.dot(normal)>.1;
          mesh.visible=p.showWalls && p.mode!=="tiles";
          mesh.traverse(node=>{
            if(node instanceof THREE.Mesh){
              const mats=Array.isArray(node.material)?node.material:[node.material];
              for(const mat of mats) {
                mat.transparent=true;mat.opacity=faded ? .12 : 1;mat.depthWrite=!faded;
              }
            }
          });
        });
        // Each model preserves its room-specific floor materials and position.
        void id;
      });
      renderer.render(scene,camera);
    }
    function freeGroup(group:THREE.Group){
      group.traverse(node=>{
        if(node instanceof THREE.Mesh){
          node.geometry.dispose();
          for(const mat of Array.isArray(node.material)?node.material:[node.material])mat.dispose();
        }
      });
    }
    function clearGhost(){if(ghost){scene.remove(ghost);freeGroup(ghost);ghost=null;}}
    function makeGhost(){
      clearGhost();
      const p=current.current;
      if(p.mode!=="furniture"||!p.adding || p.showAll)return;
      const sample:Furniture={id:"preview",type:p.adding,x:0,y:0,rotation:p.rotation};
      ghost=createFurniture(sample);
      ghost.traverse(node=>{
        if(node instanceof THREE.Mesh){
          const cloned=(node.material as THREE.MeshStandardMaterial).clone();
          (node.material as THREE.Material).dispose();
          node.material=cloned;
          cloned.transparent=true;cloned.opacity=.53;cloned.depthWrite=false;
        }
      });
      ghost.visible=false;scene.add(ghost);
    }
    function updateSelection(){
      if(selection){
        scene.remove(selection);selection.geometry.dispose();
        (selection.material as THREE.Material).dispose();selection=null;
      }
      const p=current.current;
      if(!p.selectedId)return;
      const obj=p.items.find(item=>item.id===p.selectedId);
      if(!obj)return;
      const sz=furnitureSize(obj);
      selection=new THREE.Mesh(
        new THREE.BoxGeometry(sz.width+.08,.02,sz.height+.08),
        new THREE.MeshBasicMaterial({color:activeColors.accent,transparent:true,opacity:.30,depthWrite:false}),
      );
      selection.position.set(p.room.offsetX+obj.x+sz.width/2,.03,
        p.room.offsetY+obj.y+sz.height/2);
      scene.add(selection);
    }
    function rebuild(){
      for(const model of models.values()){scene.remove(model.root);model.dispose();}
      models.clear();
      const p=current.current;
      for(const room of visibleRooms()){
        const items=room.id===p.room.id?p.items:room.furniture;
        const model=buildRoom(room,items,
          p.mode==="tiles"&&!p.movingRooms&&room.id===p.room.id,
          p.showAll && room.id!==p.room.id,activeColors);
        models.set(room.id,model);
        scene.add(model.root);
      }
      makeGhost();
      updateSelection();
      requestDraw();
    }
    function setRay(x:number,y:number){
      const rect=canvas.getBoundingClientRect();
      point2.set((x-rect.left)/Math.max(1,rect.width)*2-1,
        -((y-rect.top)/Math.max(1,rect.height)*2-1));
      raycaster.setFromCamera(point2,camera);
    }
    function worldOnFloor(x:number,y:number){
      setRay(x,y);
      const result=raycaster.ray.intersectPlane(floorPlane,intersectPoint);
      return result?result.clone():null;
    }
    function roomOf(node:THREE.Object3D):string|null {
      let candidate:THREE.Object3D|null=node;
      while(candidate){
        if(typeof candidate.userData.roomId==="string")return candidate.userData.roomId;
        candidate=candidate.parent;
      }
      return null;
    }
    function pick(x:number,y:number):Pick|null{
      setRay(x,y);
      const roots=[...models.values()].map(v=>v.root);
      for(const hit of raycaster.intersectObjects(roots,true)){
        const node=hit.object;
        // Three.js raycasting can still return invisible walls/objects. Never
        // let a visually hidden surface steal a furniture tap.
        let ancestor:THREE.Object3D|null=node, isVisible=true;
        while(ancestor){if(!ancestor.visible){isVisible=false;break;}ancestor=ancestor.parent;}
        if(!isVisible)continue;
        const roomId=roomOf(node);
        if(!roomId)continue;
        if(node.userData.roomLabel) return {kind:"label",roomId};
        // The old floor mesh is behind the furniture; in tile mode the renderer
        // hides furniture and walls so a tap always selects the floor itself.
        if(typeof node.userData.furnitureId==="string") {
          if(current.current.mode==="tiles")continue;
          return {kind:"furniture",roomId,itemId:node.userData.furnitureId};
        }
        if(node.userData.wall || node.parent?.userData.wall){
          if(current.current.mode==="tiles")continue;
          const wall=node.userData.wall?node:node.parent;
          if(wall instanceof THREE.Mesh &&
            (wall.material as THREE.MeshStandardMaterial).opacity<.2)continue;
          return {kind:"wall",roomId};
        }
        if(node.userData.tile){
          const tile=node.userData.tile as {x:number;y:number;missing?:boolean};
          return {kind:tile.missing?"missing":"floor",roomId,tile:{x:tile.x,y:tile.y}};
        }
      }
      return null;
    }
    function ghostAt(x:number,y:number):Candidate|null{
      const p=current.current;
      if(!ghost||!p.adding)return null;
      const hit=worldOnFloor(x,y);
      if(!hit){ghost.visible=false;requestDraw();return null;}
      const footprint=furnitureSize({id:"preview",type:p.adding,x:0,y:0,rotation:p.rotation});
      const gx=Math.round(hit.x-p.room.offsetX-footprint.width/2);
      const gy=Math.round(hit.z-p.room.offsetY-footprint.height/2);
      const spec:Furniture={id:"preview",type:p.adding,x:gx,y:gy,rotation:p.rotation};
      const valid=validPlacement(p.room,spec);
      ghost.visible=true;
      ghost.position.set(p.room.offsetX+gx+footprint.width/2,.045,
        p.room.offsetY+gy+footprint.height/2);
      ghost.traverse(node=>{
        if(node instanceof THREE.Mesh){
          const mat=node.material as THREE.MeshStandardMaterial;
          mat.color.set(valid?activeColors.finish:"#ef9a9b");mat.opacity=.53;
        }
      });
      requestDraw();
      return {x:gx,y:gy,valid};
    }
    function moveFurniture(id:string,x:number,y:number,startWorld:THREE.Vector3|null):Candidate|null{
      const p=current.current;
      const item=p.items.find(obj=>obj.id===id);
      const hit=worldOnFloor(x,y);
      if(!item||!hit||!startWorld)return null;
      const candidate=draggedFurniturePosition(p.room,item,startWorld,hit);
      const gx=candidate.x,gy=candidate.y,valid=candidate.valid;
      const sz=furnitureSize(item);
      const obj=models.get(p.room.id)?.objects.get(id);
      if(obj){
        obj.position.set(gx+sz.width/2,.035,gy+sz.height/2);
        obj.traverse(node=>{
          if(node instanceof THREE.Mesh){
            const mat=node.material as THREE.MeshStandardMaterial;
            mat.emissive.set(valid?activeColors.finish:"#6b111d");
            mat.emissiveIntensity=.2;
          }
        });
      }
      requestDraw();
      return {x:gx,y:gy,valid};
    }
    function moveRoomPreview(id:string, start:THREE.Vector3|null, x:number,y:number):Candidate|null{
      if(!start)return null;
      const point=worldOnFloor(x,y);
      const p=current.current;
      const room=p.rooms.find(room=>room.id===id);
      if(!point||!room)return null;
      const dx=Math.round(point.x-start.x),dy=Math.round(point.z-start.z);
      const changed=moveHouseRoom(room,p.rooms,dx,dy);
      const model=models.get(id);
      if(model){
        model.root.position.set(room.offsetX+dx,0,room.offsetY+dy);
      }
      requestDraw();
      return {x:dx,y:dy,valid:!!changed.room};
    }
    function onDown(e:PointerEvent){
      if(e.pointerType==="mouse"&&e.button!==0)return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const pos={x:e.clientX,y:e.clientY};
      pointers.set(e.pointerId,pos);
      if(pointers.size>=2){
        const [a,b]=[...pointers.values()];
        pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),
          mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},zoom:targetZoom};
        gesture=null;return;
      }
      const hit=pick(pos.x,pos.y);
      const p=current.current;
      const selectedFurniture = hit?.kind==="furniture" && hit.roomId===p.room.id &&
        !p.showAll && !p.isShowcasePreview;
      const movableObject = selectedFurniture &&
        canDragFurniture(hit?.itemId??null,p.mode,p.movingFurnitureId,
          Boolean(p.adding),p.isShowcasePreview);
      gesture={
        pointerId:e.pointerId,start:pos,last:pos,moved:false,candidate:null,
        objectId:movableObject?hit?.itemId??null:null,
        roomId:p.showAll&&p.movingRooms?hit?.roomId??null:null,
        startWorld:(p.showAll&&p.movingRooms)||movableObject ?
          worldOnFloor(pos.x,pos.y):null,
      };
      if(p.mode==="furniture"&&p.adding)ghostAt(pos.x,pos.y);
    }
    function onMove(e:PointerEvent){
      if(!pointers.has(e.pointerId))return;
      const pos={x:e.clientX,y:e.clientY};
      pointers.set(e.pointerId,pos);
      if(pinch&&pointers.size>=2){
        const [a,b]=[...pointers.values()];
        const d=Math.max(20,Math.hypot(a.x-b.x,a.y-b.y));
        targetZoom=Math.max(.55,Math.min(3,pinch.zoom*d/Math.max(20,pinch.distance)));
        const m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        const worldStep=(camera.top-camera.bottom)/Math.max(1,viewport.height);
        const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);
        const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
        pan.addScaledVector(right,-(m.x-pinch.mid.x)*worldStep);
        pan.addScaledVector(up,(m.y-pinch.mid.y)*worldStep);
        pinch.mid=m;pinch.distance=d;pinch.zoom=targetZoom;
        requestDraw();return;
      }
      if(!gesture||gesture.pointerId!==e.pointerId)return;
      const dx=pos.x-gesture.last.x,dy=pos.y-gesture.last.y;
      gesture.last=pos;
      if(Math.hypot(pos.x-gesture.start.x,pos.y-gesture.start.y)>7)gesture.moved=true;
      if(!gesture.moved)return;
      const p=current.current;
      if(p.showAll && p.movingRooms && gesture.roomId){
        gesture.candidate=moveRoomPreview(gesture.roomId,gesture.startWorld,pos.x,pos.y);
      } else if(p.mode==="furniture" && p.adding && !p.showAll){
        gesture.candidate=ghostAt(pos.x,pos.y);
      } else if(gesture.objectId) {
        gesture.candidate=moveFurniture(gesture.objectId,pos.x,pos.y,gesture.startWorld);
      } else {
        yaw+=dx*.012;targetYaw=yaw;
        pitch=Math.max(.48,Math.min(1.15,pitch+dy*.003));
        requestDraw();
      }
    }
    function onUp(e:PointerEvent){
      if(!pointers.has(e.pointerId))return;
      const pos={x:e.clientX,y:e.clientY};
      pointers.delete(e.pointerId);
      if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
      if(pinch || pointers.size>0){
        if(pointers.size<2)pinch=null;
        gesture=null;return;
      }
      if(!gesture||gesture.pointerId!==e.pointerId)return;
      const active=gesture;gesture=null;
      if(e.type==="pointercancel"){rebuild();return;}
      const p=current.current;
      if(p.showAll&&p.movingRooms&&active.roomId&&active.moved){
        const candidate=active.candidate;
        if(candidate?.valid&&(candidate.x!==0||candidate.y!==0))
          p.onMoveRoom(active.roomId,candidate.x,candidate.y);
        else {
          rebuild();
          if(candidate&&!candidate.valid)p.onError("Le stanze non possono sovrapporsi.");
        }
        return;
      }
      if(p.mode==="furniture"&&p.adding&&!p.showAll){
        const candidate=ghostAt(pos.x,pos.y);
        if(candidate?.valid)p.onPlace({
          id:"arredo_"+crypto.randomUUID(),
          type:p.adding,rotation:p.rotation,x:candidate.x,y:candidate.y,
        });
        else p.onError("Questo mobile non entra qui.");
        return;
      }
      if(active.objectId&&active.moved){
        const candidate=active.candidate;
        const old=p.items.find(item=>item.id===active.objectId);
        if(candidate?.valid&&old&&(old.x!==candidate.x||old.y!==candidate.y))
          p.onMove(active.objectId,candidate.x,candidate.y);
        else {
          rebuild();
          if(candidate&&!candidate.valid)p.onError("Posizione occupata: mobile ripristinato.");
        }
        return;
      }
      if(active.moved)return;
      const hit=pick(pos.x,pos.y);
      if(p.movingFurnitureId && !p.isShowcasePreview &&
        (hit?.kind==="floor" || hit?.kind==="missing")) {
        const item=p.items.find(v=>v.id===p.movingFurnitureId);
        const ground=worldOnFloor(pos.x,pos.y);
        if(item && ground) {
          const candidate=tappedFurniturePosition(p.room,item,ground);
          if(candidate.valid) {
            if(candidate.x!==item.x || candidate.y!==item.y)
              p.onMove(item.id,candidate.x,candidate.y);
            else p.onSelect(item.id);
          } else p.onError("Qui non c'è spazio. Tocca un tile libero.");
        }
        return;
      }
      // Any single tap in the overview enters that room. No extra "select" step.
      if(hit&&p.showAll) {
        p.onPickRoom(hit.roomId);
        return;
      }
      if(hit&&p.mode==="tiles"&&!p.movingRooms&&hit.tile) {
        p.onTile(hit.roomId,hit.tile.x,hit.tile.y);return;
      }
      if(hit?.kind==="furniture"){
        p.onSelect(hit.itemId??null);return;
      }
      if(p.mode==="finishes"&&hit&&(hit.kind==="floor"||hit.kind==="wall")) {
        p.onFinish(hit.kind);return;
      }
      p.onSelect(null);
    }
    function resize(){
      const rect=host?.getBoundingClientRect();
      if(!rect||rect.width<1||rect.height<1)return;
      viewport={width:rect.width,height:rect.height};
      renderer.setSize(Math.floor(rect.width),Math.floor(rect.height),false);
      requestDraw();
    }
    function onLost(e:Event) {
      e.preventDefault();
      setError("La grafica 3D si è interrotta. Puoi tornare alla Home di CuraCasa.");
    }
    // The five themes are shared with Home and Shop. Rebuild only on a theme
    // change: scene objects keep their own paints and furniture textures.
    function refreshSceneTheme(){
      activeColors=readSceneTheme();
      groundMat.color.set(activeColors.soft);
      rebuild();
    }
    const observer=new ResizeObserver(resize);
    observer.observe(host);
    window.addEventListener("curacasa-theme-changed",refreshSceneTheme);
    window.addEventListener("storage",refreshSceneTheme);
    canvas.addEventListener("pointerdown",onDown);
    canvas.addEventListener("pointermove",onMove);
    canvas.addEventListener("pointerup",onUp);
    canvas.addEventListener("pointercancel",onUp);
    canvas.addEventListener("webglcontextlost",onLost);
    const runtime:Runtime={
      turn(d){targetYaw+=d*Math.PI/2;requestDraw();},
      zoom(f){targetZoom=Math.max(.55,Math.min(3,targetZoom*f));requestDraw();},
      fit(){pan.set(0,0,0);zoom=1;targetZoom=1;pitch=.85;
        targetYaw=Math.PI/4;yaw=targetYaw;requestDraw();},
      rebuild,
      preview(){makeGhost();requestDraw();},
      selection(){updateSelection();requestDraw();},
      draw:requestDraw,
      dispose(){
        disposed=true;
        observer.disconnect();
        window.removeEventListener("curacasa-theme-changed",refreshSceneTheme);
        window.removeEventListener("storage",refreshSceneTheme);
        if(frame)cancelAnimationFrame(frame);
        canvas.removeEventListener("pointerdown",onDown);
        canvas.removeEventListener("pointermove",onMove);
        canvas.removeEventListener("pointerup",onUp);
        canvas.removeEventListener("pointercancel",onUp);
        canvas.removeEventListener("webglcontextlost",onLost);
        clearGhost();
        if(selection){scene.remove(selection);selection.geometry.dispose();
          (selection.material as THREE.Material).dispose();}
        for(const model of models.values()){scene.remove(model.root);model.dispose();}
        models.clear();
        groundGeo.dispose();groundMat.dispose();
        renderer.dispose();canvas.remove();
      },
    };
    runtimeRef.current=runtime;
    rebuild();resize();
    return ()=>{runtime.dispose();runtimeRef.current=null;};
  },[]);

  useEffect(()=>{runtimeRef.current?.rebuild();},
    [props.room,props.rooms,props.items,props.showAll,props.mode,props.movingRooms]);
  useEffect(()=>{runtimeRef.current?.preview();},[props.adding,props.rotation]);
  useEffect(()=>{runtimeRef.current?.selection();},[props.selectedId]);
  useEffect(()=>{runtimeRef.current?.draw();},[props.showWalls,props.panelOpen]);
  useEffect(()=>{runtimeRef.current?.fit();},[props.showAll,props.room.id]);

  return <div ref={hostRef} className="game3d-scene">
    {error&&<div className="game3d-error" role="alert">{error}</div>}
  </div>;
});
