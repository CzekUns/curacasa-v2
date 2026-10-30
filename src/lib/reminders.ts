import { dueFor, loadData } from "./store";

const API_URL = String(import.meta.env.VITE_REMINDERS_API_URL || "").replace(/\/$/, "");
const PUBLIC_KEY = String(import.meta.env.VITE_REMINDERS_VAPID_PUBLIC_KEY || "");
const FLAG = "curacasa-reminders-on";
const HOUR = "curacasa-reminders-hour";

export const remindersConfigured = Boolean(API_URL && PUBLIC_KEY);

export function remindersEnabled(): boolean {
  try { return localStorage.getItem(FLAG) === "1"; } catch { return false; }
}
export function preferredReminderHour(): number {
  try {
    const hour = Number(localStorage.getItem(HOUR));
    return [9, 18].includes(hour) ? hour : 9;
  } catch { return 9; }
}
export function rememberReminderPreference(enabled: boolean, hour = preferredReminderHour()) {
  localStorage.setItem(FLAG, enabled ? "1" : "0");
  localStorage.setItem(HOUR, String(hour));
}

export function pushAvailability(): { available: boolean; reason: string } {
  if (!remindersConfigured) return { available: false, reason: "Il servizio notifiche non è ancora collegato a CuraCasa." };
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { available: false, reason: "Questo browser non supporta le notifiche push per questa PWA." };
  }
  if (Notification.permission === "denied") {
    return { available: false, reason: "Notifiche bloccate nel browser. Abilitale dalle impostazioni del dispositivo." };
  }
  return { available: true, reason: "" };
}

function base64UrlBytes(input: string): Uint8Array<ArrayBuffer> {
  const normal = input.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normal.padEnd(Math.ceil(normal.length / 4) * 4, "="));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function scheduledChores() {
  // Share ONLY pseudonymous chore IDs and due dates: not titles, rooms, notes
  // or the user's cleaning history.
  return loadData().chores
    .map((chore) => ({ id: chore.id, dueDate: dueFor(chore, loadData().logs).dueDate }))
    .filter((item): item is { id: string; dueDate: string } => item.dueDate !== null)
    .slice(0, 200);
}

async function authorizedRequest(getToken: () => Promise<string | null>, path: string, init: RequestInit) {
  const token = await getToken();
  if (!token) throw new Error("Accedi nuovamente a CuraCasa per aggiornare i promemoria.");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Il servizio promemoria non è raggiungibile. Riprova.");
}

export async function enablePushReminders(getToken: () => Promise<string | null>, hour: number) {
  const availability = pushAvailability();
  if (!availability.available) throw new Error(availability.reason);
  if (![9, 18].includes(hour)) throw new Error("Orario promemoria non valido.");
  // The permission prompt MUST originate from this user-initiated action.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permesso notifiche non concesso.");
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlBytes(PUBLIC_KEY),
    });
  }
  try {
    await sendRemindersToServer(getToken, subscription, hour);
    rememberReminderPreference(true, hour);
  } catch (error) {
    // Never leave a new remote-unregistered subscription lingering.
    if (!remindersEnabled()) await subscription.unsubscribe();
    throw error;
  }
}

async function sendRemindersToServer(
  getToken: () => Promise<string | null>,
  subscription: PushSubscription,
  hour: number,
) {
  const data = loadData();
  const chores = data.chores
    .map((chore) => ({ id: chore.id, dueDate: dueFor(chore, data.logs).dueDate }))
    .filter((item): item is { id: string; dueDate: string } => item.dueDate !== null)
    .slice(0, 200);
  await authorizedRequest(getToken, "/api/reminders", {
    method: "PUT",
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      chores,
      hour,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome",
    }),
  });
}

export async function syncPushReminders(getToken: () => Promise<string | null>) {
  if (!remindersConfigured || !remindersEnabled() || Notification.permission !== "granted") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    rememberReminderPreference(false);
    return;
  }
  await sendRemindersToServer(getToken, subscription, preferredReminderHour());
}

export async function disablePushReminders(getToken: () => Promise<string | null>) {
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
  const subscription = await registration?.pushManager.getSubscription();
  // Revocation is local-first and cannot be blocked by a network outage.
  if (subscription) await subscription.unsubscribe();
  rememberReminderPreference(false);
  if (subscription && remindersConfigured) {
    try {
      await authorizedRequest(getToken, "/api/reminders", {
        method: "DELETE",
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    } catch {
      // The subscription has already been revoked by the browser.
      // Any stale server record is removed after the first 404/410 push.
    }
  }
}
