import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Check, Clock, Download, ListChecks, Sparkles } from "lucide-react";
import { ChoreIcon } from "../lib/icons";
import { ActionFeedback, useActionFeedback } from "../components/ActionFeedback";
import { canInstallApp, requestAppInstall } from "../lib/pwa";
import { addLog, daysAgo, dueFor, hasCompletedToday, lastLog, loadData, relativeDays, saveData, statusFor } from "../lib/store";

export function Home() {
  const [data, setData] = useState(loadData);
  const [showInstall, setShowInstall] = useState(canInstallApp);
  const { feedback, announce } = useActionFeedback();
  const [recentlyDoneId, setRecentlyDoneId] = useState<string | null>(null);
  const dueSectionRef = useRef<HTMLElement | null>(null);
  const todayKey = new Date().toDateString();
  const doneToday = new Set(data.logs.filter((log) => new Date(log.completedAt).toDateString() === todayKey).map((log) => log.choreId)).size;
  const due = data.chores
    .filter((chore) => !hasCompletedToday(data, chore.id) && statusFor(chore, data.logs) !== "normal")
    .sort((a, b) => {
      const priority = { overdue: 0, warning: 1, soon: 2, normal: 3 };
      return priority[statusFor(a, data.logs)] - priority[statusFor(b, data.logs)];
    });
  const recommended = due[0] || data.chores.find((chore) => !hasCompletedToday(data, chore.id));
  const doneThisWeek = data.logs.filter((log) => daysAgo(log.completedAt)! <= 7).length;

  function markDone(choreId: string) {
    const current = loadData();
    const next = addLog(current, choreId);
    setData(next);
    if (next === current) return;
    saveData(next);
    setRecentlyDoneId(choreId);
    announce("Faccenda completata!");
  }

  useEffect(() => {
    if (!recentlyDoneId) return;
    const timer = window.setTimeout(() => setRecentlyDoneId(null), 900);
    return () => window.clearTimeout(timer);
  }, [recentlyDoneId]);

  useEffect(() => {
    const refresh = () => setData(loadData());
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function syncInstallState() {
      setShowInstall(canInstallApp());
    }

    syncInstallState();
    window.addEventListener("curacasa-install-ready", syncInstallState);
    return () => window.removeEventListener("curacasa-install-ready", syncInstallState);
  }, []);

  const recommendedLast = recommended ? lastLog(recommended, data.logs) : null;

  function scrollToDue() {
    dueSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function dueLabel(choreId: string) {
    const chore = data.chores.find((item) => item.id === choreId);
    if (!chore) return "Da controllare";
    const due = dueFor(chore, data.logs);
    if (due.status === "overdue") return `Scaduta da ${-due.daysUntil!} giorn${due.daysUntil === -1 ? "o" : "i"}`;
    if (due.status === "warning") return "Da fare oggi";
    if (due.daysUntil !== null) return `Tra ${due.daysUntil} giorn${due.daysUntil === 1 ? "o" : "i"}`;
    return "Senza scadenza";
  }

  return (
    <div className="page-stack">
      <ActionFeedback feedback={feedback} />
      <section className="hero-card">
        <div>
          <p className="eyebrow">Riepilogo semplice</p>
          <h1>Casa sotto controllo, con calma.</h1>
          <p>Qui trovi cosa e stato fatto, cosa torna in scadenza e il prossimo gesto utile.</p>
          <Link className="pill-button" to="/app/faccende">
            Vai alle faccende
          </Link>
        </div>
      </section>

      {showInstall ? (
        <section className="install-card">
          <div>
            <p className="eyebrow">Schermata Home</p>
            <h2>Installa CuraCasa</h2>
            <span>Aprila come app, senza passare dal browser.</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await requestAppInstall();
              setShowInstall(canInstallApp());
            }}
          >
            <Download size={17} />
            Installa
          </button>
        </section>
      ) : null}

      <section className="stats-grid">
        <Link to="/app/faccende" className="stat-card">
          <ListChecks size={19} />
          <strong>{data.chores.length}</strong>
          <span>Faccende registrate</span>
        </Link>
        <Link to="/app/calendario" className="stat-card">
          <CalendarDays size={19} />
          <strong>{doneToday}</strong>
          <span>Gia fatte oggi</span>
        </Link>
        <Link to="/app/calendario" className="stat-card">
          <Clock size={19} />
          <strong>{doneThisWeek}</strong>
          <span>Fatte questa settimana</span>
        </Link>
        <button type="button" className="stat-card urgent stat-button" onClick={scrollToDue}>
          <Sparkles size={19} />
          <strong>{due.length}</strong>
          <span>Da guardare</span>
        </button>
      </section>

      <section className="section-block">
        <div className="section-title">
          <h2>Stanze rapide</h2>
          <Link to="/app/opzioni">Modifica</Link>
        </div>
        <div className="chip-row">
          <span className="chip active">Tutta casa</span>
          {data.rooms.map((room) => (
            <span className="chip" key={room}>
              {room}
            </span>
          ))}
        </div>
      </section>

      <section className="section-block" ref={dueSectionRef}>
        <div className="section-title">
          <h2>Da guardare</h2>
          <span>{due.length ? `${due.length} attive` : "Tutto in ordine"}</span>
        </div>
        {due.length ? (
          <div className="due-list">
            {due.map((chore) => {
              const last = lastLog(chore, data.logs);
              const status = statusFor(chore, data.logs);
              return (
                <article className={`due-card ${status} ${recentlyDoneId === chore.id ? "is-just-done" : ""}`} key={chore.id}>
                  <span className="icon-tile">
                    <ChoreIcon name={chore.icon} size={40} />
                  </span>
                  <div>
                    <strong>{chore.title}</strong>
                    <span>
                      {chore.room || "Tutta casa"} - {relativeDays(daysAgo(last?.completedAt))}
                    </span>
                  </div>
                  <em>{dueLabel(chore.id)}</em>
                  <button type="button" onClick={() => markDone(chore.id)} aria-label={`Completa ${chore.title}`}>
                    <Check size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="soft-note">Nessuna faccenda in scadenza al momento.</div>
        )}
      </section>

      {recommended ? (
        <section className={`recommend-card ${recentlyDoneId === recommended.id ? "is-just-done" : ""}`}>
          <span className="icon-tile">
            <ChoreIcon name={recommended.icon} size={40} />
          </span>
          <div>
            <p className="eyebrow">Attivita consigliata</p>
            <h2>{recommended.title}</h2>
            <span>
              {recommended.room || "Tutta casa"} - {relativeDays(daysAgo(recommendedLast?.completedAt))}
            </span>
          </div>
          <button type="button" onClick={() => markDone(recommended.id)} aria-label="Segna fatta">
            <Sparkles size={18} />
          </button>
        </section>
      ) : (
        <section className="empty-state">
          <ListChecks size={24} />
          <h2>{data.chores.length ? "Tutto fatto per oggi!" : "Nessuna faccenda"}</h2>
          <p>{data.chores.length ? "Le attività completate restano consultabili nel calendario." : "Aggiungi la prima faccenda o scegli un set dallo Shop."}</p>
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
    </div>
  );
}
