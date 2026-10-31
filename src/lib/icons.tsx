import { CalendarDays, Check, Home, NotebookText, Plus, Settings, Store } from "lucide-react";

export const choreIconImages = {
  casa: "/chore-icons/casa.webp",
  cucina: "/chore-icons/cucina.webp",
  bagno: "/chore-icons/bagno.svg",
  vasca: "/chore-icons/vasca.webp",
  letto: "/chore-icons/letto.webp",
  soggiorno: "/chore-icons/soggiorno.webp",
  balcone: "/chore-icons/balcone.webp",
  vetri: "/chore-icons/vetri.webp",
  tapparelle: "/chore-icons/tapparelle.webp",
  tende: "/chore-icons/tende.webp",
  lavandino: "/chore-icons/lavandino.webp",
  piante: "/chore-icons/piante.webp",
  pattumiera: "/chore-icons/pattumiera.webp",
  forno: "/chore-icons/forno.webp",
  frigorifero: "/chore-icons/frigorifero.webp",
  doccia: "/chore-icons/doccia.webp",
  wc: "/chore-icons/wc.webp",
  "biancheria-letto": "/chore-icons/biancheria-letto.webp",
  lavatrice: "/chore-icons/lavatrice.webp",
  specchio: "/chore-icons/specchio.webp",
  "finestra-tende": "/chore-icons/finestra-tende.webp",
  scopa: "/chore-icons/scopa.webp",
  aspirapolvere: "/chore-icons/aspirapolvere.webp",
  asciugamani: "/chore-icons/asciugamani.webp",
  "mocio-secchio": "/chore-icons/mocio-secchio.webp",
  termosifone: "/chore-icons/termosifone.webp",
  pavimento: "/chore-icons/pavimento.webp",
  pareti: "/chore-icons/pareti.webp",
  battiscopa: "/chore-icons/battiscopa.webp",
  armadio: "/chore-icons/armadio.webp",
  tavolo: "/chore-icons/tavolo.webp",
  spolverino: "/chore-icons/spolverino.webp",
  paletta: "/chore-icons/paletta.webp",
  tappeto: "/chore-icons/tappeto.webp",
  divano: "/chore-icons/divano.webp",
  cuscini: "/chore-icons/cuscini.webp",
  materasso: "/chore-icons/materasso.webp",
  folletto: "/chore-icons/folletto.webp",
  "scopa-elettrica": "/chore-icons/scopa-elettrica.webp",
  "robot-aspirapolvere": "/chore-icons/robot-aspirapolvere.webp",
  deumidificatore: "/chore-icons/deumidificatore.webp",
  "filtro-condizionatore": "/chore-icons/filtro-condizionatore.webp",
  "telecomando-batterie": "/chore-icons/telecomando-batterie.webp",
  condizionatore: "/chore-icons/condizionatore.webp",
  caldaia: "/chore-icons/caldaia.webp",
  cappa: "/chore-icons/cappa.webp",
  "filtro-cappa": "/chore-icons/filtro-cappa.webp",
  "lavastoviglie-manutenzione": "/chore-icons/lavastoviglie-manutenzione.webp",
  "lavastoviglie-sale": "/chore-icons/lavastoviglie-sale.webp",
  "tende-esterno": "/chore-icons/tende-esterno.webp",
  infissi: "/chore-icons/infissi.webp",
  "mobiletti-esterni": "/chore-icons/mobiletti-esterni.webp",
  lampadario: "/chore-icons/lampadario.webp",
  "addolcitore-manutenzione": "/chore-icons/addolcitore-manutenzione.webp",
  "addolcitore-sale": "/chore-icons/addolcitore-sale.webp",
  mattonelle: "/chore-icons/mattonelle.webp",
  "tubi-esterni": "/chore-icons/tubi-esterni.webp",
  "box-doccia": "/chore-icons/box-doccia.webp",
  "tapparella-grande": "/chore-icons/tapparella-grande.webp",
  zanzariera: "/chore-icons/zanzariera.webp",
  maniglie: "/chore-icons/maniglie.webp",
  porta: "/chore-icons/porta.webp",
  mensole: "/chore-icons/mensole.webp",
  dyson: "/chore-icons/dyson.webp",
  "dyson-accessori": "/chore-icons/dyson-accessori.webp",
  "macchina-caffe": "/chore-icons/macchina-caffe.webp",
  "sifone-lavandino": "/chore-icons/sifone-lavandino.webp",
} as const;

export type PresetIconName = keyof typeof choreIconImages;

/** Only these illustrations had palette-colored residue baked outside the ivory card.
 * Their source assets were cleaned; cache-bust only these URLs on installed PWAs.
 */
const CLEANED_PRESET_ICONS: ReadonlySet<string> = new Set([
  "bagno",
  "addolcitore-manutenzione", "addolcitore-sale",
  "armadio", "cappa", "deumidificatore", "infissi",
  "lampadario", "lavatrice", "macchina-caffe",
  "tapparella-grande", "tapparelle", "telecomando-batterie",
  "tende", "zanzariera",
]);

/** Updated illustrations from the approved original icon sheet and new sun awning. */
const REPLACED_PRESET_ICONS: ReadonlySet<string> = new Set([
  "mobiletti-esterni", "tende-esterno", "divano", "tappeto", "materasso",
]);

/** The four new WebPs are zoomed; the sun awning is left unchanged. */
/** Cleaned margin artifacts; leave the original artwork and cards at full size. */
const EDGE_REPAIRED_PRESET_ICONS: ReadonlySet<string> = new Set([
  "paletta", "pavimento", "termosifone", "letto", "tavolo",
  "mattonelle", "lavastoviglie-manutenzione", "lavastoviglie-sale",
  "infissi", "tubi-esterni", "tapparella-grande", "zanzariera",
]);

const ZOOMED_PRESET_ICONS: ReadonlySet<string> = new Set([
  "mobiletti-esterni", "divano", "tappeto", "materasso",
]);

export const personalIconOptions = [
  { value: "personale-scintilla", label: "Scintilla", group: "Generiche" },
  { value: "personale-stella", label: "Stella", group: "Generiche" },
  { value: "personale-cuore", label: "Cuore", group: "Generiche" },
  { value: "personale-fiore", label: "Fiore", group: "Generiche" },
  { value: "personale-sole", label: "Sole", group: "Generiche" },
  { value: "personale-luna", label: "Luna", group: "Generiche" },
  { value: "personale-orologio", label: "Orologio", group: "Generiche" },
  { value: "personale-bandierina", label: "Bandierina", group: "Generiche" },
  { value: "personale-segnalibro", label: "Segnalibro", group: "Generiche" },
  { value: "personale-etichetta", label: "Etichetta", group: "Generiche" },
  { value: "personale-nastro", label: "Nastro", group: "Generiche" },
  { value: "personale-campanella", label: "Campanella", group: "Generiche" },
  { value: "personale-lampadina", label: "Lampadina", group: "Generiche" },
  { value: "personale-bersaglio", label: "Bersaglio", group: "Generiche" },
  { value: "personale-onda", label: "Onda", group: "Generiche" },
  { value: "personale-check", label: "Spunta", group: "Generiche" },
  { value: "personale-cerchio", label: "Cerchio", group: "Generiche" },
  { value: "personale-piuma", label: "Piuma", group: "Generiche" },

  { value: "personale-goccia", label: "Goccia", group: "Pulizie" },
  { value: "personale-bolle", label: "Bollicine", group: "Pulizie" },
  { value: "personale-schiuma", label: "Schiuma", group: "Pulizie" },
  { value: "personale-spruzzo", label: "Spruzzo", group: "Pulizie" },
  { value: "personale-spugna", label: "Spugna", group: "Pulizie" },
  { value: "personale-panno", label: "Panno", group: "Pulizie" },
  { value: "personale-guanto", label: "Guanto", group: "Pulizie" },
  { value: "personale-sapone", label: "Saponetta", group: "Pulizie" },
  { value: "personale-spazzolina", label: "Spazzolina", group: "Pulizie" },
  { value: "personale-secchiello", label: "Secchiello", group: "Pulizie" },
  { value: "personale-piumino", label: "Piumino", group: "Pulizie" },
  { value: "personale-detergente", label: "Detergente", group: "Pulizie" },
  { value: "personale-vetro", label: "Vetro lucido", group: "Pulizie" },
  { value: "personale-riciclo", label: "Riciclo", group: "Pulizie" },
  { value: "personale-profumo", label: "Profumo", group: "Pulizie" },
  { value: "personale-aria", label: "Aria fresca", group: "Pulizie" },
  { value: "personale-granelli", label: "Polvere", group: "Pulizie" },
  { value: "personale-asciutto", label: "Asciutto", group: "Pulizie" },
  { value: "personale-lavaggio", label: "Lavaggio", group: "Pulizie" },
  { value: "personale-microfibra", label: "Microfibra", group: "Pulizie" },
  { value: "personale-lucido", label: "Superficie lucida", group: "Pulizie" },
  { value: "personale-flacone", label: "Flacone", group: "Pulizie" },
  { value: "personale-tergivetro", label: "Tergivetro", group: "Pulizie" },
  { value: "personale-movimento", label: "Movimento", group: "Pulizie" },
] as const;

export type PersonalIconName = typeof personalIconOptions[number]["value"];
export type ChoreIconName = PresetIconName | PersonalIconName;
export const defaultPersonalIcon: PersonalIconName = "personale-scintilla";

const personalIconNames: ReadonlySet<string> = new Set(personalIconOptions.map(({ value }) => value));

export function isPersonalIconName(name: string): name is PersonalIconName {
  return personalIconNames.has(name);
}

export const choreIconOptions: Array<{ value: ChoreIconName; label: string }> = [
  { value: "casa", label: "Casa" },
  { value: "cucina", label: "Cucina" },
  { value: "bagno", label: "Bagno" },
  { value: "vasca", label: "Pulire vasca" },
  { value: "letto", label: "Letto" },
  { value: "soggiorno", label: "Soggiorno" },
  { value: "balcone", label: "Balcone" },
  { value: "vetri", label: "Vetri" },
  { value: "tapparelle", label: "Tapparelle" },
  { value: "tende", label: "Tende" },
  { value: "lavandino", label: "Lavandino" },
  { value: "piante", label: "Piante" },
  { value: "pattumiera", label: "Pattumiera" },
  { value: "forno", label: "Forno" },
  { value: "frigorifero", label: "Frigorifero" },
  { value: "doccia", label: "Doccia" },
  { value: "wc", label: "WC" },
  { value: "biancheria-letto", label: "Biancheria letto" },
  { value: "lavatrice", label: "Lavatrice" },
  { value: "specchio", label: "Specchio" },
  { value: "finestra-tende", label: "Finestra" },
  { value: "scopa", label: "Scopa" },
  { value: "aspirapolvere", label: "Aspirapolvere vintage" },
  { value: "asciugamani", label: "Asciugamani" },
  { value: "mocio-secchio", label: "Mocio e secchio" },
  { value: "termosifone", label: "Termosifone" },
  { value: "pavimento", label: "Pavimento" },
  { value: "pareti", label: "Pareti" },
  { value: "battiscopa", label: "Battiscopa" },
  { value: "armadio", label: "Armadio" },
  { value: "tavolo", label: "Tavolo" },
  { value: "spolverino", label: "Spolverino" },
  { value: "paletta", label: "Paletta" },
  { value: "tappeto", label: "Tappeto" },
  { value: "divano", label: "Divano" },
  { value: "cuscini", label: "Cuscini" },
  { value: "materasso", label: "Materasso" },
  { value: "folletto", label: "Folletto" },
  { value: "scopa-elettrica", label: "Aspirapolvere" },
  { value: "robot-aspirapolvere", label: "Robot aspirapolvere" },
  { value: "deumidificatore", label: "Deumidificatore" },
  { value: "filtro-condizionatore", label: "Filtro condizionatore" },
  { value: "telecomando-batterie", label: "Telecomando e batterie" },
  { value: "condizionatore", label: "Condizionatore" },
  { value: "caldaia", label: "Caldaia" },
  { value: "cappa", label: "Cappa" },
  { value: "filtro-cappa", label: "Filtro cappa" },
  { value: "lavastoviglie-manutenzione", label: "Lavastoviglie manutenzione" },
  { value: "lavastoviglie-sale", label: "Lavastoviglie sale" },
  { value: "tende-esterno", label: "Tende da esterno" },
  { value: "infissi", label: "Infissi" },
  { value: "mobiletti-esterni", label: "Mobiletti esterni" },
  { value: "lampadario", label: "Lampadario" },
  { value: "addolcitore-manutenzione", label: "Addolcitore manutenzione" },
  { value: "addolcitore-sale", label: "Sale addolcitore" },
  { value: "mattonelle", label: "Mattonelle" },
  { value: "tubi-esterni", label: "Tubi esterni" },
  { value: "box-doccia", label: "Box doccia" },
  { value: "tapparella-grande", label: "Tapparella grande" },
  { value: "zanzariera", label: "Zanzariera" },
  { value: "maniglie", label: "Maniglie" },
  { value: "porta", label: "Porta" },
  { value: "mensole", label: "Mensole" },
  { value: "dyson", label: "Dyson" },
  { value: "dyson-accessori", label: "Dyson accessori" },
  { value: "macchina-caffe", label: "Macchina caffe" },
  { value: "sifone-lavandino", label: "Sifone lavandino" },
];

export function ChoreIcon({ name, size = 38 }: { name?: string; size?: number }) {
  if (name && isPersonalIconName(name)) {
    // The glyph is one color; its tone comes from the active app palette.
    // Stable grouping across themes without storing any new user data.
    const index = personalIconOptions.findIndex((icon) => icon.value === name);
    const tone = ["rose", "sage", "accent"][index % 3];
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        className="chore-icon-img chore-icon-personal"
        data-tone={tone}
        viewBox="0 0 96 96"
        height={size}
        width={size}
        style={{ height: size, width: size }}
      >
        <use href={`${import.meta.env.BASE_URL}personal-icons/symbols.svg#${name}`} />
      </svg>
    );
  }

  // Preset illustrations remain reserved for the catalog.
  // Existing user chores that already reference these images are preserved.
  const iconPath = choreIconImages[name as PresetIconName];
  if (!iconPath) {
    return <Home aria-hidden="true" size={Math.max(18, Math.round(size * 0.56))} />;
  }

  return (
    <img
      aria-hidden="true"
      className="chore-icon-img"
      loading="lazy"
      src={`${import.meta.env.BASE_URL}${iconPath.slice(1)}${EDGE_REPAIRED_PRESET_ICONS.has(name || "") ? "?art=edge-clean-20261031-v1" : ZOOMED_PRESET_ICONS.has(name || "") ? "?art=zoom-120-v3" : REPLACED_PRESET_ICONS.has(name || "") ? "?art=household-icons-20261031-v1" : CLEANED_PRESET_ICONS.has(name || "") ? "?edges=ivory-full-3" : ""}`}
      style={{ height: size, width: size }}
    />
  );
}

export const navIcons = {
  home: Home,
  chores: NotebookText,
  add: Plus,
  calendar: CalendarDays,
  settings: Settings,
  shop: Store,
  check: Check,
};
