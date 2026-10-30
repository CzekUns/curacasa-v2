/**
 * CuraCasa cleaning depth: independent from ordinary/extraordinary cadence.
 * The original 67 Store presets are classified by their exact title + icon;
 * an existing manually created task is TUA even if it uses a preset icon.
 */
export type ChoreLevel = "base" | "pro" | "super" | "tua";
const PRESET_LEVELS: Record<string, Exclude<ChoreLevel, "tua">> = {
  "controllo generale casa::casa": "base",
  "aspirapolvere::aspirapolvere": "base",
  "scopa::scopa": "base",
  "lavare pavimento::pavimento": "base",
  "mocio e secchio::mocio-secchio": "base",
  "paletta e briciole::paletta": "base",
  "spolverare::spolverino": "base",
  "svuotare pattumiera::pattumiera": "base",
  "annaffiare piante::piante": "base",
  "pulire bagno::bagno": "base",
  "pulire doccia::doccia": "base",
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
  "pulire infissi::infissi": "pro",
  "pulire tapparelle::tapparelle": "pro",
  "pulire tapparella grande::tapparella-grande": "super",
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
  "passare dyson::dyson": "pro",
  "pulire accessori dyson::dyson-accessori": "super",
  "passare folletto::folletto": "base",
  "passare scopa elettrica::scopa-elettrica": "base",
  "avviare robot aspirapolvere::robot-aspirapolvere": "base",
};
const normalize = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("it-IT");

export function classifyChoreLevel(chore: {
  title: string;
  icon: string;
  level?: string;
  presetKey?: string;
}): ChoreLevel {
  if (chore.level === "base" || chore.level === "pro" ||
      chore.level === "super" || chore.level === "tua") {
    return chore.level;
  }
  // Preserve the Store identity when the owner edits the task's title.
  const currentSignature = normalize(chore.title) + "::" + normalize(chore.icon);
  return PRESET_LEVELS[chore.presetKey || ""] ??
    PRESET_LEVELS[currentSignature] ?? "tua";
}
