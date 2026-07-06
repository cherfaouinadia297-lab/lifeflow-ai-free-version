import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AppState,
  Task,
  UserProgress,
  TimerState,
  PrayerState,
  WeatherState,
  RingingState,
  PrayerCoords,
  PrayerTimings,
  WeatherCoords,
  WeatherCache,
} from "./types";
import { getLangMeta } from "./i18n";
import { todayLocal, yesterdayLocal } from "./local-date";

const STORAGE_KEY = "lifeflow-state-v1";

const initialProgress: UserProgress = {
  xp: 0,
  level: 0,
  streak: 0,
  lastActiveDate: null,
  unlockedBadges: [],
};

const initialTimer: TimerState = { endsAt: null, totalSec: 25 * 60, pausedRemaining: null };

const initialPrayer: PrayerState = {
  coords: null,
  method: 2,
  enabled: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
  reminderMinutes: 0,
  cache: null,
  adhanId: "makkah",
  customAdhans: [],
};

const initialWeather: WeatherState = { coords: null, cache: null };

const initialState: AppState = {
  tasks: [],
  progress: initialProgress,
  language: "ar",
  theme: "light",
  ringtone: "classic",
  volume: 0.6,
  timer: initialTimer,
  prayer: initialPrayer,
  weather: initialWeather,
  ringing: null,
};

function loadState(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...initialState,
      ...parsed,
      progress: { ...initialProgress, ...(parsed.progress ?? {}) },
      tasks: parsed.tasks ?? [],
      timer: { ...initialTimer, ...(parsed.timer ?? {}) },
      prayer: { ...initialPrayer, ...(parsed.prayer ?? {}) },
      weather: { ...initialWeather, ...(parsed.weather ?? {}) },
      ringing: null, // never restore a ringing alarm across reloads
    };
  } catch {
    return initialState;
  }
}

export const XP_PER_TASK = 15;
export const XP_PER_LEVEL = 100;

function computeLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL);
}

const BADGES = [
  { id: "first-task", xp: 15 },
  { id: "streak-3", streak: 3 },
  { id: "streak-7", streak: 7 },
  { id: "streak-14", streak: 14 },
  { id: "streak-30", streak: 30 },
  { id: "streak-60", streak: 60 },
  { id: "streak-100", streak: 100 },
  { id: "level-1", level: 1 },
  { id: "level-3", level: 3 },
  { id: "level-5", level: 5 },
  { id: "level-10", level: 10 },
  { id: "level-20", level: 20 },
  { id: "level-50", level: 50 },
  { id: "tasks-10", tasks: 10 },
  { id: "tasks-25", tasks: 25 },
  { id: "tasks-50", tasks: 50 },
  { id: "tasks-100", tasks: 100 },
  { id: "tasks-250", tasks: 250 },
  { id: "tasks-500", tasks: 500 },
  { id: "xp-500", xp: 500 },
  { id: "xp-1000", xp: 1000 },
  { id: "xp-5000", xp: 5000 },
];

function evaluateBadges(progress: UserProgress, completedCount: number): string[] {
  const unlocked = new Set(progress.unlockedBadges);
  for (const b of BADGES) {
    if ("xp" in b && progress.xp >= (b.xp ?? 0)) unlocked.add(b.id);
    if ("streak" in b && progress.streak >= (b.streak ?? 0)) unlocked.add(b.id);
    if ("level" in b && progress.level >= (b.level ?? 0)) unlocked.add(b.id);
    if ("tasks" in b && completedCount >= (b.tasks ?? 0)) unlocked.add(b.id);
  }
  return Array.from(unlocked);
}

interface StoreContext {
  state: AppState;
  addTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  setLanguage: (lang: string) => void;
  setTheme: (t: "light" | "dark" | "system") => void;
  setRingtone: (id: string) => void;
  setVolume: (v: number) => void;
  resetAll: () => void;
  // Timer
  startTimer: (minutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: (minutes?: number) => void;
  finishTimer: () => void;
  // Ringing alarm dialog
  setRinging: (r: RingingState | null) => void;
  // Prayer
  setPrayerCoords: (c: PrayerCoords | null) => void;
  setPrayerMethod: (m: number) => void;
  setPrayerEnabled: (key: string, enabled: boolean) => void;
  setPrayerReminder: (mins: number) => void;
  setPrayerCache: (c: PrayerTimings | null) => void;
  setPrayerAdhan: (id: string) => void;
  addCustomAdhan: (a: { id: string; name: string; url: string }) => void;
  removeCustomAdhan: (id: string) => void;
  // Weather
  setWeatherCoords: (c: WeatherCoords | null) => void;
  setWeatherCache: (c: WeatherCache | null) => void;
}

const Ctx = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  // Apply theme
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const apply = (mode: "light" | "dark") => {
      root.classList.toggle("dark", mode === "dark");
    };
    if (state.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const listener = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
    apply(state.theme);
  }, [state.theme, hydrated]);

  // Apply language / direction
  useEffect(() => {
    if (!hydrated) return;
    const meta = getLangMeta(state.language);
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
  }, [state.language, hydrated]);

  const api = useMemo<StoreContext>(
    () => ({
      state,
      addTask: (t) => {
        setState((s) => ({
          ...s,
          tasks: [
            ...s.tasks,
            {
              ...t,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              completed: false,
            },
          ],
        }));
      },
      updateTask: (id, patch) => {
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
      },
      deleteTask: (id) => {
        setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
      },
      toggleComplete: (id) => {
        setState((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;
          const willComplete = !task.completed;
          const newTasks = s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: willComplete,
                  completedAt: willComplete ? new Date().toISOString() : undefined,
                }
              : t,
          );
          let progress = s.progress;
          if (willComplete) {
            const newXp = progress.xp + XP_PER_TASK;
            const today = todayLocal();
            let streak = progress.streak;
            if (progress.lastActiveDate === today) {
              // same day, keep streak
            } else if (progress.lastActiveDate === yesterdayLocal()) {
              streak += 1;
            } else {
              streak = 1;
            }
            progress = {
              ...progress,
              xp: newXp,
              level: computeLevel(newXp),
              streak,
              lastActiveDate: today,
            };
            const completedCount = newTasks.filter((t) => t.completed).length;
            progress = { ...progress, unlockedBadges: evaluateBadges(progress, completedCount) };
          } else {
            // Un-completing: refund the XP and recompute level. Keep badges already earned.
            const newXp = Math.max(0, progress.xp - XP_PER_TASK);
            progress = {
              ...progress,
              xp: newXp,
              level: computeLevel(newXp),
            };
          }
          return { ...s, tasks: newTasks, progress };
        });
      },
      setLanguage: (lang) => setState((s) => ({ ...s, language: lang })),
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      setRingtone: (id) => setState((s) => ({ ...s, ringtone: id })),
      setVolume: (v) => setState((s) => ({ ...s, volume: Math.max(0, Math.min(1, v)) })),
      resetAll: () => setState(initialState),
      // Timer ---------------------------------------------------------
      startTimer: (minutes) =>
        setState((s) => ({
          ...s,
          timer: {
            endsAt: Date.now() + minutes * 60 * 1000,
            totalSec: minutes * 60,
            pausedRemaining: null,
          },
        })),
      pauseTimer: () =>
        setState((s) => {
          if (!s.timer.endsAt) return s;
          const remaining = Math.max(0, Math.round((s.timer.endsAt - Date.now()) / 1000));
          return { ...s, timer: { ...s.timer, endsAt: null, pausedRemaining: remaining } };
        }),
      resumeTimer: () =>
        setState((s) => {
          if (s.timer.pausedRemaining == null) return s;
          return {
            ...s,
            timer: {
              ...s.timer,
              endsAt: Date.now() + s.timer.pausedRemaining * 1000,
              pausedRemaining: null,
            },
          };
        }),
      resetTimer: (minutes) =>
        setState((s) => ({
          ...s,
          timer: {
            endsAt: null,
            totalSec: (minutes ?? s.timer.totalSec / 60) * 60 || s.timer.totalSec,
            pausedRemaining: null,
          },
        })),
      finishTimer: () =>
        setState((s) => ({ ...s, timer: { ...s.timer, endsAt: null, pausedRemaining: null } })),
      setRinging: (r) => setState((s) => ({ ...s, ringing: r })),
      // Prayer --------------------------------------------------------
      setPrayerCoords: (c) => setState((s) => ({ ...s, prayer: { ...s.prayer, coords: c } })),
      setPrayerMethod: (m) => setState((s) => ({ ...s, prayer: { ...s.prayer, method: m } })),
      setPrayerEnabled: (key, enabled) =>
        setState((s) => ({
          ...s,
          prayer: { ...s.prayer, enabled: { ...s.prayer.enabled, [key]: enabled } },
        })),
      setPrayerReminder: (mins) =>
        setState((s) => ({ ...s, prayer: { ...s.prayer, reminderMinutes: mins } })),
      setPrayerCache: (c) => setState((s) => ({ ...s, prayer: { ...s.prayer, cache: c } })),
      setPrayerAdhan: (id) =>
        setState((s) => ({ ...s, prayer: { ...s.prayer, adhanId: id } })),
      addCustomAdhan: (a) =>
        setState((s) => ({
          ...s,
          prayer: {
            ...s.prayer,
            customAdhans: [...(s.prayer.customAdhans ?? []).filter((c) => c.id !== a.id), a],
          },
        })),
      removeCustomAdhan: (id) =>
        setState((s) => ({
          ...s,
          prayer: {
            ...s.prayer,
            customAdhans: (s.prayer.customAdhans ?? []).filter((c) => c.id !== id),
          },
        })),
      // Weather -------------------------------------------------------
      setWeatherCoords: (c) => setState((s) => ({ ...s, weather: { ...s.weather, coords: c } })),
      setWeatherCache: (c) => setState((s) => ({ ...s, weather: { ...s.weather, cache: c } })),
    }),
    [state],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { BADGES };