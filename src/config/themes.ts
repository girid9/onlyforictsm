export type ThemeName = "midnight" | "light-paper" | "ocean-blue" | "royal-purple" | "sunset-pink";

export interface ThemeConfig {
  name: string;
  dot: string; // tailwind-compatible color for preview dot
  isDark: boolean;
}

export const THEMES: Record<ThemeName, ThemeConfig> = {
  midnight: { name: "Midnight", dot: "#4b7bec", isDark: true },
  "light-paper": { name: "Light Paper", dot: "#e8e4df", isDark: false },
  "ocean-blue": { name: "Ocean Blue", dot: "#0abde3", isDark: true },
  "royal-purple": { name: "Royal Purple", dot: "#8854d0", isDark: true },
  "sunset-pink": { name: "Sunset Pink", dot: "#fd79a8", isDark: false },
};

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];
