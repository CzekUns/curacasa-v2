import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Check, Clock } from "lucide-react";
import { RoomBadge } from "../components/RoomBadge";
import { RoomManager } from "../components/RoomManager";
import { daysAgo, hasCompletedToday, loadData, saveData, statusFor, type AppData } from "../lib/store";
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
    </div>
  );
}
