import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Sparkles, Target, Trophy, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStore, XP_PER_LEVEL } from "@/lib/store";
import { ensureNotificationPermission } from "@/lib/notifications";
import type { Task } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "اليوم — LifeFlow AI" },
      { name: "description", content: "ملخّص يومك ومهامك في مكان واحد." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = useMemo(
    () =>
      state.tasks
        .filter((t) => t.date === todayStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [state.tasks, todayStr],
  );

  const completed = todayTasks.filter((t) => t.completed).length;
  const completionPct = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;
  const xpProgress = state.progress.xp % XP_PER_LEVEL;
  const xpPct = Math.round((xpProgress / XP_PER_LEVEL) * 100);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "صباح الخير ☀️";
    if (h < 18) return "نهارك سعيد";
    return "مساء الخير 🌙";
  })();

  const dateLabel = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-white shadow-elegant sm:p-8">
          <div className="absolute -end-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -start-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <p className="text-sm text-white/80">{dateLabel}</p>
            <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl">{greeting}</h1>
            <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">
              {todayTasks.length === 0
                ? "ابدأ يومك بإضافة أول نشاط — كل خطوة تُبنى عليها العادة."
                : `لديك ${todayTasks.length} نشاط اليوم، أكملت منها ${completed}.`}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatChip icon={<Target className="h-4 w-4" />} label="إنجاز اليوم" value={`${completionPct}%`} />
              <StatChip icon={<Trophy className="h-4 w-4" />} label="المستوى" value={state.progress.level} />
              <StatChip icon={<Flame className="h-4 w-4" />} label="أيام متتالية" value={state.progress.streak} />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                  void ensureNotificationPermission();
                }}
                className="bg-white text-primary hover:bg-white/90"
              >
                <Plus className="me-1 h-4 w-4" />
                نشاط جديد
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => void ensureNotificationPermission()}
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                تفعيل الإشعارات
              </Button>
            </div>
          </div>
        </section>

        {/* XP card */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">التقدّم نحو المستوى التالي</div>
              <div className="font-display mt-1 text-lg font-bold text-foreground">
                {xpProgress} / {XP_PER_LEVEL} XP
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <Progress value={xpPct} className="mt-3 h-2" />
        </section>

        {/* Today list */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-foreground">جدول اليوم</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="me-1 h-4 w-4" />
              إضافة
            </Button>
          </div>

          {todayTasks.length === 0 ? (
            <EmptyState onAdd={() => setOpen(true)} />
          ) : (
            <div className="grid gap-3">
              {todayTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onEdit={(task) => {
                    setEditing(task);
                    setOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <TaskDialog open={open} onOpenChange={setOpen} task={editing} defaultDate={todayStr} />
    </AppShell>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">{icon}</div>
      <div className="leading-tight">
        <div className="text-[11px] text-white/75">{label}</div>
        <div className="font-display text-lg font-bold">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="font-display mt-4 text-lg font-bold">ابدأ يومك بنشاط واحد</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        أضف أول نشاط لترى تقدّمك وتُفعّل سلسلة الالتزام.
      </p>
      <Button onClick={onAdd} className="mt-4 bg-gradient-primary">
        <Plus className="me-1 h-4 w-4" />
        أضف نشاط
      </Button>
    </div>
  );
}
