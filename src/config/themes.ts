export type ThemeName = "midnight" | "light-paper" | "ocean-blue" | "royal-purple" | "sunset-pink";

export interface ThemeConfig {
  name: string;
  dot: string;
  isDark: boolean;
}

export const THEMES: Record<ThemeName, ThemeConfig> = {
  midnight: { name: "Blue Grey", dot: "#7ca5c4", isDark: false },
  "light-paper": { name: "Warm Paper", dot: "#d4a574", isDark: false },
  "ocean-blue": { name: "Ocean Blue", dot: "#0abde3", isDark: false },
  "royal-purple": { name: "Royal Purple", dot: "#8854d0", isDark: false },
  "sunset-pink": { name: "Sunset Pink", dot: "#fd79a8", isDark: false },
};

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];
