import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { ChoreIcon, choreIconOptions, type ChoreIconName } from "../lib/icons";
import { loadData, saveData, type Chore, type ChoreType } from "../lib/store";

export function AddChore() {
  const navigate = useNavigate();
  const [data] = useState(loadData);
  const [selectedIcon, setSelectedIcon] = useState<ChoreIconName>("casa");
  const [iconMenuOpen, setIconMenuOpen] = useState(false);
  const selectedIconOption = choreIconOptions.find((icon) => icon.value === selectedIcon) || choreIconOptions[0];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const stamp = new Date().toISOString();
    const chore: Chore = {
      id: `chore_${crypto.getRandomValues(new Uint32Array(3)).join("")}`,
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      icon: selectedIcon,
      type: String(form.get("type") || "ordinaria") as ChoreType,
      level: "tua",
      room: String(form.get("room") || "").trim(),
      frequency: Number(form.get("frequency") || 0),
      estimatedMinutes: Number(form.get("estimatedMinutes") || 0),
      notes: String(form.get("notes") || "").trim(),
      createdAt: stamp,
      updatedAt: stamp,
    };
    if (!chore.title) return;
    saveData({ ...data, chores: [...data.chores, chore] });
    navigate("/app/faccende");
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Nuova card</p>
        <h1>Aggiungi una faccenda</h1>
      </section>

      <form className="form-card" onSubmit={submit}>
        <label>
          Titolo
          <input name="title" required placeholder="Pulizia filtri condizionatore" />
        </label>
        <label>
          Descrizione
          <textarea name="description" rows={3} placeholder="Cosa comprende questa faccenda?" />
        </label>
        <div className="form-grid">
          <label>
            Tipo
            <select name="type" defaultValue="ordinaria">
              <option value="ordinaria">Ordinaria</option>
              <option value="straordinaria">Straordinaria</option>
            </select>
          </label>
          <div className="icon-picker-field">
            <span>Icona</span>
            <input name="icon" type="hidden" value={selectedIcon} />
            <button
              aria-expanded={iconMenuOpen}
              className="icon-picker-trigger"
              type="button"
              onClick={() => setIconMenuOpen((open) => !open)}
            >
              <span className="icon-tile">
                <ChoreIcon name={selectedIcon} size={42} />
              </span>
              <strong>{selectedIconOption.label}</strong>
            </button>
            {iconMenuOpen ? (
              <div className="icon-picker-menu" role="listbox">
                {choreIconOptions.map((icon) => (
                  <button
                    aria-selected={icon.value === selectedIcon}
                    className={`icon-picker-option ${icon.value === selectedIcon ? "active" : ""}`}
                    key={icon.value}
                    role="option"
                    type="button"
                    onClick={() => {
                      setSelectedIcon(icon.value);
                      setIconMenuOpen(false);
                    }}
                  >
                    <span className="icon-tile">
                      <ChoreIcon name={icon.value} size={40} />
                    </span>
                    <span>{icon.label}</span>
                    {icon.value === selectedIcon ? <Check aria-hidden="true" size={16} /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="form-grid">
          <label>
            Stanza o zona
            <input name="room" list="rooms" placeholder="Bagno, cucina, camera..." />
            <datalist id="rooms">
              {data.rooms.map((room) => (
                <option key={room} value={room} />
              ))}
            </datalist>
          </label>
          <label>
            Scadenza opzionale
            <input name="frequency" type="number" min="0" inputMode="numeric" placeholder="Senza scadenza" />
          </label>
        </div>
        <label>
          Minuti stimati
          <input name="estimatedMinutes" type="number" min="0" inputMode="numeric" />
        </label>
        <label>
          Note
          <textarea name="notes" rows={3} placeholder="Prodotti, accortezze, dettagli utili..." />
        </label>
        <button className="primary-action" type="submit">
          Salva faccenda
        </button>
      </form>
    </div>
  );
}
