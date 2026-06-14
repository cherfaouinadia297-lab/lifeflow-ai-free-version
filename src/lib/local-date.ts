/** Local-time date helpers (avoid UTC drift from toISOString). */
export function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayLocal(): string {
  return toLocalISO(new Date());
}

export function yesterdayLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalISO(d);
}