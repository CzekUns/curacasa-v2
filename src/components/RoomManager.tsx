import { useEffect, useState, type FormEvent } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { RoomBadge, roomIcons } from "./RoomBadge";
import { availableRoomColors, normalizeRoomDetails, ROOM_TYPES, roomLabel, type RoomKind } from "../lib/rooms";
import { loadData, type AppData } from "../lib/store";

type RoomChoice = Exclude<RoomKind, "altro">;

export function RoomManager({
  data,
  onChange,
  label = "Aggiungi stanza",
  startInManager = false,
}: {
  data: AppData;
  onChange: (value: AppData) => void;
  label?: string;
  startInManager?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<RoomChoice>("bagno");
  const [note, setNote] = useState("");
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const details = normalizeRoomDetails(data.rooms, data.roomDetails);
  const available = availableRoomColors(data.rooms, details, type);
  const color = selectedColor !== null && available.includes(selectedColor) ? selectedColor : available[0] ?? null;

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function beginAdd() {
    const initial: RoomChoice = "bagno";
    setType(initial);
    setSelectedColor(availableRoomColors(data.rooms, details, initial)[0] ?? null);
    setNote("");
    setError("");
    setDeleting(null);
    setAdding(true);
  }

  function chooseType(value: RoomChoice) {
    setType(value);
    setSelectedColor(availableRoomColors(data.rooms, details, value)[0] ?? null);
    setError("");
  }

  function addRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = roomLabel(type, note);
    const current = loadData();
    if (current.rooms.some((item) => item.toLocaleLowerCase("it-IT") === name.toLocaleLowerCase("it-IT"))) {
      setError("Hai già una stanza con questo nome. Aggiungi una nota per distinguerla.");
      return;
    }
    const currentDetails = normalizeRoomDetails(current.rooms, current.roomDetails);
    const permitted = availableRoomColors(current.rooms, currentDetails, type);
    if (color === null || !permitted.includes(color)) {
      setError("Non ci sono colori liberi per questo tipo di stanza.");
      return;
    }
    onChange({
      ...current,
      rooms: [...current.rooms, name],
      roomDetails: { ...currentDetails, [name]: { kind: type, note: note.trim(), color } },
    });
    setAdding(false);
    setOpen(false);
    setDeleting(null);
    setError("");
  }

  function removeRoom(name: string) {
    const current = loadData();
    const roomDetails = { ...normalizeRoomDetails(current.rooms, current.roomDetails) };
    delete roomDetails[name];
    onChange({
      ...current,
      rooms: current.rooms.filter((item) => item !== name),
      roomDetails,
    });
    setDeleting(null);
  }

  return (
    <>
      <button type="button" className="home-add-room" onClick={() => {
        if (startInManager) {
          setAdding(false);
          setError("");
          setDeleting(null);
        } else {
          beginAdd();
        }
        setOpen(true);
      }}>
        <Plus size={15} />
        {label}
      </button>

      {open ? createPortal(
        <div className="room-manager-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="room-manager-sheet" role="dialog" aria-modal="true" aria-labelledby="room-manager-heading">
            <header className="room-manager-heading">
              <h2 id="room-manager-heading">{adding ? "Aggiungi stanza" : "Le tue stanze"}</h2>
              <button type="button" className="room-manager-close" aria-label="Chiudi" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </header>

            {adding ? (
              <>
              <form id="room-manager-create-form" onSubmit={addRoom} className="room-manager-form">
                <span className="room-manager-field-title">Scegli il tipo di ambiente</span>
                <div className="room-manager-type-grid">
                  {ROOM_TYPES.map((roomType) => {
                    const Icon = roomIcons[roomType.id];
                    return (
                      <button type="button" className={`room-manager-type ${type === roomType.id ? "selected" : ""}`}
                        key={roomType.id} onClick={() => chooseType(roomType.id)}
                        aria-pressed={type === roomType.id}>
                        <Icon size={23} />
                        <span>{roomType.label}</span>
                      </button>
                    );
                  })}
                </div>

                <label className="room-manager-field-title" htmlFor="room-manager-note">Nota / nome personalizzato</label>
                <input id="room-manager-note" value={note} maxLength={42}
                  onChange={(event) => { setNote(event.target.value); setError(""); }}
                  placeholder="Es. di servizio, matrimoniale…" />
                <p className="room-manager-hint">Esempio: Bagno + «di servizio» diventa «Bagno di servizio».</p>

                <span className="room-manager-field-title">Colore identificativo</span>
                <p className="room-manager-hint">I colori già usati da un'altra stanza dello stesso tipo non sono disponibili.</p>
                <div className="room-manager-colors">
                  {Array.from({ length: 8 }, (_, index) => (
                    <button key={index} type="button"
                      className={`room-manager-swatch room-identity--${index} ${color === index ? "selected" : ""}`}
                      disabled={!available.includes(index)}
                      aria-label={`Colore ${index + 1}${!available.includes(index) ? " già in uso" : ""}`}
                      aria-pressed={color === index}
                      onClick={() => setSelectedColor(index)}>
                      {color === index ? <Check size={17} /> : null}
                    </button>
                  ))}
                </div>
                {error ? <p className="room-manager-error" role="alert">{error}</p> : null}
              </form>
              <footer className="room-manager-footer room-manager-footer--add">
                <button type="button" className="room-manager-back" onClick={() => setAdding(false)}>
                  Gestisci stanze
                </button>
                <button type="submit" form="room-manager-create-form" className="primary-action" disabled={color === null}>
                  <Plus size={16} />
                  Aggiungi alla casa
                </button>
              </footer>
              </>
            ) : (
              <>
                <p className="room-manager-hint">Aggiungi o rimuovi gli ambienti. Le faccende e lo storico non vengono cancellati.</p>
                <div className="room-manager-list">
                  {data.rooms.map((name) => (
                    <div className="room-manager-item" key={name}>
                      <RoomBadge name={name} detail={details[name]} small />
                      <strong>{name}</strong>
                      {deleting === name ? (
                        <span className="room-manager-confirm">
                          <button type="button" onClick={() => removeRoom(name)}>Rimuovi</button>
                          <button type="button" onClick={() => setDeleting(null)}>Annulla</button>
                        </span>
                      ) : (
                        <button type="button" className="room-manager-remove" aria-label={`Rimuovi ${name}`}
                          onClick={() => setDeleting(name)}><Trash2 size={17} /></button>
                      )}
                    </div>
                  ))}
                  {!data.rooms.length ? <p className="room-manager-hint">Non hai ancora configurato stanze.</p> : null}
                </div>
                <footer className="room-manager-footer">
                  <button type="button" className="primary-action" onClick={beginAdd}>
                    <Plus size={17} />
                    Nuova stanza
                  </button>
                </footer>
              </>
            )}
          </section>
        </div>,
        document.body
      ) : null}
    </>
  );
}
