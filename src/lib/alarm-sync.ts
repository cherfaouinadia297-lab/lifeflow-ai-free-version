import { Capacitor, registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { AppState, Task } from "./types";
import type { Alarm, WakeState } from "./wake-store";
import { PRAYER_LABELS_AR } from "./prayer";

export interface NativeAlarmItem {
  id: string;
  kind: "task" | "wake" | "prayer";
  title: string;
  body: string;
  enabled: boolean;
  epochMillis?: number;
  time?: string;
  days?: number[];
  snoozeMinutes?: number;
}

export interface NativeAlarmDiagnostics {
  sdk?: number;
  manufacturer?: string;
  model?: string;
  notifications: boolean;
  exactAlarm: boolean;
  batteryOptimized: boolean;
  storedAlarms: number;
  pendingAlarms: number;
  bootReceiver: boolean;
  foregroundService: boolean;
  wakeLock: boolean;
  fullScreenIntent: boolean;
  channel: boolean;
  oemGuide: string;
}

interface LifeFlowAlarmsPlugin {
  sync(options: { alarms: NativeAlarmItem[] }): Promise<{ stored: number; pending: number }>;
  diagnostics(): Promise<NativeAlarmDiagnostics>;
  openExactAlarmSettings(): Promise<void>;
  openBatterySettings(): Promise<void>;
  openAppSettings(): Promise<void>;
}

export const LifeFlowAlarms = registerPlugin<LifeFlowAlarmsPlugin>("LifeFlowAlarms");

export const isNativeAndroid = () => Capacitor.getPlatform() === "android";

function dateTimeMs(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime();
}

export function buildNativeAlarmItems(app: AppState, wake: WakeState): NativeAlarmItem[] {
  const now = Date.now();
  const tasks: NativeAlarmItem[] = app.tasks
    .filter((t: Task) => !t.completed && !t.notified && t.date && t.startTime)
    .map((t) => ({
      id: `task:${t.id}`,
      kind: "task" as const,
      title: t.title,
      body: t.description || `حان موعد النشاط (${t.startTime})`,
      enabled: dateTimeMs(t.date, t.startTime) > now,
      epochMillis: dateTimeMs(t.date, t.startTime),
    }))
    .filter((a) => a.enabled);

  const wakeAlarms: NativeAlarmItem[] = wake.alarms.map((a: Alarm) => ({
    id: `wake:${a.id}`,
    kind: "wake" as const,
    title: a.label || "Wake Up",
    body: `⏰ ${a.time}`,
    enabled: a.enabled,
    time: a.time,
    days: a.days,
    snoozeMinutes: a.snoozeMinutes,
  }));

  const prayer = app.prayer;
  const prayerAlarms: NativeAlarmItem[] = [];
  if (prayer.cache) {
    for (const [key, time] of Object.entries(prayer.cache.timings)) {
      if (key === "Sunrise" || prayer.enabled[key] === false) continue;
      const at = dateTimeMs(prayer.cache.date, time) - prayer.reminderMinutes * 60_000;
      if (at <= now) continue;
      const label = PRAYER_LABELS_AR[key] ?? key;
      prayerAlarms.push({
        id: `prayer:${prayer.cache.date}:${key}`,
        kind: "prayer",
        title: `🕌 حان موعد صلاة ${label}`,
        body: `${prayer.coords?.city ?? "LifeFlow AI"} · ${time}`,
        enabled: true,
        epochMillis: at,
      });
    }
  }

  return [...tasks, ...wakeAlarms, ...prayerAlarms];
}

export async function syncAllNativeAlarms(app: AppState, wake: WakeState) {
  if (!isNativeAndroid()) return;
  const alarms = buildNativeAlarmItems(app, wake);
  try {
    await LifeFlowAlarms.sync({ alarms });
  } catch {
    // Fallback for older builds that only have Capacitor LocalNotifications.
    const dated = alarms.filter((a) => a.epochMillis && a.epochMillis > Date.now());
    await LocalNotifications.schedule({
      notifications: dated.map((a, i) => ({
        id: Math.abs(hash(a.id)) + i,
        title: a.title,
        body: a.body,
        channelId: "lifeflow-alarms",
        schedule: { at: new Date(a.epochMillis!), allowWhileIdle: true },
        ongoing: true,
        autoCancel: false,
        extra: { kind: a.kind, id: a.id },
      })),
    });
  }
}

export async function getAlarmDiagnostics(): Promise<NativeAlarmDiagnostics> {
  if (!isNativeAndroid()) {
    const permission = typeof Notification !== "undefined" ? Notification.permission : "denied";
    return {
      notifications: permission === "granted",
      exactAlarm: false,
      batteryOptimized: true,
      storedAlarms: 0,
      pendingAlarms: 0,
      bootReceiver: false,
      foregroundService: false,
      wakeLock: false,
      fullScreenIntent: false,
      channel: false,
      oemGuide: "تشخيص النظام الأصلي يظهر داخل تطبيق Android فقط.",
    };
  }
  return LifeFlowAlarms.diagnostics();
}

export const openExactAlarmSettings = () => LifeFlowAlarms.openExactAlarmSettings();
export const openBatterySettings = () => LifeFlowAlarms.openBatterySettings();
export const openAppSettings = () => LifeFlowAlarms.openAppSettings();

function hash(s: string) {
  let h = 17;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}