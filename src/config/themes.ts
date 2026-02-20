export type ThemeName = "midnight" | "light-paper" | "ocean-blue" | "royal-purple" | "sunset-pink";

export interface ThemeConfig {
  name: string;
  dot: string;
  isDark: boolean;
}

export const THEMES: Record<ThemeName, ThemeConfig> = {
  midnight: { name: "Mist Green", dot: "#4aa87a", isDark: false },
  "light-paper": { name: "Warm Paper", dot: "#c9a87c", isDark: false },
  "ocean-blue": { name: "Ocean Teal", dot: "#2ba8a0", isDark: false },
  "royal-purple": { name: "Lavender", dot: "#9a7bcf", isDark: false },
  "sunset-pink": { name: "Rose Mist", dot: "#d87a9e", isDark: false },
};

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];
