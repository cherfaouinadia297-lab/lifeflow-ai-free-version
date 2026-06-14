/* LifeFlow AI service worker — lightweight notifications + offline shell-lite. */
/* eslint-disable */
const SCHEDULED = new Map(); // id -> timeout

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "schedule") {
    // data: { id, title, body, at }
    const id = data.id;
    if (SCHEDULED.has(id)) {
      clearTimeout(SCHEDULED.get(id));
      SCHEDULED.delete(id);
    }
    const delay = Math.max(0, data.at - Date.now());
    const handle = setTimeout(() => {
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag: "lifeflow-" + id,
        requireInteraction: true,
        data: { id, url: data.url || "/" },
      });
      SCHEDULED.delete(id);
    }, delay);
    SCHEDULED.set(id, handle);
  } else if (data.type === "cancel") {
    const id = data.id;
    if (SCHEDULED.has(id)) {
      clearTimeout(SCHEDULED.get(id));
      SCHEDULED.delete(id);
    }
  } else if (data.type === "cancel-all") {
    for (const h of SCHEDULED.values()) clearTimeout(h);
    SCHEDULED.clear();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});