import * as THREE from "three";
import { ADDITIONAL_ASSETS } from "../../lib/percorso-asset-catalog.ts";

/** Hand-authored, original lightweight low-poly shapes, with no downloadable 3D files.
 * Units are the same 1x1 floor cells used by the room designer. The renderer
 * rotates this parent around its center for all four camera directions.
 */
// Each mesh owns its material: room disposal and previews may safely free them.
function mat(color:string) {
  return new THREE.MeshStandardMaterial({color,roughness:.85,metalness:0});
}
function mesh(g:THREE.Group, geometry:THREE.BufferGeometry, color:string, x=0,y=0,z=0) {
  const obj=new THREE.Mesh(geometry,mat(color));
  obj.position.set(x,y,z);obj.receiveShadow=true;g.add(obj);return obj;
}
function box(g:THREE.Group,w:number,h:number,d:number,x:number,y:number,z:number,c:string) {
  return mesh(g,new THREE.BoxGeometry(w,h,d),c,x,y,z);
}
function ball(g:THREE.Group,r:number,x:number,y:number,z:number,c:string) {
  return mesh(g,new THREE.IcosahedronGeometry(r,1),c,x,y,z);
}
function cyl(g:THREE.Group,r:number,h:number,x:number,y:number,z:number,c:string,rTop=r) {
  return mesh(g,new THREE.CylinderGeometry(rTop,r,h,9),c,x,y,z);
}
function hoop(g:THREE.Group,r:number,t:number,x:number,y:number,z:number,c:string,vertical=false) {
  const obj=mesh(g,new THREE.TorusGeometry(r,t,6,20),c,x,y,z);
  if(!vertical)obj.rotation.x=Math.PI/2;
  return obj;
}
function rod(g:THREE.Group, a:[number,number,number], b:[number,number,number], r:number,c:string) {
  const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b);
  const delta=end.clone().sub(start);
  const obj=mesh(g,new THREE.CylinderGeometry(r,r,delta.length(),7),c,
    (start.x+end.x)/2,(start.y+end.y)/2,(start.z+end.z)/2);
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  return obj;
}
function frame(g:THREE.Group,w=0.83,h=1.45,y=0.9,c="#a38369") {
  box(g,w,.075,.12,0,y+h/2,0,c);
  box(g,w,.075,.12,0,y-h/2,0,c);
  for(const x of [-w/2,w/2])box(g,.065,h,.12,x,y,0,c);
}
function appliance(g:THREE.Group,c="#e8edeb",h=.91) {
  box(g,.84,h,.77,0,h/2+.055,0,c);
  box(g,.76,.13,.045,0,h-.055,.4,"#aec5c8");
}
function handle(g:THREE.Group,y=.95,x=.25) {
  box(g,.18,.055,.085,x,y,.09,"#c8aa72");
  ball(g,.044,x+.10,y,.10,"#eee2b6");
}
function vacuumStick(g:THREE.Group,style:"slim"|"upright"|"cordless"|"brush") {
  const head=style==="brush"?"#b89574":style==="upright"?"#568781":"#7e929a";
  if(style==="brush"){
    rod(g,[-.03,.19,.02],[.16,1.66,-.08],.032,"#b68a60");
    box(g,.66,.18,.25,0,.13,.02,"#c6a56f");
    for(let i=0;i<7;i++)box(g,.045,.16,.13,-.27+i*.09,.045,.08,"#d8c8aa");
  }else{
    rod(g,[0,.21,.0],[.13,1.6,-.04],.051,style==="cordless"?"#897481":"#b9cad0");
    box(g,.68,.15,.31,0,.115,.08,head);
    box(g,.18,.38,.20,.12,1.32,-.05,style==="cordless"?"#a88ba9":"#779e9b");
    cyl(g,.12,.13,.12,1.59,-.05,"#d6b789");
    if(style==="slim")box(g,.15,.3,.16,.0,.78,0,"#d1b5a4");
    if(style==="upright")box(g,.39,.66,.23,0,.61,0,"#bbd2c6");
  }
}
function tiledWall(g:THREE.Group,color:string) {
  box(g,.92,1.53,.10,0,.84,-.04,color);
  for(const v of [-.49,.01,.51])box(g,.92,.016,.13,0,.84+v,.025,"#f5f1e8");
  for(const x of [-.22,.23])box(g,.015,1.46,.13,x,.84,.025,"#f5f1e8");
}
function windowFrame(g:THREE.Group,kind:string,w=0.86) {
  frame(g,w,1.35,.84,"#b7a48f");
  box(g,w-.13,1.23,.018,0,.84,0,kind==="zanzariera"?"#7e9992":"#9dc3cf");
  box(g,.045,1.27,.12,0,.84,.035,"#f0eadb");
  box(g,w-.1,.045,.13,0,.84,.035,"#f0eadb");
  if(kind==="finestra-tende" || kind==="tende") {
    for(const x of [-.29,.29]) {
      box(g,.21,1.27,.075,x,.84,.13,kind==="tende"?"#e2babe":"#f5e5cd");
      for(let i=0;i<4;i++)box(g,.012,1.18,.083,x-.075+i*.05,.84,.18,"#fcf4e5");
    }
  }else if(kind==="tapparelle"||kind==="tapparella-grande"){
    for(let i=0;i<10;i++)box(g,w-.1,.085,.085,0,.26+i*.128,.12,i%2?"#c1b09d":"#d4c7b3");
  }else if(kind==="zanzariera"){
    for(let i=0;i<11;i++){
      const k=-w/2+.08+i*(w-.16)/10;
      box(g,.008,1.2,.018,k,.84,.07,"#445e5b");
      box(g,w-.13,.009,.018,0,.24+i*.12,.07,"#445e5b");
    }
  }else if(kind==="infissi"){
    box(g,.13,1.23,.07,.24,.84,.09,"#f5f0e7");
    handle(g,.85,.22);
  }else if(kind==="vetri"){
    box(g,.08,.08,.09,.03,.85,.08,"#f8ffff");
  }
}
function fanFace(g:THREE.Group,y:number,z:number) {
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    const blade=box(g,.13,.33,.035,Math.cos(a)*.14,y+Math.sin(a)*.14,z,"#7f9caa");
    blade.rotation.z=-a;
  }
  cyl(g,.065,.09,0,y,z+.01,"#dee9e7");
}
function bottle(g:THREE.Group,color:string) {
  cyl(g,.2,.53,0,.32,0,color);
  cyl(g,.095,.15,0,.67,0,color);
  box(g,.23,.19,.03,0,.34,.205,"#f5f0e5");
}

/** Returns false only for old catalogue models, which still use their existing renderer. */
export function renderAdditionalAsset(parent:THREE.Group,type:string):boolean {
  const spec=ADDITIONAL_ASSETS.find(x=>x.id===type);
  if(!spec)return false;
  const g=parent, a=spec.color, b=spec.accent, wood="#b58f73", pale="#f7eee2", dark="#59636a", chrome="#b7c9ca";
  switch(type){
    case "casa":
      box(g,.78,.72,.70,0,.39,0,b); {
        const roof=mesh(g,new THREE.ConeGeometry(.67,.47,4),a,0,1.0,0);
        roof.rotation.y=Math.PI/4;
      }
      box(g,.22,.43,.05,0,.24,.375,wood);
      box(g,.17,.18,.05,-.23,.62,.375,"#91bbc6");
      break;
    case "scopa-elettrica":vacuumStick(g,"slim");break;
    case "scopa":vacuumStick(g,"brush");break;
    case "pavimento":
      rod(g,[-.1,.10,0],[.20,1.64,0],.037,wood);
      box(g,.73,.13,.31,-.10,.10,0,"#c3d8d5");
      for(let i=0;i<6;i++)box(g,.085,.08,.23,-.40+i*.12,.025,.0,pale);
      break;
    case "spolverino":
      rod(g,[0,.11,0],[.08,1.45,0],.042,wood);
      for(let i=0;i<7;i++)ball(g,.115,(i%2?-.09:.09),1.17+i*.074,0,i%2?"#f1dbbd":"#c3b0ab");
      break;
    case "pattumiera":
      cyl(g,.29,.80,0,.46,0,"#8daca6",.32);
      cyl(g,.34,.10,0,.9,0,"#687e79");box(g,.19,.08,.17,0,.98,0,chrome);
      break;
    case "bagno":
      box(g,1.7,.81,.73,0,.46,0,wood);
      box(g,1.72,.11,.79,0,.91,0,pale);
      cyl(g,.25,.025,-.39,.98,0,chrome);
      hoop(g,.19,.035,-.39,1.01,0,"#ffffff");
      rod(g,[-.4,.98,-.1],[-.4,1.17,-.1],.025,chrome);
      break;
    case "cucina":
      box(g,1.79,.87,.79,0,.45,0,"#b5ada2");
      box(g,1.85,.09,.86,0,.93,0,pale);
      for(const x of [-.51,-.05])hoop(g,.17,.02,x,.99,0,dark);
      box(g,.46,.03,.40,.54,.99,0,chrome);
      rod(g,[.55,.99,-.1],[.55,1.22,-.1],.025,chrome);
      break;
    case "soggiorno":
      box(g,1.79,.57,.66,0,.34,0,wood);
      box(g,1.82,.10,.72,0,.67,0,pale);
      box(g,1.22,.73,.11,0,1.12,-.06,dark);
      box(g,1.08,.57,.035,0,1.13,.01,"#7296a5");
      box(g,.30,.18,.28,0,.71,-.06,chrome);
      for(const x of [-.58,.58])box(g,.12,.09,.09,x,.06,.15,wood);
      break;
    case "balcone":
      box(g,1.7,.13,.18,0,.78,-.37,wood);
      for(const x of [-.76,0,.76])rod(g,[x,.08,-.38],[x,1.14,-.38],.035,chrome);
      cyl(g,.35,.09,0,.46,.10,wood);
      rod(g,[0,.05,.1],[0,.48,.1],.06,wood);
      ball(g,.27,.46,.38,.12,"#78a584");
      break;
    case "doccia":
      cyl(g,.30,.07,0,.06,0,chrome);
      rod(g,[.24,.13,-.2],[.24,1.75,-.2],.033,chrome);
      rod(g,[.24,1.74,-.2],[-.13,1.74,-.2],.038,chrome);
      cyl(g,.21,.07,-.13,1.66,-.2,chrome);
      for(const x of [-.20,-.13,-.06])ball(g,.015,x,1.54,-.2,"#82bcd4");
      break;
    case "wc":
      box(g,.62,.64,.22,0,.65,-.28,pale);
      cyl(g,.33,.41,0,.30,.07,pale);
      hoop(g,.27,.045,0,.53,.07,"#fdfdf9");
      cyl(g,.18,.015,0,.11,.07,chrome);
      break;
    case "lavandino":
      cyl(g,.13,.72,0,.39,0,pale);
      cyl(g,.40,.16,0,.79,.06,pale);
      hoop(g,.28,.046,0,.87,.06,"#dcebea");
      rod(g,[0,.88,-.21],[0,1.16,-.21],.027,chrome);
      rod(g,[0,1.15,-.21],[0,1.15,-.03],.028,chrome);
      break;
    case "asciugamani":
      rod(g,[-.33,1.13,0],[.33,1.13,0],.04,chrome);
      for(const x of [-.29,.29])rod(g,[x,.25,-.02],[x,1.3,-.02],.03,chrome);
      for(const x of [-.20,.15])box(g,.24,.62,.04,x,.77,.04,x<0?"#e2bcaa":"#b2c7c7");
      break;
    case "biancheria-letto":
      for(let i=0;i<4;i++)box(g,.73,.17,.62,0,.12+i*.15,0,["#eee2d4","#c6d6c5","#f5e9e3","#b4c2d5"][i]);
      box(g,.77,.06,.65,0,.72,0,pale);
      break;
    case "mocio-secchio":
      cyl(g,.29,.42,-.17,.29,0,"#b5d1d7",.34);
      hoop(g,.28,.025,-.17,.54,0,chrome);
      rod(g,[.24,.08,0],[.18,1.63,0],.03,wood);
      box(g,.25,.10,.23,.24,.10,0,pale);
      break;
    case "paletta":
      rod(g,[.15,.24,-.08],[.15,1.30,-.08],.035,wood);
      box(g,.65,.09,.42,0,.12,.08,"#b6ccce");
      box(g,.65,.19,.05,0,.23,-.13,"#a1b5b5");
      break;
    case "macchina-caffe":
      box(g,.69,.77,.65,0,.42,0,"#747f81");
      box(g,.62,.13,.71,0,.77,.02,"#b7bbc1");
      box(g,.50,.40,.04,0,.51,.35,dark);
      cyl(g,.16,.1,.0,.28,.39,pale);
      rod(g,[0,.30,.33],[0,.60,.33],.028,chrome);
      break;
    case "cuscini":
      for(const [x,y,z,c] of [[-.21,.24,-.1,"#e2b4ad"],[.18,.32,.08,"#c2d4c4"],[0,.53,-.16,"#eee0b5"]] as const){
        const pillow=box(g,.47,.19,.45,x,y,z,c);pillow.rotation.y=x*1.4;
      }
      break;
    case "specchio":
      box(g,.79,1.6,.13,0,.89,-.04,wood);
      box(g,.66,1.45,.025,0,.89,.035,"#abcbd0");
      box(g,.12,.17,.027,-.18,1.29,.052,pale);
      break;
    case "mensole":
      for(let i=0;i<3;i++)box(g,.88,.10,.45,0,.37+i*.47,0,wood);
      for(let i=0;i<3;i++){box(g,.14,.26,.22,-.26+i*.23,.55+i%2*.46,0,["#b2c8c6","#ce9e84","#cfc6af"][i]);}
      break;
    case "maniglie":
      box(g,.73,1.48,.12,0,.78,0,pale);
      handle(g,.86,.18);box(g,.20,.06,.04,.18,.88,.13,chrome);
      break;
    case "box-doccia":
      box(g,1.85,.12,.86,0,.07,0,pale);
      for(const x of [-.89,.89])box(g,.055,1.7,.055,x,.89,-.34,chrome);
      box(g,.05,1.65,.77,-.89,.89,0,"#b8d7db");
      box(g,1.75,1.65,.025,0,.89,.37,"#d9edef");
      handle(g,.94,.44);
      break;
    case "mattonelle":
      for(let j=0;j<3;j++)for(let i=0;i<3;i++){
        box(g,.28,.035,.28,-.30+i*.30,.10+j*.09,-.08+(i%2)*.05,j%2?"#b2c7d0":"#e2e5d7");
      }
      break;
    case "forno":
      appliance(g,"#e9ece9");
      box(g,.69,.46,.035,0,.41,.41,"#697c84");
      for(const x of [-.25,.25])for(const z of [-.18,.18])hoop(g,.11,.018,x,1.01,z,dark);
      box(g,.40,.045,.06,0,.69,.46,chrome);
      break;
    case "cappa":
      box(g,.78,.18,.70,0,1.18,0,chrome);
      box(g,.46,.52,.36,0,1.52,-.10,"#bfc8c6");
      box(g,.90,.10,.75,0,1.04,.10,"#9da9a8");
      for(let i=0;i<4;i++)box(g,.12,.02,.49,-.27+i*.18,1.03,.1,dark);
      break;
    case "lavastoviglie-manutenzione":
      appliance(g,pale);
      box(g,.73,.61,.04,0,.45,.41,"#afc5c4");
      box(g,.37,.04,.06,0,.72,.46,chrome);
      for(const x of [-.18,0,.18])box(g,.02,.35,.04,x,.39,.435,"#fdfdf8");
      break;
    case "lavastoviglie-sale":
      bottle(g,"#c3d6e3");
      cyl(g,.24,.04,0,.77,0,"#e4aea6");
      break;
    case "materasso":
      box(g,1.84,.22,.80,0,.30,0,"#fbf3e8");
      for(const x of [-.65,-.22,.22,.65])box(g,.025,.03,.71,x,.42,0,"#d1c0b0");
      box(g,1.90,.12,.84,0,.11,0,wood);
      break;
    case "battiscopa":
      box(g,1.9,.22,.12,0,.13,-.30,wood);
      box(g,1.90,.035,.15,0,.26,-.30,pale);
      break;
    case "porta":
      box(g,.88,1.8,.10,0,.95,0,wood);
      box(g,.7,1.6,.022,0,.94,.065,"#d7bda1");
      box(g,.55,.56,.025,0,1.40,.08,pale);
      handle(g,.88,.29);
      break;
    case "lampadario":
      rod(g,[0,.60,0],[0,1.93,0],.03,chrome);
      cyl(g,.34,.24,0,1.5,0,"#e5cc9f",.19);
      for(const x of [-.35,.35]){
        rod(g,[0,1.61,0],[x,1.45,0],.027,chrome);
        ball(g,.11,x,1.42,0,"#ffe9b3");
      }
      break;
    case "vetri":case "finestra-tende":case "infissi":case "tapparelle":
    case "tende":case "tapparella-grande":case "zanzariera":
      windowFrame(g,type,type==="tapparella-grande"?1.73:.86);
      break;
    case "tende-esterno":
      for(const x of [-.85,.85])rod(g,[x,.08,-.3],[x,1.42,-.3],.045,wood);
      box(g,1.95,.09,.95,0,1.54,.03,"#dd9b93");
      for(let i=0;i<5;i++)box(g,.23,.018,.93,-.75+i*.37,1.6,.03,i%2?pale:"#c77f7d");
      box(g,1.9,.22,.06,0,1.42,.49,"#e5b6a6");
      break;
    case "termosifone":
      for(let i=0;i<7;i++)box(g,.095,.91,.24,-.33+i*.11,.58,0,pale);
      box(g,.80,.06,.26,0,1.08,0,chrome);
      box(g,.80,.06,.26,0,.11,0,chrome);
      break;
    case "caldaia":
      appliance(g,pale,1.56);
      box(g,.48,.20,.04,0,.94,.41,"#9bb2b5");
      for(const x of [-.24,0,.24])cyl(g,.045,.15,x,.12,0,chrome);
      break;
    case "condizionatore":
      box(g,.85,.42,.35,0,1.39,-.11,pale);
      box(g,.75,.07,.035,0,1.21,.08,"#7495a3");
      fanFace(g,1.39,.075);
      break;
    case "deumidificatore":
      appliance(g,pale,1.0);
      for(let i=0;i<5;i++)box(g,.66,.025,.025,0,.37+i*.085,.407,dark);
      cyl(g,.055,.035,.24,.98,.2,"#89c1c5");
      break;
    case "telecomando-batterie":
      box(g,.28,.11,.72,0,.16,0,dark);
      ball(g,.07,0,.235,-.22,"#d5a2a2");
      for(let i=0;i<5;i++)ball(g,.03,(i%2?-.07:.07),.225,-.08+i*.09,pale);
      break;
    case "sifone-lavandino":
      rod(g,[-.25,1.45,0],[-.25,.43,0],.08,chrome);
      rod(g,[-.25,.43,0],[.25,.43,0],.08,chrome);
      rod(g,[.25,.43,0],[.25,1.03,0],.08,chrome);
      cyl(g,.10,.12,0,.10,0,dark);
      break;
    case "tubi-esterni":
      for(const x of [-.26,0,.26])rod(g,[x,.10,-.15],[x,1.60,-.15],.07,x===0?"#c18f72":chrome);
      rod(g,[-.32,.68,0],[.36,.68,0],.07,chrome);
      break;
    case "addolcitore-manutenzione":
      cyl(g,.27,1.38,0,.74,0,"#a9c2c9");
      cyl(g,.29,.16,0,1.48,0,dark);
      box(g,.38,.22,.18,.03,1.64,.13,pale);
      break;
    case "addolcitore-sale":
      cyl(g,.31,.83,0,.46,0,pale,.24);
      box(g,.46,.35,.032,0,.51,.24,"#b1bfd3");
      box(g,.41,.07,.04,0,.29,.255,"#829fac");
      break;
    case "filtro-cappa":
      box(g,.81,.12,.57,0,.32,0,dark);
      for(let i=0;i<7;i++)box(g,.025,.04,.48,-.34+i*.113,.40,0,chrome);
      break;
    case "filtro-condizionatore":
      box(g,.82,.76,.09,0,.48,0,chrome);
      for(let i=0;i<7;i++)box(g,.66,.03,.05,0,.18+i*.10,.065,dark);
      break;
    case "pareti":
      tiledWall(g,"#d9e1ce");
      box(g,.42,.25,.025,0,1.16,.04,"#f0dbd1");
      break;
    case "mobiletti-esterni":
      box(g,.86,1.08,.76,0,.58,0,"#8b9a88");
      for(const x of [-.23,.23]){box(g,.38,.90,.03,x,.58,.40,"#c4d1bc");ball(g,.036,x<0?-.07:.07,.64,.435,chrome);}
      break;
    case "dyson":
      vacuumStick(g,"cordless");
      box(g,.16,.42,.20,.11,.97,0,"#c9a5a5");
      break;
    case "dyson-accessori":
      box(g,.75,.14,.40,0,.15,0,wood);
      for(let i=0;i<3;i++){
        rod(g,[-.25+i*.24,.23,0],[-.25+i*.24,.75+i*.09,0],.048,chrome);
        cyl(g,.10,.10,-.25+i*.24,.81+i*.09,0,i===0?"#c6a5a5":dark);
      }
      break;
    case "folletto":
      vacuumStick(g,"upright");
      break;
    case "aspirapolvere":
      cyl(g,.32,.40,0,.31,0,"#b8a18a");
      cyl(g,.25,.055,0,.57,0,dark);
      for(const x of [-.25,.25])cyl(g,.095,.095,x,.11,.16,dark);
      rod(g,[.20,.47,0],[.44,1.25,.03],.045,chrome);
      box(g,.33,.14,.23,.33,.14,.27,"#9ab5b1");
      break;
    case "robot-aspirapolvere":
      cyl(g,.36,.17,0,.13,0,dark);
      cyl(g,.27,.018,0,.227,0,chrome);
      ball(g,.055,0,.27,-.16,"#e0a7a8");
      for(const x of [-.25,.25])box(g,.10,.035,.08,x,.06,.13,wood);
      break;

    // Extra furniture pieces: unlike the 67 chore assets these are freely decorative.
    case "poltrona":
      box(g,.82,.34,.74,0,.35,0,"#c79488");
      box(g,.82,.67,.16,0,.67,-.30,"#a77871");
      for(const x of [-.37,.37])box(g,.13,.52,.72,x,.47,0,"#b98b84");
      box(g,.61,.10,.47,0,.54,.12,pale);
      break;
    case "divano-angolare":
      box(g,1.87,.37,.79,0,.29,-.46,"#c59384");
      box(g,.85,.37,1.89,-.51,.29,0,"#c59384");
      box(g,1.87,.60,.16,0,.62,-.81,"#aa7b72");
      box(g,.17,.60,1.89,-.89,.62,0,"#aa7b72");
      for(const x of [-.50,.20,.63])box(g,.47,.10,.54,x,.52,-.44,pale);
      break;
    case "tavolino":
      box(g,.80,.10,.76,0,.51,0,wood);
      for(const x of [-.31,.31])for(const z of [-.29,.29])box(g,.09,.47,.09,x,.25,z,dark);
      break;
    case "mobile-tv":
      box(g,1.82,.51,.70,0,.34,0,"#c7a68b");
      for(const x of [-.47,.47])box(g,.83,.36,.035,x,.36,.37,pale);
      for(const x of [-.77,.77])box(g,.08,.10,.08,x,.05,.20,wood);
      break;
    case "televisore":
      box(g,.73,.99,.10,0,1.15,0,dark);
      box(g,.64,.79,.022,0,1.16,.062,"#7497a8");
      rod(g,[0,.24,0],[0,.66,0],.06,chrome);
      box(g,.49,.08,.34,0,.20,0,wood);
      break;
    case "libreria":
      box(g,1.75,1.86,.61,0,1.0,0,wood);
      box(g,1.59,1.72,.04,0,1.02,.33,pale);
      for(let j=0;j<4;j++) {
        box(g,1.72,.075,.64,0,.28+j*.49,0,"#ad8b6e");
        for(let i=0;i<8;i++)box(g,.12,.31+(i%3)*.035,.32,-.65+i*.18,.51+j*.49,0,["#8d9b93","#bd9998","#d4bb99"][i%3]);
      }
      break;
    case "lampada-terra":
      cyl(g,.25,.09,0,.06,0,dark);
      rod(g,[0,.09,0],[0,1.75,0],.03,chrome);
      cyl(g,.29,.40,0,1.58,0,"#e7cda7",.17);
      ball(g,.10,0,1.56,0,"#fff2cb");
      break;
    case "credenza":
      box(g,1.85,.98,.68,0,.53,0,wood);
      for(const x of [-.55,0,.55])box(g,.49,.72,.025,x,.59,.36,"#e7cfb7");
      for(const x of [-.55,0,.55])ball(g,.037,x,.56,.39,"#d0b17e");
      break;
    case "console":
      box(g,1.84,.10,.55,0,.90,0,wood);
      for(const x of [-.77,.77])box(g,.11,.85,.10,x,.46,0,"#957a65");
      box(g,.60,.31,.30,-.30,1.1,0,pale);
      break;
    case "sgabello":
      cyl(g,.33,.09,0,.54,0,wood);
      for(const x of [-.23,.23])for(const z of [-.23,.23])rod(g,[x,.08,z],[x,.51,z],.035,dark);
      break;
    case "ventilatore":
      cyl(g,.26,.08,0,.06,0,dark);
      rod(g,[0,.08,0],[0,1.16,0],.045,chrome);
      hoop(g,.32,.04,0,1.37,.08,chrome,true);
      fanFace(g,1.37,.10);
      break;
    case "comodino":
      box(g,.73,.67,.67,0,.41,0,wood);
      for(const y of [.28,.54]){box(g,.62,.24,.04,0,y,.36,pale);ball(g,.027,0,y,.39,dark);}
      break;
    case "cassettiera":
      box(g,.79,1.34,.70,0,.71,0,wood);
      for(let i=0;i<4;i++){box(g,.70,.25,.035,0,.28+i*.29,.37,pale);box(g,.17,.032,.06,0,.28+i*.29,.41,chrome);}
      break;
    case "letto-singolo":
      box(g,.86,.23,1.87,0,.23,0,wood);
      box(g,.79,.16,1.72,0,.43,.04,pale);
      box(g,.81,.07,1.11,0,.53,.32,"#bcd2c2");
      box(g,.90,.63,.12,0,.57,-.88,wood);
      box(g,.53,.10,.28,0,.54,-.55,"#fffdf9");
      break;
    case "culla":
      box(g,1.72,.18,.73,0,.40,0,"#ead7ba");
      for(const z of [-.38,.38])box(g,1.8,.58,.07,0,.72,z,wood);
      for(const x of [-.77,.77])box(g,.07,.66,.86,x,.70,0,wood);
      for(let i=0;i<7;i++)rod(g,[-.64+i*.21,.52,-.39],[-.64+i*.21,1.0,-.39],.023,pale);
      break;
    case "specchiera":
      box(g,.79,1.47,.11,0,1.01,0,wood);
      box(g,.68,1.35,.02,0,1.01,.07,"#a3c7c8");
      box(g,.87,.71,.47,0,.40,-.02,"#d6b799");
      break;
    case "appendiabiti":
      rod(g,[0,.10,0],[0,1.82,0],.055,wood);
      cyl(g,.32,.07,0,.08,0,wood);
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2;
        rod(g,[0,1.62,0],[Math.cos(a)*.33,1.70,Math.sin(a)*.33],.032,wood);
        ball(g,.065,Math.cos(a)*.34,1.70,Math.sin(a)*.34,chrome);
      }
      break;
    case "scarpiera":
      box(g,.84,1.11,.51,0,.61,0,"#bca28a");
      for(let i=0;i<3;i++){
        box(g,.78,.30,.055,0,.25+i*.35,.27,pale);
        box(g,.19,.025,.04,0,.25+i*.35,.32,chrome);
      }
      break;
    case "abat-jour":
      cyl(g,.18,.08,0,.09,0,wood);
      rod(g,[0,.10,0],[0,.60,0],.033,chrome);
      cyl(g,.29,.36,0,.78,0,"#e9d2bd",.15);
      ball(g,.075,0,.70,0,"#fff0c9");
      break;
    case "scrittoio":
      box(g,1.76,.10,.77,0,.79,0,wood);
      for(const x of [-.76,.76])for(const z of [-.29,.29])box(g,.08,.73,.08,x,.39,z,wood);
      box(g,.65,.12,.38,-.28,.89,-.12,pale);
      box(g,.39,.36,.08,.31,1.08,-.11,dark);
      break;
    case "microonde":
      box(g,.81,.52,.56,0,.34,0,"#aebec0");
      box(g,.55,.31,.04,-.07,.36,.31,dark);
      for(const y of [.26,.41])cyl(g,.034,.03,.34,y,.32,chrome);
      break;
    case "tostapane":
      box(g,.55,.43,.38,0,.29,0,"#bfc6bc");
      for(const x of [-.13,.13])box(g,.035,.03,.22,x,.51,0,dark);
      box(g,.07,.06,.10,.31,.31,.14,wood);
      break;
    case "bollitore":
      cyl(g,.23,.56,0,.33,0,chrome,.16);
      cyl(g,.20,.06,0,.66,0,dark);
      rod(g,[.18,.22,0],[.35,.45,0],.046,dark);
      rod(g,[.35,.45,0],[.18,.62,0],.046,dark);
      break;
    case "lavello-cucina":
      box(g,.84,.87,.73,0,.48,0,wood);
      box(g,.88,.08,.77,0,.93,0,pale);
      box(g,.55,.024,.45,0,.98,0,"#8faeb9");
      rod(g,[0,.98,-.26],[0,1.23,-.26],.024,chrome);
      rod(g,[0,1.23,-.26],[0,1.23,-.05],.025,chrome);
      break;
    case "tavolo-pranzo":
      box(g,1.84,.13,1.82,0,.76,0,"#c2a083");
      for(const x of [-.72,.72])for(const z of [-.70,.70])box(g,.11,.73,.11,x,.37,z,wood);
      break;
    case "sgabello-bar":
      cyl(g,.27,.08,0,1.12,0,wood);
      for(const x of [-.19,.19])for(const z of [-.19,.19])rod(g,[x,.07,z],[x,1.10,z],.029,dark);
      box(g,.47,.035,.035,0,.41,.18,chrome);
      break;
    case "dispensa":
      box(g,1.85,1.90,.74,0,.98,0,wood);
      for(const x of [-.47,.47]) {
        box(g,.87,1.72,.035,x,.99,.39,pale);
        ball(g,.035,x<0?-.10:.10,1.01,.43,dark);
      }
      break;
    case "asciugatrice":
      appliance(g,pale);
      hoop(g,.25,.05,0,.46,.41,"#728c97",true);
      ball(g,.17,0,.46,.43,"#bed7da");
      for(const x of [-.25,.25])ball(g,.04,x,.84,.41,dark);
      break;
    case "bidet":
      cyl(g,.31,.43,0,.28,0,pale);
      hoop(g,.26,.05,0,.52,0,"#e2ece8");
      rod(g,[0,.51,-.20],[0,.73,-.20],.025,chrome);
      rod(g,[0,.72,-.20],[0,.72,-.03],.025,chrome);
      break;
    case "termoarredo":
      for(let i=0;i<8;i++)box(g,.69,.055,.12,0,.19+i*.18,0,chrome);
      for(const x of [-.33,.33])box(g,.06,1.5,.12,x,.83,0,dark);
      break;
    case "stendino":
      for(const x of [-.85,.85])rod(g,[x,.10,-.25],[x,1.21,-.25],.035,chrome);
      for(let i=0;i<6;i++)rod(g,[-.85,1.22,-.33+i*.13],[.85,1.22,-.33+i*.13],.024,chrome);
      for(const x of [-.45,.23])box(g,.28,.38,.035,x,1.04,.23,x<0?"#e3b5b4":"#bed3c1");
      break;
    case "portabiancheria":
      cyl(g,.35,.77,0,.43,0,"#bc9e81",.30);
      hoop(g,.34,.03,0,.83,0,pale);
      for(let i=0;i<8;i++)box(g,.03,.63,.04,-.26+i*.075,.40,.28,"#f2dec7");
      break;
    case "fioriera":
      box(g,1.78,.58,.57,0,.33,0,"#ba8d72");
      box(g,1.71,.07,.52,0,.65,0,"#695c4e");
      for(let i=0;i<7;i++){
        const x=-.73+i*.24;
        rod(g,[x,.67,0],[x,1.13+(i%3)*.1,0],.032,"#648873");
        ball(g,.16,x,1.15+(i%3)*.1,0,i%2?"#e7b8ad":"#80ad8c");
      }
      break;
    case "panca-esterno":
      box(g,1.83,.17,.60,0,.52,0,wood);
      box(g,1.85,.61,.13,0,.85,-.24,wood);
      for(const x of [-.75,.75])box(g,.12,.51,.12,x,.29,.16,dark);
      break;
    case "ombrellone":
      cyl(g,.31,.08,0,.08,0,chrome);
      rod(g,[0,.12,0],[0,2.0,0],.035,wood);
      mesh(g,new THREE.ConeGeometry(.85,.41,8), "#c68e85",0,1.79,0);
      break;
    case "barbecue":
      box(g,.75,.19,.59,0,.77,0,dark);
      for(const x of [-.27,.27])for(const z of [-.21,.21])rod(g,[x,.10,z],[x,.74,z],.045,chrome);
      for(let i=0;i<6;i++)rod(g,[-.32,.87,-.24+i*.09],[.32,.87,-.24+i*.09],.02,chrome);
      box(g,.69,.10,.11,0,.30,-.26,wood);
      break;
    case "sedia-giardino":
      box(g,.68,.11,.64,0,.48,0,"#87a9a3");
      box(g,.66,.75,.10,0,.92,-.26,"#87a9a3");
      for(const x of [-.25,.25])for(const z of [-.24,.24])rod(g,[x,.08,z],[x,.48,z],.036,dark);
      break;
    case "portaombrelli":
      cyl(g,.27,.68,0,.38,0,"#a1b4b5");
      hoop(g,.26,.03,0,.74,0,chrome);
      for(const x of [-.10,.10]) {
        rod(g,[x,.30,0],[x,1.40,0],.025,wood);
        hoop(g,.12,.026,x+.12,1.38,0,wood,true);
      }
      break;
    default:
      box(g,Math.min(spec.width*.85,1.8),.75,Math.min(spec.height*.82,.84),0,.42,0,a);
      box(g,.25,.12,.08,0,.84,.39,b);
  }
  return true;
}
