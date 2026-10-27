import { UserButton } from "@clerk/react";
import { Home, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { isDemoMode } from "../../lib/demo";

export function Header() {
  return (
    <header className="app-header">
      <Link className="brand-mark" to="/app" aria-label="CuraCasa Home">
        <span className="brand-icon">
          <Home size={18} />
        </span>
        <span>CuraCasa</span>
      </Link>
      <div className="header-actions">
        {!isDemoMode && <UserButton />}
        <Link className="header-action" to="/app/opzioni" aria-label="Opzioni">
          <Settings size={18} />
        </Link>
      </div>
    </header>
  );
}
