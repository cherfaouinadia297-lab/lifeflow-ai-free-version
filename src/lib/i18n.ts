export interface LangMeta {
  code: string;
  label: string;
  dir: "ltr" | "rtl";
  locale: string;
}

export const LANGUAGES: LangMeta[] = [
  { code: "ar", label: "العربية", dir: "rtl", locale: "ar-EG" },
  { code: "en", label: "English", dir: "ltr", locale: "en-US" },
  { code: "fr", label: "Français", dir: "ltr", locale: "fr-FR" },
  { code: "es", label: "Español", dir: "ltr", locale: "es-ES" },
  { code: "de", label: "Deutsch", dir: "ltr", locale: "de-DE" },
  { code: "it", label: "Italiano", dir: "ltr", locale: "it-IT" },
  { code: "pt", label: "Português", dir: "ltr", locale: "pt-BR" },
  { code: "tr", label: "Türkçe", dir: "ltr", locale: "tr-TR" },
  { code: "ru", label: "Русский", dir: "ltr", locale: "ru-RU" },
  { code: "zh", label: "中文", dir: "ltr", locale: "zh-CN" },
  { code: "ja", label: "日本語", dir: "ltr", locale: "ja-JP" },
  { code: "ko", label: "한국어", dir: "ltr", locale: "ko-KR" },
  { code: "hi", label: "हिन्दी", dir: "ltr", locale: "hi-IN" },
  { code: "id", label: "Bahasa Indonesia", dir: "ltr", locale: "id-ID" },
  { code: "ur", label: "اردو", dir: "rtl", locale: "ur-PK" },
  { code: "fa", label: "فارسی", dir: "rtl", locale: "fa-IR" },
  { code: "he", label: "עברית", dir: "rtl", locale: "he-IL" },
];

export function getLangMeta(code: string): LangMeta {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

type Dict = Record<string, string>;

const STRINGS: Record<string, Dict> = {
  ar: {
    assistant: "المساعد",
    timer: "الموقت",
    settings: "الإعدادات",
    ringtone: "نغمة التنبيه",
    test: "اختبار",
    duration: "المدة (دقائق)",
    start: "ابدأ",
    pause: "إيقاف مؤقت",
    resume: "استئناف",
    reset: "إعادة",
    timerDone: "انتهى الوقت!",
    chatPlaceholder: "اكتب رسالتك للمساعد...",
    send: "إرسال",
    assistantHello: "مرحبًا! أنا مساعدك الذكي في LifeFlow. كيف أساعدك اليوم؟",
    language: "اللغة",
    volume: "مستوى الصوت",
  },
  en: {
    assistant: "Assistant",
    timer: "Timer",
    settings: "Settings",
    ringtone: "Ringtone",
    test: "Test",
    duration: "Duration (minutes)",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    timerDone: "Time's up!",
    chatPlaceholder: "Type your message...",
    send: "Send",
    assistantHello: "Hi! I'm your LifeFlow AI assistant. How can I help today?",
    language: "Language",
    volume: "Volume",
  },
};

export function t(lang: string, key: keyof typeof STRINGS["ar"]): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}