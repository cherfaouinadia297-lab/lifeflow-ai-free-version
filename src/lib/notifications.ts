import type { Task } from "./types";
import { startAlarm, type RingtoneId } from "./sound";

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "default") {
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied";
    }
  }
  return Notification.permission;
}

export function notify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    // Prefer service worker registration so the system OS shows the
    // notification — this also lets it persist past the page lifecycle on
    // installed PWAs.
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready
        .then((reg) =>
          reg.showNotification(title, {
            body,
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: "lifeflow",
            requireInteraction: true,
          } as NotificationOptions),
        )
        .catch(() => {
          try {
            new Notification(title, { body, icon: "/favicon.svg" });
          } catch {
            /* noop */
          }
        });
      return;
    }
    new Notification(title, { body, icon: "/favicon.svg" });
  } catch {
    /* noop */
  }
}

export function notifyWithSound(
  title: string,
  body: string,
  ringtone: RingtoneId = "classic",
  volume = 0.5,
) {
  notify(title, body);
  startAlarm(ringtone, volume);
}

/** Returns tasks whose start time is within the next 60 seconds and not yet notified. */
export function dueTasks(tasks: Task[], nowMs = Date.now()): Task[] {
  return tasks.filter((t) => {
    if (t.completed || t.notified) return false;
    const start = new Date(`${t.date}T${t.startTime}:00`).getTime();
    return start <= nowMs && nowMs - start < 60_000;
  });
}

/**
 * Schedule precise per-task setTimeout alarms for the next ~12 hours.
 * Returns a cleanup function that cancels all scheduled timeouts.
 */
export function scheduleTaskAlarms(
  tasks: Task[],
  onFire: (task: Task) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  const now = Date.now();
  const horizon = 12 * 60 * 60 * 1000;
  for (const t of tasks) {
    if (t.completed || t.notified) continue;
    const start = new Date(`${t.date}T${t.startTime}:00`).getTime();
    const delay = start - now;
    if (delay < -60_000 || delay > horizon) continue;
    timeouts.push(setTimeout(() => onFire(t), Math.max(0, delay)));
  }
  return () => timeouts.forEach((id) => clearTimeout(id));
}