import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { loadAll } from "@/services/questionBank";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalChat } from "@/components/GlobalChat";

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <div className="h-7 w-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-primary font-semibold text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed md:sticky top-0 left-0 h-screen z-40 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </aside>
      <div className="flex-1 flex flex-col min-h-screen w-full pb-safe">
        <header className="sticky top-0 z-20 h-14 flex items-center px-4 md:px-6 bg-card/80 backdrop-blur-lg border-b border-border/30 pt-safe">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 rounded-xl bg-secondary/50 flex items-center justify-center md:hidden active:scale-95 transition-transform"
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
          <span className="ml-3 font-bold text-sm text-foreground">Quest Ace</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden" role="main">
          <Outlet />
        </main>
      </div>
      {!isBattlePage && showGlobalChat && <GlobalChat />}
    </div>
  );
}
