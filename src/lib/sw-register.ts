/** Registers the LifeFlow notification service worker (browser only). */
export async function registerNotificationSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch {
    return null;
  }
}

export function scheduleSWNotification(payload: {
  id: string;
  title: string;
  body: string;
  at: number;
  url?: string;
}) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: "schedule", ...payload });
  });
}

export function cancelSWNotification(id: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: "cancel", id });
  });
}

export function cancelAllSWNotifications() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: "cancel-all" });
  });
}