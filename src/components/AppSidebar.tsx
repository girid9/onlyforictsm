import { NavLink } from "react-router-dom";
import {
  Home,
  BookOpen,
  Bookmark,
  XCircle,
  Swords,
  X,
  Zap,
  Clock,
  Palette,
  Check,
  RotateCcw,
  BarChart3,
  Brain,
  Flame,
  Bot
} from "lucide-react";
import { useProgressStore } from "@/store/useAppStore";
import { useTheme } from "@/components/ThemeProvider";
import { THEMES, THEME_NAMES, ThemeName } from "@/config/themes";
import { useState } from "react";
import { LevelBadge } from "@/components/LevelBadge";

const links = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/revision", icon: Brain, label: "Revision" },
  { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { to: "/wrong", icon: XCircle, label: "Review" },
  { to: "/battle", icon: Swords, label: "Battle" },
];

interface Props {
  onClose: () => void;
}

export function AppSidebar({ onClose }: Props) {
  const { streak, xp } = useProgressStore();
  const { colorTheme, setColorTheme } = useTheme();
  const [themesOpen, setThemesOpen] = useState(false);

  return (
    <div className="w-64 h-full flex flex-col border-r border-border/50" style={{ background: 'hsl(var(--sidebar-background) / 0.85)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)' }}>
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-glow">
            <span className="text-primary-foreground font-bold text-lg">Q</span>
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground uppercase">Quest Ace</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors focus-ring"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 p-2 rounded-lg border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={10} className="text-warning" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Streak</span>
            </div>
            <p className="text-xs font-bold">{streak}d 🔥</p>
          </div>
          <div className="bg-muted/30 p-2 rounded-lg border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={10} className="text-warning" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">XP</span>
            </div>
            <p className="text-xs font-bold">{xp}</p>
          </div>
        </div>
        <LevelBadge xp={xp} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar" role="navigation" aria-label="Main navigation">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 focus-ring ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-glass-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Theme Section */}
        <div className="pt-3 mt-3 border-t border-border/50">
          <button
            onClick={() => setThemesOpen(!themesOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 w-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Palette size={16} />
            <span className="flex-1 text-left">Themes</span>
            <span
              className="h-3 w-3 rounded-full border border-border/50"
              style={{ backgroundColor: THEMES[colorTheme].dot }}
            />
          </button>

          {themesOpen && (
            <div className="mt-1 ml-2 mr-2 p-2 rounded-xl bg-muted/30 border border-border/50 space-y-1">
              {THEME_NAMES.map((key) => {
                const theme = THEMES[key];
                const isActive = colorTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setColorTheme(key)}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-border/50 shrink-0"
                      style={{ backgroundColor: theme.dot }}
                    />
                    <span className="flex-1 text-left">{theme.name}</span>
                    {isActive && <Check size={14} className="text-primary" />}
                  </button>
                );
              })}
              <button
                onClick={() => setColorTheme("midnight")}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <RotateCcw size={12} />
                Reset to Default
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-[9px] text-muted-foreground/50 text-center font-bold uppercase tracking-[0.2em]">
          Quest Ace v2.1.0
        </div>
      </div>
    </div>
  );
}
