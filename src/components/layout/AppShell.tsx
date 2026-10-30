import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { isDemoMode } from "../../lib/demo";
import { RemindersBackgroundSync } from "../RemindersBackgroundSync";

export function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    // Restrict mobile pinch/double-tap zoom to the installed app,
    // leaving the public landing page's accessibility viewport untouched.
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!viewport) return;
    const original = viewport.content;
    viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";
    return () => { viewport.content = original; };
  }, []);

  return (
    <div className="app-shell">
      {!isDemoMode && <RemindersBackgroundSync />}
      <div className="app-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
