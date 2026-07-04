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

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "alarms", label: "Alarms", icon: AlarmClock },
  { id: "ringtones", label: "Ringtones", icon: Music2 },
  { id: "challenges", label: "Challenges", icon: Brain },
  { id: "confirm", label: "Confirmation", icon: Bell },
  { id: "assistant", label: "AI Assistant", icon: Bot },
  { id: "integrations", label: "Habits & Tasks", icon: ListChecks },
  { id: "stats", label: "Stats", icon: BarChart3 },
];

function WakeHubPage() {
  const [tab, setTab] = useState<TabId>("alarms");
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Wake Up</h1>
            <p className="text-sm text-muted-foreground">
              Alarms, wake challenges, ringtone library, and your AI wake assistant.
            </p>
          </div>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "border-transparent bg-gradient-primary text-primary-foreground shadow-soft"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
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
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function AlarmsTab() {
  const wake = useWake();
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Your Alarms</h2>
        <Button className="bg-gradient-primary" onClick={() => setCreating(true)}>
          <Plus className="me-1 h-4 w-4" /> New Alarm
        </Button>
      </div>

      {wake.state.alarms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <AlarmClock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No alarms yet — tap "New Alarm" to create one.</p>
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
                    <span>{a.days.length === 0 ? "One-time" : a.days.map((d) => DAY_LABELS[d]).join(" ")}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Music2 className="h-3 w-3" />{findRingtoneName(a.ringtoneId, wake.state.customs)}</span>
                    {a.vibrate && <span className="flex items-center gap-1"><Vibrate className="h-3 w-3" /> Vibrate</span>}
                    {a.challenges.filter((c) => c !== "none").length > 0 && (
                      <span className="flex items-center gap-1"><Brain className="h-3 w-3" /> {a.challenges.length} challenge{a.challenges.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
                <Switch checked={a.enabled} onCheckedChange={() => wake.toggleAlarm(a.id)} />
                <Button variant="outline" size="sm" onClick={() => setEditing(a)}>Edit</Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { if (confirm("Delete this alarm?")) wake.deleteAlarm(a.id); }}
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
    sentence: alarm?.sentence ?? "I am awake and ready",
    confirmAfterMinutes: alarm?.confirmAfterMinutes ?? d.confirmAfterMinutes,
  });
  const [showRingtones, setShowRingtones] = useState(false);

  const toggleDay = (day: WeekDay) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((x) => x !== day) : [...f.days, day].sort() as WeekDay[],
    }));
  };
  const toggleChallenge = (c: ChallengeKind) => {
    setForm((f) => {
      const set = new Set(f.challenges.filter((x) => x !== "none"));
      if (set.has(c)) set.delete(c); else set.add(c);
      return { ...f, challenges: set.size === 0 ? ["none"] : Array.from(set) };
    });
  };

  const save = () => {
    if (alarm) wake.updateAlarm(alarm.id, form);
    else wake.addAlarm(form);
    toast.success(alarm ? "Alarm updated" : "Alarm created");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{alarm ? "Edit Alarm" : "New Alarm"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Time</Label>
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div>
            <Label>Label</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Wake up" />
          </div>
          <div>
            <Label>Repeat</Label>
            <div className="mt-2 flex gap-1">
              {DAY_LABELS.map((l, i) => {
                const active = form.days.includes(i as WeekDay);
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i as WeekDay)}
                    className={`h-9 w-9 rounded-full text-sm font-semibold transition-all ${
                      active ? "bg-gradient-primary text-primary-foreground shadow-soft" : "border border-border bg-background text-muted-foreground hover:border-primary"
                    }`}
                  >{l}</button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {form.days.length === 0 ? "One-time alarm" : "Repeats weekly on selected days"}
            </p>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Ringtone</div>
                <div className="text-xs text-muted-foreground">{findRingtoneName(form.ringtoneId, wake.state.customs)}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowRingtones((v) => !v)}>
                {showRingtones ? "Close" : "Change"}
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
            <div className="flex items-center gap-2"><Vibrate className="h-4 w-4" /><span className="text-sm">Vibrate</span></div>
            <Switch checked={form.vibrate} onCheckedChange={(v) => setForm({ ...form, vibrate: v })} />
          </div>

          <div className="rounded-xl border border-border p-3">
            <Label className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> Volume — {Math.round(form.volume * 100)}%</Label>
            <Slider className="mt-3" value={[form.volume * 100]} max={100} step={5} onValueChange={(v) => setForm({ ...form, volume: (v[0] ?? 60) / 100 })} />
          </div>

          <div className="rounded-xl border border-border p-3">
            <Label className="flex items-center gap-2"><Timer className="h-4 w-4" /> Fade in — {form.fadeInSeconds}s</Label>
            <Slider className="mt-3" value={[form.fadeInSeconds]} max={60} step={5} onValueChange={(v) => setForm({ ...form, fadeInSeconds: v[0] ?? 0 })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Snooze — {form.snoozeMinutes} min</Label>
              <Slider className="mt-3" value={[form.snoozeMinutes]} max={30} step={1} onValueChange={(v) => setForm({ ...form, snoozeMinutes: v[0] ?? 0 })} />
            </div>
            <div className="rounded-xl border border-border p-3">
              <Label>Max snoozes — {form.snoozeMax}</Label>
              <Slider className="mt-3" value={[form.snoozeMax]} max={10} step={1} onValueChange={(v) => setForm({ ...form, snoozeMax: v[0] ?? 0 })} />
            </div>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center gap-2"><Brain className="h-4 w-4" /><span className="text-sm font-semibold">Wake challenges</span></div>
            <p className="mb-3 text-xs text-muted-foreground">Combine any of these — you'll have to complete all of them to dismiss the alarm.</p>
            <div className="flex flex-wrap gap-2">
              {(["math-easy","math-medium","math-hard","shake","sentence","memory","focus"] as ChallengeKind[]).map((c) => {
                const active = form.challenges.includes(c);
                return (
                  <button key={c} onClick={() => toggleChallenge(c)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      active ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary"
                    }`}>{challengeLabel(c)}</button>
                );
              })}
            </div>
            {form.challenges.includes("shake") && (
              <div className="mt-3">
                <Label>Shake count — {form.shakeCount}</Label>
                <Slider className="mt-2" value={[form.shakeCount]} max={50} step={5} onValueChange={(v) => setForm({ ...form, shakeCount: v[0] ?? 20 })} />
              </div>
            )}
            {form.challenges.includes("sentence") && (
              <div className="mt-3">
                <Label>Sentence to type</Label>
                <Input className="mt-1" value={form.sentence} onChange={(e) => setForm({ ...form, sentence: e.target.value })} />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-3">
            <Label>Wake confirmation delay</Label>
            <div className="mt-2 flex gap-2">
              {[0, 5, 10, 15].map((m) => (
                <button key={m} onClick={() => setForm({ ...form, confirmAfterMinutes: m as 0|5|10|15 })}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                    form.confirmAfterMinutes === m ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary"
                  }`}>{m === 0 ? "Off" : `${m} min`}</button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-primary" onClick={save}><Check className="me-1 h-4 w-4" /> Save Alarm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function challengeLabel(c: ChallengeKind): string {
  return {
    "none": "None",
    "math-easy": "Math (Easy)",
    "math-medium": "Math (Medium)",
    "math-hard": "Math (Hard)",
    "shake": "Shake Phone",
    "sentence": "Type Sentence",
    "memory": "Memory Pattern",
    "focus": "Focus Countdown",
  }[c];
}

// ------------------ Ringtones tab ------------------
function RingtonesTab() {
  const wake = useWake();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Ringtone Library</h2>
        <p className="text-sm text-muted-foreground">
          {40} built-in tones across 10 categories. Import your own MP3, WAV, OGG, M4A, or AAC files.
        </p>
      </div>
      <RingtoneLibrary
        selectedId={wake.state.defaults.ringtoneId}
        onSelect={(id) => { wake.setDefaults({ ringtoneId: id }); toast.success("Default ringtone updated"); }}
        volume={wake.state.defaults.volume}
      />
    </div>
  );
}

// ------------------ Challenges tab ------------------
function ChallengesTab() {
  const [mode, setMode] = useState<"math-easy" | "math-medium" | "math-hard" | "sentence" | "memory">("math-medium");
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">Try a Wake Challenge</h2>
      <p className="text-sm text-muted-foreground">Preview how each dismissal challenge works.</p>
      <div className="flex flex-wrap gap-2">
        {(["math-easy", "math-medium", "math-hard", "sentence", "memory"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              mode === m ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary"
            }`}>{challengeLabel(m)}</button>
        ))}
      </div>
      <div className="rounded-xl border border-border p-5">
        {mode.startsWith("math") && <MathChallenge difficulty={mode as "math-easy" | "math-medium" | "math-hard"} />}
        {mode === "sentence" && <SentenceChallenge target="I am awake and ready" />}
        {mode === "memory" && <MemoryChallenge />}
      </div>
    </div>
  );
}

function MathChallenge({ difficulty }: { difficulty: "math-easy" | "math-medium" | "math-hard" }) {
  const problem = useMemo(() => genMath(difficulty), [difficulty]);
  const [answer, setAnswer] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div>
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Solve to dismiss</div>
        <div className="mt-2 font-display text-4xl font-bold">{problem.q}</div>
      </div>
      <div className="mt-4 flex gap-2">
        <Input inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" />
        <Button className="bg-gradient-primary" onClick={() => {
          if (Number(answer) === problem.a) { setDone(true); toast.success("Correct — alarm dismissed"); }
          else toast.error("Wrong answer, try again");
        }}>Check</Button>
      </div>
      {done && <div className="mt-3 flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> Challenge complete!</div>}
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
  const [text, setText] = useState("");
  const done = text.trim() === target.trim();
  return (
    <div>
      <div className="text-xs text-muted-foreground">Type this sentence exactly:</div>
      <div className="mt-1 rounded-lg bg-secondary p-3 font-mono text-sm">{target}</div>
      <Input className="mt-3" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type here…" />
      {done && <div className="mt-2 flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> Perfect — alarm dismissed</div>}
    </div>
  );
}

function MemoryChallenge() {
  const [seq] = useState(() => Array.from({ length: 4 }, () => Math.floor(Math.random() * 4)));
  const [shown, setShown] = useState(true);
  const [input, setInput] = useState<number[]>([]);
  const done = input.length === seq.length && input.every((v, i) => v === seq[i]);
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">Repeat the pattern</div>
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
        <Button size="sm" variant="outline" onClick={() => setShown((s) => !s)}>{shown ? "Hide" : "Show"} pattern</Button>
        <Button size="sm" variant="outline" onClick={() => setInput([])}>Reset</Button>
      </div>
      {done && <div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> Correct!</div>}
    </div>
  );
}

// ------------------ Confirmation tab ------------------
function ConfirmTab() {
  const wake = useWake();
  const d = wake.state.defaults;
  const confirmations = wake.state.history.filter((h) => h.confirmed !== undefined);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Wake Confirmation</h2>
        <p className="text-sm text-muted-foreground">
          After dismissing an alarm, we'll ask you to confirm you're still awake. If you don't,
          the alarm restarts as a high-priority notification.
        </p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <Label>Default confirmation delay</Label>
        <div className="mt-2 flex gap-2">
          {[0, 5, 10, 15].map((m) => (
            <button key={m} onClick={() => wake.setDefaults({ confirmAfterMinutes: m as 0|5|10|15 })}
              className={`rounded-lg border px-3 py-1 text-sm font-medium ${
                d.confirmAfterMinutes === m ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary"
              }`}>{m === 0 ? "Off" : `${m} min`}</button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Recent confirmations</h3>
        {confirmations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No confirmations yet.
          </div>
        ) : (
          <div className="space-y-2">
            {confirmations.slice(0, 10).map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <div>{new Date(h.firedAt).toLocaleString()}</div>
                {h.confirmed ? (
                  <span className="flex items-center gap-1 text-primary"><Check className="h-4 w-4" /> Confirmed</span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive"><X className="h-4 w-4" /> Missed</span>
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
    if (Number(avgSnoozes) > 2) suggestions.push("You snooze often — try enabling a Math (Medium) challenge to wake up faster.");
    if (successRate < 60 && history.length) suggestions.push("Consider a louder ringtone or increasing volume for more reliable wake-ups.");
    if (alarms.length === 0) suggestions.push("Add your first alarm to start building a morning routine.");
    if (wake.state.streak >= 3) suggestions.push(`Great job — you're on a ${wake.state.streak}-day wake streak! Keep it going.`);
    if (suggestions.length === 0) suggestions.push("Your wake patterns look healthy. Keep it up!");
    return { avgSnoozes, successRate, suggestions };
  }, [wake.state]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">AI Wake Assistant</h2>
          <p className="text-sm text-muted-foreground">Personalized insights based on your wake history.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Wake success" value={`${insights.successRate}%`} />
        <Kpi label="Avg. snoozes" value={insights.avgSnoozes} />
        <Kpi label="Streak" value={`${wake.state.streak} days`} />
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
  const today = new Date().toISOString().slice(0, 10);
  const todaysTasks = appState.tasks.filter((t) => t.date === today);
  const overdue = appState.tasks.filter((t) => !t.completed && t.date < today);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Wake · Habits · Tasks</h2>
        <p className="text-sm text-muted-foreground">
          What you'll see right after dismissing your alarm — today's tasks, meetings, and streaks.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <h3 className="mb-2 font-semibold">Today's tasks</h3>
        {todaysTasks.length === 0 ? (
          <div className="text-sm text-muted-foreground">No tasks scheduled for today.</div>
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
          <h3 className="mb-2 font-semibold text-destructive">Overdue ({overdue.length})</h3>
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
      <h2 className="font-display text-lg font-bold">Wake Statistics</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Success rate" value={`${successRate}%`} />
        <Kpi label="Avg. wake time" value={avgTime} />
        <Kpi label="Avg. snoozes" value={avgSnoozes} />
        <Kpi label="Streak" value={`${wake.state.streak} days`} />
      </div>
      <div className="rounded-xl border border-border p-4">
        <h3 className="mb-3 font-semibold">Dismissal methods</h3>
        {Object.keys(byMethod).length === 0 ? (
          <div className="text-sm text-muted-foreground">No wake data yet — history appears after alarms fire.</div>
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