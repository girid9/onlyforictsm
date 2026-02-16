import { NavLink } from "react-router-dom";
import {
  Home,
  BookOpen,
  Bookmark,
  XCircle,
  Swords,
  X,
  Zap,
  Clock
} from "lucide-react";
import { useProgressStore } from "@/store/useAppStore";

const links = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { to: "/wrong", icon: XCircle, label: "Review" },
  { to: "/battle", icon: Swords, label: "Battle" },
];

interface Props {
  onClose: () => void;
}

export function AppSidebar({ onClose }: Props) {
  const { streak, xp } = useProgressStore();

  return (
    <div className="w-64 h-full bg-card flex flex-col border-r border-border">
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">Q</span>
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground uppercase">Quest Ace</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 hover:bg-muted rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 p-2 rounded border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={10} className="text-warning" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Streak</span>
            </div>
            <p className="text-xs font-bold">{streak}d</p>
          </div>
          <div className="bg-muted/30 p-2 rounded border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={10} className="text-warning" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">XP</span>
            </div>
            <p className="text-xs font-bold">{xp}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
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
