import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import {
  Box, Check, ChevronLeft, Eraser, Eye, EyeOff, Grid2X2, Hand, Layers3,
  Minus, Paintbrush, Plus, RotateCcw, RotateCw, Trash2, X, ZoomIn,
} from "lucide-react";
import { IsometricBoard } from "../components/percorso/IsometricBoard";
import { isoDeltaToTiles, pinchCamera, clampStageZoom } from "../lib/percorso-gestures";
import {
  FLOOR_STYLES, FURNITURE, WALL_STYLES, canMoveRoom, furnitureSize, loadHouse,
  newRoom, reconcileHouse, resizeRoom, saveHouse, snapRoom, toggleCell, validPlacement,
  type Direction, type FloorStyle, type Furniture, type FurnitureType,
  type HouseLayout, type HouseRoom, type WallStyle,
} from "../lib/percorso";
import { loadData } from "../lib/store";
import "../styles/percorso.css";

type Mode = "esplora" | "forma" | "arredi" | "sposta";
type Hit = { kind: "floor" | "wall" | "object"; roomId: string; x: number; y: number; objectId: string };
type Palette = { type: "floor" | "wall"; roomId: string; tile?: { x: number; y: number } };
type Camera = { zoom: number; pan: { x: number; y: number } };
type Drag = {
  pointerId: number;
  kind: "room" | "object" | "pan" | "tap";
  hit: Hit | null;
  roomId: string;
  objectId: string;
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  inverse: DOMMatrix | null;
  initialPan: { x: number; y: number };
  moved: boolean;
};
type Pinch = {
  distance: number;
  midpoint: { x: number; y: number };
  zoom: number;
  pan: { x: number; y: number };
};
const direction = (value: number): Direction => ((value % 4 + 4) % 4) as Direction;
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const defaultCamera: Camera = { zoom: 1, pan: { x: 0, y: 0 } };
const modes = [
  { id: "esplora", label: "Esplora", Icon: Hand },
  { id: "forma", label: "Forma", Icon: Eraser },
  { id: "arredi", label: "Arreda", Icon: Box },
  { id: "sposta", label: "Sposta", Icon: Grid2X2 },
] as const;

export function Percorso() {
  const [house, setHouse] = useState<HouseLayout>(() => loadHouse(loadData().rooms));
  const houseRef = useRef(house);
  const [roomId, setRoomId] = useState(() => loadData().rooms[0] ?? "");
  const [view, setView] = useState<Direction>(0);
  const [mode, setMode] = useState<Mode>("esplora");
  const [showAll, setShowAll] = useState(false);
  const [showWalls, setShowWalls] = useState(true);
  const [furnitureType, setFurnitureType] = useState<FurnitureType>("divano");
  const [placementRotation, setPlacementRotation] = useState<Direction>(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [camera, setCamera] = useState<Camera>(defaultCamera);
  const cameraRef = useRef(camera);
  const [snapTarget, setSnapTarget] = useState("");
  const [message, setMessage] = useState("Tocca pavimenti e pareti per personalizzarli.");
  const [resetConfirm, setResetConfirm] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<Drag | null>(null);
  const pinch = useRef<Pinch | null>(null);
  const pinchInProgress = useRef(false);

  const room = house.rooms.find((entry) => entry.id === roomId) ?? house.rooms[0];
  const activeRoomId = room?.id ?? "";
  const selected = room?.furniture.find((entry) => entry.id === selectedId);
  const selectedSpec = selected && FURNITURE.find((entry) => entry.id === selected.type);
  const chosenRoom = palette && house.rooms.find((entry) => entry.id === palette.roomId);
  const target = house.rooms.find((entry) => entry.id === snapTarget && entry.id !== activeRoomId)
    ?? house.rooms.find((entry) => entry.id !== activeRoomId);
  const placing = furnitureSize({ id: "preview", type: furnitureType, x: 0, y: 0, rotation: placementRotation });

  useEffect(() => { cameraRef.current = camera; }, [camera]);
  useEffect(() => { houseRef.current = house; }, [house]);

  // Lock browser-page pinch only during this separate laboratory route.
  // The stage has touch-action:none and implements its own bounded, scene-only zoom.
  useEffect(() => {
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const original = viewport?.content;
    if (viewport) viewport.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
    const preventOutsidePinch = (event: TouchEvent) => {
      if (event.touches.length > 1 && !(event.target instanceof Element && event.target.closest(".pc-stage-view"))) {
        event.preventDefault();
      }
    };
    document.addEventListener("touchmove", preventOutsidePinch, { passive: false });
    return () => {
      if (viewport && original !== undefined) viewport.content = original;
      document.removeEventListener("touchmove", preventOutsidePinch);
    };
  }, []);

  useEffect(() => {
    const syncRooms = () => {
      const current = houseRef.current;
      const next = reconcileHouse(loadData().rooms, current);
      if (next.rooms.map((item) => item.name).join("|") !== current.rooms.map((item) => item.name).join("|")) {
        houseRef.current = next;
        setHouse(next);
        saveHouse(next);
      }
    };
    window.addEventListener("focus", syncRooms);
    window.addEventListener("curacasa:data-changed", syncRooms);
    return () => {
      window.removeEventListener("focus", syncRooms);
      window.removeEventListener("curacasa:data-changed", syncRooms);
    };
  }, []);

  function applyHouse(next: HouseLayout, persist = true) {
    houseRef.current = next;
    setHouse(next);
    if (persist) saveHouse(next);
  }
  function updateRoom(updated: HouseRoom, persist = true): boolean {
    const current = houseRef.current;
    if (!canMoveRoom(current.rooms, updated)) {
      if (persist) setMessage("Le stanze non possono sovrapporsi: prova una posizione libera.");
      return false;
    }
    applyHouse({ ...current, rooms: current.rooms.map((entry) => entry.id === updated.id ? updated : entry) }, persist);
    return true;
  }
  function selectRoom(id: string) {
    setRoomId(id);
    setSelectedId(null);
    setPalette(null);
    setResetConfirm(false);
    setCamera(defaultCamera);
    setMessage("Stanza selezionata: il progetto è salvato separatamente dalle faccende.");
  }
  function chooseMode(next: Mode) {
    setMode(next);
    setPalette(null);
    setSelectedId(null);
    if (next === "sposta") setShowAll(true);
    setMessage({
      esplora: "Tocca una parete o il pavimento per scegliere un pattern.",
      forma: "Tocca un tile per rimuoverlo o ripristinarlo. La stanza deve restare collegata.",
      arredi: "Tocca il pavimento per posare un arredo; trascina un mobile per spostarlo.",
      sposta: "Prendi la stanza con un dito e trascinala accanto alle altre.",
    }[next]);
  }
  function changeDimension(axis: "width" | "height", amount: number) {
    if (!room) return;
    const changed = resizeRoom(room, room.width + (axis === "width" ? amount : 0),
      room.height + (axis === "height" ? amount : 0));
    if (changed.furniture.length !== room.furniture.length) {
      setMessage("Sposta prima gli arredi che occupano l'area da rimuovere.");
      return;
    }
    if (updateRoom(changed)) setMessage("Dimensioni aggiornate.");
  }
  function handleFloor(id: string, x: number, y: number) {
    const current = houseRef.current.rooms.find((entry) => entry.id === id);
    if (!current) return;
    if (id !== activeRoomId) { selectRoom(id); return; }
    if (mode === "sposta") return;
    if (mode === "forma") {
      const result = toggleCell(current, x, y);
      if (!result) { setMessage("Non puoi eliminare l'ultimo collegamento né un tile occupato."); return; }
      updateRoom(result);
      setMessage("Singolo tile modificato.");
      return;
    }
    if (mode === "arredi") {
      const item: Furniture = { id: `arredo_${crypto.randomUUID()}`, type: furnitureType, x, y, rotation: placementRotation };
      if (!validPlacement(current, item)) {
        setMessage("Il mobile non entra nei tile liberi: scegli una zona più ampia.");
        return;
      }
      updateRoom({ ...current, furniture: [...current.furniture, item] });
      setSelectedId(item.id);
      setMessage("Arredo aggiunto. Puoi prenderlo con un dito per trascinarlo.");
      return;
    }
    setPalette({ type: "floor", roomId: id, tile: { x, y } });
    setMessage("Il pattern si applica a tutto il pavimento della stanza.");
  }
  function handleWall(id: string) {
    if (mode === "sposta") return;
    if (id !== activeRoomId) setRoomId(id);
    setPalette({ type: "wall", roomId: id });
    setMessage("Scegli il rivestimento per le pareti di questa stanza.");
  }
  function handleObject(id: string, objectId: string) {
    if (mode === "sposta") { setRoomId(id); return; }
    setRoomId(id);
    setMode("arredi");
    setSelectedId(objectId);
    setPalette(null);
    setMessage("Mobile selezionato: trascinalo, ruotalo o rimuovilo.");
  }
  function changePattern(value: FloorStyle | WallStyle) {
    if (!palette) return;
    const current = houseRef.current.rooms.find((entry) => entry.id === palette.roomId);
    if (!current) return;
    updateRoom(palette.type === "floor"
      ? { ...current, floor: value as FloorStyle }
      : { ...current, wall: value as WallStyle });
    setMessage(`Pattern ${palette.type === "floor" ? "del pavimento" : "delle pareti"} applicato a tutta la stanza.`);
    setPalette(null);
  }
  function removeSelectedTile() {
    if (!palette?.tile || palette.type !== "floor") return;
    const current = houseRef.current.rooms.find((entry) => entry.id === palette.roomId);
    if (!current) return;
    const changed = toggleCell(current, palette.tile.x, palette.tile.y);
    if (!changed) setMessage("Tile non eliminabile: serve a collegare la stanza o è occupato.");
    else { updateRoom(changed); setMessage("Tile rimosso. In Forma puoi anche ripristinarlo."); }
    setPalette(null);
  }
  function editFurniture(action: "rotate" | "delete") {
    const current = houseRef.current.rooms.find((entry) => entry.id === activeRoomId);
    const item = current?.furniture.find((entry) => entry.id === selectedId);
    if (!current || !item) return;
    if (action === "delete") {
      updateRoom({ ...current, furniture: current.furniture.filter((entry) => entry.id !== item.id) });
      setSelectedId(null);
      setMessage("Arredo rimosso.");
      return;
    }
    const next = { ...item, rotation: direction(item.rotation + 1) };
    if (!validPlacement(current, next, item.id)) {
      setMessage("Non c'è spazio per ruotare qui: prima sposta l'arredo.");
      return;
    }
    updateRoom({ ...current, furniture: current.furniture.map((entry) => entry.id === item.id ? next : entry) });
  }
  function attach(side: "nord" | "est" | "sud" | "ovest") {
    if (!room || !target) return;
    const updated = snapRoom(room, target, side);
    if (updateRoom(updated)) setMessage(`${room.name} agganciata a ${target.name}. Restano due stanze indipendenti.`);
  }
  function resetRoom() {
    if (!room) return;
    const i = house.rooms.findIndex((entry) => entry.id === room.id);
    if (updateRoom(newRoom(room.name, i))) {
      setResetConfirm(false);
      setSelectedId(null);
      setMessage("La stanza è tornata alla configurazione iniziale.");
    }
  }

  function sceneHit(targetElement: EventTarget | null): Hit | null {
    if (!(targetElement instanceof Element)) return null;
    const element = targetElement.closest<SVGElement>("[data-pc-kind]");
    if (!element) return null;
    const kind = element.dataset.pcKind as Hit["kind"];
    const room = element.dataset.pcRoom;
    if (!room || !["floor", "wall", "object"].includes(kind)) return null;
    return { kind, roomId: room, x: Number(element.dataset.pcX), y: Number(element.dataset.pcY), objectId: element.dataset.pcObject ?? "" };
  }
  function handleTap(hit: Hit | null) {
    if (!hit) { setPalette(null); return; }
    if (hit.kind === "wall") handleWall(hit.roomId);
    else if (hit.kind === "floor") handleFloor(hit.roomId, hit.x, hit.y);
    else if (hit.kind === "object") handleObject(hit.roomId, hit.objectId);
  }
  function onScenePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: distance(a, b), midpoint: mid(a, b), zoom: cameraRef.current.zoom, pan: cameraRef.current.pan };
      drag.current = null;
      pinchInProgress.current = true;
      return;
    }
    if (pointers.current.size > 2) return;
    pinchInProgress.current = false;
    const hit = sceneHit(event.target);
    const current = houseRef.current.rooms.find((entry) => entry.id === hit?.roomId);
    const object = current?.furniture.find((entry) => entry.id === hit?.objectId);
    const kind: Drag["kind"] = mode === "sposta" && hit && current ? "room"
      : mode === "arredi" && hit?.kind === "object" && object ? "object"
      : !hit && cameraRef.current.zoom > 1 ? "pan" : "tap";
    drag.current = {
      pointerId: event.pointerId, kind, hit,
      roomId: hit?.roomId ?? "", objectId: hit?.objectId ?? "",
      originX: kind === "room" ? (current?.offsetX ?? 0) : (object?.x ?? 0),
      originY: kind === "room" ? (current?.offsetY ?? 0) : (object?.y ?? 0),
      startX: event.clientX, startY: event.clientY,
      inverse: svgRef.current?.getScreenCTM()?.inverse() ?? null,
      initialPan: cameraRef.current.pan, moved: false,
    };
    if (kind === "room" && hit && hit.roomId !== activeRoomId) {
      setRoomId(hit.roomId);
      setSelectedId(null);
    }
    if (kind === "object" && hit) setSelectedId(hit.objectId);
  }
  function onScenePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = sceneRef.current?.getBoundingClientRect();
      if (!rect) return;
      const next = pinchCamera(pinch.current.zoom, pinch.current.pan, pinch.current.distance,
        pinch.current.midpoint, distance(a, b), mid(a, b),
        { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      cameraRef.current = next;
      setCamera(next);
      return;
    }
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId || pointers.current.size !== 1) return;
    const dx = event.clientX - gesture.startX, dy = event.clientY - gesture.startY;
    if (!gesture.moved && Math.hypot(dx, dy) < 7) return;
    if (gesture.kind === "tap") return;
    gesture.moved = true;
    if (gesture.kind === "pan") {
      const next = { zoom: cameraRef.current.zoom, pan: { x: gesture.initialPan.x + dx, y: gesture.initialPan.y + dy } };
      cameraRef.current = next;
      setCamera(next);
      return;
    }
    if (!gesture.inverse) return;
    const start = new DOMPoint(gesture.startX, gesture.startY).matrixTransform(gesture.inverse);
    const end = new DOMPoint(event.clientX, event.clientY).matrixTransform(gesture.inverse);
    const delta = isoDeltaToTiles(end.x - start.x, end.y - start.y, view);
    const x = gesture.originX + Math.round(delta.x), y = gesture.originY + Math.round(delta.y);
    const current = houseRef.current.rooms.find((entry) => entry.id === gesture.roomId);
    if (!current) return;
    if (gesture.kind === "room") {
      if (current.offsetX === x && current.offsetY === y) return;
      updateRoom({ ...current, offsetX: x, offsetY: y }, false);
    } else {
      const item = current.furniture.find((entry) => entry.id === gesture.objectId);
      if (!item || (item.x === x && item.y === y)) return;
      const updated = { ...item, x, y };
      if (!validPlacement(current, updated, item.id)) return;
      updateRoom({ ...current, furniture: current.furniture.map((entry) => entry.id === item.id ? updated : entry) }, false);
    }
  }
  function onScenePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    const multiTouch = pinchInProgress.current;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) pinchInProgress.current = false;
    if (!gesture || gesture.pointerId !== event.pointerId || multiTouch) {
      if (!pointers.current.size) drag.current = null;
      return;
    }
    if (gesture.moved) {
      saveHouse(houseRef.current);
      setMessage(gesture.kind === "room" ? "Stanza spostata e salvata." : "Posizione aggiornata.");
    } else if (event.type === "pointerup") handleTap(gesture.hit);
    drag.current = null;
  }
  function zoomBy(factor: number) {
    setCamera((before) => {
      const next = { ...before, zoom: clampStageZoom(before.zoom * factor) };
      cameraRef.current = next;
      return next;
    });
  }

  return <div className="percorso-page">
    <header className="pc-mobile-header">
      <Link to="/app" className="pc-back" aria-label="Torna a CuraCasa"><ChevronLeft size={21} /> CuraCasa</Link>
      <div className="pc-header-center"><span className="pc-lab-label">LAB</span><strong>Percorso Casa</strong></div>
      <button type="button" className="pc-icon-button" aria-label="Reimposta zoom e posizione della vista"
        onClick={() => { cameraRef.current = defaultCamera; setCamera(defaultCamera); }}><RotateCcw size={19} /></button>
    </header>

    <main className="pc-workspace">
      <section className="pc-stage" aria-label="Editor isometrico">
        <div className="pc-stage-toolbar">
          <label className="pc-room-picker"><span>Stanza</span>
            <select value={activeRoomId} aria-label="Scegli stanza"
              onChange={(event) => selectRoom(event.target.value)}>
              {house.rooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="pc-stage-actions" role="group" aria-label="Ambito visualizzazione">
            <button type="button" className={!showAll ? "active" : ""} aria-pressed={!showAll}
              onClick={() => { setShowAll(false); setCamera(defaultCamera); }}>Stanza</button>
            <button type="button" className={showAll ? "active" : ""} aria-pressed={showAll}
              onClick={() => { setShowAll(true); setCamera(defaultCamera); }}>Casa</button>
          </div>
          <button type="button" className="pc-visibility" title={showWalls ? "Nascondi pareti" : "Mostra pareti"}
            aria-label={showWalls ? "Nascondi pareti" : "Mostra pareti"}
            aria-pressed={showWalls} onClick={() => setShowWalls((current) => !current)}>
            {showWalls ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        <div className="pc-stage-view" ref={sceneRef}
          onPointerDown={onScenePointerDown} onPointerMove={onScenePointerMove}
          onPointerUp={onScenePointerEnd} onPointerCancel={onScenePointerEnd}
          onContextMenu={(event) => event.preventDefault()}>
          <div className="pc-scene-decoration" aria-hidden="true" />
          <div className="pc-scene-camera" style={{ transform: `translate(${camera.pan.x}px, ${camera.pan.y}px) scale(${camera.zoom})` }}>
            <div className="pc-svg-anchor" ref={(element) => {
              svgRef.current = element?.querySelector("svg") ?? null;
            }}>
              <IsometricBoard rooms={house.rooms} activeRoomId={activeRoomId} view={view}
                showAll={showAll} showWalls={showWalls} sculpt={mode === "forma"}
                selectedObject={selectedId} onCell={handleFloor} onWall={handleWall} onObject={handleObject} />
            </div>
          </div>
          <div className="pc-camera-controls">
            <button type="button" title="Ruota a sinistra" aria-label="Ruota a sinistra" onClick={() => setView((before) => direction(before - 1))}><RotateCcw size={18} /></button>
            <span>{view * 90}°</span>
            <button type="button" title="Ruota a destra" aria-label="Ruota a destra" onClick={() => setView((before) => direction(before + 1))}><RotateCw size={18} /></button>
          </div>
          <div className="pc-zoom-controls">
            <button type="button" aria-label="Rimpicciolisci scena" onClick={() => zoomBy(1 / 1.3)}><Minus size={17} /></button>
            <span aria-label={`Zoom ${Math.round(camera.zoom * 100)} percento`}><ZoomIn size={16} /> {Math.round(camera.zoom * 100)}%</span>
            <button type="button" aria-label="Ingrandisci scena" onClick={() => zoomBy(1.3)}><Plus size={17} /></button>
          </div>
          {!house.rooms.length && <div className="pc-no-rooms"><Layers3 size={30} /> Nessuna stanza registrata. Aggiungine una da CuraCasa.</div>}
        </div>
        <p className="pc-stage-status" role="status"><span>✦</span> {message}</p>
      </section>

      <section className="pc-gesture-panel" aria-label="Strumenti contestuali">
        {palette && chosenRoom ? <div className="pc-context-content pc-pattern-panel" key={palette.type + palette.roomId}>
          <div className="pc-context-heading">
            <div><small>FINITURE · {chosenRoom.name}</small><strong>{palette.type === "floor" ? "Pavimento completo" : "Pareti"}</strong></div>
            <button type="button" className="pc-close" aria-label="Chiudi selettore pattern" onClick={() => setPalette(null)}><X size={19} /></button>
          </div>
          <div className="pc-material-list">
            {(palette.type === "floor" ? FLOOR_STYLES : WALL_STYLES).map((style) =>
              <button type="button" key={style.id}
                className={`pc-material-choice ${(palette.type === "floor" ? chosenRoom.floor : chosenRoom.wall) === style.id ? "active" : ""}`}
                aria-pressed={(palette.type === "floor" ? chosenRoom.floor : chosenRoom.wall) === style.id}
                onClick={() => changePattern(style.id)}>
                <span className={`pc-material-swatch pc-${palette.type === "floor" ? "floor" : "wall"}-${style.id}`} />
                <span>{style.label}</span>{(palette.type === "floor" ? chosenRoom.floor : chosenRoom.wall) === style.id && <Check size={16} />}
              </button>)}
          </div>
          {palette.type === "floor" && palette.tile && <button type="button" className="pc-delete-tile"
            onClick={removeSelectedTile}><Eraser size={17} /> Rimuovi solo il tile {palette.tile.x + 1}, {palette.tile.y + 1}</button>}
          <p className="pc-tip">Le finiture vengono applicate all'intera superficie di questa stanza.</p>
        </div> : <>
          {mode === "esplora" && <div className="pc-context-content pc-explore-tip">
            <Paintbrush size={23} /><div><strong>Personalizza con un tocco</strong><span>Tocca il pavimento o una parete per scegliere il pattern. Due dita per lo zoom, frecce per ruotare.</span></div>
          </div>}
          {mode === "forma" && <div className="pc-context-content">
            <div className="pc-context-heading"><div><small>FORMA DELLA STANZA</small><strong>{room?.name ?? "Nessuna stanza"}</strong></div><Eraser size={21} /></div>
            {room && <div className="pc-dimensions">
              <div><span>Larghezza</span><div className="pc-stepper">
                <button type="button" aria-label="Riduci larghezza" onClick={() => changeDimension("width", -1)}><Minus size={18} /></button>
                <strong>{room.width} <small>tile</small></strong>
                <button type="button" aria-label="Aumenta larghezza" onClick={() => changeDimension("width", 1)}><Plus size={18} /></button>
              </div></div>
              <div><span>Lunghezza</span><div className="pc-stepper">
                <button type="button" aria-label="Riduci lunghezza" onClick={() => changeDimension("height", -1)}><Minus size={18} /></button>
                <strong>{room.height} <small>tile</small></strong>
                <button type="button" aria-label="Aumenta lunghezza" onClick={() => changeDimension("height", 1)}><Plus size={18} /></button>
              </div></div>
            </div>}
            <div className="pc-context-actions">
              <p className="pc-tip">Tocca una casella per eliminarla. Tocca una casella tratteggiata per aggiungerla.</p>
              {resetConfirm ? <div className="pc-confirm"><span>Ripristinare la stanza?</span><button type="button" onClick={resetRoom}>Conferma</button><button type="button" onClick={() => setResetConfirm(false)}>Annulla</button></div>
                : <button type="button" className="pc-minor-action" onClick={() => setResetConfirm(true)}><RotateCcw size={15} /> Ripristina</button>}
            </div>
          </div>}
          {mode === "arredi" && <div className="pc-context-content">
            <div className="pc-context-heading"><div><small>ARREDAMENTO</small><strong>{selectedSpec ? `Sposta ${selectedSpec.label.toLowerCase()}` : "Scegli e posiziona"}</strong></div>
              <button type="button" className="pc-icon-button" onClick={() => { setSelectedId(null); setMessage("Scegli un arredo e tocca il pavimento."); }} aria-label="Deseleziona arredo"><X size={18} /></button>
            </div>
            {selected && selectedSpec ? <div className="pc-selected-actions">
              <span className="pc-selected-icon" aria-hidden="true">{selectedSpec.icon}</span>
              <div className="pc-selected-label"><strong>{selectedSpec.label}</strong><small>{furnitureSize(selected).width}×{furnitureSize(selected).height} tile · trascina con un dito</small></div>
              <button type="button" onClick={() => editFurniture("rotate")}><RotateCw size={19} /><small>Ruota</small></button>
              <button type="button" className="pc-danger" onClick={() => editFurniture("delete")}><Trash2 size={19} /><small>Elimina</small></button>
            </div> : <>
              <div className="pc-furniture-strip" aria-label="Scegli un arredo">
                {FURNITURE.map((entry) => <button type="button" key={entry.id}
                  aria-pressed={furnitureType === entry.id} className={furnitureType === entry.id ? "active" : ""}
                  onClick={() => setFurnitureType(entry.id)}>
                  <span aria-hidden="true">{entry.icon}</span><strong>{entry.label}</strong><small>{entry.width}×{entry.height}</small>
                </button>)}
              </div>
              <div className="pc-place-row">
                <span><strong>{FURNITURE.find((entry) => entry.id === furnitureType)?.label}</strong> · {placing.width}×{placing.height} tile</span>
                <button type="button" onClick={() => setPlacementRotation((current) => direction(current + 1))}><RotateCw size={18} /> Ruota prima di posare</button>
              </div>
            </>}
          </div>}
          {mode === "sposta" && <div className="pc-context-content">
            <div className="pc-context-heading"><div><small>PUZZLE DELLA CASA</small><strong>Prendi e trascina {room?.name ?? "una stanza"}</strong></div><Hand size={22} /></div>
            <p className="pc-tip">Appoggia il dito su una stanza e trascinala. La posizione si aggancia ai tile e non può sovrapporsi alle altre stanze.</p>
            {room && house.rooms.length > 1 && target && <div className="pc-snap-section">
              <label htmlFor="pc-snap-target">Aggancio rapido a</label>
              <select id="pc-snap-target" value={target.id} onChange={(event) => setSnapTarget(event.target.value)}>
                {house.rooms.filter((entry) => entry.id !== room.id).map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
              </select>
              <div className="pc-snap-buttons">
                {(["nord", "est", "sud", "ovest"] as const).map((side) =>
                  <button type="button" key={side} onClick={() => attach(side)}>{side}</button>)}
              </div>
            </div>}
          </div>}
        </>}
      </section>
    </main>

    <nav className="pc-mode-dock" aria-label="Fasi di modifica">
      {modes.map(({ id, label, Icon }) =>
        <button type="button" key={id} className={mode === id ? "active" : ""}
          aria-pressed={mode === id} onClick={() => chooseMode(id)}>
          <Icon size={23} strokeWidth={mode === id ? 2.4 : 1.9} />
          <span>{label}</span>
        </button>)}
    </nav>
  </div>;
}
