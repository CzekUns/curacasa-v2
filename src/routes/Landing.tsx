import { Show, SignInButton, SignUpButton } from "@clerk/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";
import { landingDescription, landingFeatures, landingTitle } from "../content/landing";
import { isDemoMode } from "../lib/demo";

const appDestination = `${import.meta.env.BASE_URL}#/app`;

export function Landing() {
  return (
    <main className="landing-page">
      <div className="landing-bg" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <header className="landing-topbar">
        <Brand className="landing-brand-reveal" />
        {isDemoMode ? (
          <Link className="landing-mini-link" to="/app">Apri demo</Link>
        ) : (
          <>
            <Show when="signed-in">
              <Link className="landing-mini-link" to="/app">Apri app</Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl={appDestination}>
                <button className="landing-mini-link" type="button">Accedi</button>
              </SignInButton>
            </Show>
          </>
        )}
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy landing-reveal">
          <div className="landing-hero-mark" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}brand/mark.svg`} width="90" height="90" alt="" />
            <span className="landing-hero-glint" />
          </div>
          <h1 id="landing-title">{landingTitle}</h1>
          <p className="landing-subtitle">{landingDescription}</p>
          <div className="landing-actions">
            {isDemoMode ? (
              <Link className="landing-cta landing-cta--primary" to="/accesso">
                Scopri l'accesso <ArrowRight size={17} />
              </Link>
            ) : (
              <>
                <Show when="signed-out">
                  <SignUpButton mode="modal" forceRedirectUrl={appDestination}>
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

        <div className="landing-hero-art" aria-hidden="true">
          <img
            src={`${import.meta.env.BASE_URL}brand/hero-whisper-v2.svg`}
            alt=""
            width="1200"
            height="820"
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>
      </section>
    </main>
  );
}
