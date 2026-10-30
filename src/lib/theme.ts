/** Palette-only selection: components, layout and gradient directions are shared. */
export type ThemeName = "classico" | "cipria" | "giada" | "ghiaccio" | "corallo";

const THEME_KEY = "curacasa_v2_theme";

export type ThemeOption = {
  id: ThemeName;
  label: string;
  description: string;
  /** Background gradient stops + identifying accent in the Store preview. */
  colors: readonly [string, string, string, string];
  /** New palettes are CuraCasa interpretations, not Pinterest UI designs. */
  inspiration?: "Pinterest Palette 2026";
};

export const THEMES: ThemeOption[] = [
  {
    id: "classico",
    label: "Classico",
    description: "Palette autentica del primo CuraCasa: rosa antico, salvia, avorio e antracite.",
    colors: ["#e6eeed", "#ead2d5", "#faf7f2", "#b8878d"],
  },
  {
    id: "cipria",
    label: "Cipria",
    description: "Avorio caldo, rosa cipria e verde salvia.",
    colors: ["#faf5ef", "#f5e5e1", "#e6eeed", "#c58d6d"],
  },
  {
    id: "giada",
    label: "Giada",
    description: "Verde minerale, crema e salvia: naturale e rilassante.",
    colors: ["#eff3ea", "#dbe6d7", "#f5f3ec", "#aeb8a0"],
    inspiration: "Pinterest Palette 2026",
  },
  {
    id: "ghiaccio",
    label: "Ghiaccio",
    description: "Azzurro polare, bianco e blu polvere: fresco e luminoso.",
    colors: ["#f5faff", "#d7efff", "#e4e8f3", "#426a88"],
    inspiration: "Pinterest Palette 2026",
  },
  {
    id: "corallo",
    label: "Corallo",
    description: "Pesca, albicocca e accenti corallo: caldo e vivace.",
    colors: ["#fff7f0", "#ffe2d5", "#f6ceb8", "#ff5c34"],
    inspiration: "Pinterest Palette 2026",
  },
];

export function getTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.find((theme) => theme.id === saved)?.id ?? "classico";
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
  } catch {
    // Some private browsers disable storage; visual selection still works.
  }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent<ThemeName>("curacasa-theme-changed", { detail: theme }));
}

export function initTheme() {
  applyTheme(getTheme());
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY) applyTheme(getTheme());
  });
}
