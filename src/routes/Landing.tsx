import { Show, SignInButton, SignUpButton } from "@clerk/react";
import { ArrowRight, CalendarDays, Home, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { landingDescription, landingFeatures, landingTitle } from "../content/landing";
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
          <Link className="landing-mini-link" to="/app">Apri app</Link>
        ) : (
          <>
            <Show when="signed-in">
              <Link className="landing-mini-link" to="/app">Apri app</Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="landing-mini-link" type="button">Accedi</button>
              </SignInButton>
            </Show>
          </>
        )}
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <h1 id="landing-title">{landingTitle}</h1>
          <p className="landing-subtitle">{landingDescription}</p>
          <div className="landing-actions">
            {isDemoMode ? (
              <Link className="landing-cta landing-cta--primary" to="/app">
                Apri CuraCasa <ArrowRight size={17} />
              </Link>
            ) : (
              <>
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <button className="landing-cta landing-cta--primary" type="button">
                      Inizia gratis <ArrowRight size={17} />
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link className="landing-cta landing-cta--primary" to="/app">
                    Apri CuraCasa <ArrowRight size={17} />
                  </Link>
                </Show>
              </>
            )}
          </div>
          <ul className="landing-features" aria-label="Funzioni principali">
            {landingFeatures.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        </div>

        <div className="phone-preview" aria-hidden="true">
          <div className="phone-frame">
            <div className="phone-notch" />
            <div className="preview-screen">
              <span className="preview-eyebrow">CuraCasa</span>
              <h2>La tua casa, a colpo d'occhio.</h2>
              <div className="preview-card">
                <ListChecks size={18} />
                <strong>Faccende</strong>
                <span>Organizza e registra le pulizie</span>
              </div>
              <div className="preview-card rose">
                <CalendarDays size={18} />
                <strong>Calendario</strong>
                <span>Controlla le prossime scadenze</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
