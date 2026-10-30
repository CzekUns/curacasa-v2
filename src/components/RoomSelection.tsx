import { House } from "lucide-react";
import { RoomBadge } from "./RoomBadge";
import { eligibleRoomNames, type ChoreRoomRule } from "../lib/chore-rooms";
import { normalizeRoomDetails, type RoomDetails } from "../lib/rooms";

const pluralNames = {
  bagno: "bagni", cucina: "cucine", camera: "camere",
  salone: "saloni", balcone: "balconi",
} as const;

export function RoomSelection({
  rooms,
  roomDetails,
  rule,
  selected,
  onChange,
  title = "Dove hai svolto questa faccenda?",
}: {
  rooms: string[];
  roomDetails?: RoomDetails;
  rule: ChoreRoomRule;
  selected: string[];
  onChange: (rooms: string[]) => void;
  title?: string;
}) {
  const available = eligibleRoomNames(rooms, roomDetails, rule);
  const details = normalizeRoomDetails(rooms, roomDetails);
  const allSelected = available.length > 0 && available.every((name) => selected.includes(name));
  const allLabel = rule.mode === "any"
    ? "Tutta la casa"
    : rule.mode === "type" ? `Tutti i ${pluralNames[rule.kind]}` : "Tutte le stanze indicate";
  return (
    <fieldset className="chore-room-selection">
      <legend>{title}</legend>
      {available.length ? (
        <>
          <button type="button" className={`chore-room-choice ${allSelected ? "selected" : ""}`}
            aria-pressed={allSelected}
            onClick={() => onChange(allSelected ? [] : [...available])}>
            <span className="chore-room-house"><House size={18} /></span>
            <strong>{allLabel}</strong>
            <span className="chore-room-check" aria-hidden="true">{allSelected ? "✓" : ""}</span>
          </button>
          {available.map((name) => {
            const checked = selected.includes(name);
            return (
              <button className={`chore-room-choice ${checked ? "selected" : ""}`} type="button"
                key={name} aria-pressed={checked}
                onClick={() => onChange(checked ? selected.filter((item) => item !== name) : [...selected.filter((item) => available.includes(item)), name])}>
                <RoomBadge name={name} detail={details[name]} small />
                <strong>{name}</strong>
                <span className="chore-room-check" aria-hidden="true">{checked ? "✓" : ""}</span>
              </button>
            );
          })}
        </>
      ) : (
        <p className="chore-room-no-match">
          Nessuna stanza compatibile è configurata. Puoi aggiungerla dalla Home;
          questa registrazione può comunque essere salvata senza indicare il luogo.
        </p>
      )}
    </fieldset>
  );
}
