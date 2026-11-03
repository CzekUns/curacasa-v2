import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { createFurniture, buildRoom, type RoomVisual } from "./three-room-model";
import { furnitureSize, validPlacement, type Direction, type Furniture, type FurnitureType, type HouseRoom } from "../../lib/percorso";

export type Room3DMode = "play" | "furniture" | "finishes";
export type Room3DHandle = {
  turn: (direction: -1 | 1) => void;
  zoom: (factor: number) => void;
  fit: () => void;
};
type Props = {
  room: HouseRoom;
  items: Furniture[];
  mode: Room3DMode;
  adding: FurnitureType | null;
  rotation: Direction;
  selectedId: string | null;
  showWalls: boolean;
  panelOpen: boolean;
  onPlace: (item: Furniture) => void;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onFinish: (part: "wall" | "floor") => void;
  onError: (message: string) => void;
};
type Pointer = { x: number; y: number };
type Drag = {
  id: number; start: Pointer; last: Pointer; moved: boolean;
  objectId: string | null;
  candidate: { x:number; y:number; valid:boolean } | null;
};
type Runtime = {
  turn: (direction: -1 | 1) => void;
  zoom: (factor: number) => void;
  fit: () => void;
  dispose: () => void;
  rebuild: () => void;
  updatePreview: () => void;
  draw: () => void;
};

export const Room3DScene = forwardRef<Room3DHandle, Props>(function Room3DScene(props, ref) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const [unavailable, setUnavailable] = useState("");

  useImperativeHandle(ref, () => ({
    turn: (direction) => runtimeRef.current?.turn(direction),
    zoom: (factor) => runtimeRef.current?.zoom(factor),
    fit: () => runtimeRef.current?.fit(),
  }), []);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      setUnavailable("WebGL non è disponibile in questo browser. Usa il Percorso classico.");
      return;
    }
    renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio || 1));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.domElement.className = "game3d-canvas";
    renderer.domElement.setAttribute("aria-label", "Stanza 3D interattiva, trascina per ruotare, due dita per lo zoom");
    host.append(renderer.domElement);
    const canvas = renderer.domElement;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5,5,5,-5,.1,100);
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    const keyLight = new THREE.DirectionalLight(0xffffff,2.0);
    keyLight.position.set(-3,9,8);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xfce6d8,.65);
    fillLight.position.set(8,5,-3);
    scene.add(fillLight);

    // Soft ground below the whole room, for the dollhouse appearance.
    const groundGeometry = new THREE.CircleGeometry(16,64);
    const groundMaterial = new THREE.MeshBasicMaterial({ color:0xcedfd0,transparent:true,opacity:.16,depthWrite:false });
    const ground = new THREE.Mesh(groundGeometry,groundMaterial);
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -.19;
    scene.add(ground);
    let model: RoomVisual | null = null;
    let ghost: THREE.Group | null = null;
    let selection: THREE.Mesh | null = null;
    let yaw = Math.PI/4, targetYaw = yaw, pitch = .85;
    let zoom = 1, targetZoom = 1;
    const pan = new THREE.Vector3(0,0,0);
    const pointers = new Map<number,Pointer>();
    let drag: Drag | null = null;
    let pinch: {distance:number; midpoint:Pointer; zoom:number} | null = null;
    let frame = 0, disposed = false;
    let size = {width:1,height:1};
    const ray = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const hitPoint = new THREE.Vector3();
    const lastPointer = {x:0,y:0};
    let lastCandidate: {x:number;y:number;valid:boolean}|null = null;

    function cameraUpdate() {
      const {room,panelOpen} = propsRef.current;
      const center = new THREE.Vector3(room.width/2, .52, room.height/2).add(pan);
      const forward = new THREE.Vector3(Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch),Math.sin(yaw)*Math.cos(pitch));
      camera.position.copy(center).addScaledVector(forward,24);
      camera.lookAt(center);
      camera.updateMatrixWorld(true);
      const projected: THREE.Vector3[] = [];
      for (const x of [0,room.width]) for (const z of [0,room.height]) for (const y of [-.14,2.45]) {
        projected.push(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
      }
      const minX=Math.min(...projected.map(v=>v.x)), maxX=Math.max(...projected.map(v=>v.x));
      const minY=Math.min(...projected.map(v=>v.y)), maxY=Math.max(...projected.map(v=>v.y));
      const aspect=size.width/size.height;
      const freeRatio=panelOpen ? .65 : .83;
      const height = Math.max((maxY-minY)/freeRatio,(maxX-minX)/Math.max(.2,aspect)/.86,5.5)/Math.max(.7,Math.min(2.8,zoom));
      camera.left=-height*aspect/2;camera.right=height*aspect/2;
      camera.top=height/2;camera.bottom=-height/2;
      camera.updateProjectionMatrix();
      const centerShift = panelOpen ? -height*.14 : 0;
      const viewUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
      camera.position.addScaledVector(viewUp,centerShift);
      camera.updateMatrixWorld(true);
      // Keep camera orientation while moving its eye and target by an equal vector.
    }
    function renderNow() {
      if (disposed) return;
      if (Math.abs(targetYaw-yaw)>.002 || Math.abs(targetZoom-zoom)>.003) {
        yaw += (targetYaw-yaw)*.24;
        zoom += (targetZoom-zoom)*.22;
        requestDraw();
      } else { yaw=targetYaw; zoom=targetZoom; }
      cameraUpdate();
      if (model) {
        const facing=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw));
        model.walls.forEach(({mesh,normal})=>{
          const faded = !propsRef.current.showWalls || facing.dot(normal)>.10;
          const material=mesh.material as THREE.MeshStandardMaterial;
          material.opacity = !propsRef.current.showWalls ? 0 : faded ? .13 : 1;
          mesh.visible = propsRef.current.showWalls;
          material.depthWrite = !faded;
        });
      }
      renderer.render(scene,camera);
    }
    function requestDraw() {
      if(disposed||frame)return;
      frame=requestAnimationFrame(()=>{frame=0;renderNow();});
    }
    function disposeGroup(group: THREE.Group) {
      group.traverse((obj)=>{
        if(obj instanceof THREE.Mesh){
          obj.geometry.dispose();
          const materials=Array.isArray(obj.material)?obj.material:[obj.material];
          materials.forEach(m=>m.dispose());
        }
      });
    }
    function removeGhost() {
      if(!ghost)return;
      scene.remove(ghost);
      disposeGroup(ghost);
      ghost=null;
    }
    function rebuildGhost() {
      removeGhost();
      const {adding,rotation,mode} = propsRef.current;
      if(!adding || mode!=="furniture")return;
      const temp: Furniture = {id:"preview",type:adding,x:0,y:0,rotation};
      ghost=createFurniture(temp);
      ghost.traverse(node=>{
        if(node instanceof THREE.Mesh){
          const old = node.material as THREE.MeshStandardMaterial;
          const material = old.clone();
          old.dispose();
          node.material=material;
          material.transparent=true;
          material.opacity=.56;
          material.depthWrite=false;
        }
      });
      ghost.visible=false;
      scene.add(ghost);
    }
    function updateSelection() {
      if(selection){scene.remove(selection);selection.geometry.dispose();(selection.material as THREE.Material).dispose();selection=null;}
      const {selectedId,items}=propsRef.current;
      const obj=items.find(item=>item.id===selectedId);
      if(!obj)return;
      const dims=furnitureSize(obj);
      selection=new THREE.Mesh(new THREE.BoxGeometry(dims.width+.06,.017,dims.height+.06),
        new THREE.MeshBasicMaterial({color:"#7abf9a",transparent:true,opacity:.28,depthWrite:false}));
      selection.position.set(obj.x+dims.width/2,.028,obj.y+dims.height/2);
      scene.add(selection);
    }
    function rebuild() {
      if(model){scene.remove(model.root);model.dispose();}
      const {room,items}=propsRef.current;
      model=buildRoom(room,items);
      scene.add(model.root);
      rebuildGhost();
      updateSelection();
      requestDraw();
    }
    function worldOnFloor(x:number,y:number) {
      const rect=canvas.getBoundingClientRect();
      pointerNdc.set(((x-rect.left)/Math.max(1,rect.width))*2-1,-((y-rect.top)/Math.max(1,rect.height))*2+1);
      ray.setFromCamera(pointerNdc,camera);
      return ray.ray.intersectPlane(floorPlane,hitPoint) ? hitPoint.clone() : null;
    }
    function pick(x:number,y:number) {
      const rect=canvas.getBoundingClientRect();
      pointerNdc.set(((x-rect.left)/Math.max(1,rect.width))*2-1,-((y-rect.top)/Math.max(1,rect.height))*2+1);
      ray.setFromCamera(pointerNdc,camera);
      const hits=model?ray.intersectObjects(model.root.children,true):[];
      for(const hit of hits) {
        const node=hit.object;
        if(typeof node.userData.furnitureId==="string") return {kind:"furniture" as const,id:node.userData.furnitureId as string};
        if(node.userData.wall===true || node.parent?.userData.wall===true) return {kind:"wall" as const};
        if(node.userData.tile) return {kind:"floor" as const};
      }
      return null;
    }
    function moveGhostAt(x:number,y:number) {
      if(!ghost||!propsRef.current.adding)return null;
      const point=worldOnFloor(x,y);
      if(!point){ghost.visible=false;requestDraw();return null;}
      const {room,adding,rotation}=propsRef.current;
      const spec: Furniture = {id:"preview",type:adding,x:0,y:0,rotation};
      const footprint=furnitureSize(spec);
      const gx=Math.round(point.x-footprint.width/2);
      const gy=Math.round(point.z-footprint.height/2);
      spec.x=gx;spec.y=gy;
      const valid=validPlacement(room,spec);
      ghost.visible=true;
      ghost.position.set(gx+footprint.width/2,.045,gy+footprint.height/2);
      ghost.traverse(node=>{
        if(node instanceof THREE.Mesh) {
          const mat=node.material as THREE.MeshStandardMaterial;
          mat.color.set(valid?"#a1d2ad":"#f0a0a1");
          mat.opacity=.53;
        }
      });
      lastCandidate={x:gx,y:gy,valid};
      requestDraw();
      return lastCandidate;
    }
    function dragFurniture(id:string,x:number,y:number) {
      const point=worldOnFloor(x,y);
      const {room,items}=propsRef.current;
      const item=items.find(v=>v.id===id);
      if(!point||!item)return null;
      const size=furnitureSize(item);
      const gx=Math.round(point.x-size.width/2), gy=Math.round(point.z-size.height/2);
      const valid=validPlacement(room,{...item,x:gx,y:gy},id);
      const object=model?.objects.get(id);
      if(object){
        object.position.set(gx+size.width/2,.04,gy+size.height/2);
        object.traverse(node=>{
          if(node instanceof THREE.Mesh){
            const mat=node.material as THREE.MeshStandardMaterial;
            mat.emissive.set(valid?"#184e26":"#6b101b");
            mat.emissiveIntensity=.14;
          }
        });
      }
      requestDraw();
      return {x:gx,y:gy,valid};
    }
    function onDown(event: PointerEvent) {
      if(event.pointerType==="mouse"&&event.button!==0)return;
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      const pt={x:event.clientX,y:event.clientY};
      pointers.set(event.pointerId,pt);
      if(pointers.size>=2) {
        const [a,b]=[...pointers.values()];
        pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),midpoint:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},zoom:targetZoom};
        drag=null;
        return;
      }
      const hit=pick(pt.x,pt.y);
      drag={id:event.pointerId,start:pt,last:pt,moved:false,
        objectId:propsRef.current.mode==="furniture"&&!propsRef.current.adding&&hit?.kind==="furniture"?hit.id:null,
        candidate:null};
      if(propsRef.current.mode==="furniture"&&propsRef.current.adding)moveGhostAt(pt.x,pt.y);
    }
    function onMove(event: PointerEvent) {
      if(!pointers.has(event.pointerId))return;
      const pt={x:event.clientX,y:event.clientY};
      pointers.set(event.pointerId,pt);
      if(pinch&&pointers.size>=2){
        const [a,b]=[...pointers.values()];
        const d=Math.max(20,Math.hypot(a.x-b.x,a.y-b.y));
        targetZoom=Math.max(.72,Math.min(2.65,pinch.zoom*d/Math.max(20,pinch.distance)));
        const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        const step=worldUnitsPerPixel();
        const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);
        const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
        pan.addScaledVector(right,-(mid.x-pinch.midpoint.x)*step);
        pan.addScaledVector(up,(mid.y-pinch.midpoint.y)*step);
        pinch.midpoint=mid;pinch.distance=d;pinch.zoom=targetZoom;
        requestDraw();return;
      }
      if(!drag||drag.id!==event.pointerId)return;
      const dx=pt.x-drag.last.x,dy=pt.y-drag.last.y;
      drag.last=pt;
      if(Math.hypot(pt.x-drag.start.x,pt.y-drag.start.y)>7)drag.moved=true;
      if(!drag.moved)return;
      if(propsRef.current.mode==="furniture"&&propsRef.current.adding) {
        drag.candidate=moveGhostAt(pt.x,pt.y);
      } else if(drag.objectId) {
        drag.candidate=dragFurniture(drag.objectId,pt.x,pt.y);
      } else {
        targetYaw=yaw+dx*.012;
        yaw=targetYaw;
        pitch=Math.max(.48,Math.min(1.16,pitch+dy*.003));
        requestDraw();
      }
    }
    function worldUnitsPerPixel() { return (camera.top-camera.bottom)/Math.max(1,size.height); }
    function onUp(event: PointerEvent) {
      if(!pointers.has(event.pointerId))return;
      const pt={x:event.clientX,y:event.clientY};
      pointers.delete(event.pointerId);
      if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
      if(pinch || pointers.size>0) {
        if(pointers.size<2)pinch=null;
        drag=null;
        return;
      }
      if(!drag||drag.id!==event.pointerId)return;
      const current=drag;drag=null;
      if(event.type==="pointercancel") {rebuild();return;}
      const {mode,adding,rotation,items}=propsRef.current;
      if(mode==="furniture"&&adding) {
        const candidate=moveGhostAt(pt.x,pt.y);
        if(candidate?.valid) propsRef.current.onPlace({
          id:"arredo_"+crypto.randomUUID(),type:adding,rotation,x:candidate.x,y:candidate.y,
        });
        else propsRef.current.onError("Questo mobile non entra qui. Prova un'altra casella.");
        return;
      }
      if(current.objectId&&current.moved) {
        const candidate=current.candidate;
        const old=items.find(x=>x.id===current.objectId);
        if(candidate?.valid&&old&&(old.x!==candidate.x||old.y!==candidate.y)) {
          propsRef.current.onMove(current.objectId,candidate.x,candidate.y);
        } else { rebuild(); if(candidate&&!candidate.valid)propsRef.current.onError("Posizione occupata: mobile ripristinato."); }
        return;
      }
      if(!current.moved){
        const hit=pick(pt.x,pt.y);
        if(hit?.kind==="furniture"){propsRef.current.onSelect(hit.id);return;}
        if(mode==="finishes"&&(hit?.kind==="floor"||hit?.kind==="wall")){
          propsRef.current.onFinish(hit.kind);return;
        }
        propsRef.current.onSelect(null);
      }
    }
    function onLost(event:Event) {
      event.preventDefault();
      setUnavailable("Il dispositivo ha interrotto la grafica 3D. Torna al Percorso classico.");
    }
    function resize() {
      const rect=host?.getBoundingClientRect();
      if(!rect||rect.width<1||rect.height<1)return;
      size={width:rect.width,height:rect.height};
      renderer.setSize(Math.floor(rect.width),Math.floor(rect.height),false);
      requestDraw();
    }
    const observer=new ResizeObserver(resize);
    observer.observe(host);
    canvas.addEventListener("pointerdown",onDown);
    canvas.addEventListener("pointermove",onMove);
    canvas.addEventListener("pointerup",onUp);
    canvas.addEventListener("pointercancel",onUp);
    canvas.addEventListener("webglcontextlost",onLost);
    const runtime:Runtime={
      turn(d){targetYaw+=d*Math.PI/2;requestDraw();},
      zoom(f){targetZoom=Math.min(2.65,Math.max(.72,targetZoom*f));requestDraw();},
      fit(){pan.set(0,0,0);targetZoom=1;zoom=1;pitch=.85;targetYaw=Math.PI/4;yaw=targetYaw;requestDraw();},
      rebuild,
      updatePreview(){rebuildGhost();requestDraw();},
      draw:requestDraw,
      dispose(){
        disposed=true;
        observer.disconnect();
        if(frame)cancelAnimationFrame(frame);
        canvas.removeEventListener("pointerdown",onDown);
        canvas.removeEventListener("pointermove",onMove);
        canvas.removeEventListener("pointerup",onUp);
        canvas.removeEventListener("pointercancel",onUp);
        canvas.removeEventListener("webglcontextlost",onLost);
        removeGhost();
        if(selection){scene.remove(selection);selection.geometry.dispose();(selection.material as THREE.Material).dispose();}
        if(model){scene.remove(model.root);model.dispose();}
        groundGeometry.dispose();groundMaterial.dispose();
        renderer.dispose();
        canvas.remove();
      },
    };
    runtimeRef.current=runtime;
    rebuild();resize();
    return ()=>{runtime.dispose();runtimeRef.current=null;};
  }, []);

  useEffect(() => { runtimeRef.current?.rebuild(); }, [props.room,props.items]);
  useEffect(() => { runtimeRef.current?.updatePreview(); }, [props.adding,props.rotation,props.mode]);
  useEffect(() => { runtimeRef.current?.rebuild(); }, [props.selectedId]);
  useEffect(() => { runtimeRef.current?.draw(); }, [props.showWalls,props.panelOpen]);

  return <div ref={mountRef} className="game3d-scene">
    {unavailable && <div className="game3d-error" role="alert">{unavailable}</div>}
  </div>;
});
