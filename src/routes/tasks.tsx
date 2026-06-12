import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES } from "@/lib/categories";
import { useStore } from "@/lib/store";
import type { CategoryKey, Task } from "@/lib/types";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "كل المهام — LifeFlow AI" },
      { name: "description", content: "تصفّح وأدر جميع مهامك في مكان واحد." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [cat, setCat] = useState<"all" | CategoryKey>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const items = useMemo(() => {
    return state.tasks
      .filter((t) => (filter === "all" ? true : filter === "done" ? t.completed : !t.completed))
      .filter((t) => (cat === "all" ? true : t.category === cat))
      .filter((t) => (query ? t.title.includes(query) || (t.description ?? "").includes(query) : true))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [state.tasks, filter, cat, query]);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">كل المهام</h1>
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

        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في المهام..."
              className="pe-10"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="active">قيد التنفيذ</TabsTrigger>
                <TabsTrigger value="done">مكتملة</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={cat === "all"} onClick={() => setCat("all")}>
                جميع التصنيفات
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.key}
                  active={cat === c.key}
                  onClick={() => setCat(c.key)}
                  color={c.color}
                >
                  {c.labelAr}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            لا توجد مهام تطابق التصفية.
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((t) => (
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
      </div>

      <TaskDialog open={open} onOpenChange={setOpen} task={editing} />
    </AppShell>
  );
}

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-foreground text-background"
          : "border border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
      style={active && color ? { backgroundColor: color, color: "#fff", borderColor: color } : undefined}
    >
      {children}
    </button>
  );
}