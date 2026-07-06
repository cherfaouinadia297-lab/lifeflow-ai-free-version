import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { RingtoneLibrary, findRingtoneName } from "@/components/RingtoneLibrary";
import { useWake, type Alarm, type ChallengeKind, type WeekDay } from "@/lib/wake-store";
import { useStore } from "@/lib/store";
import { t as tr } from "@/lib/i18n";
import { toast } from "sonner";
import {
  AlarmClock, Music2, Bell, Brain, Bot, Sparkles, ListChecks, BarChart3,
  Plus, Trash2, Vibrate, Clock, Volume2, Check, X, Timer,
} from "lucide-react";

export const Route = createFileRoute("/wake")({
  head: () => ({
    meta: [
      { title: "Wake Up — LifeFlow AI" },
      { name: "description", content: "Alarms, wake challenges, ringtone library, and AI wake assistant." },
    ],
  }),
  component: WakeHubPage,
});

type TabId = "alarms" | "ringtones" | "challenges" | "confirm" | "assistant" | "integrations" | "stats";

const TABS: { id: TabId; labelKey: string; icon: React.ElementType }[] = [
  { id: "alarms", labelKey: "wake.tab.alarms", icon: AlarmClock },
  { id: "ringtones", labelKey: "wake.tab.ringtones", icon: Music2 },
  { id: "challenges", labelKey: "wake.tab.challenges", icon: Brain },
  { id: "confirm", labelKey: "wake.tab.confirm", icon: Bell },
  { id: "assistant", labelKey: "wake.tab.assistant", icon: Bot },
  { id: "integrations", labelKey: "wake.tab.integrations", icon: ListChecks },
  { id: "stats", labelKey: "wake.tab.stats", icon: BarChart3 },
];

function useT() {
  const { state } = useStore();
  return (k: string, v?: Record<string, string | number>) => tr(state.language, k, v);
}

function WakeHubPage() {
  const [tab, setTab] = useState<TabId>("alarms");
  const t = useT();
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t("wake.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("wake.subtitle")}</p>
          </div>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab_) => {
            const Icon = tab_.icon;
            const active = tab === tab_.id;
            return (
              <button
                key={tab_.id}
                onClick={() => setTab(tab_.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "border-transparent bg-gradient-primary text-primary-foreground shadow-soft"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(tab_.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          {tab === "alarms" && <AlarmsTab />}
          {tab === "ringtones" && <RingtonesTab />}
          {tab === "challenges" && <ChallengesTab />}
          {tab === "confirm" && <ConfirmTab />}
          {tab === "assistant" && <AssistantTab />}
          {tab === "integrations" && <IntegrationsTab />}
          {tab === "stats" && <StatsTab />}
        </div>
      </div>
    </AppShell>
  );
}

// ------------------ Alarms ------------------
const DAY_KEYS = [
  "wake.day.sun", "wake.day.mon", "wake.day.tue", "wake.day.wed",
  "wake.day.thu", "wake.day.fri", "wake.day.sat",
];

function AlarmsTab() {
  const wake = useWake();
  const t = useT();
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{t("wake.alarms.your")}</h2>
        <Button className="bg-gradient-primary" onClick={() => setCreating(true)}>
          <Plus className="me-1 h-4 w-4" /> {t("wake.alarms.new")}
        </Button>
      </div>

      {wake.state.alarms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <AlarmClock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("wake.alarms.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {wake.state.alarms
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-display text-2xl font-bold ${a.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {a.time}
                    </span>
                    {a.label && <span className="truncate text-sm text-muted-foreground">· {a.label}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{a.days.length === 0 ? t("wake.alarms.oneTime") : a.days.map((d) => t(DAY_KEYS[d])).join(" ")}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Music2 className="h-3 w-3" />{findRingtoneName(a.ringtoneId, wake.state.customs)}</span>
                    {a.vibrate && <span className="flex items-center gap-1"><Vibrate className="h-3 w-3" /> {t("wake.alarms.vibrate")}</span>}
                    {a.challenges.filter((c) => c !== "none").length > 0 && (
                      <span className="flex items-center gap-1"><Brain className="h-3 w-3" /> {t(a.challenges.length === 1 ? "wake.alarms.challenges" : "wake.alarms.challengesPlural", { n: a.challenges.length })}</span>
                    )}
                  </div>
                </div>
                <Switch checked={a.enabled} onCheckedChange={() => wake.toggleAlarm(a.id)} />
                <Button variant="outline" size="sm" onClick={() => setEditing(a)}>{t("wake.alarms.edit")}</Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { if (confirm(t("wake.alarms.deleteConfirm"))) wake.deleteAlarm(a.id); }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
        </div>
      )}

      {(creating || editing) && (
        <AlarmDialog
          alarm={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function AlarmDialog({ alarm, onClose }: { alarm: Alarm | null; onClose: () => void }) {
  const wake = useWake();
  const t = useT();
  const d = wake.state.defaults;
  const [form, setForm] = useState<Omit<Alarm, "id" | "createdAt">>({
    label: alarm?.label ?? "",
    time: alarm?.time ?? "07:00",
    days: alarm?.days ?? [],
    enabled: alarm?.enabled ?? true,
    ringtoneId: alarm?.ringtoneId ?? d.ringtoneId,
    vibrate: alarm?.vibrate ?? d.vibrate,
    snoozeMinutes: alarm?.snoozeMinutes ?? d.snoozeMinutes,
    snoozeMax: alarm?.snoozeMax ?? d.snoozeMax,
    fadeInSeconds: alarm?.fadeInSeconds ?? d.fadeInSeconds,
    volume: alarm?.volume ?? d.volume,
    challenges: alarm?.challenges ?? ["none"],
    shakeCount: alarm?.shakeCount ?? 20,
    sentence: alarm?.sentence ?? t("wake.defaultSentence"),
    confirmAfterMinutes: alarm?.confirmAfterMinutes ?? d.confirmAfterMinutes,
  });
  const [showRingtones, setShowRingtones] = useState(false);

  const toggleDay = (day: WeekDay) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((x) => x !== day) : [...f.days, day].sort() as WeekDay[],
    }));
  };
  const toggleChallenge = (c: Exclude<ChallengeKind, "none">) => {
    setForm((f) => {
      const set = new Set(f.challenges.filter((x) => x !== "none"));
      if (set.has(c)) set.delete(c); else set.add(c);
      return { ...f, challenges: set.size === 0 ? ["none"] : Array.from(set) };
    });
  };

  const save = () => {
    if (alarm) wake.updateAlarm(alarm.id, form);
    else wake.addAlarm(form);
    toast.success(alarm ? t("wake.alarms.updated") : t("wake.alarms.created"));
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{alarm ? t("wake.dialog.editTitle") : t("wake.dialog.newTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t("wake.field.time")}</Label>
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div>
            <Label>{t("wake.field.label")}</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder={t("wake.field.labelPlaceholder")} />
          </div>
          <div>
            <Label>{t("wake.field.repeat")}</Label>
            <div className="mt-2 flex gap-1">
              {DAY_KEYS.map((k, i) => {
                const active = form.days.includes(i as WeekDay);
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i as WeekDay)}
                    className={`h-9 w-9 rounded-full text-sm font-semibold transition-all ${
                      active ? "bg-gradient-primary text-primary-foreground shadow-soft" : "border border-border bg-background text-muted-foreground hover:border-primary"
                    }`}
                  >{t(k)}</button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {form.days.length === 0 ? t("wake.field.oneTime") : t("wake.field.repeatWeekly")}
            </p>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{t("wake.field.ringtone")}</div>
                <div className="text-xs text-muted-foreground">{findRingtoneName(form.ringtoneId, wake.state.customs)}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowRingtones((v) => !v)}>
                {showRingtones ? t("wake.field.close") : t("wake.field.change")}
              </Button>
            </div>
            {showRingtones && (
              <div className="mt-3">
                <RingtoneLibrary
                  selectedId={form.ringtoneId}
                  onSelect={(id) => setForm({ ...form, ringtoneId: id })}
                  volume={form.volume}
                  compact
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div className="flex items-center gap-2"><Vibrate className="h-4 w-4" /><span className="text-sm">{t("wake.field.vibrate")}</span></div>
            <Switch checked={form.vibrate} onCheckedChange={(v) => setForm({ ...form, vibrate: v })} />
          </div>

          <div className="rounded-xl border border-border p-3">
            <Label className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> {t("wake.field.volume")} — {Math.round(form.volume * 100)}%</Label>
            <Slider className="mt-3" value={[form.volume * 100]} max={100} step={5} onValueChange={(v) => setForm({ ...form, volume: (v[0] ?? 60) / 100 })} />
          </div>

          <div className="rounded-xl border border-border p-3">
            <Label className="flex items-center gap-2"><Timer className="h-4 w-4" /> {t("wake.field.fadeIn")} — {form.fadeInSeconds}s</Label>
            <Slider className="mt-3" value={[form.fadeInSeconds]} max={60} step={5} onValueChange={(v) => setForm({ ...form, fadeInSeconds: v[0] ?? 0 })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> {t("wake.field.snoozeMin")} — {form.snoozeMinutes} {t("common.minutes")}</Label>
              <Slider className="mt-3" value={[form.snoozeMinutes]} max={30} step={1} onValueChange={(v) => setForm({ ...form, snoozeMinutes: v[0] ?? 0 })} />
            </div>
            <div className="rounded-xl border border-border p-3">
              <Label>{t("wake.field.snoozeMax")} — {form.snoozeMax}</Label>
              <Slider className="mt-3" value={[form.snoozeMax]} max={10} step={1} onValueChange={(v) => setForm({ ...form, snoozeMax: v[0] ?? 0 })} />
            </div>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center gap-2"><Brain className="h-4 w-4" /><span className="text-sm font-semibold">{t("wake.field.challenges")}</span></div>
            <p className="mb-3 text-xs text-muted-foreground">{t("wake.field.challengesHint")}</p>
            <div className="flex flex-wrap gap-2">
              {(["math-easy","math-medium","math-hard","shake","sentence","memory","focus"] as Exclude<ChallengeKind, "none">[]).map((c) => {
                const active = form.challenges.includes(c);
                return (
                  <button key={c} onClick={() => toggleChallenge(c)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      active ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary"
                    }`}>{t(`wake.challenge.${c}`)}</button>
                );
              })}
            </div>
            {form.challenges.includes("shake") && (
              <div className="mt-3">
                <Label>{t("wake.field.shakeCount")} — {form.shakeCount}</Label>
                <Slider className="mt-2" value={[form.shakeCount]} max={50} step={5} onValueChange={(v) => setForm({ ...form, shakeCount: v[0] ?? 20 })} />
              </div>
            )}
            {form.challenges.includes("sentence") && (
              <div className="mt-3">
                <Label>{t("wake.field.sentence")}</Label>
                <Input className="mt-1" value={form.sentence} onChange={(e) => setForm({ ...form, sentence: e.target.value })} />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-3">
            <Label>{t("wake.field.confirmDelay")}</Label>
            <div className="mt-2 flex gap-2">
              {[0, 5, 10, 15].map((m) => (
                <button key={m} onClick={() => setForm({ ...form, confirmAfterMinutes: m as 0|5|10|15 })}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                    form.confirmAfterMinutes === m ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary"
                  }`}>{m === 0 ? t("wake.field.off") : `${m} ${t("common.minutes")}`}</button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button className="bg-gradient-primary" onClick={save}><Check className="me-1 h-4 w-4" /> {t("wake.saveAlarm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------ Ringtones tab ------------------
function RingtonesTab() {
  const wake = useWake();
  const t = useT();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">{t("wake.ringtones.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("wake.ringtones.hint")}</p>
      </div>
      <RingtoneLibrary
        selectedId={wake.state.defaults.ringtoneId}
        onSelect={(id) => { wake.setDefaults({ ringtoneId: id }); toast.success(t("wake.ringtones.updated")); }}
        volume={wake.state.defaults.volume}
      />
    </div>
  );
}

// ------------------ Challenges tab ------------------
function ChallengesTab() {
  const t = useT();
  const [mode, setMode] = useState<"math-easy" | "math-medium" | "math-hard" | "sentence" | "memory">("math-medium");
  const sentence = useT()("wake.defaultSentence");
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">{t("wake.challenges.tryTitle")}</h2>
      <p className="text-sm text-muted-foreground">{t("wake.challenges.tryHint")}</p>
      <div className="flex flex-wrap gap-2">
        {(["math-easy", "math-medium", "math-hard", "sentence", "memory"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              mode === m ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary"
            }`}>{t(`wake.challenge.${m}`)}</button>
        ))}
      </div>
      <div className="rounded-xl border border-border p-5">
        {mode.startsWith("math") && <MathChallenge difficulty={mode as "math-easy" | "math-medium" | "math-hard"} />}
        {mode === "sentence" && <SentenceChallenge target={sentence} />}
        {mode === "memory" && <MemoryChallenge />}
      </div>
    </div>
  );
}

function MathChallenge({ difficulty }: { difficulty: "math-easy" | "math-medium" | "math-hard" }) {
  const t = useT();
  const problem = useMemo(() => genMath(difficulty), [difficulty]);
  const [answer, setAnswer] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div>
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("wake.challenges.solve")}</div>
        <div className="mt-2 font-display text-4xl font-bold">{problem.q}</div>
      </div>
      <div className="mt-4 flex gap-2">
        <Input inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={t("wake.challenges.answer")} />
        <Button className="bg-gradient-primary" onClick={() => {
          if (Number(answer) === problem.a) { setDone(true); toast.success(t("wake.challenges.correct")); }
          else toast.error(t("wake.challenges.wrong"));
        }}>{t("wake.challenges.check")}</Button>
      </div>
      {done && <div className="mt-3 flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> {t("wake.challenges.complete")}</div>}
    </div>
  );
}
function genMath(diff: "math-easy" | "math-medium" | "math-hard") {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  if (diff === "math-easy") { const a = rand(1, 20), b = rand(1, 20); return { q: `${a} + ${b} = ?`, a: a + b }; }
  if (diff === "math-medium") { const a = rand(11, 30), b = rand(11, 30); return { q: `${a} × ${b} = ?`, a: a * b }; }
  const a = rand(21, 40), b = rand(11, 20), c = rand(2, 9);
  return { q: `(${a} × ${b}) − ${a * c} = ?`, a: a * b - a * c };
}

function SentenceChallenge({ target }: { target: string }) {
  const t = useT();
  const [text, setText] = useState("");
  const done = text.trim() === target.trim();
  return (
    <div>
      <div className="text-xs text-muted-foreground">{t("wake.challenges.typeExact")}</div>
      <div className="mt-1 rounded-lg bg-secondary p-3 font-mono text-sm">{target}</div>
      <Input className="mt-3" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("wake.challenges.typeHere")} />
      {done && <div className="mt-2 flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> {t("wake.challenges.perfect")}</div>}
    </div>
  );
}

function MemoryChallenge() {
  const t = useT();
  const [seq] = useState(() => Array.from({ length: 4 }, () => Math.floor(Math.random() * 4)));
  const [shown, setShown] = useState(true);
  const [input, setInput] = useState<number[]>([]);
  const done = input.length === seq.length && input.every((v, i) => v === seq[i]);
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">{t("wake.challenges.pattern")}</div>
      <div className="mt-3 flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <button key={i}
            className={`h-14 w-14 rounded-xl border transition-all ${
              shown && seq.includes(i) ? "border-primary bg-primary/20" : "border-border bg-background"
            } ${input.includes(i) ? "ring-2 ring-primary" : ""}`}
            onClick={() => setInput([...input, i])}
          >{i + 1}</button>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setShown((s) => !s)}>{shown ? t("wake.challenges.hide") : t("wake.challenges.show")}</Button>
        <Button size="sm" variant="outline" onClick={() => setInput([])}>{t("wake.challenges.reset")}</Button>
      </div>
      {done && <div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> {t("wake.challenges.correctShort")}</div>}
    </div>
  );
}

// ------------------ Confirmation tab ------------------
function ConfirmTab() {
  const wake = useWake();
  const t = useT();
  const d = wake.state.defaults;
  const confirmations = wake.state.history.filter((h) => h.confirmed !== undefined);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">{t("wake.confirm.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("wake.confirm.hint")}</p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <Label>{t("wake.confirm.default")}</Label>
        <div className="mt-2 flex gap-2">
          {[0, 5, 10, 15].map((m) => (
            <button key={m} onClick={() => wake.setDefaults({ confirmAfterMinutes: m as 0|5|10|15 })}
              className={`rounded-lg border px-3 py-1 text-sm font-medium ${
                d.confirmAfterMinutes === m ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary"
              }`}>{m === 0 ? t("wake.field.off") : `${m} ${t("common.minutes")}`}</button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">{t("wake.confirm.recent")}</h3>
        {confirmations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("wake.confirm.empty")}
          </div>
        ) : (
          <div className="space-y-2">
            {confirmations.slice(0, 10).map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <div>{new Date(h.firedAt).toLocaleString()}</div>
                {h.confirmed ? (
                  <span className="flex items-center gap-1 text-primary"><Check className="h-4 w-4" /> {t("wake.confirm.confirmed")}</span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive"><X className="h-4 w-4" /> {t("wake.confirm.missed")}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------ Assistant tab ------------------
function AssistantTab() {
  const wake = useWake();
  const t = useT();
  const insights = useMemo(() => {
    const alarms = wake.state.alarms.filter((a) => a.enabled);
    const history = wake.state.history;
    const avgSnoozes = history.length
      ? (history.reduce((s, h) => s + (h.snoozes ?? 0), 0) / history.length).toFixed(1)
      : "0";
    const successRate = history.length
      ? Math.round((history.filter((h) => h.method === "challenge" || h.method === "swipe").length / history.length) * 100)
      : 0;
    const suggestions: string[] = [];
    if (Number(avgSnoozes) > 2) suggestions.push(t("wake.assistant.snoozeAdvice"));
    if (successRate < 60 && history.length) suggestions.push(t("wake.assistant.louderAdvice"));
    if (alarms.length === 0) suggestions.push(t("wake.assistant.noAlarms"));
    if (wake.state.streak >= 3) suggestions.push(t("wake.assistant.streakGood", { n: wake.state.streak }));
    if (suggestions.length === 0) suggestions.push(t("wake.assistant.healthy"));
    return { avgSnoozes, successRate, suggestions };
  }, [wake.state, t]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">{t("wake.assistant.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("wake.assistant.hint")}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label={t("wake.assistant.success")} value={`${insights.successRate}%`} />
        <Kpi label={t("wake.assistant.avgSnoozes")} value={insights.avgSnoozes} />
        <Kpi label={t("wake.assistant.streak")} value={t("wake.assistant.streakDays", { n: wake.state.streak })} />
      </div>
      <div className="space-y-2">
        {insights.suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

// ------------------ Integrations tab ------------------
function IntegrationsTab() {
  const { state: appState, toggleComplete } = useStore();
  const t = useT();
  const today = new Date().toISOString().slice(0, 10);
  const todaysTasks = appState.tasks.filter((t) => t.date === today);
  const overdue = appState.tasks.filter((t) => !t.completed && t.date < today);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">{t("wake.integrations.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("wake.integrations.hint")}</p>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <h3 className="mb-2 font-semibold">{t("wake.integrations.today")}</h3>
        {todaysTasks.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t("wake.integrations.noTasks")}</div>
        ) : (
          <div className="space-y-1">
            {todaysTasks.slice(0, 5).map((t) => (
              <label key={t.id} className="flex items-center gap-2 rounded-lg p-2 hover:bg-secondary">
                <input type="checkbox" checked={t.completed} onChange={() => toggleComplete(t.id)} />
                <span className="text-xs font-mono text-muted-foreground">{t.startTime}</span>
                <span className={`flex-1 text-sm ${t.completed ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {overdue.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <h3 className="mb-2 font-semibold text-destructive">{t("wake.integrations.overdue", { n: overdue.length })}</h3>
          <div className="space-y-1">
            {overdue.slice(0, 3).map((t) => (
              <div key={t.id} className="text-sm">· {t.title} <span className="text-xs text-muted-foreground">({t.date})</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------ Stats tab ------------------
function StatsTab() {
  const wake = useWake();
  const t = useT();
  const history = wake.state.history;
  const successRate = history.length
    ? Math.round((history.filter((h) => h.method === "challenge" || h.method === "swipe").length / history.length) * 100)
    : 0;
  const avgSnoozes = history.length
    ? (history.reduce((s, h) => s + (h.snoozes ?? 0), 0) / history.length).toFixed(1)
    : "0";
  const avgTime = useMemo(() => {
    if (!history.length) return "—";
    const times = history.map((h) => {
      const d = new Date(h.firedAt);
      return d.getHours() * 60 + d.getMinutes();
    });
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    return `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}`;
  }, [history]);

  const byMethod = history.reduce<Record<string, number>>((acc, h) => {
    const k = h.method ?? "unknown"; acc[k] = (acc[k] ?? 0) + 1; return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">{t("wake.stats.title")}</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label={t("wake.stats.successRate")} value={`${successRate}%`} />
        <Kpi label={t("wake.stats.avgTime")} value={avgTime} />
        <Kpi label={t("wake.assistant.avgSnoozes")} value={avgSnoozes} />
        <Kpi label={t("wake.assistant.streak")} value={t("wake.assistant.streakDays", { n: wake.state.streak })} />
      </div>
      <div className="rounded-xl border border-border p-4">
        <h3 className="mb-3 font-semibold">{t("wake.stats.dismissals")}</h3>
        {Object.keys(byMethod).length === 0 ? (
          <div className="text-sm text-muted-foreground">{t("wake.stats.noData")}</div>
        ) : (
          <div className="space-y-2">
            {Object.entries(byMethod).map(([k, v]) => {
              const pct = Math.round((v / history.length) * 100);
              return (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-xs"><span>{k}</span><span>{v} · {pct}%</span></div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// keep Dialog imports referenced (some paths not used in prod tree-shake)
void DialogTrigger;
