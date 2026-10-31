/**
 * CuraCasa cleaning depth: independent from ordinary/extraordinary cadence.
 * The original 67 Store presets are classified by their exact title + icon;
 * an existing manually created task is TUA even if it uses a preset icon.
 */
export type ChoreLevel = "base" | "pro" | "super" | "speciale" | "tua";

export const CHORE_LEVEL_LABELS: Record<ChoreLevel, string> = {
  base: "BASE", pro: "PRO", super: "SUPER", speciale: "SPECIALE", tua: "TUA",
};
const PRESET_LEVELS: Record<string, Exclude<ChoreLevel, "tua">> = {
  "controllo generale casa::casa": "base",
  "aspirapolvere::aspirapolvere": "speciale",
  "aspirapolvere vintage::aspirapolvere": "speciale",
  "aspirapolvere::scopa-elettrica": "base",
  "scopa::scopa": "base",
  "lavare pavimento::pavimento": "base",
  "mocio e secchio::mocio-secchio": "base",
  "lavare pavimento 2::mocio-secchio": "base",
  "paletta e briciole::paletta": "base",
  "spolverare::spolverino": "base",
  "svuotare pattumiera::pattumiera": "base",
  "annaffiare piante::piante": "base",
  "pulire bagno::bagno": "base",
  "pulire doccia::doccia": "base",
  "pulire soffione doccia::doccia": "base",
  "pulire box doccia::box-doccia": "pro",
  "pulire vasca::vasca": "base",
  "pulire wc::wc": "base",
  "pulire lavandino::lavandino": "base",
  "pulire sifone lavandino::sifone-lavandino": "super",
  "pulire mattonelle::mattonelle": "pro",
  "pulire tubi esterni::tubi-esterni": "super",
  "cambiare asciugamani::asciugamani": "base",
  "manutenzione addolcitore::addolcitore-manutenzione": "super",
  "caricare sale addolcitore::addolcitore-sale": "super",
  "pulire cucina::cucina": "base",
  "pulire forno::forno": "pro",
  "pulire frigorifero::frigorifero": "pro",
  "pulire cappa::cappa": "pro",
  "cambiare filtro cappa::filtro-cappa": "super",
  "lavastoviglie manutenzione::lavastoviglie-manutenzione": "pro",
  "sale lavastoviglie::lavastoviglie-sale": "pro",
  "macchina caffe::macchina-caffe": "base",
  "pulire tavolo::tavolo": "base",
  "cambio letto::letto": "base",
  "biancheria letto::biancheria-letto": "base",
  "lavare biancheria da letto::biancheria-letto": "base",
  "controllare materasso::materasso": "pro",
  "sistemare cuscini::cuscini": "base",
  "sistemare armadio::armadio": "pro",
  "fare lavatrice::lavatrice": "base",
  "pulire tappeto::tappeto": "base",
  "sistemare soggiorno::soggiorno": "base",
  "sistemare divano::divano": "base",
  "pulire specchio::specchio": "base",
  "pulire mensole::mensole": "base",
  "spolverare pareti::pareti": "super",
  "pulire battiscopa::battiscopa": "pro",
  "pulire maniglie::maniglie": "base",
  "pulire porta::porta": "pro",
  "pulire lampadario::lampadario": "pro",
  "pulire vetri::vetri": "pro",
  "pulire finestra::finestra-tende": "pro",
  "pulire vetri 2::finestra-tende": "pro",
  "pulire infissi::infissi": "pro",
  "pulire tapparelle::tapparelle": "pro",
  "pulire tapparella grande::tapparella-grande": "super",
  "pulire tapparelle 2::tapparella-grande": "super",
  "lavare tende::tende": "pro",
  "pulire tende da esterno::tende-esterno": "pro",
  "pulire zanzariera::zanzariera": "super",
  "sistemare balcone::balcone": "base",
  "pulire mobiletti esterni::mobiletti-esterni": "super",
  "pulire termosifoni::termosifone": "pro",
  "controllare caldaia::caldaia": "pro",
  "pulire condizionatore::condizionatore": "pro",
  "pulire filtro condizionatore::filtro-condizionatore": "super",
  "controllare deumidificatore::deumidificatore": "pro",
  "cambiare batterie telecomando::telecomando-batterie": "pro",
  "passare dyson::dyson": "speciale",
  "pulire accessori dyson::dyson-accessori": "speciale",
  "passare folletto::folletto": "speciale",
  "passare scopa elettrica::scopa-elettrica": "base",
  "avviare robot aspirapolvere::robot-aspirapolvere": "speciale",
};
const normalize = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("it-IT");

const signature = (chore: { title: string; icon: string }) =>
  normalize(chore.title) + "::" + normalize(chore.icon);

/**
 * The public Store has renamed five pills but their identity must remain
 * the legacy signature. This preserves imported/edited chores and prevents
 * accidental duplication when changing only the illustration's label.
 * DIFFERENT icons (e.g. pavimento vs mocio-secchio) remain distinct pills.
 */
const RENAMED_PRESETS: Record<string, string> = {
  "aspirapolvere vintage::aspirapolvere": "aspirapolvere::aspirapolvere",
  "aspirapolvere::scopa-elettrica": "passare scopa elettrica::scopa-elettrica",
  "pulire soffione doccia::doccia": "pulire doccia::doccia",
  "lavare biancheria da letto::biancheria-letto": "biancheria letto::biancheria-letto",
  "lavare pavimento 2::mocio-secchio": "mocio e secchio::mocio-secchio",
  "pulire vetri 2::finestra-tende": "pulire finestra::finestra-tende",
  "pulire tapparelle 2::tapparella-grande": "pulire tapparella grande::tapparella-grande",
};

export function presetIdentity(chore: { title: string; icon: string }): string {
  const key = signature(chore);
  return RENAMED_PRESETS[key] ?? key;
}

/**
 * A known Store specialty is SPECIAL even if it was previously BASE/PRO/SUPER.
 * Unknown user-authored chores (or explicit "tua") are not reclassified by
 * their icon alone. A saved presetKey survives later title edits.
 */
const SPECIAL_SIGNATURES = new Set<string>([
  "passare dyson::dyson",
  "pulire accessori dyson::dyson-accessori",
  "passare folletto::folletto",
  "aspirapolvere::aspirapolvere",
  "aspirapolvere vintage::aspirapolvere",
  "avviare robot aspirapolvere::robot-aspirapolvere",
]);

/** Only rename an exact legacy Store title, preserving personalized titles. */
export function updatedVacuumPresetTitle(chore: { title: string; icon: string; level?: string }): string {
  if (chore.level === "tua") return chore.title;
  const key = signature(chore);
  if (key === "aspirapolvere::aspirapolvere") return "Aspirapolvere vintage";
  if (key === "passare scopa elettrica::scopa-elettrica") return "Aspirapolvere";
  return chore.title;
}

/** Upgrade old category values while preserving Chore ids, logs and settings. */
const VACUUM_LEVELS: Record<string, "base" | "speciale"> = {
  "aspirapolvere::aspirapolvere": "speciale",
  "aspirapolvere vintage::aspirapolvere": "speciale",
  "passare scopa elettrica::scopa-elettrica": "base",
  "aspirapolvere::scopa-elettrica": "base",
};

export function classifyChoreLevel(chore: {
  title: string;
  icon: string;
  level?: string;
  presetKey?: string;
}): ChoreLevel {
  if (chore.level === "tua") return "tua";
  const current = signature(chore);
  const original = chore.presetKey || presetIdentity(chore);
  if (VACUUM_LEVELS[original] || VACUUM_LEVELS[current]) return VACUUM_LEVELS[original] ?? VACUUM_LEVELS[current];
  if (SPECIAL_SIGNATURES.has(original) || SPECIAL_SIGNATURES.has(current)) return "speciale";
  if (chore.level === "base" || chore.level === "pro" ||
      chore.level === "super" || chore.level === "speciale") {
    return chore.level;
  }
  return PRESET_LEVELS[original] ?? PRESET_LEVELS[current] ?? "tua";
}
