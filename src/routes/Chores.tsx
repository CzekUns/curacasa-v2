const COMPLETION_MESSAGES = [
  "Un pensiero in meno!",
  "Un piccolo passo, una casa più serena.",
  "Ottimo, anche questa è fatta!",
  "La casa prende forma, un gesto alla volta.",
  "Hai fatto spazio alla tranquillità.",
  "Brava! Ora goditi il risultato.",
  "Un'altra cosa sistemata. Bene così!",
  "La costanza fa la differenza.",
  "Un angolo di casa più curato.",
  "Ogni piccolo gesto conta.",
  "Fatto! La tua casa ti ringrazia.",
  "Una faccenda in meno, più tempo per te.",
] as const;

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, Pencil, Play, Search, Square, X } from "lucide-react";
import { ActionFeedback, useActionFeedback } from "../components/ActionFeedback";
import { ChoreLevelTag } from "../components/ChoreLevelTag";
import { ChoreRoomRulePicker } from "../components/ChoreRoomRulePicker";
import { CompletionRoomDialog } from "../components/CompletionRoomDialog";
import { eligibleRoomNames, getRoomRule, locationRuleLabel, roomRuleToLegacy, type ChoreRoomRule } from "../lib/chore-rooms";
import { CHORE_LEVEL_LABELS, classifyChoreLevel, type ChoreLevel } from "../lib/chore-levels";
import { PersonalIconPicker } from "../components/PersonalIconPicker";
import { ChoreIcon, choreIconOptions, isPersonalIconName, defaultPersonalIcon, type ChoreIconName } from "../lib/icons";
import { addLog, daysAgo, hasCompletedToday, lastLog, loadData, relativeDays, saveData, statusFor, type ChoreType } from "../lib/store";

export function Chores() {
  const [data, setData] = useState(loadData);
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState<ChoreLevel | "">("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<ChoreIconName>(defaultPersonalIcon);
  const [editingRoomRule, setEditingRoomRule] = useState<ChoreRoomRule>({ mode: "any" });
  const [pendingCompletion, setPendingCompletion] = useState<{ id: string; durationMinutes: number; note: string } | null>(null);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualMinutes, setManualMinutes] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [recentlyDoneId, setRecentlyDoneId] = useState<string | null>(null);
  const { feedback, announce } = useActionFeedback();

  useEffect(() => {
    if (!recentlyDoneId) return;
    const timer = window.setTimeout(() => setRecentlyDoneId(null), 900);
    return () => window.clearTimeout(timer);
  }, [recentlyDoneId]);

  const rooms = useMemo(() => ["", ...data.rooms], [data.rooms]);
  const chores = data.chores.filter((chore) => {
    const roomOk = !room || eligibleRoomNames(data.rooms, data.roomDetails, getRoomRule(chore)).includes(room);
    const queryOk = !query || chore.title.toLowerCase().includes(query.toLowerCase());
    const categoryOk = !category || classifyChoreLevel(chore) === category;
    return roomOk && queryOk && categoryOk;
  });

  function markDone(choreId: string) {
    if (hasCompletedToday(loadData(), choreId)) return;
    setPendingCompletion({ id: choreId, durationMinutes: 0, note: "" });
  }

  function markDoneWithDetails(choreId: string) {
    const timerMinutes = elapsedSeconds ? Math.max(1, Math.round(elapsedSeconds / 60)) : 0;
    const durationMinutes = Number(manualMinutes || timerMinutes || 0);
    closeDetail();
    setPendingCompletion({ id: choreId, durationMinutes, note: completionNote.trim() });
  }

  function confirmCompletion(rooms: string[]) {
    if (!pendingCompletion) return;
    const current = loadData();
    const next = addLog(current, pendingCompletion.id, {
      durationMinutes: pendingCompletion.durationMinutes,
      note: pendingCompletion.note,
      rooms,
    });
    setData(next);
    setPendingCompletion(null);
    if (next === current) return;
    saveData(next);
    setRecentlyDoneId(pendingCompletion.id);
    announce(COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]);
  }

  function openDetail(choreId: string) {
    if (hasCompletedToday(loadData(), choreId)) return;
    setDetailId(choreId);
    setEditingId(null);
    setTimerStartedAt(null);
    setElapsedSeconds(0);
    setManualMinutes("");
    setCompletionNote("");
  }

  function closeDetail() {
    setDetailId(null);
    setTimerStartedAt(null);
    setElapsedSeconds(0);
    setManualMinutes("");
    setCompletionNote("");
  }

  function startEdit(choreId: string, icon: string) {
    const chore = data.chores.find((item) => item.id === choreId);
    setEditingRoomRule(chore ? getRoomRule(chore) : { mode: "any" });
    setEditingId(choreId);
    setDetailId(null);
    // Preserve current preset or legacy art until the user chooses a neutral symbol.
    setSelectedIcon((choreIconOptions.some((option) => option.value === icon) || isPersonalIconName(icon)
      ? icon : defaultPersonalIcon) as ChoreIconName);
  }

  function submitEdit(event: FormEvent<HTMLFormElement>, choreId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    if (!title || (editingRoomRule.mode === "specific" && !editingRoomRule.names.length)) return;

    const next = {
      ...data,
      chores: data.chores.map((chore) =>
        chore.id === choreId
          ? {
              ...chore,
              title,
              description: String(form.get("description") || "").trim(),
              icon: selectedIcon,
              type: String(form.get("type") || "ordinaria") as ChoreType,
              room: roomRuleToLegacy(editingRoomRule),
              roomRule: editingRoomRule,
              frequency: Number(form.get("frequency") || 0),
              estimatedMinutes: Number(form.get("estimatedMinutes") || 0),
              notes: String(form.get("notes") || "").trim(),
              updatedAt: new Date().toISOString(),
            }
          : chore,
      ),
    };
    saveData(next);
    setData(next);
    setEditingId(null);
  }

  useEffect(() => {
    if (!timerStartedAt) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - timerStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerStartedAt]);

  const detailChore = detailId ? data.chores.find((chore) => chore.id === detailId) : null;
  const detailLast = detailChore ? lastLog(detailChore, data.logs) : null;
  const timerLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="page-stack">
      <ActionFeedback feedback={feedback} />
      <section className="page-heading">
        <p className="eyebrow">Tutte le faccende</p>
        <div>
          <h1>Le faccende di casa</h1>
          <Link className="round-link" to="/app/aggiungi" aria-label="Aggiungi faccenda">
            +
          </Link>
        </div>
      </section>

      <label className="search-box">
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca faccenda" />
      </label>

      <div className="chore-filter-label" id="chore-category-label">Categoria</div>
      <div className="chip-row chore-category-filters" role="group" aria-labelledby="chore-category-label">
        <button className={`chip ${category === "" ? "active" : ""}`}
          aria-pressed={category === ""} type="button" onClick={() => setCategory("")}>
          Tutte
        </button>
        {(Object.keys(CHORE_LEVEL_LABELS) as ChoreLevel[]).map((item) => (
          <button className={`chip ${category === item ? "active" : ""}`}
            aria-pressed={category === item} key={item} type="button" onClick={() => setCategory(item)}>
            {CHORE_LEVEL_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="chore-filter-label" id="chore-room-label">Stanze</div>
      <div className="chip-row" role="group" aria-labelledby="chore-room-label">
        {rooms.map((item) => (
          <button
            className={`chip ${room === item ? "active" : ""}`}
            key={item || "all"}
            type="button"
            onClick={() => setRoom(item)}
          >
            {item || "Tutte"}
          </button>
        ))}
      </div>

      {chores.length ? (
        <section className="task-list">
          {chores.map((chore) => {
            const last = lastLog(chore, data.logs);
            const doneToday = hasCompletedToday(data, chore.id);
            return (
              <div className="task-edit-group" key={chore.id}>
                <article className={`task-row ${statusFor(chore, data.logs)} ${doneToday ? "task-row--done-today" : ""} ${recentlyDoneId === chore.id ? "is-just-done" : ""}`}>
                  <button className="icon-hit-area" type="button" disabled={doneToday} onClick={() => openDetail(chore.id)} aria-label={doneToday ? `${chore.title} già svolta oggi` : `Apri ${chore.title}`}>
                    <span className="icon-tile">
                      <ChoreIcon name={chore.icon} size={40} />
                    </span>
                  </button>
                  <div>
                    <strong>{chore.title}</strong>
                    <span>
                      {locationRuleLabel(getRoomRule(chore))} - {doneToday ? "svolta oggi" : relativeDays(daysAgo(last?.completedAt))}
                    </span>
                  </div>
                  <div className="task-actions">
                    <button type="button" onClick={() => startEdit(chore.id, chore.icon)} aria-label={`Modifica ${chore.title}`}>
                      <Pencil size={16} />
                    </button>
                    {doneToday ? (
                      <Link className="task-calendar-link" to="/app/calendario" title="Vedi nel calendario" aria-label={`Vedi ${chore.title} nel calendario`}>
                        <Check size={17} />
                      </Link>
                    ) : (
                      <button type="button" onClick={() => markDone(chore.id)} aria-label={`Completa ${chore.title}`}>
                        <Check size={17} />
                      </button>
                    )}
                  </div>
                  <ChoreLevelTag level={classifyChoreLevel(chore)} />
                </article>
                {editingId === chore.id ? (
                  <form className="task-edit-card" onSubmit={(event) => submitEdit(event, chore.id)}>
                    <div className="form-title">
                      <Pencil size={18} />
                      <h2>Modifica attività</h2>
                      <button
                        aria-label="Chiudi modifica"
                        className="icon-only-button"
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                                              }}
                      >
                        <X size={17} />
                      </button>
                    </div>
                    <label>
                      Titolo
                      <input name="title" required defaultValue={chore.title} />
                    </label>
                    <label>
                      Descrizione
                      <textarea name="description" rows={3} defaultValue={chore.description} />
                    </label>
                    <div className="form-grid">
                      <label>
                        Tipo
                        <select name="type" defaultValue={chore.type}>
                          <option value="ordinaria">Ordinaria</option>
                          <option value="straordinaria">Straordinaria</option>
                        </select>
                      </label>
                      <PersonalIconPicker key={chore.id} value={selectedIcon} onChange={setSelectedIcon} />
                    </div>
                    <ChoreRoomRulePicker rooms={data.rooms} roomDetails={data.roomDetails}
                      value={editingRoomRule} onChange={setEditingRoomRule} />
                    <label>
                      Scadenza opzionale
                      <input name="frequency" type="number" min="0" inputMode="numeric" defaultValue={chore.frequency || ""} />
                    </label>
                    <label>
                      Minuti stimati
                      <input
                        name="estimatedMinutes"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        defaultValue={chore.estimatedMinutes || ""}
                      />
                    </label>
                    <label>
                      Note
                      <textarea name="notes" rows={3} defaultValue={chore.notes} />
                    </label>
                    <button className="primary-action" type="submit"
                      disabled={editingRoomRule.mode === "specific" && !editingRoomRule.names.length}>
                      Salva modifiche
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : (
        <section className="empty-state">
          <Search size={24} />
          <h2>Nessuna faccenda trovata</h2>
          <p>Aggiungi una faccenda manualmente o scegli un set dallo Shop.</p>
          <div className="empty-actions">
            <Link className="pill-button" to="/app/aggiungi">
              Aggiungi faccenda
            </Link>
            <Link className="secondary-action" to="/app/shop">
              Apri Shop
            </Link>
          </div>
        </section>
      )}
      {pendingCompletion && data.chores.some((item) => item.id === pendingCompletion.id) ? (
        <CompletionRoomDialog key={pendingCompletion.id} data={data}
          chore={data.chores.find((item) => item.id === pendingCompletion.id)!}
          onConfirm={confirmCompletion} onClose={() => setPendingCompletion(null)} />
      ) : null}
      {detailChore && !hasCompletedToday(data, detailChore.id) ? (
        <div className="task-sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="task-sheet-title">
          <section className="task-sheet">
            <div className="form-title">
              <span className="icon-tile">
                <ChoreIcon name={detailChore.icon} size={40} />
              </span>
              <div>
                <p className="eyebrow">{locationRuleLabel(getRoomRule(detailChore))}</p>
                <h2 id="task-sheet-title">{detailChore.title}</h2>
              </div>
              <button className="icon-only-button" type="button" onClick={closeDetail} aria-label="Chiudi scheda">
                <X size={17} />
              </button>
            </div>
            <div className="task-sheet-meta">
              <span>{detailChore.type}</span>
              <span>{detailChore.frequency ? `Ogni ${detailChore.frequency} giorni` : "Senza scadenza"}</span>
              <span>{relativeDays(daysAgo(detailLast?.completedAt))}</span>
            </div>
            {detailChore.description ? <p className="sheet-copy">{detailChore.description}</p> : null}
            {detailChore.notes ? <p className="sheet-copy muted-copy">{detailChore.notes}</p> : null}
            <div className="timer-card">
              <div>
                <Clock size={18} />
                <strong>{timerLabel}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (timerStartedAt) {
                    setTimerStartedAt(null);
                    return;
                  }
                  setTimerStartedAt(Date.now() - elapsedSeconds * 1000);
                }}
              >
                {timerStartedAt ? <Square size={16} /> : <Play size={16} />}
                {timerStartedAt ? "Ferma" : "Avvia"}
              </button>
            </div>
            <div className="form-grid">
              <label>
                Durata manuale
                <input
                  value={manualMinutes}
                  onChange={(event) => setManualMinutes(event.target.value)}
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder={detailChore.estimatedMinutes ? `${detailChore.estimatedMinutes} min stimati` : "Minuti"}
                />
              </label>
              <label>
                Nota
                <input value={completionNote} onChange={(event) => setCompletionNote(event.target.value)} placeholder="Dettagli opzionali" />
              </label>
            </div>
            <button className="primary-action" type="button" onClick={() => markDoneWithDetails(detailChore.id)}>
              Segna svolta oggi
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
