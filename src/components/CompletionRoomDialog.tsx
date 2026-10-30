import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { RoomSelection } from "./RoomSelection";
import { eligibleRoomNames, getRoomRule } from "../lib/chore-rooms";
import type { AppData, Chore } from "../lib/store";

export function CompletionRoomDialog({
  data,
  chore,
  onConfirm,
  onClose,
}: {
  data: AppData;
  chore: Chore;
  onConfirm: (rooms: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const rule = getRoomRule(chore);
  const eligible = eligibleRoomNames(data.rooms, data.roomDetails, rule);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="room-manager-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="room-manager-sheet completion-room-sheet" role="dialog"
        aria-modal="true" aria-labelledby="completion-room-title">
        <header className="room-manager-heading">
          <div>
            <p className="eyebrow">Conferma completamento</p>
            <h2 id="completion-room-title">{chore.title}</h2>
          </div>
          <button type="button" className="room-manager-close" aria-label="Annulla" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="completion-room-content">
          <RoomSelection rooms={data.rooms} roomDetails={data.roomDetails}
            rule={rule} selected={selected} onChange={setSelected} />
        </div>
        <footer className="room-manager-footer completion-room-footer">
          <button type="button" className="room-manager-back" onClick={() => onConfirm([])}>
            Senza luogo
          </button>
          <button type="button" className="primary-action"
            disabled={eligible.length > 0 && selected.length === 0}
            onClick={() => onConfirm(selected)}>
            Conferma faccenda
          </button>
        </footer>
      </section>
    </div>, document.body,
  );
}
