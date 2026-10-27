import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Clock, Pencil, Play, Square, X } from "lucide-react";
import { ChoreIcon } from "../lib/icons";
import { ActionFeedback, useActionFeedback } from "../components/ActionFeedback";
import { addLog, dayKey, hasCompletedOnDay, loadData, monthKey, saveData, type ChoreLog } from "../lib/store";

function timerText(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours) {
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(rest).padStart(2, "0")}s`;
  }
  return `${String(minutes).padStart(2, "0")}m ${String(rest).padStart(2, "0")}s`;
}

function currentElapsedSeconds(elapsedSeconds: number, startedAt: number | null) {
  return startedAt ? Math.floor((Date.now() - startedAt) / 1000) : elapsedSeconds;
}

function durationSecondsFrom(manualMinutes: string, elapsedSeconds: number, startedAt: number | null) {
  const manual = Number(manualMinutes);
  if (manualMinutes && Number.isFinite(manual)) return Math.max(0, Math.round(manual * 60));
  return currentElapsedSeconds(elapsedSeconds, startedAt);
}

function logDurationSeconds(log: ChoreLog) {
  return Number(log.durationSeconds || log.durationMinutes * 60 || 0);
}

export function Calendar() {
  const [data, setData] = useState(loadData);
  const { feedback, announce } = useActionFeedback();
  const [addStatus, setAddStatus] = useState("");
  const [month, setMonth] = useState(monthKey());
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));
  const [addRoom, setAddRoom] = useState("");
  const [addManualMinutes, setAddManualMinutes] = useState("");
  const [addElapsedSeconds, setAddElapsedSeconds] = useState(0);
  const [addTimerStartedAt, setAddTimerStartedAt] = useState<number | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editManualMinutes, setEditManualMinutes] = useState("");
  const [editElapsedSeconds, setEditElapsedSeconds] = useState(0);
  const [editTimerStartedAt, setEditTimerStartedAt] = useState<number | null>(null);

  const cells = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const first = new Date(year, monthNumber - 1, 1);
    const last = new Date(year, monthNumber, 0);
    const startOffset = (first.getDay() + 6) % 7;
    const days: (Date | null)[] = Array.from({ length: startOffset }, () => null);
    for (let day = 1; day <= last.getDate(); day += 1) days.push(new Date(year, monthNumber - 1, day));
    return days;
  }, [month]);

  const selectedLogs = data.logs.filter((log) => dayKey(log.completedAt) === selectedDay);
  const selectedCountLabel = selectedLogs.length === 1 ? "1 faccenda" : `${selectedLogs.length} faccende`;

  useEffect(() => {
    if (!addTimerStartedAt) return;
    const interval = window.setInterval(() => {
      setAddElapsedSeconds(Math.floor((Date.now() - addTimerStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [addTimerStartedAt]);

  useEffect(() => {
    if (!editTimerStartedAt) return;
    const interval = window.setInterval(() => {
      setEditElapsedSeconds(Math.floor((Date.now() - editTimerStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [editTimerStartedAt]);

  function shift(offset: number) {
    const [year, monthNumber] = month.split("-").map(Number);
    setMonth(monthKey(new Date(year, monthNumber - 1 + offset, 1)));
  }

  function stopEditingLog() {
    setEditingLogId(null);
    setEditRoom("");
    setEditNote("");
    setEditManualMinutes("");
    setEditElapsedSeconds(0);
    setEditTimerStartedAt(null);
  }

  function roomLabel(log: ChoreLog) {
    return log.rooms?.[0] || "Tutta la casa";
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const choreId = String(form.get("choreId") || "");
    if (!choreId) return;
    const durationSeconds = durationSecondsFrom(addManualMinutes, addElapsedSeconds, addTimerStartedAt);
    const current = loadData();
    const next = addLog(current, choreId, {
      completedAt: `${selectedDay}T12:00:00`,
      durationMinutes: Math.ceil(durationSeconds / 60),
      durationSeconds,
      note: String(form.get("note") || ""),
      rooms: addRoom ? [addRoom] : [],
    });
    setData(next);
    if (next === current) {
      setAddStatus("Questa faccenda è già registrata per il giorno scelto. Seleziona un altro giorno.");
      return;
    }
    saveData(next);
    setAddStatus("");
    announce("Faccenda registrata nel calendario!");
    event.currentTarget.reset();
    setAddRoom("");
    setAddManualMinutes("");
    setAddElapsedSeconds(0);
    setAddTimerStartedAt(null);
  }

  function removeLog(logId: string) {
    const next = {
      ...data,
      logs: data.logs.filter((log) => log.id !== logId),
    };
    saveData(next);
    setData(next);
    if (editingLogId === logId) stopEditingLog();
  }

  function startEditLog(log: ChoreLog) {
    setEditingLogId(log.id);
    setEditRoom(log.rooms?.[0] || "");
    setEditNote(log.note || "");
    setEditManualMinutes("");
    setEditElapsedSeconds(logDurationSeconds(log));
    setEditTimerStartedAt(null);
  }

  function submitEditLog(event: FormEvent<HTMLFormElement>, logId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const durationSeconds = durationSecondsFrom(editManualMinutes, editElapsedSeconds, editTimerStartedAt);
    const next = {
      ...data,
      logs: data.logs.map((log) =>
        log.id === logId
          ? {
              ...log,
              durationMinutes: Math.ceil(durationSeconds / 60),
              durationSeconds,
              note: String(form.get("note") || ""),
              rooms: editRoom ? [editRoom] : [],
            }
          : log,
      ),
    };
    saveData(next);
    setData(next);
    stopEditingLog();
  }

  return (
    <div className="page-stack">
      <ActionFeedback feedback={feedback} />
      <section className="page-heading">
        <p className="eyebrow">Calendario globale</p>
        <div>
          <h1>
            {new Date(`${month}-01T12:00:00`).toLocaleDateString("it-IT", {
              month: "long",
              year: "numeric",
            })}
          </h1>
          <div className="calendar-actions">
            <button type="button" onClick={() => shift(-1)}>
              Indietro
            </button>
            <button type="button" onClick={() => shift(1)}>
              Avanti
            </button>
            <button type="button" onClick={() => setMonth(monthKey())}>
              Oggi
            </button>
          </div>
        </div>
      </section>

      <section className="calendar-panel">
        <div className="weekdays">
          {["L", "M", "M", "G", "V", "S", "D"].map((day) => (
            <strong key={day}>{day}</strong>
          ))}
        </div>
        <div className="calendar-grid">
          {cells.map((date, index) => {
            if (!date) return <span className="calendar-day muted" key={`empty-${index}`} />;
            const key = dayKey(date);
            const count = data.logs.filter((log) => dayKey(log.completedAt) === key).length;
            return (
              <button
                className={`calendar-day ${selectedDay === key ? "active" : ""} ${count ? "has-log" : ""}`}
                key={key}
                type="button"
                onClick={() => {
                  setSelectedDay(key);
                  setAddStatus("");
                  stopEditingLog();
                }}
              >
                <strong>{date.getDate()}</strong>
                {count ? <span>{count}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-block calendar-diary">
        <div className="section-title calendar-diary-title">
          <div>
            <p className="eyebrow">Diario delle faccende</p>
            <h2>{new Date(`${selectedDay}T12:00:00`).toLocaleDateString("it-IT")}</h2>
          </div>
          <span>{selectedCountLabel}</span>
        </div>
        <div className="task-list calendar-log-list">
          {selectedLogs.length ? (
            selectedLogs.map((log) => {
              const chore = data.chores.find((item) => item.id === log.choreId);
              return (
                <div className="task-edit-group" key={log.id}>
                  <article className="task-row calendar-log-row">
                    <span className="icon-tile">
                      <ChoreIcon name={chore?.icon || "casa"} size={40} />
                    </span>
                    <div>
                      <strong>{chore?.title || "Faccenda"}</strong>
                      <span>
                        {roomLabel(log)}
                        {logDurationSeconds(log) ? ` - ${timerText(logDurationSeconds(log))}` : ""}
                        {log.note ? ` - ${log.note}` : ""}
                      </span>
                    </div>
                    <div className="task-actions">
                      <button type="button" onClick={() => startEditLog(log)} aria-label={`Modifica ${chore?.title || "faccenda"}`}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => removeLog(log.id)} aria-label={`Rimuovi ${chore?.title || "faccenda"} dal giorno`}>
                        <X size={17} />
                      </button>
                    </div>
                  </article>
                  {editingLogId === log.id ? (
                    <form className="task-edit-card" onSubmit={(event) => submitEditLog(event, log.id)}>
                      <div className="form-title">
                        <Pencil size={18} />
                        <h2>Modifica registrazione</h2>
                        <button className="icon-only-button" type="button" onClick={stopEditingLog} aria-label="Chiudi modifica">
                          <X size={17} />
                        </button>
                      </div>
                      <label>
                        Stanza
                        <select value={editRoom} onChange={(event) => setEditRoom(event.target.value)}>
                          <option value="">Tutta la casa</option>
                          {data.rooms.map((room) => (
                            <option key={room} value={room}>
                              {room}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="form-grid">
                        <label>
                          Durata
                          <input
                            value={editManualMinutes}
                            onChange={(event) => setEditManualMinutes(event.target.value)}
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="Minuti manuali"
                          />
                        </label>
                        <label>
                          Nota
                          <input name="note" value={editNote} onChange={(event) => setEditNote(event.target.value)} placeholder="Dettagli" />
                        </label>
                      </div>
                      <div className="timer-card">
                        <div>
                          <Clock size={18} />
                          <strong>{timerText(editElapsedSeconds)}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setEditTimerStartedAt((startedAt) => (startedAt ? null : Date.now() - editElapsedSeconds * 1000))
                          }
                        >
                          {editTimerStartedAt ? <Square size={16} /> : <Play size={16} />}
                          {editTimerStartedAt ? "Ferma" : "Avvia"}
                        </button>
                      </div>
                      <button className="primary-action" type="submit">
                        Salva registrazione
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="soft-note">Nessuna faccenda registrata in questo giorno.</div>
          )}
        </div>
      </section>

      <form className="form-card compact" onSubmit={submit}>
        <div className="form-title">
          <CalendarPlus size={18} />
          <h2>Aggiungi a questa giornata</h2>
        </div>
        <label>
          Faccenda
          <select name="choreId" required>
            <option value="">Scegli</option>
            {data.chores.map((chore) => (
              <option key={chore.id} value={chore.id} disabled={hasCompletedOnDay(data, chore.id, selectedDay)}>
                {chore.title}{hasCompletedOnDay(data, chore.id, selectedDay) ? " · già svolta" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stanza
          <select value={addRoom} onChange={(event) => setAddRoom(event.target.value)}>
            <option value="">Tutta la casa</option>
            {data.rooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Durata
            <input
              value={addManualMinutes}
              onChange={(event) => setAddManualMinutes(event.target.value)}
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Minuti manuali"
            />
          </label>
          <label>
            Nota
            <input name="note" placeholder="Dettagli" />
          </label>
        </div>
        <div className="timer-card">
          <div>
            <Clock size={18} />
            <strong>{timerText(addElapsedSeconds)}</strong>
          </div>
          <button
            type="button"
            onClick={() => setAddTimerStartedAt((startedAt) => (startedAt ? null : Date.now() - addElapsedSeconds * 1000))}
          >
            {addTimerStartedAt ? <Square size={16} /> : <Play size={16} />}
            {addTimerStartedAt ? "Ferma" : "Avvia"}
          </button>
        </div>
        <button className="primary-action" type="submit">
          Aggiungi registrazione
        </button>
        {addStatus ? <p className="status-note" role="status">{addStatus}</p> : null}
      </form>
    </div>
  );
}
