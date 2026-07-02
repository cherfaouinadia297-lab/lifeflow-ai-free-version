import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import type { Task } from "./types";

/**
 * Native alarm scheduling powered by Capacitor's LocalNotifications plugin.
 *
 * Behind the scenes on Android this uses AlarmManager with exact alarms and
 * a boot-persisted broadcast receiver, so notifications continue to fire
 * when the app is closed, the screen is off, or the device is rebooted —
 * as long as the user has not force-stopped the app and has granted the
 * SCHEDULE_EXACT_ALARM + POST_NOTIFICATIONS permissions.
 *
 * On the web this is a no-op — the existing in-app `scheduleTaskAlarms`
 * timer path in __root.tsx keeps handling browser tabs.
 */

export const isNative = () => Capacitor.isNativePlatform();

const CHANNEL_ID = "lifeflow-alarms";

function taskNotificationId(taskId: string): number {
  // LocalNotifications requires a 32-bit int id — hash the task uuid.
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    hash = (hash * 31 + taskId.charCodeAt(i)) | 0;
  }
  // Keep it positive and below Java Int.MAX_VALUE.
  return Math.abs(hash) % 2_000_000_000;
}

async function ensureChannel() {
  if (!isNative()) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "LifeFlow Alarms",
      description: "Task alarms and reminders",
      importance: 5, // IMPORTANCE_HIGH
      visibility: 1, // VISIBILITY_PUBLIC — show on lock screen
      sound: "alarm.wav",
      vibration: true,
      lights: true,
      lightColor: "#2E8B8B",
    });
  } catch {
    /* channel may already exist */
  }
}

export async function requestNativePermissions(): Promise<boolean> {
  if (!isNative()) return false;
  await ensureChannel();
  try {
    const perms = await LocalNotifications.requestPermissions();
    return perms.display === "granted";
  } catch {
    return false;
  }
}

export async function checkNativePermissions(): Promise<{
  notifications: boolean;
  exactAlarm: boolean;
}> {
  if (!isNative()) return { notifications: false, exactAlarm: false };
  try {
    const perms = await LocalNotifications.checkPermissions();
    return { notifications: perms.display === "granted", exactAlarm: true };
  } catch {
    return { notifications: false, exactAlarm: false };
  }
}

/**
 * Schedule (or reschedule) all future task alarms with the OS.
 * Cancels stale pending alarms first so edits/deletes take effect.
 */
export async function syncTaskAlarms(tasks: Task[]): Promise<void> {
  if (!isNative()) return;
  await ensureChannel();

  // Cancel every pending scheduled alarm so we start from a clean slate.
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch {
    /* noop */
  }

  const now = Date.now();
  const toSchedule = tasks
    .filter((t) => !t.completed && !t.notified && t.date && t.startTime)
    .map((t) => {
      const at = new Date(`${t.date}T${t.startTime}:00`);
      return { task: t, at };
    })
    .filter(({ at }) => at.getTime() > now);

  if (!toSchedule.length) return;

  await LocalNotifications.schedule({
    notifications: toSchedule.map(({ task, at }) => ({
      id: taskNotificationId(task.id),
      title: task.title,
      body: task.description || `حان موعد النشاط (${task.startTime})`,
      channelId: CHANNEL_ID,
      schedule: {
        at,
        allowWhileIdle: true, // fire during Doze
      },
      smallIcon: "ic_stat_icon_config_sample",
      largeBody: task.description,
      autoCancel: false,
      ongoing: true, // keep visible until user dismisses
      extra: { taskId: task.id },
    })),
  });
}

export async function cancelTaskAlarm(taskId: string) {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: taskNotificationId(taskId) }],
    });
  } catch {
    /* noop */
  }
}

export async function fireTestAlarm() {
  if (!isNative()) return;
  await ensureChannel();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 999_999,
        title: "🔔 اختبار المنبه",
        body: "إذا رأيت هذا الإشعار، فإن نظام التنبيهات يعمل بشكل صحيح.",
        channelId: CHANNEL_ID,
        schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true },
        smallIcon: "ic_stat_icon_config_sample",
      },
    ],
  });
}

export async function vibratePulse() {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    /* noop */
  }
}

/**
 * Handle taps on scheduled notifications (user opens app from a task alarm).
 * Returns an unsubscribe function.
 */
export function onNotificationTap(handler: (taskId: string | null) => void) {
  if (!isNative()) return () => {};
  const handle = LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (event) => {
      const taskId =
        (event.notification.extra as { taskId?: string } | undefined)?.taskId ??
        null;
      handler(taskId);
    },
  );
  return () => {
    void handle.then((h) => h.remove());
  };
}