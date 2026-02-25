export type ThemeName = "midnight" | "light-paper" | "ocean-blue" | "royal-purple" | "sunset-pink";

export interface ThemeConfig {
  name: string;
  dot: string;
  isDark: boolean;
}

export const THEMES: Record<ThemeName, ThemeConfig> = {
  midnight: { name: "Deep Teal", dot: "#3dd9a0", isDark: true },
  "light-paper": { name: "Warm Amber", dot: "#d4a44a", isDark: true },
  "ocean-blue": { name: "Ocean Blue", dot: "#33b8e0", isDark: true },
  "royal-purple": { name: "Royal Purple", dot: "#9a7bcf", isDark: true },
  "sunset-pink": { name: "Rose Glass", dot: "#e06088", isDark: true },
};

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];
