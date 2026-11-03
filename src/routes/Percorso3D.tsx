import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Armchair, Brush, Check, Coins,
  Eye, EyeOff, Maximize, RotateCcw, RotateCw,
  Sparkles, Trash2, Trophy, Undo2, X, Grid2X2, WandSparkles, Move,
  ChevronLeft, ChevronRight, House, PlusCircle, type LucideIcon,
} from "lucide-react";
import { Room3DHouseScene, type House3DHandle, type GameMode } from "../components/percorso/Room3DHouseScene";
import { editHouseTile } from "../lib/percorso-grid";
import {
  autoArrangeRooms, loadRoomArrangement,
  moveRoomInArrangement, positionedRooms, reconcileRoomArrangement,
  saveRoomArrangement, type RoomArrangement,
} from "../lib/percorso-arrangement";
import { sampleFurniture } from "../components/percorso/three-room-model";
import {
  FLOOR_STYLES, WALL_STYLES, FURNITURE, loadHouse, saveHouse,
  validPlacement, type Direction, type Furniture, type FurnitureType,
  type FloorStyle, type HouseRoom, type HouseLayout, type WallStyle,
} from "../lib/percorso";
import { eligibleRoomNames, getRoomRule } from "../lib/chore-rooms";
import { getWallet, hasCompletedToday, loadData, type AppData } from "../lib/store";
import "./percorso3d.css";

const tabs: {id: "play"|"furniture"|"tiles"; title:string; Icon:LucideIcon}[] = [
  {id:"play", title:"Casa",Icon:Trophy},
  {id:"furniture",title:"Arreda",Icon:Armchair},
  {id:"tiles",title:"Modifica",Icon:Grid2X2},
];
const icons: Record<string,string> = {
  divano:"🛋️",letto:"🛏️",tavolo:"▣",sedia:"♧",armadio:"▤",
  lavatrice:"◉",vasca:"◠",pianta:"🌿",tappeto:"▦",frigo:"▥",
};
const floorSwatches: Record<FloorStyle,string> = {
  parquet:"#c6a783",piastrelle:"#dce6dd",cotto:"#c99276",
  terrazzo:"#e2d4d1",pietra:"#b8c8c4",
};
const wallSwatches: Record<WallStyle,string> = {
  avorio:"#f4e7d3",salvia:"#c8ddcb",cipria:"#efd0d2",
  righe:"#dcc3c4",carta:"#d0e1d4",
};

export function Percorso3D() {
  const [data,setData] = useState<AppData>(loadData);
  const [house,setHouse] = useState<HouseLayout>(()=>loadHouse(loadData().rooms));
  const [arrangement,setArrangement] = useState<RoomArrangement>(() =>
    loadRoomArrangement(loadHouse(loadData().rooms).rooms));
  const [roomId,setRoomId] = useState(() => loadData().rooms[0] ?? "");
  const [mode,setMode] = useState<GameMode>("play");
  const [showAll,setShowAll] = useState(false);
  const [panelOpen,setPanelOpen] = useState(false);
  const [walls,setWalls] = useState(true);
  const [adding,setAdding] = useState<FurnitureType|null>(null);
  const [rotation,setRotation] = useState<Direction>(0);
  const [selectedId,setSelectedId] = useState<string|null>(null);
  const [movingFurnitureId,setMovingFurnitureId] = useState<string|null>(null);
  const [finishPart,setFinishPart] = useState<"floor"|"wall">("floor");
  const [showcase,setShowcase] = useState(true);
  const [toast,setToast] = useState("");
  const [immersive,setImmersive] = useState(false);
  const sceneRef=useRef<House3DHandle|null>(null);
  const pageRef=useRef<HTMLDivElement|null>(null);
  const undoRef=useRef<Array<{house:HouseLayout; arrangement:RoomArrangement}>>([]);
  const [canUndo,setCanUndo] = useState(false);
  const room=house.rooms.find(r=>r.id===roomId) ?? house.rooms[0];
  const currentArrangement=useMemo(()=>
    reconcileRoomArrangement(house.rooms,arrangement),[house.rooms,arrangement]);
  const overviewRooms=useMemo(()=>
    positionedRooms(house.rooms,currentArrangement),[house.rooms,currentArrangement]);
  // Editing a room always uses its own coordinates; overview placement is cosmetic.
  const sceneRoom=useMemo(()=>room?
    (showAll ? overviewRooms.find(r=>r.id===room.id) ?? room : {...room,offsetX:0,offsetY:0})
    : undefined,[room,showAll,overviewRooms]);
  const roomName=room?.name ?? "La tua casa";
  const roomIndex=house.rooms.findIndex(r=>r.id===room?.id);
  function nextRoom(step:-1|1) {
    if(house.rooms.length<2)return;
    const next=(roomIndex+step+house.rooms.length)%house.rooms.length;
    chooseRoom(house.rooms[next].id);
  }
  const preview = Boolean(room && showcase && room.furniture.length===0 && mode!=="tiles");
  const demoItems=useMemo(()=>room?sampleFurniture(room.kind,room):[],[room]);
  const items=room?(preview?demoItems:room.furniture):[];
  const selected=items.find(item=>item.id===selectedId);
  const selectedSpec=FURNITURE.find(x=>x.id===selected?.type);
  const relevantChores=room?data.chores.filter(chore =>
    eligibleRoomNames(data.rooms,data.roomDetails,getRoomRule(chore)).includes(room.name)):[];
  const completed=relevantChores.filter(chore=>hasCompletedToday(data,chore.id)).length;
  const completionPercent = relevantChores.length? Math.round(completed/relevantChores.length*100):0;
  const wallet=getWallet(data);
  const objectChores=selectedSpec?relevantChores.filter(chore=>{
    const title=chore.title.toLocaleLowerCase("it");
    const label=selectedSpec.label.toLocaleLowerCase("it");
    return title.includes(label)|| (selected?.type==="frigo"&&title.includes("frigorifero"));
  }):[];

  useEffect(()=>{
    if(!toast)return;
    const timeout=window.setTimeout(()=>setToast(""),3100);
    return ()=>window.clearTimeout(timeout);
  },[toast]);

  useEffect(()=>{
    const original=document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const before=original?.content;
    if(original)original.content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
    const suppress=(e:TouchEvent)=>{
      if(e.touches.length>1 && !(e.target instanceof Element && e.target.closest(".game3d-scene"))) e.preventDefault();
    };
    const onFull=()=>setImmersive(Boolean(document.fullscreenElement));
    const sync=()=>{
      const updated=loadData();
      setData(updated);
      setHouse(previous=>{
        const saved=loadHouse(updated.rooms);
        const currentIds=previous.rooms.map(r=>r.name).join("|");
        return currentIds===saved.rooms.map(r=>r.name).join("|")?previous:saved;
      });
    };
    document.addEventListener("touchmove",suppress,{passive:false});
    document.addEventListener("fullscreenchange",onFull);
    window.addEventListener("focus",sync);
    window.addEventListener("curacasa:data-changed",sync);
    return ()=>{
      if(original && before!==undefined)original.content=before;
      document.removeEventListener("touchmove",suppress);
      document.removeEventListener("fullscreenchange",onFull);
      window.removeEventListener("focus",sync);
      window.removeEventListener("curacasa:data-changed",sync);
    };
  },[]);

  function rememberChange() {
    undoRef.current=[...undoRef.current.slice(-19),{house,arrangement:currentArrangement}];
    setCanUndo(true);
  }
  function persist(next: HouseLayout) {
    rememberChange();
    setHouse(next);
    saveHouse(next);
  }
  function persistArrangement(next: RoomArrangement) {
    if(next===currentArrangement)return;
    rememberChange();
    setArrangement(next);
    saveRoomArrangement(next);
  }
  function updateRoom(next: HouseRoom) {
    persist({...house,rooms:house.rooms.map(r=>r.id===next.id?next:r)});
  }
  function undo() {
    const previous=undoRef.current.pop();
    if(!previous)return;
    setHouse(previous.house);saveHouse(previous.house);
    setArrangement(previous.arrangement);saveRoomArrangement(previous.arrangement);
    setCanUndo(undoRef.current.length>0);
    setSelectedId(null);setAdding(null);setMovingFurnitureId(null);
    setToast("Ultima modifica annullata.");
  }
  function applyShowcase() {
    if(!room || !preview || !demoItems.length)return;
    const saved=demoItems.map(item=>({...item,id:"arredo_"+crypto.randomUUID()}));
    const chosen=selectedId && demoItems.find(item=>item.id===selectedId);
    updateRoom({...room,furniture:saved});
    setSelectedId(chosen?saved.find(item=>item.type===chosen.type)?.id??null:null);
    setMovingFurnitureId(null);
    setShowcase(false);
    setToast("Stanza salvata. Tocca un mobile e usa Sposta.");
  }
  function selectFurniture(id:string|null) {
    setSelectedId(id);
    setMovingFurnitureId(null);
    if(id){setAdding(null);setPanelOpen(false);}
  }
  function startMovingFurniture() {
    if(!selected || preview)return;
    setMovingFurnitureId(selected.id);
    setPanelOpen(false);
    setToast("Trascina il mobile oppure tocca un tile libero per spostarlo.");
  }
  function chooseRoom(id:string) {
    setRoomId(id);setSelectedId(null);setAdding(null);setMovingFurnitureId(null);
    setShowcase(true);setPanelOpen(false);
    setShowAll(false);
    setMode("play");
    sceneRef.current?.fit();
  }
  function chooseMode(next:GameMode) {
    setMode(next);setAdding(null);setSelectedId(null);setMovingFurnitureId(null);
    if(next==="furniture")setShowAll(false);
    setPanelOpen(next==="furniture");
    if(next==="tiles")setToast("Tocca il pavimento per togliere tile; tocca le caselle verdi per aggiungerli.");
  }
  function changeView(all:boolean){
    setShowAll(all);setAdding(null);setSelectedId(null);setMovingFurnitureId(null);setPanelOpen(false);
    if(all)setMode("play");
    setToast(all?"Trascina una stanza per sistemarla. Toccala per entrarci.":"");
  }
  function resetArrangement() {
    persistArrangement(autoArrangeRooms(house.rooms,currentArrangement.order));
    sceneRef.current?.fit();
    setToast("Stanze disposte automaticamente. Puoi riordinarle o trascinarle.");
  }

  function changeTile(id:string,x:number,y:number){
    const source=house.rooms.find(r=>r.id===id);
    if(!source || id!==room?.id)return;
    const result=editHouseTile(source,house.rooms,x,y);
    if(!result.room){setToast(result.reason);return;}
    updateRoom(result.room);
    setPanelOpen(false);
    setToast(result.reason+" Puoi usare Annulla.");
  }
  function shiftRoom(id:string,dx:number,dy:number){
    const result=moveRoomInArrangement(house.rooms,currentArrangement,id,dx,dy);
    if(!result.arrangement){setToast(result.reason);return;}
    persistArrangement(result.arrangement);
    const selectedRoom=house.rooms.find(r=>r.id===id);
    setToast((selectedRoom?.name??"Stanza")+" spostata nella vista Casa intera. Le sue misure non cambiano.");
  }
  function place(item: Furniture) {
    if(!room)return;
    if(preview){setToast("Prima usa l'esempio oppure scegli «Parti da zero».");return;}
    if(!validPlacement(room,item)){setToast("Spazio occupato: prova un'altra casella.");return;}
    updateRoom({...room,furniture:[...room.furniture,item]});
    setSelectedId(item.id);setAdding(null);setMovingFurnitureId(null);
    setPanelOpen(false);
    setToast("Arredo posizionato. Toccalo per spostarlo o ruotarlo.");
  }
  function move(id:string,x:number,y:number) {
    if(!room || preview)return;
    const item=room.furniture.find(obj=>obj.id===id);
    if(!item || !validPlacement(room,{...item,x,y},id))return;
    updateRoom({...room,furniture:room.furniture.map(obj=>obj.id===id?{...obj,x,y}:obj)});
    setSelectedId(id);
    setMovingFurnitureId(null);
    setToast("Mobile spostato.");
  }
  function rotateSelected() {
    if(!room || !selected || preview)return;
    const turn=((selected.rotation+1)%4) as Direction;
    const candidate={...selected,rotation:turn};
    if(!validPlacement(room,candidate,selected.id)){
      setToast("Qui non c'è spazio per ruotarlo.");return;
    }
    updateRoom({...room,furniture:room.furniture.map(obj=>obj.id===selected.id?candidate:obj)});
    setToast("Arredo ruotato.");
  }
  function deleteSelected() {
    if(!room || !selected || preview)return;
    updateRoom({...room,furniture:room.furniture.filter(obj=>obj.id!==selected.id)});
    setMovingFurnitureId(null);
    setSelectedId(null);setToast("Arredo rimosso. Puoi annullare.");
  }
  function finish(style:FloorStyle|WallStyle) {
    if(!room)return;
    updateRoom(finishPart==="floor"?{...room,floor:style as FloorStyle}:{...room,wall:style as WallStyle});
    setPanelOpen(false);
    setToast("Finitura aggiornata.");
  }
  async function fullscreen() {
    try {
      if(document.fullscreenElement)await document.exitFullscreen();
      else if(pageRef.current?.requestFullscreen)await pageRef.current.requestFullscreen();
      else setToast("Installa CuraCasa dalla schermata Home per eliminare la barra del browser.");
    } catch {
      setToast("Il browser integrato blocca lo schermo intero; apri la PWA dalla Home.");
    }
  }

  return <main ref={pageRef} className="game3d-page">
    <header className="game3d-header">
      <Link to="/percorso" aria-label="Torna al Percorso classico" className="game3d-back"><ArrowLeft size={20}/></Link>
      <div className="game3d-brand"><span className="game3d-overline">CURACASA · NUOVO LAB</span><strong>La tua casa 3D</strong></div>
      <span className="game3d-coins"><Coins size={17}/>{wallet.balance}</span>
      <button className="game3d-head-icon" type="button" onClick={undo} disabled={!canUndo} aria-label="Annulla ultima modifica"><Undo2 size={19}/></button>
      <button className="game3d-head-icon" type="button" onClick={fullscreen} aria-label={immersive?"Esci dallo schermo intero":"Schermo intero"}><Maximize size={19}/></button>
    </header>
    <div className="game3d-stage">
      {sceneRoom ? <Room3DHouseScene ref={sceneRef} room={sceneRoom}
        rooms={showAll ? overviewRooms : [sceneRoom]} items={items} mode={mode}
        showAll={showAll} movingRooms={showAll}
        adding={adding} rotation={rotation} selectedId={selectedId}
        movingFurnitureId={movingFurnitureId} isShowcasePreview={preview}
        showWalls={walls} panelOpen={panelOpen} onPlace={place} onMove={move}
        onPickRoom={chooseRoom} onMoveRoom={shiftRoom} onTile={changeTile}
        onSelect={selectFurniture}
        onFinish={(part)=>{setFinishPart(part);setPanelOpen(true);}}
        onError={setToast}/> : <div className="game3d-no-room">Aggiungi una stanza in CuraCasa per iniziare. <Link to="/app">Vai alle stanze</Link></div>}
      <div className="game3d-stage-top game3d-stage-top--simple">
        <div className="game3d-room-nav" role="group" aria-label="Scegli ambiente">
          {showAll ? <span className="game3d-room-title"><House size={16}/> Tutta la casa</span> : <>
            <button type="button" disabled={house.rooms.length<2} aria-label="Stanza precedente"
              onClick={()=>nextRoom(-1)}><ChevronLeft size={20}/></button>
            <strong className="game3d-room-title">{roomName}</strong>
            <button type="button" disabled={house.rooms.length<2} aria-label="Stanza successiva"
              onClick={()=>nextRoom(1)}><ChevronRight size={20}/></button>
          </>}
        </div>
        <button type="button" className={"game3d-view-toggle"+(showAll?" active":"")}
          aria-label={showAll?"Torna alla stanza":"Vedi tutta la casa"}
          onClick={()=>changeView(!showAll)}>
          {showAll?<ChevronLeft size={17}/>:<House size={19}/>}
          <span>{showAll?"Stanza":"Casa intera"}</span>
        </button>
      </div>
      {showAll && <button type="button" className="game3d-autoplace-pill"
        onClick={resetArrangement} aria-label="Disponi automaticamente le stanze">
        <WandSparkles size={16}/> Disponi
      </button>}
      {mode==="play" && !showAll && <button type="button"
        className="game3d-progress game3d-progress--touch"
        aria-label="Apri le missioni di questa stanza"
        onClick={()=>setPanelOpen(true)}>
        <div className="game3d-progress-copy"><span>{showAll?"CASA · "+house.rooms.length+" STANZE":"OGGI · "+roomName}</span><strong>{completed}/{relevantChores.length} missioni</strong></div>
        <div className="game3d-progress-track"><span style={{width:completionPercent+"%"}}/></div>
      </button>}
      {preview && !showAll && !selected && <div className="game3d-showcase">
        <div><strong><Sparkles size={15}/> Stanza d'esempio</strong><small>Anteprima: nulla viene salvato automaticamente</small></div>
        <div className="game3d-showcase-actions">
          <button type="button" onClick={()=>{setShowcase(false);setToast("Stanza vuota: inizia ad arredare.");}}>Parti da zero</button>
          <button type="button" onClick={applyShowcase} disabled={!demoItems.length}>Usa questa</button>
        </div>
      </div>}
      <div className="game3d-camera-dock game3d-camera-dock--simple" role="group" aria-label="Visuale">
        <button type="button" aria-label="Ruota a sinistra" onClick={()=>sceneRef.current?.turn(-1)}><RotateCcw size={19}/></button>
        <button type="button" aria-label="Ruota a destra" onClick={()=>sceneRef.current?.turn(1)}><RotateCw size={19}/></button>
        <button type="button" aria-label="Mostra o nascondi le pareti"
          aria-pressed={walls} onClick={()=>setWalls(value=>!value)}>
          {walls?<Eye size={18}/>:<EyeOff size={18}/>}
        </button>
      </div>
      {!showAll && !selected && (mode==="tiles"||mode==="finishes") && <div className="game3d-quicktools"
        role="group" aria-label="Strumenti per modificare la stanza">
        <button type="button" className={mode==="tiles"?"active":""}
          aria-pressed={mode==="tiles"} onClick={()=>{setMode("tiles");setPanelOpen(false);}}>
          <Grid2X2 size={18}/> Forma
        </button>
        <button type="button" className={mode==="finishes"?"active":""}
          aria-pressed={mode==="finishes"} onClick={()=>{setMode("finishes");setPanelOpen(true);}}>
          <Brush size={18}/> Colori
        </button>
      </div>}
      {!showAll && mode==="furniture"&&!adding&&!panelOpen && <button
        type="button" className="game3d-add-furniture"
        onClick={()=>setPanelOpen(true)}><PlusCircle size={19}/> Scegli un mobile</button>}
      {mode==="furniture"&&adding && <div className="game3d-placement-hint">
        <span>Posiziona: <strong>{FURNITURE.find(x=>x.id===adding)?.label}</strong></span>
        <button type="button" aria-label="Ruota arredo da aggiungere"
          onClick={()=>setRotation(v=>((v+1)%4) as Direction)}><RotateCw size={18}/></button>
        <button type="button" aria-label="Annulla aggiunta" onClick={()=>{setAdding(null);setPanelOpen(true);}}><X size={19}/></button>
      </div>}
      {selected && !adding && !showAll && mode!=="tiles" && <div
        className={"game3d-selected game3d-object-menu"+(movingFurnitureId?" game3d-object-menu--moving":"")}
        role="group" aria-label={"Azioni per "+(selectedSpec?.label??"mobile")}>
        <div className="game3d-object-label">
          <strong>{selectedSpec?.label}</strong>
          <span>{preview?"Anteprima non salvata":movingFurnitureId?
            "Trascina o tocca dove posizionarlo":
            objectChores.length?objectChores.filter(c=>hasCompletedToday(data,c.id)).length+"/"+objectChores.length+" faccende":
            "Tocca un'azione"}</span>
        </div>
        {preview ? <button type="button" className="game3d-object-save"
          onClick={applyShowcase}><Check size={19}/><small>Usa questa</small></button> : <>
          <button type="button" className={movingFurnitureId?"active":""}
            aria-pressed={Boolean(movingFurnitureId)} onClick={()=>
              movingFurnitureId?setMovingFurnitureId(null):startMovingFurniture()}>
            <Move size={19}/><small>{movingFurnitureId?"Annulla":"Sposta"}</small>
          </button>
          <button type="button" aria-label="Ruota mobile" onClick={rotateSelected}>
            <RotateCw size={19}/><small>Ruota</small>
          </button>
          <button type="button" aria-label="Rimuovi mobile" onClick={deleteSelected}>
            <Trash2 size={19}/><small>Rimuovi</small>
          </button>
        </>}
        <button type="button" className="game3d-object-close" aria-label="Chiudi menu mobile"
          onClick={()=>selectFurniture(null)}><X size={17}/></button>
      </div>
      {toast && <p className="game3d-toast" role="status">{toast}</p>}
      {panelOpen && <section className="game3d-sheet open" aria-label="Comandi contestuali">
        <button type="button" className="game3d-sheet-handle" aria-expanded={panelOpen}
          onClick={()=>setPanelOpen(v=>!v)}>
          <span className="game3d-handle-dash"/>
          <strong>{mode==="play"?"Missioni":mode==="furniture"?"Mobili":"Colori e materiali"}</strong>
          <X size={18}/>
        </button>
        <div className="game3d-sheet-content">
          {mode==="play" && <>
            {selectedSpec && <div className="game3d-object-context">
              <strong>{selectedSpec.label}</strong>
              <span>{objectChores.length?"Faccende collegate: "+objectChores.map(c=>c.title).join(", "):"Nessuna faccenda specifica collegata."}</span>
            </div>}
            {relevantChores.length ? <div className="game3d-missions">
              {relevantChores.slice(0,5).map(chore=>{
                const done=hasCompletedToday(data,chore.id);
                return <div className={"game3d-mission"+(done?" done":"")} key={chore.id}>
                  {done?<Check size={18}/>:<Trophy size={18}/>}
                  <span>{chore.title}</span><small>{done?"Fatta":"Da fare"}</small>
                </div>;
              })}
            </div> : <p className="game3d-empty">Qui non ci sono ancora faccende: aggiungile dall'app.</p>}
            <Link to="/app/faccende" className="game3d-main-cta">Apri le faccende</Link>
          </>}
          {mode==="furniture" && <>
            {preview && <div className="game3d-demo-choice">
              <p className="game3d-empty">Stai guardando un esempio non salvato. Scegli come iniziare:</p>
              <div>
                <button type="button" onClick={()=>{setShowcase(false);setToast("Stanza vuota: scegli un arredo.");}}>Parti da zero</button>
                <button type="button" onClick={()=>{applyShowcase();setPanelOpen(false);}}>Usa questa stanza</button>
              </div>
            </div>}
            <div className="game3d-catalog">
              {FURNITURE.map(entry=><button type="button" key={entry.id} disabled={preview}
                className={adding===entry.id?"active":""}
                onClick={()=>{setAdding(entry.id);setSelectedId(null);setPanelOpen(false);}}>
                <span aria-hidden="true">{icons[entry.id]}</span><strong>{entry.label}</strong>
                <small>{entry.width}×{entry.height}</small>
              </button>)}
            </div>
            <p className="game3d-sheet-note">Scegli un mobile e tocca o trascina sulla stanza: l'anteprima diventa rossa se la posizione è occupata.</p>
          </>}

          {mode==="finishes" && <>
            <div className="game3d-finish-tabs">
              <button type="button" className={finishPart==="floor"?"active":""} onClick={()=>setFinishPart("floor")}>Pavimenti</button>
              <button type="button" className={finishPart==="wall"?"active":""} onClick={()=>setFinishPart("wall")}>Pareti</button>
            </div>
            <div className="game3d-finishes">
              {(finishPart==="floor"?FLOOR_STYLES:WALL_STYLES).map(item=><button type="button" key={item.id}
                className={room?.[finishPart]===item.id?"selected":""} onClick={()=>finish(item.id)}>
                <span className="game3d-finish-swatch"
                  style={{background:finishPart==="floor"?floorSwatches[item.id as FloorStyle]:wallSwatches[item.id as WallStyle]}}/>
                <strong>{item.label}</strong>{room?.[finishPart]===item.id&&<Check size={15}/>}
              </button>)}
            </div>
          </>}
        </div>
      </section>}
    </div>
    {!showAll && <nav className="game3d-tabs" aria-label="Modalità di gioco">
      {tabs.map(({id,title,Icon})=>{
        const active=id==="tiles"?mode==="tiles"||mode==="finishes":mode===id;
        return <button key={id} type="button" className={active?"active":""}
          aria-pressed={active} onClick={()=>chooseMode(id)}><Icon size={23}/><span>{title}</span></button>;
      })}
    </nav>}
  </main>;
}
