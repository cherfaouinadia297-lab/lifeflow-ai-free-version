// Standalone localStorage-backed store for the Wake Up module.
// Kept separate from the main app store so this feature can be added
// without touching the existing state shape.

import { useCallback, useEffect, useState } from "react";
import type { CustomRingtone } from "./ringtones-catalog";

const KEY = "lifeflow-wake-v1";

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun

export type ChallengeKind =
  | "none"
  | "math-easy"
  | "math-medium"
  | "math-hard"
  | "shake"
  | "sentence"
  | "memory"
  | "focus";

export interface Alarm {
  id: string;
  label: string;
  time: string; // HH:mm
  days: WeekDay[]; // empty = one-time
  enabled: boolean;
  ringtoneId: string; // builtin id or custom-<uuid>
  vibrate: boolean;
  snoozeMinutes: number; // 0..30
  snoozeMax: number; // number of allowed snoozes
  fadeInSeconds: number; // 0..60
  volume: number; // 0..1
  challenges: ChallengeKind[]; // combined dismissal challenges
  shakeCount: number; // for shake challenge
  sentence: string; // custom sentence to type
  confirmAfterMinutes: 0 | 5 | 10 | 15;
  createdAt: number;
}

export interface WakeHistoryEntry {
  id: string;
  alarmId: string;
  firedAt: number;
  dismissedAt?: number;
  method?: "challenge" | "swipe" | "snooze" | "missed";
  snoozes: number;
  confirmed?: boolean; // wake confirmation received
}

export interface WakeState {
  alarms: Alarm[];
  favorites: string[]; // favorite ringtone ids
  recents: string[]; // most-recently-used ringtone ids (max 8)
  customs: CustomRingtone[];
  history: WakeHistoryEntry[];
  streak: number;
  lastWakeDate: string | null;
  defaults: {
    ringtoneId: string;
    volume: number;
    fadeInSeconds: number;
    vibrate: boolean;
    snoozeMinutes: number;
    snoozeMax: number;
    confirmAfterMinutes: 0 | 5 | 10 | 15;
  };
}

const initial: WakeState = {
  alarms: [],
  favorites: [],
  recents: [],
  customs: [],
  history: [],
  streak: 0,
  lastWakeDate: null,
  defaults: {
    ringtoneId: "clx-morning",
    volume: 0.7,
    fadeInSeconds: 5,
    vibrate: true,
    snoozeMinutes: 9,
    snoozeMax: 3,
    confirmAfterMinutes: 10,
  },
};

function load(): WakeState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<WakeState>;
    return {
      ...initial,
      ...parsed,
      defaults: { ...initial.defaults, ...(parsed.defaults ?? {}) },
      alarms: parsed.alarms ?? [],
      favorites: parsed.favorites ?? [],
      recents: parsed.recents ?? [],
      customs: parsed.customs ?? [],
      history: parsed.history ?? [],
    };
  } catch {
    return initial;
  }
}

// Simple pub/sub so multiple hook consumers stay in sync in the same tab.
const listeners = new Set<() => void>();
let state: WakeState = initial;
let hydrated = false;

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function ensureHydrated() {
  if (hydrated) return;
  state = load();
  hydrated = true;
}

export function useWake() {
  const [, setTick] = useState(0);
  useEffect(() => {
    ensureHydrated();
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    setTick((t) => t + 1);
    return () => { listeners.delete(l); };
  }, []);

  const set = useCallback((updater: (s: WakeState) => WakeState) => {
    ensureHydrated();
    state = updater(state);
    persist();
  }, []);

  return {
    state,
    // Alarms
    addAlarm: (a: Omit<Alarm, "id" | "createdAt">) =>
      set((s) => ({ ...s, alarms: [...s.alarms, { ...a, id: crypto.randomUUID(), createdAt: Date.now() }] })),
    updateAlarm: (id: string, patch: Partial<Alarm>) =>
      set((s) => ({ ...s, alarms: s.alarms.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
    deleteAlarm: (id: string) =>
      set((s) => ({ ...s, alarms: s.alarms.filter((a) => a.id !== id) })),
    toggleAlarm: (id: string) =>
      set((s) => ({ ...s, alarms: s.alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) })),

    // Ringtones
    toggleFavorite: (rid: string) =>
      set((s) => ({
        ...s,
        favorites: s.favorites.includes(rid) ? s.favorites.filter((x) => x !== rid) : [...s.favorites, rid],
      })),
    markRecent: (rid: string) =>
      set((s) => ({
        ...s,
        recents: [rid, ...s.recents.filter((x) => x !== rid)].slice(0, 8),
      })),
    addCustomRingtone: (c: Omit<CustomRingtone, "id" | "addedAt">) =>
      set((s) => ({
        ...s,
        customs: [...s.customs, { ...c, id: `custom-${crypto.randomUUID()}`, addedAt: Date.now() }],
      })),
    renameCustom: (id: string, name: string) =>
      set((s) => ({ ...s, customs: s.customs.map((c) => (c.id === id ? { ...c, name } : c)) })),
    deleteCustom: (id: string) =>
      set((s) => ({
        ...s,
        customs: s.customs.filter((c) => c.id !== id),
        favorites: s.favorites.filter((x) => x !== id),
        recents: s.recents.filter((x) => x !== id),
      })),

    // Defaults
    setDefaults: (patch: Partial<WakeState["defaults"]>) =>
      set((s) => ({ ...s, defaults: { ...s.defaults, ...patch } })),

    // History
    logWake: (entry: Omit<WakeHistoryEntry, "id">) =>
      set((s) => ({ ...s, history: [{ ...entry, id: crypto.randomUUID() }, ...s.history].slice(0, 200) })),
    updateHistory: (id: string, patch: Partial<WakeHistoryEntry>) =>
      set((s) => ({ ...s, history: s.history.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
    bumpStreak: (date: string) =>
      set((s) => {
        if (s.lastWakeDate === date) return s;
        const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const streak = s.lastWakeDate === yest ? s.streak + 1 : 1;
        return { ...s, streak, lastWakeDate: date };
      }),
  };
}