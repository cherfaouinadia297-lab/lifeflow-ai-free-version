import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppState, Task, UserProgress } from "./types";

const STORAGE_KEY = "lifeflow-state-v1";

const initialProgress: UserProgress = {
  xp: 0,
  level: 0,
  streak: 0,
  lastActiveDate: null,
  unlockedBadges: [],
};

const initialState: AppState = {
  tasks: [],
  progress: initialProgress,
  language: "ar",
  theme: "light",
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
  { id: "level-1", level: 1 },
  { id: "level-5", level: 5 },
  { id: "tasks-25", tasks: 25 },
  { id: "tasks-100", tasks: 100 },
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

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

interface StoreContext {
  state: AppState;
  addTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  setLanguage: (lang: "ar" | "en") => void;
  setTheme: (t: "light" | "dark" | "system") => void;
  resetAll: () => void;
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
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
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
            const today = todayStr();
            let streak = progress.streak;
            if (progress.lastActiveDate === today) {
              // same day, keep streak
            } else if (progress.lastActiveDate === yesterdayStr()) {
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
          }
          return { ...s, tasks: newTasks, progress };
        });
      },
      setLanguage: (lang) => setState((s) => ({ ...s, language: lang })),
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      resetAll: () => setState(initialState),
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