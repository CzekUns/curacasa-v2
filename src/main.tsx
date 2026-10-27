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
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        afterSignOutUrl={import.meta.env.BASE_URL}
        appearance={{
          variables: {
            colorPrimary: "#8f5960",
            colorBackground: "#fffdf9",
            colorForeground: "#17323a",
            colorBorder: "#e7d9d6",
            borderRadius: "1.1rem",
            fontFamily: "Montserrat, Arial, sans-serif",
            fontFamilyButtons: "Montserrat, Arial, sans-serif",
          },
          options: {
            logoImageUrl: `${window.location.origin}${import.meta.env.BASE_URL}brand/logo.svg`,
            logoPlacement: "inside",
            socialButtonsPlacement: "top",
            socialButtonsVariant: "blockButton",
          },
        }}
      >
        <HashRouter>
          <App />
        </HashRouter>
      </ClerkProvider>
    ) : (
      <MissingClerkConfig />
    )}
  </StrictMode>,
);
