import * as THREE from "three";
import { FURNITURE, furnitureSize, type Furniture, type FurnitureType, type HouseRoom } from "../../lib/percorso.ts";
import { editableTileSlots } from "../../lib/percorso-grid.ts";

/**
 * CuraCasa's 3D game uses the SAME five application palettes for its interface
 * highlights, floor editing hints, labels and scene ground. Existing furniture,
 * user-selected wall paints and flooring are deliberately not recolored.
 */
export type SceneThemeColors = {
  accent: string;
  finish: string;
  soft: string;
  paper: string;
};
const DEFAULT_SCENE_THEME:SceneThemeColors = {
  accent:"#b8878d",finish:"#8d9684",soft:"#ead2d5",paper:"#fffdf9",
};
export function readSceneTheme():SceneThemeColors {
  if(typeof document==="undefined")return DEFAULT_SCENE_THEME;
  const computed=getComputedStyle(document.documentElement);
  const token=(key:string,fallback:string)=>
    computed.getPropertyValue(key).trim()||fallback;
  return {
    accent:token("--theme-cta",DEFAULT_SCENE_THEME.accent),
    finish:token("--theme-finish",DEFAULT_SCENE_THEME.finish),
    soft:token("--rose-soft",DEFAULT_SCENE_THEME.soft),
    paper:token("--paper",DEFAULT_SCENE_THEME.paper),
  };
}

/** Procedural low-poly models, coordinates in real grid cells. */
const palette = {
  timber: "#b79478", cream: "#f8f0e6", rose: "#c78385",
  sage: "#719787", dark: "#45554d", brass: "#bd9d61",
  linen: "#f7e9d9", blue: "#a2bdc6", white: "#fdfcf8",
};
const floorColors: Record<HouseRoom["floor"], string> = {
  parquet: "#cfb18f", piastrelle: "#dfe6da", cotto: "#c9937a",
  terrazzo: "#e3d8cf", pietra: "#bfcac4",
};
const wallColors: Record<HouseRoom["wall"], string> = {
  avorio: "#f5e9d9", salvia: "#cbdcc9", cipria: "#edcfcd",
  righe: "#efe3d5", carta: "#dce9dc",
};

const standard = (color: string, roughness = .88) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });

function cube(parent: THREE.Group, w: number, h: number, d: number,
  x: number, y: number, z: number, color: string, radius = 0) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, standard(color));
  mesh.position.set(x, y, z);
  if (radius) mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function orb(parent: THREE.Group, r: number, x: number, y: number, z: number, color: string) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), standard(color));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function makeFloorTexture(kind: HouseRoom["floor"]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = floorColors[kind];
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = kind === "parquet" ? "#ac8e70" : "#b2b3a5";
  ctx.lineWidth = kind === "piastrelle" ? 7 : 3;
  if (kind === "parquet" || kind === "cotto") {
    for (let row = 0; row < 8; row++) {
      const yy = row * 32;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(256, yy);
      const stagger = row % 2 ? 40 : 0;
      for (let xx = stagger - 80; xx < 290; xx += 80) {
        ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 32);
      }
      ctx.stroke();
    }
  } else if (kind === "piastrelle" || kind === "pietra") {
    ctx.strokeStyle = kind === "piastrelle" ? "#ffffff" : "#a8b9b1";
    ctx.beginPath();
    ctx.moveTo(128, 0); ctx.lineTo(128, 256);
    ctx.moveTo(0, 128); ctx.lineTo(256, 128);
    ctx.stroke();
  } else {
    for (let i = 0; i < 34; i++) {
      const x = (i * 113 + 37) % 256, y = (i * 71 + 19) % 256;
      ctx.fillStyle = i % 3 ? "#b5a7a1" : "#f1e7df";
      ctx.fillRect(x, y, 7 + i % 11, 4 + i % 7);
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 2;
  return map;
}

export function sampleFurniture(kind: HouseRoom["kind"], room: HouseRoom): Furniture[] {
  const candidates: Array<[FurnitureType, number, number, 0 | 1 | 2 | 3]> =
    kind === "bagno" ? [["vasca", 0, 0, 0], ["lavatrice", 3, 0, 0], ["pianta", 3, 2, 0]] :
    kind === "camera" ? [["letto", 1, 1, 0], ["armadio", 3, 0, 0], ["pianta", 0, 0, 0]] :
    kind === "cucina" ? [["frigo", 0, 0, 0], ["tavolo", 2, 1, 0], ["sedia", 1, 2, 0], ["pianta", 4, 0, 0]] :
    kind === "balcone" ? [["pianta", 0, 0, 0], ["tavolo", 2, 1, 0], ["sedia", 1, 2, 0]] :
    [["divano", 1, 1, 0], ["tavolo", 3, 1, 0], ["pianta", 0, 0, 0], ["tappeto", 0, 2, 0]];
  const results: Furniture[] = [];
  const occupancy = new Set(room.cells);
  for (const [type, x, y, rotation] of candidates) {
    const candidate: Furniture = { id: "showcase-" + type, type, x, y, rotation };
    const { width, height } = furnitureSize(candidate);
    const ok = Array.from({ length: width * height }, (_, i) =>
      occupancy.has((x + i % width) + "," + (y + Math.floor(i / width)))).every(Boolean);
    const overlap = results.some((placed) => {
      const size = furnitureSize(placed);
      return x < placed.x + size.width && x + width > placed.x &&
        y < placed.y + size.height && y + height > placed.y;
    });
    if (ok && !overlap) results.push(candidate);
  }
  return results;
}

/** Builds a visual, not a collider: collision rules remain in lib/percorso.ts. */
export function createFurniture(item: Furniture): THREE.Group {
  const { width: w, height: d } = furnitureSize(item);
  const g = new THREE.Group();
  const base = new THREE.Group();
  g.add(base);
  const box = (ww: number, hh: number, dd: number, x: number, yy: number, z: number, c: string) =>
    cube(base, ww, hh, dd, x, yy, z, c);
  const sx = w, sz = d;
  const swatch = FURNITURE.find((entry) => entry.id === item.type);
  // Keep physical model orientation independent of the rotated footprint.
  const primitive = new THREE.Group();
  base.add(primitive);
  const sbox = (ww: number, hh: number, dd: number, x: number, yy: number, z: number, c: string) =>
    cube(primitive, ww, hh, dd, x, yy, z, c);
  switch (item.type) {
    case "divano":
      sbox(1.92,.34,.83,0,.24,0,palette.rose);
      sbox(1.94,.72,.22,0,.58,-.32,"#a76c70");
      for(const x of [-.57,.57]) sbox(.73,.13,.56,x,.46,.09,"#ddb3aa");
      for(const x of [-.88,.88]) sbox(.18,.52,.92,x,.43,0,"#b67c7c");
      for(const x of [-.72,.72]) for(const z of [-.30,.30]) sbox(.10,.11,.10,x,.08,z,palette.timber);
      break;
    case "letto":
      sbox(1.91,.22,1.86,0,.18,0,palette.timber);
      sbox(1.84,.21,1.77,0,.36,.03,palette.linen);
      sbox(1.82,.11,.96,0,.52,.41,"#bdcfc1");
      sbox(1.9,.75,.13,0,.54,-.89,"#a88b82");
      for(const x of [-.44,.44]) sbox(.72,.12,.34,x,.52,-.58,palette.white);
      break;
    case "tavolo":
      sbox(1.87,.14,1.77,0,.75,0,palette.timber);
      for(const x of [-.69,.69]) for(const z of [-.67,.67]) sbox(.13,.68,.13,x,.37,z,"#94755e");
      sbox(.46,.10,.32,.20,.85,0,palette.white);
      break;
    case "sedia":
      sbox(.72,.14,.72,0,.46,0,"#b78e72");
      sbox(.73,.81,.12,0,.86,-.31,"#b78e72");
      for(const x of [-.25,.25]) for(const z of [-.25,.25]) sbox(.10,.47,.10,x,.23,z,"#846b5b");
      break;
    case "armadio":
      sbox(1.9,2.04,.83,0,1.08,0,"#b99a7d");
      for(const x of [-.45,.45]) {
        sbox(.84,1.84,.035,x,1.1,.44,"#e3ccb0");
        orb(primitive,.037,x<0?-.08:.08,1.12,.485,palette.brass);
      }
      break;
    case "lavatrice":
      sbox(.86,.91,.86,0,.50,0,"#e8eff0");
      sbox(.78,.14,.04,0,.83,.45,"#a8c2c8");
      const washer = new THREE.Mesh(new THREE.TorusGeometry(.235,.045,8,32),standard("#8ea9af"));
      washer.position.set(0,.46,.455);primitive.add(washer);
      orb(primitive,.14,0,.46,.46,"#5c7e89");
      break;
    case "vasca":
      sbox(1.9,.52,.87,0,.29,0,"#f2f5ef");
      sbox(1.59,.025,.55,0,.555,0,"#a6ced2");
      orb(primitive,.06,-.67,.58,-.33,"#b1b2a6");
      break;
    case "pianta":
      sbox(.56,.51,.56,0,.27,0,"#c69678");
      sbox(.08,.84,.08,0,.82,0,"#728d62");
      for (const [x,y,z,r,c] of [
        [-.19,1.19,0,.34,"#739b7c"],[.19,1.02,.09,.31,"#8fb38b"],
        [.04,1.39,-.14,.29,"#507e64"],[-.09,1.35,.14,.28,"#9bc49b"],
      ] as const) orb(primitive,r,x,y,z,c);
      break;
    case "tappeto":
      sbox(1.93,.045,1.90,0,.04,0,"#d6b6aa");
      sbox(1.54,.01,1.54,0,.07,0,"#f0d7c9");
      break;
    case "frigo":
      sbox(.90,1.88,.89,0,.97,0,"#d5e1dd");
      sbox(.79,.035,.03,0,1.23,.455,"#9aaeb0");
      sbox(.045,.35,.055,.31,1.55,.47,"#788d89");
      sbox(.045,.32,.055,.31,.80,.47,"#788d89");
      break;
    default:
      box(sx*.8,.5,sz*.8,0,.25,0,swatch?.color ?? palette.cream);
  }
  if (item.rotation % 2) primitive.rotation.y = -Math.PI / 2;
  // Furniture geometry is authored at the catalog footprint center; rotate it.
  if (item.rotation === 2) primitive.rotation.y = Math.PI;
  if (item.rotation === 3) primitive.rotation.y = Math.PI / 2;
  if (item.rotation % 2) {
    // Geometry dimensions come from the unrotated catalog.
    // The pivot is already at the footprint center, so a 90° spin fits.
  }
  g.position.set(item.x + w/2, 0, item.y + d/2);
  g.userData.furnitureId = item.id;
  g.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.userData.furnitureId = item.id;
      node.castShadow = false; // mobile-friendly, contact shadow from ambient shading
    }
  });
  return g;
}

export type RoomVisual = {
  root: THREE.Group;
  floor: THREE.Mesh[];
  walls: Array<{ mesh: THREE.Mesh; normal: THREE.Vector3 }>;
  objects: Map<string, THREE.Group>;
  dispose: () => void;
};

export function buildRoom(
  room: HouseRoom, furniture: Furniture[], editable = false, showLabel = false,
  theme: SceneThemeColors = DEFAULT_SCENE_THEME,
): RoomVisual {
  const root = new THREE.Group(), floor: THREE.Mesh[] = [];
  root.userData.roomId = room.id;
  root.position.set(room.offsetX,0,room.offsetY);
  const walls: RoomVisual["walls"] = [];
  const objects = new Map<string, THREE.Group>();
  const active = new Set(room.cells);
  const floorTex = makeFloorTexture(room.floor);
  const surface = new THREE.MeshStandardMaterial({
    color: "#ffffff", roughness: .96, map: floorTex ?? undefined,
  });
  const sideMat = standard("#a89987");
  for (const key of room.cells) {
    const [x, z] = key.split(",").map(Number);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(.985,.12,.985), [sideMat,sideMat,surface,sideMat,sideMat,sideMat]);
    slab.position.set(x+.5,-.05,z+.5);
    slab.userData.tile = { x, y:z };
    slab.receiveShadow = true;
    root.add(slab);
    floor.push(slab);
    const edges: Array<[number,number,THREE.Vector3,number,number,number]> = [
      [-1,0,new THREE.Vector3(-1,0,0),x,z+.5,Math.PI/2],
      [0,-1,new THREE.Vector3(0,0,-1),x+.5,z,0],
      [1,0,new THREE.Vector3(1,0,0),x+1,z+.5,Math.PI/2],
      [0,1,new THREE.Vector3(0,0,1),x+.5,z+1,0],
    ];
    for (const [dx,dz,normal,wx,wz,rotation] of edges) {
      if(active.has((x+dx)+","+(z+dz)))continue;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1,2.35,.09),
        new THREE.MeshStandardMaterial({
          color: wallColors[room.wall], roughness: .95, side: THREE.DoubleSide,
          transparent:true, opacity:1, depthWrite:true,
        }));
      panel.position.set(wx,1.175,wz);
      panel.rotation.y = rotation;
      panel.userData.wall = true;
      root.add(panel); walls.push({mesh:panel,normal});
      const trim = new THREE.Mesh(new THREE.BoxGeometry(.99,.08,.11), standard("#f7f4ed"));
      trim.position.set(0,-1.04,.07);
      panel.add(trim);
      if(room.wall==="righe"||room.wall==="carta"){
        for(let i=0;i<5;i++){
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(.016,2.15,.008),
            standard(room.wall==="righe"?"#d5aeb0":"#b9cfbc"));
          stripe.position.set(-.41+i*.205,0,.053);
          panel.add(stripe);
        }
      }
    }
  }
  if (editable) {
    for (const {x,y} of editableTileSlots(room)) {
      const ghost = new THREE.Mesh(
        new THREE.BoxGeometry(.92,.035,.92),
        new THREE.MeshBasicMaterial({
          color:theme.finish, transparent:true, opacity:.34,
          depthWrite:false, side:THREE.DoubleSide,
        }),
      );
      ghost.position.set(x+.5,-.07,y+.5);
      ghost.userData.tile = {x,y,missing:true};
      ghost.userData.tilePlaceholder = true;
      root.add(ghost);
    }
  }
  if (showLabel) {
    const canvas=document.createElement("canvas");
    canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext("2d");
    if(ctx) {
      ctx.fillStyle=theme.paper;
      ctx.beginPath();
      ctx.roundRect(8,10,496,104,46);
      ctx.fill();
      ctx.lineWidth=7;ctx.strokeStyle=theme.soft;ctx.stroke();
      ctx.fillStyle=theme.accent;
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.font="bold 41px sans-serif";
      const name=room.name.length>22?room.name.slice(0,20)+"…":room.name;
      ctx.fillText(name,256,63,448);
      const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthTest:false}));
      sprite.position.set(room.width/2,2.9,room.height/2);
      sprite.scale.set(Math.max(2.5,Math.min(3.8,room.width*.6)),.8,1);
      sprite.userData.roomLabel=true;
      root.add(sprite);
    }
  }
  for (const item of furniture) {
    const group = createFurniture(item);
    root.add(group);
    objects.set(item.id,group);
  }
  const dispose = () => {
    root.traverse((obj)=>{
      if(obj instanceof THREE.Sprite){
        const material=obj.material as THREE.SpriteMaterial;
        material.map?.dispose();
        material.dispose();
      }
      if(obj instanceof THREE.Mesh){
        obj.geometry.dispose();
        for (const mat of Array.isArray(obj.material)?obj.material:[obj.material]) mat.dispose();
      }
    });
    floorTex?.dispose();
  };
  return {root,floor,walls,objects,dispose};
}
