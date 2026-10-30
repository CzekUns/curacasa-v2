import { UserButton } from "@clerk/react";
import { Settings } from "lucide-react";
import { Brand } from "../Brand";
import { Link } from "react-router-dom";
import { isDemoMode } from "../../lib/demo";
import { CuracoinBalance } from "../CuracoinBalance";

export function Header() {
  return (
    <header className="app-header">
      <Link className="brand-mark" to="/app" aria-label="CuraCasa Home">
        <Brand compact />
      </Link>
      <div className="header-actions">
        <CuracoinBalance compact />
        {!isDemoMode && <UserButton />}
        <Link className="header-action" to="/app/opzioni" aria-label="Opzioni">
          <Settings size={18} />
        </Link>
      </div>
    </header>
  );
}
