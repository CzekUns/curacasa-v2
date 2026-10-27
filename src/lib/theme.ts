/** Palette selection; layouts/gradients remain identical for all themes. */
export type ThemeName = "classico" | "cipria";
const THEME_KEY = "curacasa_v2_theme";

export const THEMES: { id: ThemeName; label: string; description: string; colors: string[] }[] = [
  {
    id: "classico",
    label: "Classico",
    description: "I colori originali di CuraCasa: rosa antico, salvia e avorio.",
    colors: ["#e6eeed", "#ead2d5", "#faf7f2", "#b8878d"],
  },
  {
    id: "cipria",
    label: "Cipria",
    description: "Avorio caldo, rosa cipria e verde salvia.",
    colors: ["#faf5ef", "#f5e5e1", "#e6eeed", "#c58d6d"],
  },
];

export function getTheme(): ThemeName {
  try {
    return localStorage.getItem(THEME_KEY) === "cipria" ? "cipria" : "classico";
  } catch {
    return "classico";
  }
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: ThemeName) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch { /* Preview may have storage disabled; visual selection still works. */ }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent<ThemeName>("curacasa-theme-changed", { detail: theme }));
}

export function initTheme() {
  applyTheme(getTheme());
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY) applyTheme(getTheme());
  });
}
