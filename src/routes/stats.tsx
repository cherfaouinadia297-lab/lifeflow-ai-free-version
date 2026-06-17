import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Trophy, Flame, Target, Sparkles, Award, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, BADGES, XP_PER_LEVEL } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "الإحصائيات — LifeFlow AI" },
      { name: "description", content: "تابع تقدّمك، نقاط XP، وسلسلة الالتزام." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { state } = useStore();
  const tasks = state.tasks;
  const totalCompleted = tasks.filter((t) => t.completed).length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => !t.completed && t.date < todayIso).length;

  // Last 7 days completion %
  const weekData = useMemo(() => {
    const arr: { day: string; pct: number; done: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayTasks = tasks.filter((t) => t.date === iso);
      const done = dayTasks.filter((t) => t.completed).length;
      const pct = dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0;
      arr.push({
        day: d.toLocaleDateString("ar-EG", { weekday: "short" }),
        pct,
        done,
        total: dayTasks.length,
      });
    }
    return arr;
  }, [tasks]);

  // Last 30 days XP trend
  const xpData = useMemo(() => {
    const arr: { day: string; xp: number }[] = [];
    let cumulative = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      cumulative += tasks.filter((t) => t.completed && (t.completedAt ?? "").slice(0, 10) === iso).length * 15;
      arr.push({ day: `${d.getDate()}/${d.getMonth() + 1}`, xp: cumulative });
    }
    return arr;
  }, [tasks]);

  // Category distribution
  const catData = useMemo(() => {
    return CATEGORIES.map((c) => ({
      name: c.labelKey,
      value: tasks.filter((t) => t.category === c.key && t.completed).length,
      color: c.color,
    })).filter((d) => d.value > 0);
  }, [tasks]);

  const xpInLevel = state.progress.xp % XP_PER_LEVEL;
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  const hasData = tasks.length > 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">الإحصائيات</h1>
          <p className="text-sm text-muted-foreground">تابع تقدّمك واحتفِ بكل خطوة.</p>
        </div>

        {/* Key stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<Trophy className="h-5 w-5" />} label="المستوى" value={state.progress.level} accent />
          <KpiCard icon={<Sparkles className="h-5 w-5" />} label="نقاط XP" value={state.progress.xp} />
          <KpiCard icon={<Flame className="h-5 w-5" />} label="أيام متتالية" value={state.progress.streak} />
          <KpiCard icon={<Target className="h-5 w-5" />} label="مهام مكتملة" value={totalCompleted} />
        </div>

        {/* Level progress */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">التقدّم نحو المستوى {state.progress.level + 1}</div>
              <div className="font-display text-lg font-bold">{xpInLevel} / {XP_PER_LEVEL} XP</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {overdue > 0 && <span className="text-destructive">{overdue} مهمة متأخرة</span>}
            </div>
          </div>
          <Progress value={xpPct} className="h-2" />
        </div>

        {!hasData && <EmptyState />}

        {/* Weekly completion */}
        <ChartCard title="نسبة الإنجاز خلال آخر 7 أيام">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                formatter={(v: number) => [`${v}%`, "الإنجاز"]}
              />
              <Bar dataKey="pct" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* XP trend */}
        <ChartCard title="تطوّر نقاط XP خلال 30 يوم">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={xpData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
              />
              <Line type="monotone" dataKey="xp" stroke="var(--color-gold)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category split */}
        {catData.length > 0 && (
          <ChartCard title="توزيع المهام المكتملة حسب التصنيف">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {catData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Badges */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-gold" />
            <h2 className="font-display text-lg font-bold">الأوسمة</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BADGES.map((b) => {
              const unlocked = state.progress.unlockedBadges.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    unlocked
                      ? "border-gold/40 bg-gradient-gold/10 shadow-soft"
                      : "border-dashed border-border bg-secondary/40 opacity-60"
                  }`}
                >
                  <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${unlocked ? "bg-gradient-gold text-gold-foreground" : "bg-muted text-muted-foreground"}`}>
                    {unlocked ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div className="mt-2 text-xs font-bold">{badgeLabel(b.id)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="font-display mb-4 text-base font-bold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-soft ${
        accent ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-card text-foreground"
      }`}
    >
      <div className={`flex items-center justify-between ${accent ? "" : "text-muted-foreground"}`}>
        <span className="text-xs">{label}</span>
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${accent ? "bg-white/20" : "bg-secondary"}`}>{icon}</div>
      </div>
      <div className="font-display mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-primary" />
      <p className="mt-2 font-display text-base font-bold">ابدأ بإكمال أنشطتك لرؤية تقدمك وإحصائياتك</p>
      <p className="mt-1 text-sm text-muted-foreground">
        كل نشاط تكمله يضيف نقاط XP ويُحدّث رسومك البيانية.
      </p>
    </div>
  );
}

function badgeLabel(id: string): string {
  switch (id) {
    case "first-task": return "أول إنجاز";
    case "streak-3": return "3 أيام متتالية";
    case "streak-7": return "أسبوع متواصل";
    case "level-1": return "المستوى 1";
    case "level-5": return "المستوى 5";
    case "tasks-25": return "25 مهمة";
    case "tasks-100": return "100 مهمة";
    default: return id;
  }
}