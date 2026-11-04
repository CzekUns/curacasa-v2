/**
 * Material skins for the 3D furniture catalogue.
 * They intentionally do NOT alter 2D Shop icon skins or the application's palette.
 * Skin choice is saved on each Furniture record; all 106 existing meshes support it.
 */
export const FURNITURE_SKINS = [
  { id:"illustrata", label:"Classica illustrata", description:"Avorio, tortora, salvia e contorni morbidi come le icone CuraCasa.", swatch:"#e9dace", accent:"#9e9b88" },
  { id:"originale", label:"Originale 3D", description:"Le tinte e le geometrie originali, senza modifiche.", swatch:"#b99588", accent:"#8faeaa" },
  { id:"cipria", label:"Cipria", description:"Rosa antico, crema e finiture satinate.", swatch:"#edc6cd", accent:"#f6eade" },
  { id:"salvia", label:"Salvia", description:"Verde delicato, legno e lino naturale.", swatch:"#9eb5a1", accent:"#e6dfca" },
  { id:"vintage60", label:"Vintage 60", description:"Senape, petrolio e terracotta, effetto retrò.", swatch:"#c5a15e", accent:"#6e9c94" },
  { id:"vintage80", label:"Vintage 80", description:"Corallo, azzurro e lilla con contrasti pop.", swatch:"#ed839a", accent:"#88b9cb" },
  { id:"claytoon", label:"Claytoon", description:"Forme più arrotondate e colori da plastilina opaca.", swatch:"#c59ca8", accent:"#9cbca4" },
] as const;
export type FurnitureSkinId = (typeof FURNITURE_SKINS)[number]["id"];
export const DEFAULT_FURNITURE_SKIN: FurnitureSkinId = "illustrata";
export const DEFAULT_FURNITURE_SKIN_STORAGE = "curacasa_house3d_default_skin";
export function isFurnitureSkinId(value: unknown): value is FurnitureSkinId {
  return typeof value === "string" && FURNITURE_SKINS.some(option=>option.id===value);
}
export function normalizeFurnitureSkinId(value: unknown): FurnitureSkinId {
  return isFurnitureSkinId(value) ? value : DEFAULT_FURNITURE_SKIN;
}
export function getDefaultFurnitureSkin(): FurnitureSkinId {
  try {
    return typeof localStorage!=="undefined"
      ? normalizeFurnitureSkinId(localStorage.getItem(DEFAULT_FURNITURE_SKIN_STORAGE))
      : DEFAULT_FURNITURE_SKIN;
  } catch {
    return DEFAULT_FURNITURE_SKIN;
  }
}
export function setDefaultFurnitureSkin(value: FurnitureSkinId): void {
  if (!isFurnitureSkinId(value)) return;
  try {
    if (typeof localStorage!=="undefined") localStorage.setItem(DEFAULT_FURNITURE_SKIN_STORAGE,value);
  } catch { /* Private browsing may reject writes. */ }
}
