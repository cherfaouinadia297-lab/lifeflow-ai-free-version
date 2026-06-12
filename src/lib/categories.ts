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
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  key: CategoryKey;
  labelAr: string;
  labelEn: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "study", labelAr: "الدراسة", labelEn: "Study", color: "#2E8B8B", icon: GraduationCap },
  { key: "work", labelAr: "العمل", labelEn: "Work", color: "#3D5AFE", icon: Briefcase },
  { key: "sport", labelAr: "الرياضة", labelEn: "Sport", color: "#E5533C", icon: Dumbbell },
  { key: "prayer", labelAr: "الصلاة", labelEn: "Prayer", color: "#7C5BC8", icon: Sparkles },
  { key: "reading", labelAr: "القراءة", labelEn: "Reading", color: "#C98A2B", icon: BookOpen },
  { key: "cooking", labelAr: "الطبخ", labelEn: "Cooking", color: "#D04A6A", icon: ChefHat },
  { key: "sleep", labelAr: "النوم", labelEn: "Sleep", color: "#5470A3", icon: Moon },
  { key: "meeting", labelAr: "الاجتماعات", labelEn: "Meetings", color: "#2BA875", icon: Users },
];

export function getCategory(key: CategoryKey): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

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