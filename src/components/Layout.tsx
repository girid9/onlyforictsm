import { useEffect, useState } from "react";
import { Outlet, useLocation, NavLink } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Menu, Home, BookOpen, Brain, BarChart3 } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { loadAll } from "@/services/questionBank";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalChat } from "@/components/GlobalChat";

const bottomTabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/revision", icon: Brain, label: "Revision" },
  { to: "/dashboard", icon: BarChart3, label: "Stats" },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isBattlePage = location.pathname === "/battle";
  const setData = useDataStore((s) => s.setData);
  const loaded = useDataStore((s) => s.loaded);
  const showGlobalChat = useProgressStore((s) => s.settings.showGlobalChat ?? true);

  useEffect(() => {
    let cancelled = false;
    loadAll().then((data) => {
      if (!cancelled) setData(data);
    }).catch((e) => console.error("Failed to load data:", e));
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  useEffect(() => {
    window.scrollTo(0, 0);
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--gradient-bg)" }}>
        <div className="flex flex-col items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <div className="h-7 w-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-primary font-semibold text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--gradient-bg)" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed md:sticky top-0 left-0 h-screen z-40 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </aside>
      <div className="flex-1 flex flex-col min-h-screen w-full pb-safe">
        <header className="sticky top-0 z-20 h-14 flex items-center px-4 md:px-6 pt-safe" style={{ background: "hsl(var(--glass-bg) / 0.06)", backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)", borderBottom: "1px solid hsl(var(--glass-border) / 0.1)" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 rounded-xl flex items-center justify-center md:hidden active:scale-95 transition-transform text-foreground/70 hover:text-foreground"
            style={{ background: "hsl(var(--glass-bg) / 0.1)" }}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
          <span className="ml-3 font-bold text-sm text-foreground">Quest Ace</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden pb-16 md:pb-0" role="main">
          <Outlet />
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 md:hidden pb-safe" style={{ background: "hsl(var(--glass-bg) / 0.08)", backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)", borderTop: "1px solid hsl(var(--glass-border) / 0.1)" }}>
          <div className="flex items-center justify-around h-14">
            {bottomTabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      {!isBattlePage && showGlobalChat && <GlobalChat />}
    </div>
  );
}
