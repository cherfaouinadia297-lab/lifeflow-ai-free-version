import type { PrayerTimings } from "./types";

export interface AlAdhanResponse {
  data: {
    timings: Record<string, string>;
    date: {
      readable: string;
      hijri: { date: string; month: { en: string; ar: string }; year: string };
      gregorian: { date: string };
    };
  };
}

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  method = 2,
  date = new Date(),
): Promise<PrayerTimings> {
  const d = date;
  const path = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  // School=0 (Shafi/standard) is the default. iso8601=false returns local HH:mm in the
  // location's own timezone, which is what we display. Cache-bust with a daily token.
  const url = `https://api.aladhan.com/v1/timings/${path}?latitude=${lat}&longitude=${lng}&method=${method}&school=0&iso8601=false`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("prayer_fetch_failed");
  const json = (await res.json()) as AlAdhanResponse;
  const t = json.data.timings;
  // Normalize to HH:mm (strip any timezone suffix like " (EET)")
  const clean = (s: string) => s.slice(0, 5);
  const timings: Record<string, string> = {
    Fajr: clean(t.Fajr),
    Sunrise: clean(t.Sunrise),
    Dhuhr: clean(t.Dhuhr),
    Asr: clean(t.Asr),
    Maghrib: clean(t.Maghrib),
    Isha: clean(t.Isha),
  };
  const hijri = `${json.data.date.hijri.date} ${json.data.date.hijri.month.ar} ${json.data.date.hijri.year}`;
  return {
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    hijri,
    timings,
    fetchedAt: Date.now(),
  };
}

export const PRAYER_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export const PRAYER_LABELS_AR: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

export const CALC_METHODS: { id: number; label: string }[] = [
  { id: 2, label: "ISNA (أمريكا الشمالية)" },
  { id: 3, label: "MWL (رابطة العالم الإسلامي)" },
  { id: 4, label: "أم القرى (السعودية)" },
  { id: 5, label: "الهيئة المصرية" },
  { id: 1, label: "الكراتشي" },
  { id: 8, label: "قطر" },
  { id: 9, label: "الكويت" },
  { id: 10, label: "ماليزيا (JAKIM)" },
  { id: 12, label: "اتحاد الإفتاء (UOIF)" },
  { id: 13, label: "ديانة (تركيا)" },
];

/** Returns next upcoming prayer name + HH:mm + ms remaining. */
export function nextPrayer(
  timings: Record<string, string>,
  now = new Date(),
): { key: string; time: string; remainingMs: number } | null {
  for (const key of PRAYER_KEYS) {
    const hhmm = timings[key];
    if (!hhmm) continue;
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    if (d.getTime() > now.getTime()) {
      return { key, time: hhmm, remainingMs: d.getTime() - now.getTime() };
    }
  }
  // All passed — next is tomorrow's Fajr
  const fajr = timings.Fajr;
  if (!fajr) return null;
  const [h, m] = fajr.split(":").map(Number);
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  return { key: "Fajr", time: fajr, remainingMs: d.getTime() - now.getTime() };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lng}&language=ar&format=json`,
    );
    if (!res.ok) return undefined;
    const j = (await res.json()) as { results?: { name: string; country?: string }[] };
    const r = j.results?.[0];
    return r ? `${r.name}${r.country ? `، ${r.country}` : ""}` : undefined;
  } catch {
    return undefined;
  }
}

export async function geocodeCity(
  name: string,
): Promise<{ lat: number; lng: number; city: string } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=ar`,
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      results?: { latitude: number; longitude: number; name: string; country?: string }[];
    };
    const r = j.results?.[0];
    if (!r) return null;
    return {
      lat: r.latitude,
      lng: r.longitude,
      city: `${r.name}${r.country ? `، ${r.country}` : ""}`,
    };
  } catch {
    return null;
  }
}