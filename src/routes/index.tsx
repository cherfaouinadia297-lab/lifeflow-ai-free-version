import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Sparkles, Target, Trophy, Flame, Lightbulb, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStore, XP_PER_LEVEL } from "@/lib/store";
import { ensureNotificationPermission } from "@/lib/notifications";
import type { Task } from "@/lib/types";
import { todayLocal } from "@/lib/local-date";
import { t, getLangMeta } from "@/lib/i18n";
import { findFreeSlots, findProcrastinatedTasks } from "@/lib/planner";

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
  const lang = state.language;
  const tr = (k: string) => t(lang, k);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const todayStr = todayLocal();
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

  const freeSlots = useMemo(() => findFreeSlots(state.tasks).slice(0, 3), [state.tasks]);
  const procrastinated = useMemo(() => findProcrastinatedTasks(state.tasks).slice(0, 5), [state.tasks]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return tr("goodMorning");
    if (h < 18) return tr("goodAfternoon");
    return tr("goodEvening");
  })();

  const dateLabel = new Date().toLocaleDateString(getLangMeta(lang).locale, {
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
                ? tr("startDayHint")
                : `لديك ${todayTasks.length} نشاط اليوم، أكملت منها ${completed}.`}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatChip icon={<Target className="h-4 w-4" />} label={tr("todayProgress")} value={`${completionPct}%`} />
              <StatChip icon={<Trophy className="h-4 w-4" />} label={tr("level")} value={state.progress.level} />
              <StatChip icon={<Flame className="h-4 w-4" />} label={tr("streak")} value={state.progress.streak} />
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
                {tr("newActivity")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => void ensureNotificationPermission()}
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                {tr("enableNotifications")}
              </Button>
            </div>
          </div>
        </section>

        {/* XP card */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{tr("progressToNextLevel")}</div>
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

        {/* Smart Planner suggestion */}
        {freeSlots.length > 0 && (
          <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display text-base font-bold">{tr("smartPlanner")}</div>
                <div className="text-xs text-muted-foreground">{tr("smartPlannerHint")}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {freeSlots.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setEditing(null); setOpen(true); }}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary"
                >
                  <span className="font-mono tabular-nums">{s.start} – {s.end}</span>
                  <span className="ms-2 text-muted-foreground">({Math.floor(s.minutes / 60)}h{s.minutes % 60 ? ` ${s.minutes % 60}m` : ""})</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Procrastination */}
        {procrastinated.length > 0 && (
          <section className="rounded-2xl border border-amber-400/30 bg-amber-50/50 p-5 shadow-soft dark:bg-amber-950/20">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500 text-white">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display text-base font-bold">{tr("procrastinationTitle")}</div>
                <div className="text-xs text-muted-foreground">{tr("procrastinationHint")}</div>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm">
              {procrastinated.map(({ task, days }) => (
                <li key={task.id} className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
                  <span className="truncate">{task.title}</span>
                  <span className="shrink-0 text-xs text-amber-700 dark:text-amber-400">+{days}d</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Today list */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-foreground">{tr("todaySchedule")}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="me-1 h-4 w-4" />
              {tr("add")}
            </Button>
          </div>

          {todayTasks.length === 0 ? (
            <EmptyState onAdd={() => setOpen(true)} lang={lang} />
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

function EmptyState({ onAdd, lang }: { onAdd: () => void; lang: string }) {
  const tr = (k: string) => t(lang, k);
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="font-display mt-4 text-lg font-bold">{tr("startFirstActivity")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tr("addFirstActivityHint")}</p>
      <Button onClick={onAdd} className="mt-4 bg-gradient-primary">
        <Plus className="me-1 h-4 w-4" />
        {tr("addActivity")}
      </Button>
    </div>
  );
}
