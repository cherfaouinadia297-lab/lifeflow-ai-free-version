export type CategoryKey =
  | "study"
  | "work"
  | "health"
  | "prayer"
  | "family"
  | "friends"
  | "money"
  | "shopping"
  | "food"
  | "entertainment"
  | "learning"
  | "tech"
  | "projects"
  | "travel"
  | "daily"
  | "reading"
  | "cooking"
  | "sleep"
  | "meeting"
  | "sport";

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
  timer: TimerState;
  prayer: PrayerState;
  weather: WeatherState;
  ringing: RingingState | null;
}

export interface TimerState {
  endsAt: number | null; // epoch ms when timer ends; null = idle
  totalSec: number; // last selected duration in seconds
  pausedRemaining: number | null; // when paused, seconds left
}

export interface PrayerCoords { lat: number; lng: number; city?: string }
export interface PrayerTimings {
  date: string; // YYYY-MM-DD
  hijri?: string;
  timings: Record<string, string>; // Fajr, Dhuhr, Asr, Maghrib, Isha (HH:mm)
  fetchedAt: number;
}
export interface PrayerState {
  coords: PrayerCoords | null;
  method: number; // AlAdhan calculation method (e.g., 2 = ISNA, 3 = MWL, 4 = Umm Al-Qura)
  enabled: Record<string, boolean>; // per-prayer notification toggle
  reminderMinutes: number; // 0,5,10,15,30
  cache: PrayerTimings | null;
}

export interface WeatherCoords { lat: number; lng: number; city?: string }
export interface WeatherCache {
  current: {
    temperature: number;
    apparent: number;
    humidity: number;
    windSpeed: number;
    code: number;
    isDay: boolean;
  };
  daily: Array<{ date: string; min: number; max: number; code: number }>;
  hourly: Array<{ time: string; temp: number; code: number }>;
  fetchedAt: number;
  city?: string;
}
export interface WeatherState {
  coords: WeatherCoords | null;
  cache: WeatherCache | null;
}

export interface RingingState {
  title: string;
  body: string;
  startedAt: number;
}