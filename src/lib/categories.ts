import type { CategoryKey } from "./types";
import {
  BookOpen,
  Briefcase,
  Dumbbell,
  Moon,
  ChefHat,
  Users,
  Sparkles,
  GraduationCap,
  Heart,
  UserCircle2,
  Wallet,
  ShoppingCart,
  Utensils,
  Gamepad2,
  Lightbulb,
  Laptop,
  Rocket,
  Plane,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  key: CategoryKey;
  /** i18n key for the translated label, e.g. "cat.study". */
  labelKey: string;
  /** Visual emoji for quick scanning (works alongside the icon). */
  emoji: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "study",         labelKey: "cat.study",         emoji: "📚", color: "#2E8B8B", icon: GraduationCap },
  { key: "work",          labelKey: "cat.work",          emoji: "💼", color: "#3D5AFE", icon: Briefcase },
  { key: "health",        labelKey: "cat.health",        emoji: "🏃", color: "#E5533C", icon: Dumbbell },
  { key: "prayer",        labelKey: "cat.prayer",        emoji: "🕌", color: "#7C5BC8", icon: Sparkles },
  { key: "family",        labelKey: "cat.family",        emoji: "👨‍👩‍👧", color: "#E08A4D", icon: Heart },
  { key: "friends",       labelKey: "cat.friends",       emoji: "👥", color: "#3FB7B0", icon: UserCircle2 },
  { key: "money",         labelKey: "cat.money",         emoji: "💰", color: "#2BA875", icon: Wallet },
  { key: "shopping",      labelKey: "cat.shopping",      emoji: "🛒", color: "#C44CA8", icon: ShoppingCart },
  { key: "food",          labelKey: "cat.food",          emoji: "🍔", color: "#D04A6A", icon: Utensils },
  { key: "entertainment", labelKey: "cat.entertainment", emoji: "🎮", color: "#8B5CF6", icon: Gamepad2 },
  { key: "learning",      labelKey: "cat.learning",      emoji: "📖", color: "#C98A2B", icon: Lightbulb },
  { key: "tech",          labelKey: "cat.tech",          emoji: "💻", color: "#0EA5E9", icon: Laptop },
  { key: "projects",      labelKey: "cat.projects",      emoji: "🚀", color: "#F97316", icon: Rocket },
  { key: "travel",        labelKey: "cat.travel",        emoji: "✈️", color: "#06B6D4", icon: Plane },
  { key: "daily",         labelKey: "cat.daily",         emoji: "📝", color: "#64748B", icon: ListChecks },
  // Legacy keys kept so existing tasks keep their styling
  { key: "reading", labelKey: "cat.reading", emoji: "📖", color: "#C98A2B", icon: BookOpen },
  { key: "cooking", labelKey: "cat.cooking", emoji: "🍳", color: "#D04A6A", icon: ChefHat },
  { key: "sleep",   labelKey: "cat.sleep",   emoji: "🌙", color: "#5470A3", icon: Moon },
  { key: "meeting", labelKey: "cat.meeting", emoji: "🤝", color: "#2BA875", icon: Users },
  { key: "sport",   labelKey: "cat.sport",   emoji: "🏋️", color: "#E5533C", icon: Dumbbell },
];

export function getCategory(key: CategoryKey): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

/** Categories shown in the picker — excludes the legacy aliases. */
export const PRIMARY_CATEGORIES = CATEGORIES.slice(0, 15);

export const SUGGESTIONS: Record<CategoryKey, { titleAr: string; tipsAr: string[] }> = {
  study: {
    titleAr: "نصائح للدراسة الفعّالة",
    tipsAr: [
      "استخدم تقنية بومودورو: 25 دقيقة تركيز ثم 5 دقائق راحة.",
      "اكتب الملاحظات بيدك لتحسين الاستيعاب طويل المدى.",
      "ابدأ بأصعب موضوع عندما يكون تركيزك في أعلى مستوياته.",
      "أغلق إشعارات الهاتف وابتعد عن المشتتات.",
    ],
  },
  work: {
    titleAr: "نصائح للإنتاجية في العمل",
    tipsAr: [
      "حدّد أهم 3 مهام لليوم وابدأ بها.",
      "خصّص فترات تركيز عميق بدون اجتماعات.",
      "خذ استراحة كل 90 دقيقة لتجنّب الإرهاق الذهني.",
    ],
  },
  sport: {
    titleAr: "نصائح للرياضة",
    tipsAr: [
      "ابدأ بإحماء 5 دقائق لتجنّب الإصابات.",
      "اشرب الماء قبل وأثناء وبعد التمرين.",
      "30 دقيقة يوميًا أفضل من ساعتين مرة في الأسبوع.",
    ],
  },
  prayer: {
    titleAr: "تذكير روحاني",
    tipsAr: [
      "خذ دقائق من الخشوع قبل البدء.",
      "اجعل الصلاة في وقتها أولوية على كل شيء.",
      "أتبعها بأذكار قصيرة لراحة القلب.",
    ],
  },
  reading: {
    titleAr: "نصائح للقراءة",
    tipsAr: [
      "ابدأ بهدف صغير: 10 صفحات يوميًا.",
      "دوّن فكرة واحدة على الأقل من كل جلسة قراءة.",
      "اقرأ في مكان هادئ وبإضاءة جيدة.",
    ],
  },
  cooking: {
    titleAr: "نصائح للطبخ",
    tipsAr: [
      "حضّر المكوّنات كلها قبل البدء (Mise en place).",
      "اقرأ الوصفة كاملة قبل التنفيذ.",
      "نظّف أثناء العمل لتسهيل النهاية.",
    ],
  },
  sleep: {
    titleAr: "نصائح للنوم العميق",
    tipsAr: [
      "تجنّب الشاشات قبل ساعة من النوم.",
      "نم واستيقظ في الوقت نفسه كل يوم.",
      "اجعل غرفتك مظلمة وباردة قدر الإمكان.",
    ],
  },
  meeting: {
    titleAr: "نصائح للاجتماعات الفعّالة",
    tipsAr: [
      "حدّد أجندة واضحة وأرسلها مسبقًا.",
      "اجعل مدّة الاجتماع 25 أو 50 دقيقة بدل 30 و60.",
      "اختم باتفاق واضح على المهام التالية.",
    ],
  },
};