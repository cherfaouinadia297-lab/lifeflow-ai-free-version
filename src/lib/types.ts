export type CategoryKey =
  | "study"
  | "work"
  | "sport"
  | "prayer"
  | "reading"
  | "cooking"
  | "sleep"
  | "meeting";

export type RepeatKind = "none" | "daily" | "weekly";

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: CategoryKey;
  color: string; // hex
  repeat: RepeatKind;
  completed: boolean;
  completedAt?: string; // ISO
  createdAt: string; // ISO
  notified?: boolean;
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  unlockedBadges: string[];
}

export interface AppState {
  tasks: Task[];
  progress: UserProgress;
  language: string;
  theme: "light" | "dark" | "system";
  ringtone: string;
  volume: number;
}