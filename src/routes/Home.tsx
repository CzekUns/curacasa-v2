import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Check, Clock, ChevronRight } from "lucide-react";
import { RoomBadge } from "../components/RoomBadge";
import { RoomManager } from "../components/RoomManager";
import { ChoreIcon } from "../lib/icons";
import { daysAgo, dueFor, hasCompletedToday, lastLog, loadData, relativeDays, saveData, statusFor, type AppData } from "../lib/store";
import { normalizeRoomDetails } from "../lib/rooms";

export function Home() {
  const [data, setData] = useState(loadData);
  const todayKey = new Date().toDateString();
  const doneToday = new Set(data.logs
    .filter((log) => new Date(log.completedAt).toDateString() === todayKey)
    .map((log) => log.choreId)).size;
  const doneThisWeek = data.logs.filter((log) => {
    const age = daysAgo(log.completedAt);
    return age !== null && age >= 0 && age < 7;
  }).length;
  const dueCount = data.chores.filter((chore) =>
    !hasCompletedToday(data, chore.id) && statusFor(chore, data.logs) !== "normal").length;
  const roomDetails = normalizeRoomDetails(data.rooms, data.roomDetails);
  const outstanding = data.chores.filter((chore) => !hasCompletedToday(data, chore.id));
  const due = outstanding
    .filter((chore) => statusFor(chore, data.logs) !== "normal")
    .sort((a, b) => {
      const first = dueFor(a, data.logs).daysUntil ?? Number.POSITIVE_INFINITY;
      const second = dueFor(b, data.logs).daysUntil ?? Number.POSITIVE_INFINITY;
      return first - second || a.title.localeCompare(b.title, "it");
    });
  const pending = outstanding.filter((chore) => statusFor(chore, data.logs) === "normal");
  const pendingPreview = pending.slice(0, 6);

  function dueLabel(chore: AppData["chores"][number]) {
    const info = dueFor(chore, data.logs);
    if (info.status === "overdue") return `Scaduta da ${Math.abs(info.daysUntil ?? 0)} giorni`;
    if (info.status === "warning") return "Scade oggi";
    if (info.status === "soon") return `Tra ${info.daysUntil} giorni`;
    return "Da pianificare";
  }

  function saveRooms(next: AppData) {
    saveData(next);
    setData(next);
  }

  useEffect(() => {
    const refresh = () => setData(loadData());
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("curacasa:data-changed", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("curacasa:data-changed", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div className="page-stack home-room-page">
      <section className="home-room-hero" aria-labelledby="home-rooms-title">
        <p className="eyebrow">La tua casa, un pensiero in meno</p>
        <h1 id="home-rooms-title">Le tue stanze</h1>
        <p className="home-room-subtitle">Gli ambienti della tua casa, a colpo d'occhio.</p>
        <div className="home-room-grid">
          {data.rooms.map((name) => (
            <div className="home-room-item" key={name}>
              <RoomBadge name={name} detail={roomDetails[name]} />
              <strong>{name}</strong>
            </div>
          ))}
          {!data.rooms.length ? (
            <p className="home-room-empty">Aggiungi la prima stanza per configurare la tua casa.</p>
          ) : null}
        </div>
        <div className="home-room-actions">
          <RoomManager data={data} onChange={saveRooms} />
        </div>
      </section>

      <section className="home-overview" aria-label="Riepilogo faccende">
        <h2>Oggi, a casa tua</h2>
        <div className="home-overview-grid">
          <Link className="home-overview-stat" to="/app/calendario">
            <Check size={19} />
            <strong>{doneToday}</strong>
            <span>Faccende fatte oggi</span>
          </Link>
          <Link className="home-overview-stat" to="/app/calendario">
            <CalendarDays size={19} />
            <strong>{doneThisWeek}</strong>
            <span>Questa settimana</span>
          </Link>
          <Link className="home-overview-stat home-overview-stat--due" to="/app/faccende">
            <Clock size={19} />
            <strong>{dueCount}</strong>
            <span>Da guardare</span>
          </Link>
        </div>
      </section>

      <section className="section-block home-due-section" aria-labelledby="home-due-heading">
        <div className="section-title">
          <h2 id="home-due-heading">Scadenze</h2>
          <span>{due.length ? `${due.length} da controllare` : "Tutto in ordine"}</span>
        </div>
        {due.length ? (
          <div className="due-list">
            {due.map((chore) => (
              <Link className={`due-card ${statusFor(chore, data.logs)} home-due-link`}
                to="/app/faccende" key={chore.id}>
                <span className="icon-tile">
                  <ChoreIcon name={chore.icon} size={40} />
                </span>
                <div>
                  <strong>{chore.title}</strong>
                  <span>{dueLabel(chore)}</span>
                </div>
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : <p className="soft-note">Nessuna faccenda in scadenza al momento.</p>}
      </section>

      <section className="section-block home-pending-section" aria-labelledby="home-pending-heading">
        <div className="section-title">
          <h2 id="home-pending-heading">In attesa</h2>
          <Link to="/app/faccende">{pending.length} faccende</Link>
        </div>
        {pendingPreview.length ? (
          <>
            <div className="due-list">
              {pendingPreview.map((chore) => (
                <Link className="due-card home-due-link" to="/app/faccende" key={chore.id}>
                  <span className="icon-tile">
                    <ChoreIcon name={chore.icon} size={40} />
                  </span>
                  <div>
                    <strong>{chore.title}</strong>
                    <span>{relativeDays(daysAgo(lastLog(chore, data.logs)?.completedAt))}</span>
                  </div>
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              ))}
            </div>
            {pending.length > pendingPreview.length ? (
              <Link className="home-pending-more" to="/app/faccende">
                Vedi tutte le {pending.length} faccende in attesa <ChevronRight size={16} />
              </Link>
            ) : null}
          </>
        ) : <p className="soft-note">Nessun'altra faccenda in attesa.</p>}
      </section>
    </div>
  );
}
