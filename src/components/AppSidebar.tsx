import { NavLink } from "react-router-dom";
import {
  Home, BookOpen, Bookmark, XCircle, Swords, X, Zap,
  Palette, Check, RotateCcw, BarChart3, Brain, Flame, MessageCircle
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
  const { streak, xp, settings, updateSettings } = useProgressStore();
  const { colorTheme, setColorTheme } = useTheme();
  const [themesOpen, setThemesOpen] = useState(false);

  return (
    <div className="w-64 h-full flex flex-col" style={{ background: "hsl(var(--glass-bg) / 0.06)", backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)", borderRight: "1px solid hsl(var(--glass-border) / 0.1)" }}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-5" style={{ borderBottom: "1px solid hsl(var(--glass-border) / 0.1)" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-base">Q</span>
          </div>
          <span className="font-bold text-sm text-foreground">Quest Ace</span>
        </div>
        <button onClick={onClose} className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center active:scale-95 transition-transform text-muted-foreground hover:text-foreground" style={{ background: "hsl(var(--glass-bg) / 0.1)" }} aria-label="Close sidebar">
          <X size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3" style={{ borderBottom: "1px solid hsl(var(--glass-border) / 0.1)" }}>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl" style={{ background: "hsl(var(--glass-bg) / 0.06)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={11} className="text-warning" />
              <span className="text-[10px] font-semibold text-muted-foreground">Streak</span>
            </div>
            <p className="text-sm font-bold text-foreground">{streak}d 🔥</p>
          </div>
          <div className="p-2.5 rounded-xl" style={{ background: "hsl(var(--glass-bg) / 0.06)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={11} className="text-primary" />
              <span className="text-[10px] font-semibold text-muted-foreground">XP</span>
            </div>
            <p className="text-sm font-bold text-foreground">{xp}</p>
          </div>
        </div>
        <LevelBadge xp={xp} />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar" role="navigation" aria-label="Main navigation">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
            style={({ isActive }) => !isActive ? { } : {}}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="pt-3 mt-3 space-y-0.5" style={{ borderTop: "1px solid hsl(var(--glass-border) / 0.1)" }}>
          <button
            onClick={() => updateSettings({ showGlobalChat: !settings.showGlobalChat })}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium w-full text-muted-foreground hover:text-foreground transition-all"
          >
            <MessageCircle size={18} />
            <span className="flex-1 text-left">Chat</span>
            <span className={`h-5 w-9 rounded-full transition-colors duration-200 flex items-center ${settings.showGlobalChat ? 'bg-primary justify-end' : 'justify-start'}`} style={!settings.showGlobalChat ? { background: "hsl(var(--glass-bg) / 0.15)" } : {}}>
              <span className="h-3.5 w-3.5 rounded-full mx-0.5 shadow-sm" style={{ background: "hsl(var(--foreground) / 0.9)" }} />
            </span>
          </button>

          <button
            onClick={() => setThemesOpen(!themesOpen)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium w-full text-muted-foreground hover:text-foreground transition-all"
          >
            <Palette size={18} />
            <span className="flex-1 text-left">Themes</span>
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: THEMES[colorTheme].dot, border: "2px solid hsl(var(--glass-border) / 0.2)" }} />
          </button>

          {themesOpen && (
            <div className="ml-2 mr-2 p-2 rounded-xl space-y-0.5" style={{ background: "hsl(var(--glass-bg) / 0.06)" }}>
              {THEME_NAMES.map((key) => {
                const theme = THEMES[key];
                const isActive = colorTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setColorTheme(key)}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: theme.dot }} />
                    <span className="flex-1 text-left">{theme.name}</span>
                    {isActive && <Check size={14} className="text-primary" />}
                  </button>
                );
              })}
              <button
                onClick={() => setColorTheme("midnight")}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <RotateCcw size={12} />
                Reset to Default
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="p-4" style={{ borderTop: "1px solid hsl(var(--glass-border) / 0.1)" }}>
        <p className="text-[10px] text-muted-foreground/50 text-center font-medium">Quest Ace v2.1.0</p>
      </div>
    </div>
  );
}
