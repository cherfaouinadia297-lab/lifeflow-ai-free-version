import type { Task } from "./types";

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
    new Notification(title, { body, icon: "/icon-192.png", lang: "ar" });
  } catch {
    /* noop */
  }
}

/** Returns tasks whose start time is within the next 60 seconds and not yet notified. */
export function dueTasks(tasks: Task[], nowMs = Date.now()): Task[] {
  return tasks.filter((t) => {
    if (t.completed || t.notified) return false;
    const start = new Date(`${t.date}T${t.startTime}:00`).getTime();
    return start <= nowMs && nowMs - start < 60_000;
  });
}