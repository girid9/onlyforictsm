import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDataStore, useProgressStore } from "@/store/useAppStore";
import { loadAll } from "@/services/questionBank";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalChat } from "@/components/GlobalChat";
import { AIMentor } from "@/components/AIMentor";

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
          <div className="h-16 w-16 rounded-2xl glass flex items-center justify-center animate-pulse-glow">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">Initializing Data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background app-hero">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed md:sticky top-0 left-0 h-screen z-40 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </aside>
      <div className="flex-1 flex flex-col min-h-screen w-full pb-safe">
        <header className="sticky top-0 z-20 h-16 flex items-center px-6 glass pt-safe">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-12 w-12 rounded-2xl arctic-btn flex items-center justify-center md:hidden focus-ring"
            aria-label="Toggle navigation menu"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
          <span className="ml-4 font-light text-sm tracking-[0.2em] text-primary uppercase">Quest Ace</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden" role="main">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {!isBattlePage && showGlobalChat && <GlobalChat />}
      <AIMentor />
    </div>
  );
}
