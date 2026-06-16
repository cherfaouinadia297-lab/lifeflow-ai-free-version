import type { Task } from "./types";
import { todayLocal } from "./local-date";

export interface FreeSlot { date: string; start: string; end: string; minutes: number }

function toMin(h: string): number {
  const [a, b] = h.split(":").map(Number);
  return a * 60 + b;
}
function fromMin(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const x = m % 60;
  return `${String(h).padStart(2, "0")}:${String(x).padStart(2, "0")}`;
}

/** Find free slots today between dayStart..dayEnd minutes, given scheduled tasks. */
export function findFreeSlots(
  tasks: Task[],
  date = todayLocal(),
  dayStart = 8 * 60,
  dayEnd = 22 * 60,
  minMinutes = 30,
): FreeSlot[] {
  const busy = tasks
    .filter((t) => t.date === date && !t.completed && t.startTime && t.endTime)
    .map((t) => ({ s: toMin(t.startTime), e: toMin(t.endTime) }))
    .sort((a, b) => a.s - b.s);

  const now = new Date();
  const nowMin = date === todayLocal() ? now.getHours() * 60 + now.getMinutes() : dayStart;
  let cursor = Math.max(dayStart, nowMin);
  const slots: FreeSlot[] = [];
  for (const b of busy) {
    if (b.s - cursor >= minMinutes) {
      slots.push({ date, start: fromMin(cursor), end: fromMin(b.s), minutes: b.s - cursor });
    }
    cursor = Math.max(cursor, b.e);
  }
  if (dayEnd - cursor >= minMinutes) {
    slots.push({ date, start: fromMin(cursor), end: fromMin(dayEnd), minutes: dayEnd - cursor });
  }
  return slots.sort((a, b) => b.minutes - a.minutes);
}

/** Tasks postponed >= N days: incomplete and date < today by threshold. */
export function findProcrastinatedTasks(tasks: Task[], minDays = 3): { task: Task; days: number }[] {
  const today = todayLocal();
  const todayMs = new Date(today).getTime();
  return tasks
    .filter((t) => !t.completed && t.date && t.date < today)
    .map((t) => ({
      task: t,
      days: Math.floor((todayMs - new Date(t.date).getTime()) / 86400000),
    }))
    .filter((x) => x.days >= minDays)
    .sort((a, b) => b.days - a.days);
}
