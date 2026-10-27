import { Show, SignInButton, SignUpButton } from "@clerk/react";
import { ArrowRight, CalendarDays, Home, ListChecks, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { isDemoMode } from "../lib/demo";

export function Landing() {
  return (
    <main className="landing-page">
      <div className="landing-bg" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <header className="landing-topbar">
        <span className="landing-logo">
          <Home size={17} /> CuraCasa
        </span>
        {isDemoMode ? (
          <Link className="landing-mini-link" to="/app">
            Apri app
          </Link>
        ) : (
          <Show when="signed-in">
            <Link className="landing-mini-link" to="/app">
              Apri app
            </Link>
          </Show>
        )}
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow landing-pill">Routine leggere, casa sotto controllo</span>
          <h1>CuraCasa</h1>
          <p className="landing-subtitle">
            Una webapp elegante per segnare faccende, stanze, scadenze e giornate fatte senza
            fogli sparsi o calendari rigidi.
          </p>
          <div className="landing-actions">
            {isDemoMode ? (
              <Link className="landing-cta landing-cta--primary" to="/app">
                <span>Prova CuraCasa</span>
                <ArrowRight size={17} />
              </Link>
            ) : (
              <>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="landing-cta landing-cta--primary" type="button">
                      <span>Accedi</span>
                      <ArrowRight size={17} />
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="landing-cta landing-cta--ghost" type="button">
                      Crea account
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link className="landing-cta landing-cta--primary" to="/app">
                    <span>Vai alla dashboard</span>
                    <ArrowRight size={17} />
                  </Link>
                </Show>
              </>
            )}
          </div>
        </div>

        <div className="phone-preview" aria-hidden="true">
          <div className="phone-frame">
            <div className="phone-notch" />
            <div className="preview-screen">
              <span className="preview-eyebrow">Riepilogo semplice</span>
              <h2>Casa sotto controllo, con calma.</h2>
              <p>3 da guardare oggi</p>
              <div className="preview-card">
                <ListChecks size={18} />
                <strong>Faccende</strong>
                <span>10 salvate</span>
              </div>
              <div className="preview-card rose">
                <CalendarDays size={18} />
                <strong>Calendario</strong>
                <span>giornate leggibili</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-proof">
        <article>
          <ShieldCheck size={19} />
          <strong>{isDemoMode ? "Demo senza login" : "Accesso Clerk"}</strong>
          <span>{isDemoMode ? "Esplora l'app senza registrazione, con dati salvati nel browser." : "Login moderno, sicuro e pronto per il deploy statico."}</span>
        </article>
        <article>
          <ListChecks size={19} />
          <strong>Faccende vere</strong>
          <span>Ordinarie, straordinarie, stanze, scadenze e storico.</span>
        </article>
        <article>
          <CalendarDays size={19} />
          <strong>Calendario</strong>
          <span>Recuperi gli arretrati e leggi subito cosa e stato fatto.</span>
        </article>
      </section>
    </main>
  );
}
