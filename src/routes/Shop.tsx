import { useEffect, useMemo, useState } from "react";
import { Check, Palette, PackagePlus, Plus } from "lucide-react";
import { ActionFeedback, useActionFeedback } from "../components/ActionFeedback";
import { ChoreIcon } from "../lib/icons";
import { CHORE_LEVEL_LABELS, presetIdentity } from "../lib/chore-levels";
import { ChoreLevelTag } from "../components/ChoreLevelTag";
import { normalizeStorePacks, groupStoreActivities, STORE_CATEGORY_ORDER, type StorePack } from "../lib/shop-catalog";
import { importPresets, loadData, presetSignature, saveData, type PresetChore } from "../lib/store";
import { getTheme, setTheme, THEMES, type ThemeName } from "../lib/theme";

type ShopTab = "collections" | "activities" | "themes";

export function Shop() {
  const [packs, setPacks] = useState<StorePack[]>([]);
  const [status, setStatus] = useState("Caricamento catalogo...");
  const [activeTab, setActiveTab] = useState<ShopTab>("activities");
  const [data, setData] = useState(loadData);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(getTheme);
  const { feedback, announce } = useActionFeedback();

  useEffect(() => {
    const syncTheme = () => setSelectedTheme(getTheme());
    window.addEventListener("storage", syncTheme);
    window.addEventListener("curacasa-theme-changed", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("curacasa-theme-changed", syncTheme);
    };
  }, []);

  const owned = useMemo(() => new Set(
    data.chores.flatMap((chore) => [chore.presetKey, presetSignature(chore), presetIdentity(chore)].filter((key): key is string => !!key)),
  ), [data.chores]);

  const activityGroups = useMemo(() => groupStoreActivities(packs), [packs]);

  useEffect(() => {
    const controller = new AbortController();
    // Prevent an older PWA catalog without category fields from hiding the
    // new collections. Recover legacy mixed packs if one still slips through.
    fetch(`${import.meta.env.BASE_URL}chore-packs.json?catalog=grouped-v2`, {
      cache: "no-store", signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("catalog");
        return response.json() as Promise<unknown>;
      })
      .then((file) => {
        const normalized = normalizeStorePacks(file);
        setPacks(normalized);
        setStatus(normalized.length ? "" : "Catalogo vuoto o non valido. Riprova ad aggiornare l'app.");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("Impossibile caricare il catalogo. Riprova con una connessione attiva.");
        console.warn("CuraCasa Store catalog unavailable:", error);
      });
    return () => controller.abort();
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
    const label = THEMES.find((item) => item.id === theme)?.label ?? theme;
    announce(`Tema ${label} applicato!`);
  }

  return (
    <div className="page-stack">
      <ActionFeedback feedback={feedback} />
      <section className="page-heading">
        <p className="eyebrow">Shop CuraCasa</p>
        <div>
          <h1>{activeTab === "themes" ? "Temi e colori" : "Collezioni e attività"}</h1>
        </div>
      </section>

      <div className="shop-tabs shop-tabs--three" role="tablist" aria-label="Shop CuraCasa">
        <button aria-selected={activeTab === "activities"} className={activeTab === "activities" ? "active" : ""}
          onClick={() => setActiveTab("activities")} role="tab" type="button">Faccende</button>
        <button aria-selected={activeTab === "collections"} className={activeTab === "collections" ? "active" : ""}
          onClick={() => setActiveTab("collections")} role="tab" type="button">Collezioni</button>
        <button aria-selected={activeTab === "themes"} className={activeTab === "themes" ? "active" : ""}
          onClick={() => setActiveTab("themes")} role="tab" type="button">Temi</button>
      </div>

      {activeTab === "collections" && packs.length ? (
        <div className="pack-category-list" role="tabpanel" aria-label="Collezioni">
          {STORE_CATEGORY_ORDER.map((category) => {
            const matchingPacks = packs.filter((pack) => pack.category === category);
            if (!matchingPacks.length) return null;
            return (
              <section className="pack-category-group" key={category} aria-label={`Collezioni ${CHORE_LEVEL_LABELS[category]}`}>
                <div className="section-title pack-category-heading">
                  <h2>{CHORE_LEVEL_LABELS[category]}</h2>
                  <span>{matchingPacks.length} {matchingPacks.length === 1 ? "collezione" : "collezioni"}</span>
                </div>
                <div className="pack-list">
                  {matchingPacks.map((pack) => {
                    const missing = pack.chores.filter((chore) => !owned.has(presetIdentity(chore)));
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
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      {activeTab === "activities" && activityGroups.length ? (
        <div className="pack-category-list" role="tabpanel" aria-label="Faccende disponibili">
          {activityGroups.map(({ category, chores }) => (
            <section className="pack-category-group" key={category}
              aria-label={`Faccende ${CHORE_LEVEL_LABELS[category]}`}>
              <div className="section-title pack-category-heading">
                <h2>{CHORE_LEVEL_LABELS[category]}</h2>
                <span>{chores.length} {chores.length === 1 ? "faccenda" : "faccende"}</span>
              </div>
              <div className="pack-list shop-activity-list">
                {chores.map((chore) => {
                  const isOwned = owned.has(presetIdentity(chore));
                  return (
                    <article className={`activity-card ${isOwned ? "shop-owned" : ""}`}
                      key={presetSignature(chore)}>
                      <span className="icon-tile" aria-hidden="true">
                        <ChoreIcon name={chore.icon} size={40} />
                      </span>
                      <div>
                        <h2>{chore.title}</h2>
                        <span>{chore.description}</span>
                      </div>
                      <button aria-label={isOwned ? `${chore.title} già aggiunta` : `Aggiungi ${chore.title}`}
                        title={isOwned ? "Già nelle tue faccende" : "Aggiungi alle mie faccende"}
                        type="button" disabled={isOwned} onClick={() => addPresets([chore], chore.title)}>
                        {isOwned ? <Check size={18} /> : <Plus size={18} />}
                      </button>
                      <ChoreLevelTag level={category} />
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {activeTab === "themes" ? (
        <section className="shop-themes" role="tabpanel" aria-label="Temi dell'app">
          <div className="shop-themes__intro">
            <Palette size={20} aria-hidden="true" />
            <div>
              <p>Cambia i colori di CuraCasa. Sfumature, disposizione e funzioni rimangono uguali.</p>
              <a href="https://business.pinterest.com/it/pinterest-palette/" target="_blank" rel="noopener noreferrer">
                I nuovi temi sono ispirati alla Pinterest Palette 2026
              </a>
            </div>
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
                {theme.inspiration ? <span className="theme-card__source">{theme.inspiration}</span> : null}
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
