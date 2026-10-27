import { useEffect, useMemo, useState } from "react";
import { PackagePlus, Plus } from "lucide-react";
import { ChoreIcon } from "../lib/icons";
import { loadData, saveData, type Chore, type ChoreType } from "../lib/store";

type PackChore = {
  title: string;
  description: string;
  icon: string;
  type: ChoreType;
  room: string;
  frequency: number;
  estimatedMinutes: number;
  notes?: string;
};

type ChorePack = {
  id: string;
  title: string;
  description: string;
  chores: PackChore[];
};

type PackFile = {
  packs: ChorePack[];
};

function makeId(prefix: string) {
  return `${prefix}_${crypto.getRandomValues(new Uint32Array(3)).join("")}`;
}

export function Shop() {
  const [packs, setPacks] = useState<ChorePack[]>([]);
  const [status, setStatus] = useState("Caricamento collezioni...");
  const [activeTab, setActiveTab] = useState<"collections" | "activities">("collections");

  const activities = useMemo(() => {
    const seen = new Set<string>();
    return packs.flatMap((pack) =>
      pack.chores
        .filter((chore) => {
          const key = `${chore.title}-${chore.icon}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((chore) => ({ ...chore, packTitle: pack.title })),
    );
  }, [packs]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}chore-packs.json`)
      .then((response) => {
        if (!response.ok) throw new Error("packs");
        return response.json() as Promise<PackFile>;
      })
      .then((file) => {
        setPacks(Array.isArray(file.packs) ? file.packs : []);
        setStatus("");
      })
      .catch(() => setStatus("Collezioni non disponibili."));
  }, []);

  function addPack(pack: ChorePack) {
    const data = loadData();
    const stamp = new Date().toISOString();
    const chores: Chore[] = pack.chores.map((chore) => ({
      ...chore,
      id: makeId("chore"),
      notes: chore.notes || "",
      createdAt: stamp,
      updatedAt: stamp,
    }));
    saveData({ ...data, chores: [...data.chores, ...chores] });
    setStatus(`Collezione ${pack.title} aggiunta.`);
  }

  function addActivity(chore: PackChore) {
    const data = loadData();
    const stamp = new Date().toISOString();
    const activity: Chore = {
      ...chore,
      id: makeId("chore"),
      notes: chore.notes || "",
      createdAt: stamp,
      updatedAt: stamp,
    };
    saveData({ ...data, chores: [...data.chores, activity] });
    setStatus(`${chore.title} aggiunta.`);
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Shop CuraCasa</p>
        <div>
          <h1>Collezioni e attività</h1>
        </div>
      </section>

      <div className="shop-tabs" role="tablist" aria-label="Shop CuraCasa">
        <button
          aria-selected={activeTab === "collections"}
          className={activeTab === "collections" ? "active" : ""}
          onClick={() => setActiveTab("collections")}
          role="tab"
          type="button"
        >
          Collezioni
        </button>
        <button
          aria-selected={activeTab === "activities"}
          className={activeTab === "activities" ? "active" : ""}
          onClick={() => setActiveTab("activities")}
          role="tab"
          type="button"
        >
          Attività
        </button>
      </div>

      {activeTab === "collections" && packs.length ? (
        <section className="pack-list">
          {packs.map((pack) => (
            <article className="pack-card" key={pack.id}>
              <div>
                <p className="eyebrow">{pack.chores.length} attività</p>
                <h2>{pack.title}</h2>
                <span>{pack.description}</span>
              </div>
              <div className="pack-preview" aria-hidden="true">
                {pack.chores.slice(0, 4).map((chore) => (
                  <span className="icon-tile" key={`${pack.id}-${chore.title}`}>
                    <ChoreIcon name={chore.icon} size={40} />
                  </span>
                ))}
              </div>
              <button type="button" onClick={() => addPack(pack)}>
                <PackagePlus size={17} />
                Aggiungi collezione
              </button>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === "activities" && activities.length ? (
        <section className="pack-list">
          {activities.map((chore) => (
            <article className="activity-card" key={`${chore.title}-${chore.icon}`}>
              <span className="icon-tile" aria-hidden="true">
                <ChoreIcon name={chore.icon} size={40} />
              </span>
              <div>
                <p className="eyebrow">{chore.packTitle}</p>
                <h2>{chore.title}</h2>
                <span>{chore.description}</span>
              </div>
              <button aria-label={`Aggiungi ${chore.title}`} type="button" onClick={() => addActivity(chore)}>
                <Plus size={18} />
              </button>
            </article>
          ))}
        </section>
      ) : null}

      {((activeTab === "collections" && !packs.length) || (activeTab === "activities" && !activities.length)) ? (
        <section className="empty-state">
          <PackagePlus size={24} />
          <h2>Nessuna voce disponibile</h2>
          <p>Qui compariranno collezioni e attività precaricate.</p>
        </section>
      ) : null}

      {status ? <p className="status-note">{status}</p> : null}
    </div>
  );
}
