const CACHE_NAME = "curacasa-v2-shell-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request)),
  );
});


// Notifications are shown only on a genuine Push API event. This is not a
// background timer: the delivery service must send a push to this worker.
self.addEventListener("push", (event) => {
  const payload = (() => {
    try { return event.data ? event.data.json() : null; } catch { return null; }
  })();
  if (!payload || typeof payload !== "object") return;
  const count = Number(payload.data?.count);
  if (!Number.isSafeInteger(count) || count < 1 || count > 1000) return;
  const title = "CuraCasa · Promemoria";
  const body = count === 1
    ? "Hai una faccenda in scadenza. Apri CuraCasa per vederla."
    : `Hai ${count} faccende in scadenza. Apri CuraCasa per vederle.`;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: new URL("brand/icon-192.png", self.registration.scope).href,
      badge: new URL("brand/favicon-48.png", self.registration.scope).href,
      tag: "curacasa-due-" + String(payload.data?.day || "").slice(0, 10),
      data: { path: "#/app/faccende" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL("#/app/faccende", self.registration.scope);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.registration.scope));
    if (existing) {
      await existing.focus();
      existing.navigate(url.href);
    } else {
      await self.clients.openWindow(url.href);
    }
  })());
});
