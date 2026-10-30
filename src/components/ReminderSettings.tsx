import { useAuth } from "@clerk/react";
import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import {
  disablePushReminders, enablePushReminders, preferredReminderHour,
  pushAvailability, remindersConfigured, remindersEnabled, syncPushReminders,
} from "../lib/reminders";

export function ReminderSettings() {
  const { getToken } = useAuth();
  const [enabled, setEnabled] = useState(remindersEnabled);
  const [hour, setHour] = useState(preferredReminderHour);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const availability = pushAvailability();
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setEnabled(remindersEnabled());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  async function enable() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await enablePushReminders(() => getToken(), hour);
      setEnabled(true);
      setNotice("Promemoria attivi. Riceverai un avviso per le faccende in scadenza.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Impossibile attivare le notifiche.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (busy) return;
    setBusy(true);
    try {
      await disablePushReminders(() => getToken());
      setEnabled(false);
      setNotice("Promemoria disattivati su questo dispositivo.");
    } catch {
      setNotice("Impossibile disattivare le notifiche. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  async function changeHour(nextHour: number) {
    if (![9, 18].includes(nextHour)) return;
    setHour(nextHour);
    if (!enabled) return;
    try {
      // Update local preference before the next sync; refresh the server now.
      localStorage.setItem("curacasa-reminders-hour", String(nextHour));
      await syncPushReminders(() => getToken());
      setNotice("Orario del promemoria aggiornato.");
    } catch {
      setNotice("Orario salvato sul telefono; verrà sincronizzato alla prossima apertura.");
    }
  }

  return (
    <section className="settings-card reminder-settings">
      <div className="reminder-settings__head">
        {enabled ? <Bell size={22} /> : <BellOff size={22} />}
        <div><h2>Promemoria scadenze</h2><p>Un avviso al giorno se hai faccende da fare oggi o già scadute.</p></div>
      </div>
      <p>Il calendario e gli avvisi nell'app funzionano anche senza notifiche push.</p>
      <label className="reminder-settings__hour">
        <span>Orario giornaliero</span>
        <select disabled={busy} value={hour} onChange={(event) => void changeHour(Number(event.target.value))}>
          <option value={9}>09:00</option>
          <option value={18}>18:00</option>
        </select>
      </label>
      {enabled ? (
        <button type="button" className="secondary-action" disabled={busy} onClick={() => void disable()}>
          <BellOff size={17} /> Disattiva su questo dispositivo
        </button>
      ) : (
        <button type="button" className="primary-action" disabled={busy || !availability.available} onClick={() => void enable()}>
          <Bell size={17} /> Attiva notifiche
        </button>
      )}
      {enabled ? <p className="reminder-settings__enabled"><CheckCircle2 size={16}/> Notifiche abilitate su questo dispositivo</p> : null}
      {!availability.available && !enabled ? <p role="status">{availability.reason}</p> : null}
      {notice ? <p role="status">{notice}</p> : null}
      {remindersConfigured && !("PushManager" in window) ? <p>Su iPhone occorre aggiungere CuraCasa alla schermata Home prima di attivare le notifiche.</p> : null}
    </section>
  );
}
