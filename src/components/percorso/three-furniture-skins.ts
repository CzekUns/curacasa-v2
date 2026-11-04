import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { categoryForFurniture } from "../../lib/percorso-asset-catalog.ts";
import { normalizeFurnitureSkinId, type FurnitureSkinId } from "../../lib/percorso-furniture-skins.ts";
import type { FurnitureType } from "../../lib/percorso.ts";

/**
 * Non-destructive procedural re-skin of existing CuraCasa models.
 * Every object keeps its silhouette, footprint, pivot, collision and selection ID.
 * Only the meshes' per-object materials and (for the soft styles) large box corners change.
 */
type ColorSet = {
  light:string; neutral:string; warm:string; cool:string; dark:string;
  leaf:string; accent:string; blend:number; outline:number; rounded:boolean;
  toon:boolean; roughness:number; metalness:number;
};
const STYLES: Record<Exclude<FurnitureSkinId,"originale">,ColorSet> = {
  illustrata:{
    light:"#fbf5eb",neutral:"#c1b3a6",warm:"#cfaaa4",cool:"#a8b6aa",
    dark:"#54514c",leaf:"#849b7e",accent:"#dcc5ae",blend:.12,
    outline:.26,rounded:true,toon:true,roughness:1,metalness:0,
  },
  cipria:{
    light:"#fff5ed",neutral:"#ddc4c0",warm:"#d9a9b8",cool:"#c5cad7",
    dark:"#7a626f",leaf:"#a6b4a3",accent:"#e7c7ad",blend:.10,
    outline:.08,rounded:true,toon:false,roughness:.87,metalness:.03,
  },
  salvia:{
    light:"#f7f2e3",neutral:"#c2c7b3",warm:"#c6a990",cool:"#90b0a3",
    dark:"#53675a",leaf:"#719c74",accent:"#dacaa6",blend:.11,
    outline:.10,rounded:true,toon:false,roughness:.93,metalness:0,
  },
  vintage60:{
    light:"#f4dec3",neutral:"#c6ad8f",warm:"#c88166",cool:"#67918d",
    dark:"#574a42",leaf:"#839b67",accent:"#cdad63",blend:.08,
    outline:.15,rounded:true,toon:true,roughness:1,metalness:0,
  },
  vintage80:{
    light:"#ffe5d4",neutral:"#b9a6c6",warm:"#ef7891",cool:"#71b5cb",
    dark:"#56456c",leaf:"#78b5a0",accent:"#ebc66a",blend:.05,
    outline:.17,rounded:false,toon:true,roughness:.9,metalness:0,
  },
  claytoon:{
    light:"#f6dccf",neutral:"#c7a7aa",warm:"#d99096",cool:"#9fb4d2",
    dark:"#705c6e",leaf:"#8eb8a0",accent:"#d9b7a1",blend:.14,
    outline:0,rounded:true,toon:false,roughness:1,metalness:0,
  },
};
function pickTone(original:THREE.Color, palette:ColorSet, type:FurnitureType, index:number) {
  const hsl={h:0,s:0,l:0};
  original.getHSL(hsl);
  const category=categoryForFurniture(type);
  const isLeaf=hsl.s>.16 && hsl.h>.19 && hsl.h<.49 && hsl.l<.76;
  let tone:string;
  if(hsl.l<.26) tone=palette.dark;
  else if(isLeaf) tone=palette.leaf;
  else if(hsl.l>.78) tone=palette.light;
  else if(hsl.s<.15) tone=hsl.l>.62 ? palette.light : palette.neutral;
  else if(hsl.h>.48 && hsl.h<.78) tone=palette.cool;
  else if(hsl.h>.91 || hsl.h<.19) tone=palette.warm;
  else tone=palette.accent;
  // Furniture retains its material's value and the original colour identity.
  const result=new THREE.Color(tone).lerp(original,palette.blend);
  // Make wood slightly warmer and sanitary appliances a little lighter.
  if(category==="Camera" || category==="Salone") {
    if(hsl.s<.18 && hsl.l>.32 && hsl.l<.78)
      result.lerp(new THREE.Color(palette.accent),.13);
  } else if(category==="Bagno" || category==="Impianti") {
    if(hsl.l>.66)result.lerp(new THREE.Color(palette.light),.16);
  }
  // Make small adjacent details distinguishable, without random colours.
  if(index%5===3 && hsl.l>.36 && hsl.l<.76)
    result.lerp(new THREE.Color(palette.neutral),.09);
  return result;
}
function roundedMainBoxes(meshes:THREE.Mesh[], soft:boolean) {
  if(!soft)return;
  let changed=0;
  for(const obj of meshes) {
    if(changed>=4)break; // geometry budget: safe on modest mobile hardware
    if(!(obj.geometry instanceof THREE.BoxGeometry))continue;
    const {width,height,depth}=obj.geometry.parameters;
    if(Math.min(width,height,depth)<.16 || Math.max(width,height,depth)<.55)continue;
    const radius=Math.min(.10,Math.min(width,height,depth)*.20);
    obj.geometry.dispose();
    obj.geometry=new RoundedBoxGeometry(width,height,depth,3,radius);
    changed++;
  }
}
/** Models without a saved skin use the illustrated default; old "originale" remains selectable. */
export function applyFurnitureSkin(root:THREE.Group,rawSkin:unknown,type:FurnitureType):void {
  const skin=normalizeFurnitureSkinId(rawSkin);
  if(skin==="originale")return;
  const palette=STYLES[skin];
  const meshes:THREE.Mesh[]=[];
  root.traverse(node=>{if(node instanceof THREE.Mesh)meshes.push(node);});
  roundedMainBoxes(meshes,palette.rounded);
  let drawnEdges=0;
  meshes.forEach((obj,index)=>{
    const originalMaterials=Array.isArray(obj.material)?obj.material:[obj.material];
    const converted=originalMaterials.map(source=>{
      const color=source instanceof THREE.MeshStandardMaterial || source instanceof THREE.MeshBasicMaterial
        ? source.color : new THREE.Color(palette.neutral);
      const tint=pickTone(color,palette,type,index);
      const common={color:tint,side:source.side,transparent:source.transparent,opacity:source.opacity,depthWrite:source.depthWrite};
      return palette.toon
        ? new THREE.MeshToonMaterial(common)
        : new THREE.MeshStandardMaterial({...common,roughness:palette.roughness,metalness:palette.metalness});
    });
    obj.material=Array.isArray(obj.material)?converted:converted[0];
    originalMaterials.forEach(m=>m.dispose());
    // A small number of contour strokes recreate the soft graphite outlines
    // of CuraCasa's classic WEBP illustrations, without heavy post-processing.
    if(palette.outline>0 && drawnEdges<4 && obj.geometry instanceof THREE.BufferGeometry) {
      const bounds=new THREE.Box3().setFromBufferAttribute(obj.geometry.attributes.position as THREE.BufferAttribute);
      const size=new THREE.Vector3();
      bounds.getSize(size);
      if(Math.max(size.x,size.y,size.z)>.58 && Math.min(size.x,size.y,size.z)>.13){
        const edges=new THREE.LineSegments(
          new THREE.EdgesGeometry(obj.geometry,42),
          new THREE.LineBasicMaterial({color:palette.dark,transparent:true,opacity:palette.outline,depthWrite:false}),
        );
        edges.raycast=()=>{}; // do not intercept touch selection of furniture
        obj.add(edges);
        drawnEdges++;
      }
    }
  });
}
