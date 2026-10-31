import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, Check, ChevronLeft, Eraser,
  Grid2X2, Layers3, Minus, Move, Plus, RotateCcw, RotateCw, Trash2,
} from "lucide-react";
import { IsometricBoard } from "../components/percorso/IsometricBoard";
import {
  FLOOR_STYLES, FURNITURE, WALL_STYLES, canMoveRoom, furnitureSize, loadHouse,
  newRoom, reconcileHouse, resizeRoom, saveHouse, snapRoom, toggleCell, validPlacement,
  type Direction, type Furniture, type FurnitureType, type HouseLayout, type HouseRoom,
} from "../lib/percorso";
import { loadData } from "../lib/store";
import "../styles/percorso.css";

type Mode = "forma" | "arredi" | "seleziona";
const nextDirection = (value: number): Direction => ((value % 4 + 4) % 4) as Direction;

export function Percorso() {
  const [house, setHouse] = useState<HouseLayout>(() => loadHouse(loadData().rooms));
  const [roomId, setRoomId] = useState(() => loadData().rooms[0] ?? "");
  const [view, setView] = useState<Direction>(0);
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState<Mode>("arredi");
  const [furnitureType, setFurnitureType] = useState<FurnitureType>("divano");
  const [placementRotation, setPlacementRotation] = useState<Direction>(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapTarget, setSnapTarget] = useState("");
  const [message, setMessage] = useState("Scegli un arredo e tocca il pavimento per posizionarlo.");
  const [confirmReset, setConfirmReset] = useState(false);
  const room = house.rooms.find((item) => item.id === roomId) ?? house.rooms[0];
  const activeRoomId = room?.id ?? "";
  const selected = room?.furniture.find((item) => item.id === selectedId);
  const selectedSpec = selected && FURNITURE.find((entry) => entry.id === selected.type);
  const target = house.rooms.find((item) => item.id === snapTarget && item.id !== activeRoomId)
    ?? house.rooms.find((item) => item.id !== activeRoomId);

  useEffect(() => {
    const syncRooms = () => setHouse((current) => {
      const next = reconcileHouse(loadData().rooms, current);
      if (next.rooms.map((entry) => entry.id).join("|") === current.rooms.map((entry) => entry.id).join("|")) return current;
      saveHouse(next);
      return next;
    });
    window.addEventListener("focus", syncRooms);
    window.addEventListener("curacasa:data-changed", syncRooms);
    return () => {
      window.removeEventListener("focus", syncRooms);
      window.removeEventListener("curacasa:data-changed", syncRooms);
    };
  }, []);

  function updateHouse(next: HouseLayout) {
    setHouse(next);
    saveHouse(next);
  }
  function updateRoom(updated: HouseRoom) {
    if (!canMoveRoom(house.rooms, updated)) {
      setMessage("Questa modifica sovrapporrebbe due stanze. Sposta prima l'ambiente.");
      return;
    }
    updateHouse({ ...house, rooms: house.rooms.map((item) => item.id === updated.id ? updated : item) });
    setMessage("Modifica salvata sul dispositivo.");
  }
  function selectRoom(id: string) {
    setRoomId(id);
    setSelectedId(null);
    setConfirmReset(false);
    setMessage("Stanza selezionata. Le altre stanze restano indipendenti.");
  }
  function handleCell(id: string, x: number, y: number) {
    const current = house.rooms.find((item) => item.id === id);
    if (!current) return;
    if (id !== activeRoomId) { selectRoom(id); return; }
    if (mode === "forma") {
      const changed = toggleCell(current, x, y);
      if (!changed) {
        setMessage("Non puoi interrompere il pavimento o togliere una casella occupata da un arredo.");
        return;
      }
      updateRoom(changed);
      return;
    }
    if (mode === "arredi") {
      const item: Furniture = {
        id: `oggetto_${crypto.randomUUID()}`, type: furnitureType, x, y, rotation: placementRotation,
      };
      if (!validPlacement(current, item)) {
        setMessage("Non c'è spazio: l'oggetto deve rientrare nei tile liberi e non sovrapporsi ad altri.");
        return;
      }
      updateRoom({ ...current, furniture: [...current.furniture, item] });
      setSelectedId(item.id);
      setMessage("Arredo posizionato. Puoi aggiungerne altri o passare a Seleziona.");
      return;
    }
    setSelectedId(null);
    setMessage(`Casella ${x + 1}, ${y + 1} — seleziona un oggetto per modificarlo.`);
  }
  function handleObject(id: string, objectId: string) {
    if (id !== activeRoomId) setRoomId(id);
    setMode("seleziona");
    setSelectedId(objectId);
    setMessage("Oggetto selezionato: ruotalo, spostalo o rimuovilo.");
  }
  function editObject(action: "rotate" | "remove" | "up" | "down" | "left" | "right") {
    if (!room || !selected) return;
    if (action === "remove") {
      updateRoom({ ...room, furniture: room.furniture.filter((item) => item.id !== selected.id) });
      setSelectedId(null);
      setMessage("Oggetto rimosso.");
      return;
    }
    const next: Furniture = { ...selected };
    if (action === "rotate") next.rotation = nextDirection(next.rotation + 1);
    if (action === "up") next.y--;
    if (action === "down") next.y++;
    if (action === "left") next.x--;
    if (action === "right") next.x++;
    if (!validPlacement(room, next, next.id)) {
      setMessage("Posizione non valida: controlla lo spazio disponibile sulla griglia.");
      return;
    }
    updateRoom({ ...room, furniture: room.furniture.map((item) => item.id === selected.id ? next : item) });
  }
  function dimension(axis: "width" | "height", increment: number) {
    if (!room) return;
    const next = resizeRoom(room, room.width + (axis === "width" ? increment : 0),
      room.height + (axis === "height" ? increment : 0));
    if (next.width === room.width && next.height === room.height) return;
    if (next.furniture.length < room.furniture.length) {
      setMessage("Prima di restringere la stanza, sposta gli arredi fuori dall'area da rimuovere.");
      return;
    }
    updateRoom(next);
  }
  function moveRoom(dx: number, dy: number) {
    if (room) updateRoom({ ...room, offsetX: room.offsetX + dx, offsetY: room.offsetY + dy });
  }
  function attach(side: "nord" | "est" | "sud" | "ovest") {
    if (!room || !target) return;
    updateRoom(snapRoom(room, target, side));
    setShowAll(true);
  }
  function resetRoom() {
    if (!room) return;
    const index = house.rooms.findIndex((item) => item.id === room.id);
    const reset = newRoom(room.name, index);
    if (!canMoveRoom(house.rooms, reset)) {
      setMessage("Lo spazio iniziale è occupato da un'altra stanza. Spostala prima di ripristinare.");
      return;
    }
    updateRoom(reset);
    setSelectedId(null);
    setConfirmReset(false);
    setMessage("Stanza riportata alla planimetria iniziale.");
  }
  const currentFurniture = FURNITURE.find((entry) => entry.id === furnitureType)!;
  const placing = furnitureSize({ id: "", type: furnitureType, x: 0, y: 0, rotation: placementRotation });
  return <div className="percorso-page">
    <header className="percorso-topbar">
      <Link to="/app" className="pc-back"><ChevronLeft size={18} /> CuraCasa</Link>
      <span className="pc-lab-label"><span className="pc-lab-dot" /> LABORATORIO</span>
    </header>
    <div className="percorso-heading">
      <div>
        <p className="pc-kicker">Il tuo piccolo mondo domestico</p>
        <h1>Percorso <span>Casa</span></h1>
        <p>Costruisci le tue stanze tile dopo tile. Arredale, uniscile e osservale da quattro prospettive.</p>
      </div>
      <div className="pc-heading-count"><strong>{house.rooms.length}</strong><span>stanze registrate</span></div>
    </div>
    <div className="pc-workspace">
      <section className="pc-stage" aria-label="Visualizzazione della casa">
        <div className="pc-stage-toolbar">
          <span><Layers3 size={16} /> Vista isometrica</span>
          <div className="pc-stage-actions">
            <button type="button" className={!showAll ? "active" : ""} onClick={() => setShowAll(false)}>Stanza</button>
            <button type="button" className={showAll ? "active" : ""} onClick={() => setShowAll(true)}>Casa intera</button>
          </div>
        </div>
        <div className="pc-stage-view">
          <div className="pc-scene-decoration" aria-hidden="true" />
          <IsometricBoard rooms={house.rooms} activeRoomId={activeRoomId} view={view}
            showAll={showAll} sculpt={mode === "forma"}
            selectedObject={selectedId} onCell={handleCell} onObject={handleObject} />
          <div className="pc-camera-controls">
            <button type="button" aria-label="Ruota camera a sinistra" title="Ruota camera a sinistra"
              onClick={() => setView((value) => nextDirection(value - 1))}><RotateCcw size={18} /></button>
            <span>{view * 90}°</span>
            <button type="button" aria-label="Ruota camera a destra" title="Ruota camera a destra"
              onClick={() => setView((value) => nextDirection(value + 1))}><RotateCw size={18} /></button>
          </div>
        </div>
        <div className="pc-stage-status" role="status"><span className="pc-status-icon">✦</span> {message}</div>
      </section>
      <aside className="pc-editor">
        <section className="pc-panel">
          <div className="pc-section-caption"><span>01 / Ambiente</span><span><Grid2X2 size={15} /> Griglia</span></div>
          <label htmlFor="pc-room">Stanza da modificare</label>
          <select id="pc-room" value={activeRoomId} onChange={(event) => selectRoom(event.target.value)}>
            {house.rooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          {room ? <>
            <div className="pc-dimensions">
              <div><span>Larghezza</span><div className="pc-stepper">
                <button type="button" aria-label="Riduci larghezza" onClick={() => dimension("width", -1)}><Minus size={16} /></button>
                <strong>{room.width} <small>tile</small></strong>
                <button type="button" aria-label="Aumenta larghezza" onClick={() => dimension("width", 1)}><Plus size={16} /></button>
              </div></div>
              <div><span>Lunghezza</span><div className="pc-stepper">
                <button type="button" aria-label="Riduci lunghezza" onClick={() => dimension("height", -1)}><Minus size={16} /></button>
                <strong>{room.height} <small>tile</small></strong>
                <button type="button" aria-label="Aumenta lunghezza" onClick={() => dimension("height", 1)}><Plus size={16} /></button>
              </div></div>
            </div>
            <div className="pc-divider" />
            <p className="pc-control-label">Modifica forma e arredi</p>
            <div className="pc-mode-switch">
              <button type="button" className={mode === "forma" ? "active" : ""} onClick={() => { setMode("forma"); setMessage("Tocca i tile per creare rientranze o aggiungere pavimento."); }}><Eraser size={16} /> Forma</button>
              <button type="button" className={mode === "arredi" ? "active" : ""} onClick={() => { setMode("arredi"); setMessage("Scegli un arredo, poi tocca una casella libera."); }}><Box size={16} /> Arredi</button>
              <button type="button" className={mode === "seleziona" ? "active" : ""} onClick={() => { setMode("seleziona"); setMessage("Tocca un oggetto per selezionarlo."); }}><Move size={16} /> Seleziona</button>
            </div>
            {mode === "forma" && <p className="pc-tip">Tocca una casella piena per eliminarla, una tratteggiata per ripristinarla. Il pavimento deve restare collegato.</p>}
            {mode === "arredi" && <>
              <div className="pc-furniture-grid">
                {FURNITURE.map((item) => <button type="button" key={item.id}
                  className={furnitureType === item.id ? "pc-furniture-option active" : "pc-furniture-option"}
                  aria-pressed={furnitureType === item.id}
                  onClick={() => { setFurnitureType(item.id); setMessage(`Posiziona ${item.label.toLowerCase()} su una zona libera.`); }}>
                  <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
                  <em>{item.width}×{item.height}</em>
                </button>)}
              </div>
              <div className="pc-item-note">
                <span><strong>{currentFurniture.label}</strong> · Ingombro {placing.width}×{placing.height} tile</span>
                <button type="button" onClick={() => setPlacementRotation((value) => nextDirection(value + 1))}>
                  <RotateCw size={15} /> Ruota oggetto
                </button>
              </div>
            </>}
            {mode === "seleziona" && (selected && selectedSpec ? <>
              <div className="pc-selected-item">
                <span className="pc-selected-icon">{selectedSpec.icon}</span>
                <div><strong>{selectedSpec.label}</strong><small>{furnitureSize(selected).width}×{furnitureSize(selected).height} tile · lato {selected.rotation + 1}/4</small></div>
                <button type="button" aria-label="Rimuovi oggetto" onClick={() => editObject("remove")}><Trash2 size={17} /></button>
              </div>
              <div className="pc-object-controls">
                <button type="button" onClick={() => editObject("rotate")}><RotateCw size={16} /> Ruota 90°</button>
                <div className="pc-direction-pad">
                  <button type="button" aria-label="Muovi arredo su" onClick={() => editObject("up")}><ArrowUp size={17} /></button>
                  <div><button type="button" aria-label="Muovi arredo a sinistra" onClick={() => editObject("left")}><ArrowLeft size={17} /></button>
                    <button type="button" aria-label="Muovi arredo giù" onClick={() => editObject("down")}><ArrowDown size={17} /></button>
                    <button type="button" aria-label="Muovi arredo a destra" onClick={() => editObject("right")}><ArrowRight size={17} /></button></div>
                </div>
              </div>
            </> : <p className="pc-tip">Tocca un oggetto nella scena per spostarlo, ruotarlo o eliminarlo.</p>)}
          </> : <p className="pc-tip">Non risultano stanze registrate. Aggiungile dalla schermata principale di CuraCasa.</p>}
        </section>
        {room && <>
          <section className="pc-panel">
            <div className="pc-section-caption"><span>02 / Finiture</span><span>Pattern</span></div>
            <p className="pc-control-label">Pavimento</p>
            <div className="pc-material-list">
              {FLOOR_STYLES.map((item) => <button type="button" key={item.id}
                aria-pressed={room.floor === item.id} className={room.floor === item.id ? "active" : ""}
                onClick={() => updateRoom({ ...room, floor: item.id })}>
                <span className={`pc-material-swatch pc-floor-${item.id}`} />{item.label}{room.floor === item.id && <Check size={15} />}
              </button>)}
            </div>
            <p className="pc-control-label">Pareti</p>
            <div className="pc-material-list">
              {WALL_STYLES.map((item) => <button type="button" key={item.id}
                aria-pressed={room.wall === item.id} className={room.wall === item.id ? "active" : ""}
                onClick={() => updateRoom({ ...room, wall: item.id })}>
                <span className={`pc-material-swatch pc-wall-${item.id}`} />{item.label}{room.wall === item.id && <Check size={15} />}
              </button>)}
            </div>
          </section>
          <section className="pc-panel">
            <div className="pc-section-caption"><span>03 / Puzzle</span><span>Posizione</span></div>
            <p className="pc-tip">Sposta la stanza di un tile alla volta oppure agganciala a un'altra. Le stanze rimangono sempre entità separate.</p>
            <div className="pc-puzzle-row">
              <div className="pc-direction-pad">
                <button type="button" aria-label="Sposta stanza a nord" onClick={() => moveRoom(0, -1)}><ArrowUp size={18} /></button>
                <div><button type="button" aria-label="Sposta stanza a ovest" onClick={() => moveRoom(-1, 0)}><ArrowLeft size={18} /></button>
                  <button type="button" aria-label="Sposta stanza a sud" onClick={() => moveRoom(0, 1)}><ArrowDown size={18} /></button>
                  <button type="button" aria-label="Sposta stanza a est" onClick={() => moveRoom(1, 0)}><ArrowRight size={18} /></button></div>
              </div>
              <small>Posizione: {room.offsetX}, {room.offsetY}</small>
            </div>
            {house.rooms.length > 1 && <>
              <label htmlFor="pc-attach-target">Aggancia alla stanza</label>
              <select id="pc-attach-target" value={target?.id ?? ""} onChange={(event) => setSnapTarget(event.target.value)}>
                {house.rooms.filter((item) => item.id !== room.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <div className="pc-attach-actions">
                {(["nord", "est", "sud", "ovest"] as const).map((side) =>
                  <button type="button" key={side} onClick={() => attach(side)}>{side}</button>)}
              </div>
            </>}
            <div className="pc-divider" />
            {confirmReset ?
              <div className="pc-reset-confirm"><span>Eliminare la planimetria e gli arredi di questa stanza?</span>
                <button type="button" onClick={resetRoom}>Conferma</button>
                <button type="button" onClick={() => setConfirmReset(false)}>Annulla</button></div>
              : <button type="button" className="pc-reset" onClick={() => setConfirmReset(true)}><RotateCcw size={15} /> Ripristina questa stanza</button>}
          </section>
        </>}
      </aside>
    </div>
    <footer className="pc-footer">Esperimento CuraCasa · Salvataggio locale automatico · Nessuna modifica alle faccende</footer>
  </div>;
}
