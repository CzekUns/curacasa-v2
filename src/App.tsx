import { useAuth } from "@clerk/react";
import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AccessPreview } from "./routes/AccessPreview";
import { initPwaInstallPrompt, registerServiceWorker } from "./lib/pwa";
import { isDemoMode } from "./lib/demo";
import { AddChore } from "./routes/AddChore";
import { Calendar } from "./routes/Calendar";
import { Chores } from "./routes/Chores";
import { Home } from "./routes/Home";
import { Landing } from "./routes/Landing";
import { Settings } from "./routes/Settings";
import { Shop } from "./routes/Shop";
import { Percorso } from "./routes/Percorso";
// Keep the Three.js renderer out of the normal CuraCasa bundle.
const Percorso3D = lazy(() => import("./routes/Percorso3D").then((module) => ({ default: module.Percorso3D })));
function Percorso3DEntry() {
  return <Suspense fallback={<div className="page-loader">Caricamento ambiente 3D...</div>}>
    <Percorso3D />
  </Suspense>;
}

function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) return <div className="page-loader">Caricamento account...</div>;
  if (!isSignedIn) return <Navigate to="/" replace state={{ from: location.pathname }} />;

  return <AppShell />;
}

function ProtectedPercorso3D() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  if (!isLoaded) return <div className="page-loader">Caricamento account...</div>;
  if (!isSignedIn) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <Percorso3DEntry />;
}

function ProtectedPercorso() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  if (!isLoaded) return <div className="page-loader">Caricamento account...</div>;
  if (!isSignedIn) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <Percorso />;
}

export default function App() {
  useEffect(() => {
    initPwaInstallPrompt();
    registerServiceWorker();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {isDemoMode && <Route path="/accesso" element={<AccessPreview />} />}
      <Route path="/percorso" element={isDemoMode ? <Percorso /> : <ProtectedPercorso />} />
      <Route path="/percorso3d" element={isDemoMode ? <Percorso3DEntry /> : <ProtectedPercorso3D />} />
      <Route path="/app" element={isDemoMode ? <AppShell /> : <ProtectedRoute />}>
        <Route index element={<Home />} />
        <Route path="faccende" element={<Chores />} />
        <Route path="aggiungi" element={<AddChore />} />
        <Route path="calendario" element={<Calendar />} />
        <Route path="opzioni" element={<Settings />} />
        <Route path="shop" element={<Shop />} />
      </Route>
      <Route path="*" element={<Navigate to={isDemoMode ? "/app" : "/"} replace />} />
    </Routes>
  );
}
