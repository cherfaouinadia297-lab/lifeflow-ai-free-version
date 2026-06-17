import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Mic, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRIMARY_CATEGORIES as CATEGORIES } from "@/lib/categories";
import { makeI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { CategoryKey, Task } from "@/lib/types";
import { t, getLangMeta } from "@/lib/i18n";
import { isVoiceSupported, listenOnce } from "@/lib/voice";
import { parseTaskFromText } from "@/lib/assistant.functions";
import { todayLocal } from "@/lib/local-date";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const { state, addTask } = useStore();
  const lang = state.language;
  const tr = (k: string) => t(lang, k);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [cat, setCat] = useState<"all" | CategoryKey>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [parsing, setParsing] = useState(false);

  const items = useMemo(() => {
    return state.tasks
      .filter((t) => (filter === "all" ? true : filter === "done" ? t.completed : !t.completed))
      .filter((t) => (cat === "all" ? true : t.category === cat))
      .filter((t) => (query ? t.title.includes(query) || (t.description ?? "").includes(query) : true))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [state.tasks, filter, cat, query]);

  const startVoice = () => {
    if (!isVoiceSupported()) {
      toast.error(tr("voiceUnsupported"));
      return;
    }
    setVoiceOpen(true);
    setVoiceText("");
    setListening(true);
    listenOnce(
      getLangMeta(lang).locale,
      (text) => setVoiceText(text),
      () => toast.error(tr("voiceUnsupported")),
      () => setListening(false),
    );
  };

  const confirmVoice = async () => {
    if (!voiceText.trim()) return;
    setParsing(true);
    try {
      const draft = await parseTaskFromText({
        data: { text: voiceText.trim(), todayISO: todayLocal(), language: lang },
      });
      const catObj = CATEGORIES.find((c) => c.key === draft.category) ?? CATEGORIES[0];
      addTask({
        title: draft.title,
        date: draft.date,
        startTime: draft.startTime,
        endTime: draft.endTime,
        category: catObj.key as CategoryKey,
        color: catObj.color,
        repeat: "none",
      });
      setVoiceOpen(false);
      toast.success(draft.title);
    } catch {
      toast.error("AI error");
    } finally {
      setParsing(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">{tr("allTasks")}</h1>
          <div className="flex gap-2">
            <Button onClick={startVoice} variant="outline">
              <Mic className="me-1 h-4 w-4" />
              {tr("voiceAddTask")}
            </Button>
            <Button
              onClick={() => { setEditing(null); setOpen(true); }}
              className="bg-gradient-primary"
            >
              <Plus className="me-1 h-4 w-4" />
              {tr("newActivity")}
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("searchTasks")}
              className="pe-10"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">{tr("all")}</TabsTrigger>
                <TabsTrigger value="active">{tr("active")}</TabsTrigger>
                <TabsTrigger value="done">{tr("done")}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={cat === "all"} onClick={() => setCat("all")}>
                {tr("allCategories")}
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.key}
                  active={cat === c.key}
                  onClick={() => setCat(c.key)}
                  color={c.color}
                >
                  {c.emoji} {t(lang, c.labelKey)}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {tr("noTasksMatch")}
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

      <Dialog open={voiceOpen} onOpenChange={(v) => { if (!v) setVoiceOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Mic className={`h-5 w-5 ${listening ? "animate-pulse text-primary" : ""}`} />
              {tr("voiceAddTask")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">{tr("voiceHint")}</p>
          <div className="min-h-[60px] rounded-xl border border-border bg-secondary/50 p-3 text-sm">
            {listening ? (
              <span className="text-muted-foreground">{tr("listening")}</span>
            ) : (
              voiceText || <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVoiceOpen(false)}>{tr("cancel")}</Button>
            <Button onClick={startVoice} variant="secondary" disabled={listening}>
              <Mic className="me-1 h-4 w-4" />
              {tr("listening").replace("...", "")}
            </Button>
            <Button
              className="bg-gradient-primary"
              onClick={() => void confirmVoice()}
              disabled={!voiceText || listening || parsing}
            >
              {parsing ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Plus className="me-1 h-4 w-4" />}
              {tr("add")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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