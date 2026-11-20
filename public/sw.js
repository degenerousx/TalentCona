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
        // Kept so a click can work out the record when there is no data.url (src/components/notifications/links.ts).
        data: { id: n.id || null, url, type: n.type || payload.type || "", title: n.title || "", body: n.body || "", data },
      });
      for (const client of await windows()) client.postMessage({ type: "tc:notification" });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const info = event.notification.data || {};
  const { id, url } = info;
  // No link: the portal resolves the record from the notification (needs the session), so pass it the id.
  const target = new URL(url || (id ? `/dashboard?notification=${encodeURIComponent(id)}` : "/dashboard"), self.location.origin);
  event.waitUntil(
    (async () => {
      const sameOrigin = target.origin === self.location.origin;
      const tab = (await windows()).find((c) => new URL(c.url).origin === self.location.origin);
      if (sameOrigin && tab) {
        await tab.focus();
        // The tab navigates in-app and marks the notification read (it holds the session).
        tab.postMessage({
          type: "tc:open",
          id,
          url: url ? target.pathname + target.search + target.hash : null,
          notification: url ? null : { id, type: info.type, title: info.title, body: info.body, data: info.data || null },
        });
        return;
      }
      await self.clients.openWindow(target.href);
    })(),
  );
});
