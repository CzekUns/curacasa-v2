import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { getWallet, loadData } from "../lib/store";
import { isDemoMode } from "../lib/demo";

/** Local CuraCoin balance; updates immediately after chores or login rewards. */
export function CuracoinBalance({ compact = false }: { compact?: boolean }) {
  const [wallet, setWallet] = useState(() => getWallet(loadData()));

  useEffect(() => {
    const refresh = () => setWallet(getWallet(loadData()));
    window.addEventListener("curacasa:data-changed", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("curacasa:data-changed", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  if (compact) {
    return (
      <span className="curacoin-pill" title={`Saldo: ${wallet.balance} CuraCoin`}
        aria-label={`${wallet.balance} CuraCoin disponibili`}>
        <Coins size={17} aria-hidden="true" />
        <strong>{wallet.balance}</strong>
      </span>
    );
  }

  return (
    <section className="curacoin-card" aria-labelledby="curacoin-title">
      <div className="curacoin-card__top">
        <div>
          <p className="eyebrow">Premi CuraCasa</p>
          <h2 id="curacoin-title">I tuoi CuraCoin</h2>
        </div>
        <span className="curacoin-card__balance" aria-label={`Saldo ${wallet.balance} CuraCoin`}>
          <Coins size={23} aria-hidden="true" />
          <strong>{wallet.balance}</strong>
        </span>
      </div>
      <p>Ogni faccenda completata vale <strong>1 CuraCoin per stanza</strong>.
        Se scegli tutta la casa, valgono tutte le stanze selezionate.</p>
      <p className="curacoin-card__bonus">{isDemoMode
        ? "Il premio di accesso (+30) è disponibile soltanto nella versione con login."
        : "Premio di accesso: +30 al primo login. Poi +30 solo con una nuova sessione dopo almeno 7 giorni dall'ultimo premio."}</p>
    </section>
  );
}
