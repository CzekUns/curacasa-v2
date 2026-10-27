import { useEffect, useMemo, useState } from "react";
import { Check, Palette, PackagePlus, Plus } from "lucide-react";
import { ActionFeedback, useActionFeedback } from "../components/ActionFeedback";
import { ChoreIcon } from "../lib/icons";
import { importPresets, loadData, presetSignature, saveData, type PresetChore } from "../lib/store";
import { getTheme, setTheme, THEMES, type ThemeName } from "../lib/theme";

type ChorePack = {
  id: string;
  title: string;
  description: string;
  chores: PresetChore[];
};

type PackFile = { packs: ChorePack[] };
type ShopTab = "collections" | "activities" | "themes";

export function Shop() {
  const [packs, setPacks] = useState<ChorePack[]>([]);
  const [status, setStatus] = useState("Caricamento collezioni...");
  const [activeTab, setActiveTab] = useState<ShopTab>("collections");
  const [data, setData] = useState(loadData);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(getTheme);
  const { feedback, announce } = useActionFeedback();

  const owned = useMemo(() => new Set(
    data.chores.flatMap((chore) => [chore.presetKey, presetSignature(chore)].filter((key): key is string => !!key)),
  ), [data.chores]);

  const activities = useMemo(() => {
    const seen = new Set<string>();
    return packs.flatMap((pack) =>
      pack.chores
        .filter((chore) => {
          const key = presetSignature(chore);
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

  useEffect(() => {
    const update = () => setData(loadData());
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  function addPresets(presets: PresetChore[], label: string) {
    // Read the current storage on every click: protects rapid taps, packs
    // overlapping with other packs and modifications from another tab.
    const result = importPresets(loadData(), presets);
    if (!result.added) {
      setData(result.data);
      setStatus("Queste faccende sono già presenti.");
      return;
    }
    saveData(result.data);
    setData(result.data);
    setStatus("");
    announce(result.added === 1 ? `${label} aggiunta!` : `${result.added} faccende aggiunte!`);
  }

  function selectTheme(theme: ThemeName) {
    if (selectedTheme === theme) return;
    setTheme(theme);
    setSelectedTheme(theme);
    announce(`Tema ${theme === "cipria" ? "Cipria" : "Classico"} applicato!`);
  }

  return (
    <div className="page-stack">
      <ActionFeedback feedback={feedback} />
      <section className="page-heading">
        <p className="eyebrow">Shop CuraCasa</p>
        <div>
          <h1>Collezioni e attività</h1>
        </div>
      </section>

      <div className="shop-tabs shop-tabs--three" role="tablist" aria-label="Shop CuraCasa">
        <button aria-selected={activeTab === "collections"} className={activeTab === "collections" ? "active" : ""}
          onClick={() => setActiveTab("collections")} role="tab" type="button">Collezioni</button>
        <button aria-selected={activeTab === "activities"} className={activeTab === "activities" ? "active" : ""}
          onClick={() => setActiveTab("activities")} role="tab" type="button">Faccende</button>
        <button aria-selected={activeTab === "themes"} className={activeTab === "themes" ? "active" : ""}
          onClick={() => setActiveTab("themes")} role="tab" type="button">Temi</button>
      </div>

      {activeTab === "collections" && packs.length ? (
        <section className="pack-list" role="tabpanel" aria-label="Collezioni">
          {packs.map((pack) => {
            const missing = pack.chores.filter((chore) => !owned.has(presetSignature(chore)));
            const allOwned = missing.length === 0;
            return (
              <article className={`pack-card ${allOwned ? "shop-owned" : ""}`} key={pack.id}>
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
                <button type="button" disabled={allOwned} onClick={() => addPresets(pack.chores, pack.title)}>
                  {allOwned ? <Check size={17} /> : <PackagePlus size={17} />}
                  {allOwned ? "Collezione già aggiunta" : missing.length === pack.chores.length
                    ? "Aggiungi collezione" : `Aggiungi ${missing.length} mancanti`}
                </button>
              </article>
            );
          })}
        </section>
      ) : null}

      {activeTab === "activities" && activities.length ? (
        <section className="pack-list" role="tabpanel" aria-label="Faccende disponibili">
          {activities.map((chore) => {
            const isOwned = owned.has(presetSignature(chore));
            return (
              <article className={`activity-card ${isOwned ? "shop-owned" : ""}`}
                key={presetSignature(chore)}>
                <span className="icon-tile" aria-hidden="true">
                  <ChoreIcon name={chore.icon} size={40} />
                </span>
                <div>
                  <p className="eyebrow">{chore.packTitle}</p>
                  <h2>{chore.title}</h2>
                  <span>{chore.description}</span>
                </div>
                <button aria-label={isOwned ? `${chore.title} già aggiunta` : `Aggiungi ${chore.title}`}
                  title={isOwned ? "Già nelle tue faccende" : "Aggiungi alle mie faccende"}
                  type="button" disabled={isOwned} onClick={() => addPresets([chore], chore.title)}>
                  {isOwned ? <Check size={18} /> : <Plus size={18} />}
                </button>
              </article>
            );
          })}
        </section>
      ) : null}

      {activeTab === "themes" ? (
        <section className="shop-themes" role="tabpanel" aria-label="Temi dell'app">
          <div className="shop-themes__intro">
            <Palette size={20} aria-hidden="true" />
            <p>Cambia i colori di CuraCasa. Sfumature, disposizione e funzioni rimangono uguali.</p>
          </div>
          <div className="theme-grid">
            {THEMES.map((theme) => (
              <article className={`theme-card ${selectedTheme === theme.id ? "theme-card--selected" : ""}`} key={theme.id}>
                <div className="theme-card__sample" style={{
                  background: `linear-gradient(140deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 57%, ${theme.colors[2]} 100%)`,
                }} aria-hidden="true">
                  <span className="theme-card__sample-panel">
                    <span style={{ background: theme.colors[3] }} />
                    <span style={{ background: theme.colors[2] }} />
                    <span style={{ background: theme.colors[1] }} />
                  </span>
                </div>
                <h2>{theme.label}</h2>
                <p>{theme.description}</p>
                <button type="button" disabled={selectedTheme === theme.id}
                  onClick={() => selectTheme(theme.id)}>
                  {selectedTheme === theme.id ? <Check size={18} /> : <Palette size={18} />}
                  {selectedTheme === theme.id ? "Tema attivo" : "Applica tema"}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab !== "themes" && !packs.length && !status ? (
        <section className="empty-state">
          <PackagePlus size={24} />
          <h2>Nessuna voce disponibile</h2>
          <p>Qui compariranno collezioni e attività precaricate.</p>
        </section>
      ) : null}

      {status && activeTab !== "themes" ? <p className="status-note" role="status">{status}</p> : null}
    </div>
  );
}
