import { SignOutButton, useUser } from "@clerk/react";
import { ChangeEvent, useState } from "react";
import { Download, RefreshCw, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { forceAppUpdate } from "../lib/pwa";
import { isDemoMode } from "../lib/demo";
import { ReminderSettings } from "../components/ReminderSettings";
import { createDefaultData, downloadJson, loadData, saveData, type AppData } from "../lib/store";
import { RoomBadge } from "../components/RoomBadge";
import { RoomManager } from "../components/RoomManager";
import { normalizeRoomDetails } from "../lib/rooms";

function ClerkAccountInfo() {
  const { user } = useUser();
  return (
    <>
      <p>{user?.primaryEmailAddress?.emailAddress || "Account Clerk attivo"}</p>
      <SignOutButton>
        <button className="secondary-action" type="button">
          Logout
        </button>
      </SignOutButton>
    </>
  );
}

export function Settings() {
  const [data, setData] = useState(loadData);

  function updateRooms(next: AppData) {
    saveData(next);
    setData(next);
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = JSON.parse(await file.text());
    saveData(parsed);
    setData(loadData());
  }

  function clearData() {
    const next = createDefaultData();
    saveData(next);
    setData(next);
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Impostazioni</p>
        <h1>Backup e account</h1>
      </section>

      <section className="settings-card">
        <h2>Stanze</h2>
        <p>Configura gli ambienti anche dalla Home. Ogni stanza ha un tipo, una nota e un colore.</p>
        <div className="room-list room-list--identity">
          {data.rooms.map((room) => (
            <article key={room}>
              <RoomBadge name={room} detail={normalizeRoomDetails(data.rooms, data.roomDetails)[room]} small />
              <strong>{room}</strong>
            </article>
          ))}
        </div>
        <RoomManager data={data} onChange={updateRooms} label="Gestisci stanze" />
      </section>

      <section className="settings-card">
        <h2>Backup</h2>
        <div className="action-row">
          <button type="button" onClick={() => downloadJson("curacasa-v2-backup.json", data)}>
            <Download size={17} /> Esporta backup
          </button>
          <label className="file-button">
            <Upload size={17} /> Importa backup
            <input type="file" accept="application/json" onChange={importBackup} hidden />
          </label>
          <button type="button" onClick={clearData}>
            <Trash2 size={17} /> Ripristina demo
          </button>
        </div>
      </section>

      {isDemoMode ? (
        <section className="settings-card reminder-settings">
          <h2>Promemoria scadenze</h2>
          <p>Le faccende in scadenza sono evidenziate nella Home. Le notifiche sul telefono richiedono un account Clerk e il servizio push configurato nella versione ufficiale.</p>
        </section>
      ) : <ReminderSettings />}

      <section className="settings-card">
        <h2>App installata</h2>
        <p>Usa questo comando se la versione salvata nella schermata Home non si aggiorna.</p>
        <div className="action-row">
          <button type="button" onClick={forceAppUpdate}>
            <RefreshCw size={17} /> Forza aggiornamento
          </button>
        </div>
      </section>

      <section className="settings-card">
        <h2>Account</h2>
        {isDemoMode ? (
          <>
            <p>Modalità test senza login. I dati restano in questo browser e non sono sincronizzati con altri dispositivi.</p>
            <Link className="secondary-action" to="/">Visualizza la homepage</Link>
          </>
        ) : (
          <ClerkAccountInfo />
        )}
      </section>
    </div>
  );
}
