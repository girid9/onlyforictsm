import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeName, THEMES } from "@/config/themes";

type ThemeContextValue = {
  colorTheme: ThemeName;
  setColorTheme: (t: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "quest-ace-color-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ThemeName>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved && saved in THEMES) return saved as ThemeName;
    return "midnight";
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove old theme classes
    root.removeAttribute("data-color-theme");
    root.setAttribute("data-color-theme", colorTheme);

    // Set dark/light class based on theme
    const isDark = THEMES[colorTheme].isDark;
    root.classList.toggle("dark", isDark);
  }, [colorTheme]);

  const setColorTheme = (t: ThemeName) => {
    setColorThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  };

  const value = useMemo<ThemeContextValue>(() => ({ colorTheme, setColorTheme }), [colorTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
