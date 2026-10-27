import { ArrowLeft, ArrowRight, Check, Heart, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";

/**
 * The connected GitHub Pages demo has no Clerk credentials.
 * This is a visual preview of the pre-authentication welcome screen, NOT
 * a simulated login form and it never requests credentials.
 * Production uses Clerk's actual sign-in/sign-up modals on the landing.
 */
export function AccessPreview() {
  return (
    <main className="access-preview">
      <div className="access-preview__glow" aria-hidden="true" />
      <nav className="access-preview__top">
        <Link className="access-preview__back" to="/">
          <ArrowLeft size={17} /> Torna alla homepage
        </Link>
        <Brand compact />
      </nav>

      <section className="access-preview__stage" aria-label="Anteprima accesso CuraCasa">
        <div className="access-preview__identity">
          <span className="access-preview__icon">
            <img src={`${import.meta.env.BASE_URL}brand/logo-stacked.svg`} alt="" width="120" height="120" />
          </span>
          <h1>La tua casa, un pensiero in meno.</h1>
          <p>Ritrova le tue faccende. Riprendi da dove eri rimasto.</p>
          <div className="access-preview__comfort">
            <span><Check size={16} /> Semplice</span>
            <span><Heart size={16} /> Fatto con cura</span>
          </div>
        </div>
        <div className="access-preview__card">
          <span className="access-preview__eyebrow">Anteprima accesso</span>
          <h2>Benvenuto su CuraCasa</h2>
          <p>Nel sito ufficiale qui apparirà il login sicuro gestito da Clerk.</p>
          <Link className="landing-cta landing-cta--primary access-preview__action" to="/app">
            Continua nella demo <ArrowRight size={18} />
          </Link>
          <span className="access-preview__privacy"><ShieldCheck size={16} /> Nessuna password richiesta in questa demo.</span>
        </div>
      </section>
    </main>
  );
}
