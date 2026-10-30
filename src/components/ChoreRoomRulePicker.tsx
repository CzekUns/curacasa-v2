import { RoomSelection } from "./RoomSelection";
import { ROOM_TYPES, type RoomDetails } from "../lib/rooms";
import { type ChoreRoomRule } from "../lib/chore-rooms";

export function ChoreRoomRulePicker({
  rooms,
  roomDetails,
  value,
  onChange,
}: {
  rooms: string[];
  roomDetails?: RoomDetails;
  value: ChoreRoomRule;
  onChange: (value: ChoreRoomRule) => void;
}) {
  const category = value.mode === "any" ? "any" : value.mode === "specific" ? "specific" : "type";
  return (
    <div className="chore-room-rule-picker">
      <label>
        Dove si svolge questa faccenda?
        <select value={category} onChange={(event) => {
          const next = event.target.value;
          if (next === "any") onChange({ mode: "any" });
          else if (next === "specific") onChange({ mode: "specific", names: [] });
          else onChange({ mode: "type", kind: "bagno" });
        }}>
          <option value="any">In tutta la casa / in stanze da scegliere</option>
          <option value="type">In un tipo di ambiente</option>
          <option value="specific">Solo in alcune stanze precise</option>
        </select>
      </label>
      {value.mode === "type" ? (
        <label>
          Tipo di stanza
          <select value={value.kind} onChange={(event) => {
            const kind = ROOM_TYPES.find((item) => item.id === event.target.value)?.id ?? "bagno";
            onChange({ mode: "type", kind });
          }}>
            {ROOM_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      ) : null}
      {value.mode === "specific" ? (
        <RoomSelection rooms={rooms} roomDetails={roomDetails} rule={{ mode: "specific", names: rooms }}
          selected={value.names} onChange={(names) => onChange({ mode: "specific", names })}
          title="Quali stanze precise?" />
      ) : null}
      <p className="chore-room-rule-hint">
        {value.mode === "any"
          ? "Quando la completerai, potrai indicare una o più stanze oppure tutta la casa."
          : value.mode === "type"
            ? "Quando la completerai, potrai scegliere quale ambiente di questo tipo oppure tutti."
            : "La faccenda sarà collegata soltanto alle stanze indicate."}
      </p>
    </div>
  );
}
