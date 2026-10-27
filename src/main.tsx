import { ClerkProvider } from "@clerk/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { clerkPublishableKey } from "./lib/clerk";
import { isDemoMode } from "./lib/demo";
import "./styles/global.css";

function MissingClerkConfig() {
  return (
    <main className="setup-screen">
      <span className="eyebrow">Configurazione richiesta</span>
      <h1>Inserisci la chiave Clerk</h1>
      <p>Copia `.env.example` in `.env.local` e valorizza `VITE_CLERK_PUBLISHABLE_KEY`.</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isDemoMode ? (
      <HashRouter>
        <App />
      </HashRouter>
    ) : clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl={import.meta.env.BASE_URL}>
        <HashRouter>
          <App />
        </HashRouter>
      </ClerkProvider>
    ) : (
      <MissingClerkConfig />
    )}
  </StrictMode>,
);
