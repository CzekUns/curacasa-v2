type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let installPrompt: InstallPromptEvent | null = null;
let initialized = false;

export function isAppInstalled() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function canInstallApp() {
  return Boolean(installPrompt) && !isAppInstalled();
}

export function initPwaInstallPrompt() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    // Do not suppress the browser's native install invitation.
    // The permanent Home install card has been removed.
    installPrompt = event as InstallPromptEvent;
    window.dispatchEvent(new Event("curacasa-install-ready"));
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    window.dispatchEvent(new Event("curacasa-install-ready"));
  });
}

export async function requestAppInstall() {
  if (!installPrompt) return false;
  await installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  installPrompt = null;
  window.dispatchEvent(new Event("curacasa-install-ready"));
  return choice.outcome === "accepted";
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => undefined);
  });
}

export async function forceAppUpdate() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const appScope = new URL(import.meta.env.BASE_URL, window.location.origin).href;
    await Promise.all(registrations.filter((registration) => registration.scope === appScope).map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("curacasa-v2-")).map((key) => caches.delete(key)));
  }

  window.location.reload();
}
