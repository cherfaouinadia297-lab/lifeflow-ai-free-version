// Curated Adhan library. All hosted on islamcan.com (a well-known free
// public directory of adhan MP3s). Users can also import their own audio
// file (blob URL) or paste any custom URL — stored per-user in the
// prayer store as `customAdhans`.

export interface AdhanEntry {
  id: string;
  name: string; // human name, will be shown as-is
  reciter?: string;
  url: string;
  short?: boolean; // shorter adhan (e.g. muezzin only)
  fajr?: boolean; // suitable for Fajr (contains "as-salatu khayrun min an-nawm")
}

// NOTE: these are direct MP3 URLs from islamcan.com's public /audio/adhan/
// index. They are widely used across islamic apps as free-to-stream adhans.
// If a URL fails to load at runtime the UI silently falls back to the
// browser's default audio behaviour and a toast is shown.
export const ADHAN_LIBRARY: AdhanEntry[] = [
  { id: "makkah",        name: "أذان مكة المكرمة",           reciter: "الحرم المكي",       url: "https://www.islamcan.com/audio/adhan/azan2.mp3" },
  { id: "madinah",       name: "أذان المدينة المنورة",       reciter: "الحرم النبوي",       url: "https://www.islamcan.com/audio/adhan/azan1.mp3" },
  { id: "al-aqsa",       name: "أذان المسجد الأقصى",         reciter: "المسجد الأقصى",      url: "https://www.islamcan.com/audio/adhan/azan16.mp3" },
  { id: "mishary",       name: "أذان الشيخ مشاري العفاسي",   reciter: "مشاري راشد العفاسي", url: "https://www.islamcan.com/audio/adhan/azan5.mp3" },
  { id: "ali-mullah",    name: "أذان الشيخ علي ملا",         reciter: "علي أحمد ملا",       url: "https://www.islamcan.com/audio/adhan/azan9.mp3" },
  { id: "abdul-basit",   name: "أذان الشيخ عبد الباسط",      reciter: "عبد الباسط عبد الصمد", url: "https://www.islamcan.com/audio/adhan/azan8.mp3" },
  { id: "maher",         name: "أذان الشيخ ماهر المعيقلي",   reciter: "ماهر المعيقلي",      url: "https://www.islamcan.com/audio/adhan/azan6.mp3" },
  { id: "saad-ghamdi",   name: "أذان الشيخ سعد الغامدي",     reciter: "سعد الغامدي",         url: "https://www.islamcan.com/audio/adhan/azan13.mp3" },
  { id: "naqshbandi",    name: "أذان النقشبندي",             reciter: "النقشبندي",          url: "https://www.islamcan.com/audio/adhan/azan11.mp3" },
  { id: "turkish",       name: "أذان تركي كلاسيكي",          reciter: "Türkiye",            url: "https://www.islamcan.com/audio/adhan/azan10.mp3" },
  { id: "child",         name: "أذان بصوت طفل",              reciter: "طفل",                url: "https://www.islamcan.com/audio/adhan/azan15.mp3" },
  { id: "fajr-1",        name: "أذان الفجر (مع الصلاة خير من النوم)", reciter: "أذان الفجر", url: "https://www.islamcan.com/audio/adhan/azan3.mp3", fajr: true },
  { id: "fajr-madinah",  name: "أذان فجر المدينة المنورة",   reciter: "الحرم النبوي",       url: "https://www.islamcan.com/audio/adhan/azan14.mp3", fajr: true },
  { id: "short",         name: "أذان قصير",                   reciter: "مختصر",              url: "https://www.islamcan.com/audio/adhan/azan12.mp3", short: true },
  { id: "beep",          name: "تنبيه بسيط (بدون أذان)",     reciter: "System",             url: "" }, // empty = use fallback beep synth
];

export const DEFAULT_ADHAN_ID = "makkah";

export function resolveAdhan(
  id: string | undefined,
  customs: Array<{ id: string; name: string; url: string }> | undefined,
): AdhanEntry | null {
  if (!id) return ADHAN_LIBRARY.find((a) => a.id === DEFAULT_ADHAN_ID) ?? null;
  const custom = customs?.find((c) => c.id === id);
  if (custom) return { id: custom.id, name: custom.name, url: custom.url };
  return ADHAN_LIBRARY.find((a) => a.id === id) ?? null;
}

/** Beautiful looping background videos per prayer time.
 *  All from mixkit.co's free CDN (CC0-like license, no auth required).
 *  If any URL fails, the UI falls back to an animated CSS gradient.
 */
export const PRAYER_BACKGROUNDS: Record<string, string> = {
  Fajr:    "https://assets.mixkit.co/videos/preview/mixkit-dawn-light-over-the-mountains-and-fog-4067-large.mp4",
  Sunrise: "https://assets.mixkit.co/videos/preview/mixkit-golden-clouds-over-a-mountain-at-sunset-4067-large.mp4",
  Dhuhr:   "https://assets.mixkit.co/videos/preview/mixkit-white-clouds-rolling-fast-2408-large.mp4",
  Asr:     "https://assets.mixkit.co/videos/preview/mixkit-desert-landscape-4038-large.mp4",
  Maghrib: "https://assets.mixkit.co/videos/preview/mixkit-sunset-behind-the-clouds-1234-large.mp4",
  Isha:    "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4",
};

export function backgroundGradient(prayer: string): string {
  // Fallback CSS gradients per prayer.
  switch (prayer) {
    case "Fajr":    return "linear-gradient(160deg,#0b1d3a 0%,#2b3f6b 45%,#f2b26b 100%)";
    case "Sunrise": return "linear-gradient(160deg,#f6b26b 0%,#f37f4b 55%,#8b3d2c 100%)";
    case "Dhuhr":   return "linear-gradient(160deg,#1f8fbf 0%,#4fc3e0 55%,#a8e6ff 100%)";
    case "Asr":     return "linear-gradient(160deg,#c88a3a 0%,#8c5b25 60%,#3d2a15 100%)";
    case "Maghrib": return "linear-gradient(160deg,#4b1e4a 0%,#a8395b 50%,#f2b26b 100%)";
    case "Isha":    return "linear-gradient(160deg,#04081a 0%,#0e1a3d 55%,#2b1a5c 100%)";
    default:        return "linear-gradient(160deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)";
  }
}