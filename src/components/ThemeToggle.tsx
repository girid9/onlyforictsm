import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { THEMES } from "@/config/themes";

export function ThemeToggle() {
  const { colorTheme, setColorTheme } = useTheme();
  const isDark = THEMES[colorTheme].isDark;

  const toggle = () => {
    // Toggle between midnight (dark) and light-paper (light)
    setColorTheme(isDark ? "light-paper" : "midnight");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="rounded-2xl arctic-btn"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
