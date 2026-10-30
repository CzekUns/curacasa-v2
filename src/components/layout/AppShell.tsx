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
