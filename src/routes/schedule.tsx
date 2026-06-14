import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { getCategory } from "@/lib/categories";
import type { Task } from "@/lib/types";
import { toLocalISO } from "@/lib/local-date";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "الجدول — LifeFlow AI" },
      { name: "description", content: "اعرض جدولك يوميًا أو أسبوعيًا أو شهريًا." },
    ],
  }),
  component: SchedulePage,
});

type View = "day" | "week" | "month";

const toISO = toLocalISO;

function SchedulePage() {
  const { state } = useStore();
  const [view, setView] = useState<View>("day");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const shift = (delta: number) => {
    const d = new Date(cursor);
    if (view === "day") d.setDate(d.getDate() + delta);
    if (view === "week") d.setDate(d.getDate() + delta * 7);
    if (view === "month") d.setMonth(d.getMonth() + delta);
    setCursor(d);
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">الجدول</h1>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="bg-gradient-primary"
          >
            <Plus className="me-1 h-4 w-4" />
            نشاط جديد
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="day">يومي</TabsTrigger>
              <TabsTrigger value="week">أسبوعي</TabsTrigger>
              <TabsTrigger value="month">شهري</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => shift(-1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              اليوم
            </Button>
            <Button variant="ghost" size="icon" onClick={() => shift(1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {view === "day" && (
          <DayView
            date={cursor}
            onEdit={(t) => {
              setEditing(t);
              setOpen(true);
            }}
          />
        )}
        {view === "week" && (
          <WeekView
            date={cursor}
            onEdit={(t) => {
              setEditing(t);
              setOpen(true);
            }}
          />
        )}
        {view === "month" && (
          <MonthView date={cursor} onPickDay={(d) => { setCursor(d); setView("day"); }} />
        )}
      </div>

      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        task={editing}
        defaultDate={toISO(cursor)}
      />
    </AppShell>
  );

  function DayView({ date, onEdit }: { date: Date; onEdit: (t: Task) => void }) {
    const iso = toISO(date);
    const items = state.tasks
      .filter((t) => t.date === iso)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const label = date.toLocaleDateString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div>
        <div className="mb-3 font-display text-lg text-foreground">{label}</div>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            لا توجد أنشطة في هذا اليوم.
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={onEdit} />
            ))}
          </div>
        )}
      </div>
    );
  }

  function WeekView({ date, onEdit }: { date: Date; onEdit: (t: Task) => void }) {
    // Start week on Saturday (Arabic)
    const start = new Date(date);
    const day = start.getDay(); // 0 sun..6 sat
    const diff = (day - 6 + 7) % 7;
    start.setDate(start.getDate() - diff);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
        {days.map((d) => {
          const iso = toISO(d);
          const items = state.tasks
            .filter((t) => t.date === iso)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const isToday = iso === toISO(new Date());
          return (
            <div
              key={iso}
              className={`rounded-2xl border bg-card p-3 shadow-soft ${
                isToday ? "border-primary" : "border-border"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="font-display text-sm font-bold text-foreground">
                  {d.toLocaleDateString("ar-EG", { weekday: "short" })}
                </div>
                <div
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                    isToday
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
              <div className="space-y-1.5">
                {items.length === 0 && (
                  <div className="rounded-md border border-dashed border-border p-2 text-center text-[11px] text-muted-foreground">
                    لا أنشطة
                  </div>
                )}
                {items.slice(0, 4).map((t) => {
                  const meta = getCategory(t.category);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onEdit(t)}
                      className="w-full truncate rounded-md px-2 py-1.5 text-start text-[11px] font-medium"
                      style={{ backgroundColor: `${meta.color}1F`, color: meta.color }}
                    >
                      {t.startTime} {t.title}
                    </button>
                  );
                })}
                {items.length > 4 && (
                  <div className="text-center text-[11px] text-muted-foreground">
                    + {items.length - 4} أخرى
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function MonthView({ date, onPickDay }: { date: Date; onPickDay: (d: Date) => void }) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() - 6 + 7) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const monthLabel = date.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
    const todayIso = toISO(new Date());
    const weekdays = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
    return (
      <div>
        <div className="mb-3 font-display text-lg text-foreground">{monthLabel}</div>
        <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
          <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
            {weekdays.map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = toISO(d);
              const dayTasks = state.tasks.filter((t) => t.date === iso);
              const isToday = iso === todayIso;
              return (
                <button
                  key={iso}
                  onClick={() => onPickDay(d)}
                  className={`group relative aspect-square rounded-xl border p-1.5 text-start transition-all hover:border-primary ${
                    isToday ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <div className="font-display text-sm font-bold text-foreground">
                    {d.getDate()}
                  </div>
                  <div className="absolute inset-x-1.5 bottom-1.5 flex flex-wrap gap-0.5">
                    {dayTasks.slice(0, 4).map((t) => (
                      <span
                        key={t.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: getCategory(t.category).color }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}