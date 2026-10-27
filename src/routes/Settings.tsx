import { SignOutButton, useUser } from "@clerk/react";
import { ChangeEvent, FormEvent, useState } from "react";
import { Download, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { forceAppUpdate } from "../lib/pwa";
import { isDemoMode } from "../lib/demo";
import { createDefaultData, downloadJson, loadData, saveData } from "../lib/store";

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

  function addRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const room = String(form.get("room") || "").trim();
    if (!room || data.rooms.some((item) => item.toLowerCase() === room.toLowerCase())) return;
    const next = { ...data, rooms: [...data.rooms, room] };
    saveData(next);
    setData(next);
    event.currentTarget.reset();
  }

  function removeRoom(room: string) {
    const next = { ...data, rooms: data.rooms.filter((item) => item !== room) };
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
        <form className="inline-form" onSubmit={addRoom}>
          <input name="room" placeholder="Ingresso, studio, cameretta..." />
          <button type="submit" aria-label="Aggiungi stanza">
            <Plus size={18} />
          </button>
        </form>
        <div className="room-list">
          {data.rooms.map((room) => (
            <article key={room}>
              <strong>{room}</strong>
              <button type="button" onClick={() => removeRoom(room)} aria-label={`Rimuovi ${room}`}>
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
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
