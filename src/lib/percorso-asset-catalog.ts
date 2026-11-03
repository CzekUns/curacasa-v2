/** Lightweight procedural 3D assets: one dedicated selectable object for every CuraCasa Shop preset.
 * No third-party models, downloads, or external texture assets are required.
 * Each row is [preset icon/id, display name, category, footprint width, footprint depth, symbol].
 */
export const ASSET_CATEGORIES = ["Tutti", "Pulizia", "Cucina", "Bagno", "Camera", "Salone", "Balcone", "Impianti", "Struttura"] as const;
export type AssetCategory = Exclude<(typeof ASSET_CATEGORIES)[number], "Tutti">;
const EXTRA_ASSET_ROWS = [
  [
    "casa",
    "Casetta",
    "Struttura",
    1,
    1,
    "🏠"
  ],
  [
    "scopa-elettrica",
    "Aspirapolvere a stelo",
    "Pulizia",
    1,
    1,
    "🧹"
  ],
  [
    "scopa",
    "Scopa",
    "Pulizia",
    1,
    1,
    "🧹"
  ],
  [
    "pavimento",
    "Mocio",
    "Pulizia",
    1,
    1,
    "🧼"
  ],
  [
    "spolverino",
    "Spolverino",
    "Pulizia",
    1,
    1,
    "🪶"
  ],
  [
    "pattumiera",
    "Pattumiera",
    "Cucina",
    1,
    1,
    "🗑️"
  ],
  [
    "bagno",
    "Mobile bagno",
    "Bagno",
    2,
    1,
    "🚰"
  ],
  [
    "cucina",
    "Blocco cucina",
    "Cucina",
    2,
    1,
    "🍳"
  ],
  [
    "soggiorno",
    "Mobile soggiorno",
    "Salone",
    2,
    1,
    "📺"
  ],
  [
    "balcone",
    "Set balcone",
    "Balcone",
    2,
    1,
    "🪴"
  ],
  [
    "doccia",
    "Soffione doccia",
    "Bagno",
    1,
    1,
    "🚿"
  ],
  [
    "wc",
    "WC",
    "Bagno",
    1,
    1,
    "🚽"
  ],
  [
    "lavandino",
    "Lavandino",
    "Bagno",
    1,
    1,
    "🚰"
  ],
  [
    "asciugamani",
    "Portasciugamani",
    "Bagno",
    1,
    1,
    "🧺"
  ],
  [
    "biancheria-letto",
    "Biancheria letto",
    "Camera",
    1,
    1,
    "🛏️"
  ],
  [
    "mocio-secchio",
    "Secchio e mocio",
    "Pulizia",
    1,
    1,
    "🪣"
  ],
  [
    "paletta",
    "Paletta",
    "Pulizia",
    1,
    1,
    "🧹"
  ],
  [
    "macchina-caffe",
    "Macchina caffè",
    "Cucina",
    1,
    1,
    "☕"
  ],
  [
    "cuscini",
    "Cuscini",
    "Salone",
    1,
    1,
    "🛋️"
  ],
  [
    "specchio",
    "Specchio",
    "Bagno",
    1,
    1,
    "🪞"
  ],
  [
    "mensole",
    "Mensola",
    "Struttura",
    1,
    1,
    "📚"
  ],
  [
    "maniglie",
    "Maniglia porta",
    "Struttura",
    1,
    1,
    "🚪"
  ],
  [
    "box-doccia",
    "Box doccia",
    "Bagno",
    2,
    1,
    "🚿"
  ],
  [
    "mattonelle",
    "Mattonelle",
    "Bagno",
    1,
    1,
    "▦"
  ],
  [
    "forno",
    "Forno",
    "Cucina",
    1,
    1,
    "♨️"
  ],
  [
    "cappa",
    "Cappa aspirante",
    "Cucina",
    1,
    1,
    "🍳"
  ],
  [
    "lavastoviglie-manutenzione",
    "Lavastoviglie",
    "Cucina",
    1,
    1,
    "🍽️"
  ],
  [
    "lavastoviglie-sale",
    "Sale lavastoviglie",
    "Cucina",
    1,
    1,
    "🧂"
  ],
  [
    "materasso",
    "Materasso",
    "Camera",
    2,
    1,
    "🛏️"
  ],
  [
    "battiscopa",
    "Battiscopa",
    "Struttura",
    2,
    1,
    "📏"
  ],
  [
    "porta",
    "Porta",
    "Struttura",
    1,
    1,
    "🚪"
  ],
  [
    "lampadario",
    "Lampadario",
    "Salone",
    1,
    1,
    "💡"
  ],
  [
    "vetri",
    "Finestra",
    "Struttura",
    1,
    1,
    "🪟"
  ],
  [
    "finestra-tende",
    "Finestra con tende",
    "Struttura",
    1,
    1,
    "🪟"
  ],
  [
    "infissi",
    "Telaio infisso",
    "Struttura",
    1,
    1,
    "🪟"
  ],
  [
    "tapparelle",
    "Tapparella",
    "Struttura",
    1,
    1,
    "🪟"
  ],
  [
    "tende",
    "Tende",
    "Salone",
    1,
    1,
    "🪟"
  ],
  [
    "tende-esterno",
    "Tenda da sole",
    "Balcone",
    2,
    1,
    "⛱️"
  ],
  [
    "termosifone",
    "Termosifone",
    "Impianti",
    1,
    1,
    "♨️"
  ],
  [
    "caldaia",
    "Caldaia",
    "Impianti",
    1,
    1,
    "🔥"
  ],
  [
    "condizionatore",
    "Condizionatore",
    "Impianti",
    1,
    1,
    "❄️"
  ],
  [
    "deumidificatore",
    "Deumidificatore",
    "Impianti",
    1,
    1,
    "💧"
  ],
  [
    "telecomando-batterie",
    "Telecomando",
    "Salone",
    1,
    1,
    "📺"
  ],
  [
    "sifone-lavandino",
    "Sifone",
    "Bagno",
    1,
    1,
    "🔧"
  ],
  [
    "tubi-esterni",
    "Tubi esterni",
    "Impianti",
    1,
    1,
    "🔧"
  ],
  [
    "addolcitore-manutenzione",
    "Addolcitore",
    "Impianti",
    1,
    1,
    "💧"
  ],
  [
    "addolcitore-sale",
    "Sale addolcitore",
    "Impianti",
    1,
    1,
    "🧂"
  ],
  [
    "filtro-cappa",
    "Filtro cappa",
    "Cucina",
    1,
    1,
    "▦"
  ],
  [
    "filtro-condizionatore",
    "Filtro condizionatore",
    "Impianti",
    1,
    1,
    "▦"
  ],
  [
    "pareti",
    "Parete",
    "Struttura",
    1,
    1,
    "🧱"
  ],
  [
    "tapparella-grande",
    "Tapparella grande",
    "Struttura",
    2,
    1,
    "🪟"
  ],
  [
    "zanzariera",
    "Zanzariera",
    "Struttura",
    1,
    1,
    "🪟"
  ],
  [
    "mobiletti-esterni",
    "Mobiletto esterno",
    "Balcone",
    1,
    1,
    "🗄️"
  ],
  [
    "dyson",
    "Aspirapolvere cordless",
    "Pulizia",
    1,
    1,
    "🧹"
  ],
  [
    "dyson-accessori",
    "Accessori aspirapolvere",
    "Pulizia",
    1,
    1,
    "🧰"
  ],
  [
    "folletto",
    "Aspirapolvere verticale",
    "Pulizia",
    1,
    1,
    "🧹"
  ],
  [
    "aspirapolvere",
    "Aspirapolvere vintage",
    "Pulizia",
    1,
    1,
    "🧹"
  ],
  [
    "robot-aspirapolvere",
    "Robot aspirapolvere",
    "Pulizia",
    1,
    1,
    "🤖"
  ],
  ["poltrona","Poltrona","Salone",1,1,"🪑"],
  ["divano-angolare","Divano angolare","Salone",2,2,"🛋️"],
  ["tavolino","Tavolino","Salone",1,1,"☕"],
  ["mobile-tv","Mobile TV","Salone",2,1,"📺"],
  ["televisore","Televisore","Salone",1,1,"📺"],
  ["libreria","Libreria","Salone",2,1,"📚"],
  ["lampada-terra","Lampada da terra","Salone",1,1,"💡"],
  ["credenza","Credenza","Salone",2,1,"🗄️"],
  ["console","Consolle","Salone",2,1,"🗄️"],
  ["sgabello","Sgabello","Salone",1,1,"🪑"],
  ["ventilatore","Ventilatore","Impianti",1,1,"🌬️"],
  ["comodino","Comodino","Camera",1,1,"🛏️"],
  ["cassettiera","Cassettiera","Camera",1,1,"🗄️"],
  ["letto-singolo","Letto singolo","Camera",1,2,"🛏️"],
  ["culla","Culla","Camera",2,1,"🍼"],
  ["specchiera","Specchiera","Camera",1,1,"🪞"],
  ["appendiabiti","Appendiabiti","Camera",1,1,"🧥"],
  ["scarpiera","Scarpiera","Camera",1,1,"👟"],
  ["abat-jour","Lampada da comodino","Camera",1,1,"💡"],
  ["scrittoio","Scrittoio","Camera",2,1,"✏️"],
  ["microonde","Microonde","Cucina",1,1,"🍲"],
  ["tostapane","Tostapane","Cucina",1,1,"🍞"],
  ["bollitore","Bollitore","Cucina",1,1,"🫖"],
  ["lavello-cucina","Lavello cucina","Cucina",1,1,"🚰"],
  ["tavolo-pranzo","Tavolo da pranzo","Cucina",2,2,"🍽️"],
  ["sgabello-bar","Sgabello alto","Cucina",1,1,"🪑"],
  ["dispensa","Dispensa","Cucina",2,1,"🗄️"],
  ["asciugatrice","Asciugatrice","Bagno",1,1,"🌀"],
  ["bidet","Bidet","Bagno",1,1,"🚽"],
  ["termoarredo","Termoarredo","Bagno",1,1,"♨️"],
  ["stendino","Stendino","Bagno",2,1,"👚"],
  ["portabiancheria","Portabiancheria","Bagno",1,1,"🧺"],
  ["fioriera","Fioriera","Balcone",2,1,"🌺"],
  ["panca-esterno","Panca da esterno","Balcone",2,1,"🪑"],
  ["ombrellone","Ombrellone","Balcone",1,1,"⛱️"],
  ["barbecue","Barbecue","Balcone",1,1,"🔥"],
  ["sedia-giardino","Sedia da giardino","Balcone",1,1,"🪑"],
  ["portaombrelli","Portaombrelli","Struttura",1,1,"☂️"]
] as const satisfies readonly (readonly [string, string, AssetCategory, number, number, string])[];
export type AdditionalAssetId = (typeof EXTRA_ASSET_ROWS)[number][0];
const CATEGORY_COLORS: Record<AssetCategory, readonly [string, string]> = {
  Pulizia:["#8daeb2","#f0e9da"], Cucina:["#c99f7a","#fff0d7"], Bagno:["#a4c8cf","#f3fbfc"],
  Camera:["#bb9ea6","#fff1e9"], Salone:["#b38b83","#f6ddd1"], Balcone:["#86a98b","#e1edcb"],
  Impianti:["#9aaeb6","#f0f4f6"], Struttura:["#c3ae93","#f3e8d6"],
};
/** The 'choreIcon' is the original Shop icon key; it remains stable if users rename a chore. */
export const ADDITIONAL_ASSETS = EXTRA_ASSET_ROWS.map(([id,label,category,width,height,icon]) => ({
  id, label, category, width, height, icon,
  elevation: 35, color: CATEGORY_COLORS[category][0], accent: CATEGORY_COLORS[category][1],
  choreIcon: id,
}));
/** Existing ten objects remain unchanged: no saved room loses its furniture. */
const EXISTING_PRESET_ASSETS = {
  "piante": "pianta",
  "letto": "letto",
  "vasca": "vasca",
  "lavatrice": "lavatrice",
  "tavolo": "tavolo",
  "tappeto": "tappeto",
  "divano": "divano",
  "frigorifero": "frigo",
  "armadio": "armadio"
} as const;
/** Keyed by the icon ID in public/chore-packs.json. */
export const PRESET_ASSET_IDS: Readonly<Record<string,string>> = Object.freeze({
  ...Object.fromEntries(ADDITIONAL_ASSETS.map(asset=>[asset.choreIcon,asset.id])),
  ...EXISTING_PRESET_ASSETS,
});
/** Human-readable task names: search "pulire WC" as well as "WC". */
export const PRESET_CHORE_TITLES: Readonly<Record<string,string>> = {
  "casa": "Controllo generale casa",
  "scopa-elettrica": "Aspirapolvere",
  "scopa": "Scopa",
  "pavimento": "Lavare pavimento",
  "spolverino": "Spolverare",
  "pattumiera": "Svuotare pattumiera",
  "piante": "Annaffiare piante",
  "bagno": "Pulire bagno",
  "cucina": "Pulire cucina",
  "letto": "Cambio letto",
  "soggiorno": "Sistemare soggiorno",
  "balcone": "Sistemare balcone",
  "doccia": "Pulire soffione doccia",
  "vasca": "Pulire vasca",
  "wc": "Pulire WC",
  "lavandino": "Pulire lavandino",
  "asciugamani": "Cambiare asciugamani",
  "biancheria-letto": "Lavare biancheria da letto",
  "lavatrice": "Fare lavatrice",
  "mocio-secchio": "Lavare pavimento 2",
  "paletta": "Paletta e briciole",
  "macchina-caffe": "Macchina caffe",
  "tavolo": "Pulire tavolo",
  "cuscini": "Sistemare cuscini",
  "tappeto": "Pulire tappeto",
  "divano": "Sistemare divano",
  "specchio": "Pulire specchio",
  "mensole": "Pulire mensole",
  "maniglie": "Pulire maniglie",
  "box-doccia": "Pulire box doccia",
  "mattonelle": "Pulire mattonelle",
  "forno": "Pulire forno",
  "frigorifero": "Pulire frigorifero",
  "cappa": "Pulire cappa",
  "lavastoviglie-manutenzione": "Lavastoviglie manutenzione",
  "lavastoviglie-sale": "Sale lavastoviglie",
  "materasso": "Controllare materasso",
  "armadio": "Sistemare armadio",
  "battiscopa": "Pulire battiscopa",
  "porta": "Pulire porta",
  "lampadario": "Pulire lampadario",
  "vetri": "Pulire vetri",
  "finestra-tende": "Pulire vetri 2",
  "infissi": "Pulire infissi",
  "tapparelle": "Pulire tapparelle",
  "tende": "Lavare tende",
  "tende-esterno": "Pulire tende da esterno",
  "termosifone": "Pulire termosifoni",
  "caldaia": "Controllare caldaia",
  "condizionatore": "Pulire condizionatore",
  "deumidificatore": "Controllare deumidificatore",
  "telecomando-batterie": "Cambiare batterie telecomando",
  "sifone-lavandino": "Pulire sifone lavandino",
  "tubi-esterni": "Pulire tubi esterni",
  "addolcitore-manutenzione": "Manutenzione addolcitore",
  "addolcitore-sale": "Caricare sale addolcitore",
  "filtro-cappa": "Cambiare filtro cappa",
  "filtro-condizionatore": "Pulire filtro condizionatore",
  "pareti": "Spolverare pareti",
  "tapparella-grande": "Pulire tapparelle 2",
  "zanzariera": "Pulire zanzariera",
  "mobiletti-esterni": "Pulire mobiletti esterni",
  "dyson": "Passare Dyson",
  "dyson-accessori": "Pulire accessori Dyson",
  "folletto": "Passare Folletto",
  "aspirapolvere": "Aspirapolvere vintage",
  "robot-aspirapolvere": "Avviare robot aspirapolvere"
};
export const ASSET_CHORE_TITLES: Readonly<Record<string,readonly string[]>> =
  Object.entries(PRESET_ASSET_IDS).reduce<Record<string,string[]>>((grouped,[icon,assetId])=>{
    (grouped[assetId] ??= []).push(PRESET_CHORE_TITLES[icon] ?? icon);
    return grouped;
  }, {});
export const EXISTING_ASSET_CATEGORIES: Readonly<Record<string,AssetCategory>> = {
  divano:"Salone", letto:"Camera", tavolo:"Cucina", sedia:"Salone", armadio:"Camera",
  lavatrice:"Bagno", vasca:"Bagno", pianta:"Balcone", tappeto:"Salone", frigo:"Cucina",
};
export const categoryForFurniture = (id:string): AssetCategory =>
  ADDITIONAL_ASSETS.find(asset=>asset.id===id)?.category ?? EXISTING_ASSET_CATEGORIES[id] ?? "Struttura";
