/*
 * TalentCona Admin Portal service worker: web push only (no caching).
 *
 * The backend sends pushes to the subscription saved with
 * POST /notifications/web-push/subscribe (see src/lib/push.ts). Each push is
 * shown as a system notification; clicking it focuses the portal (or opens
 * it) at the notification's data.url. Open portal tabs are told about every
 * push so the bell's unread badge updates straight away.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function readPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json() || {};
  } catch {
    return { body: event.data.text() };
  }
}

async function windows() {
  return self.clients.matchAll({ type: "window", includeUncontrolled: true });
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  // Same shape as GET /notifications items ({ id, title, body, data: { url } }),
  // tolerating a { notification: {...} } wrapper.
  const n = payload.notification || payload;
  const data = n.data || payload.data || {};
  const url = data.url || n.url || payload.url || null;
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(n.title || "TalentCona", {
        body: n.body || "",
        icon: "/favicon.ico",
        tag: n.id || undefined,
        data: { id: n.id || null, url },
      });
      for (const client of await windows()) client.postMessage({ type: "tc:notification" });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { id, url } = event.notification.data || {};
  const target = new URL(url || "/dashboard", self.location.origin);
  event.waitUntil(
    (async () => {
      const sameOrigin = target.origin === self.location.origin;
      const tab = (await windows()).find((c) => new URL(c.url).origin === self.location.origin);
      if (sameOrigin && tab) {
        await tab.focus();
        // The tab navigates in-app and marks the notification read (it holds the session).
        tab.postMessage({ type: "tc:open", id, url: target.pathname + target.search + target.hash });
        return;
      }
      await self.clients.openWindow(target.href);
    })(),
  );
});
