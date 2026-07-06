import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { RingtoneLibrary, findRingtoneName } from "@/components/RingtoneLibrary";
import { useWake, type Alarm, type ChallengeKind, type WeekDay } from "@/lib/wake-store";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { LANGUAGES, DICTIONARIES, formatPercent, formatNumber, formatDateTime } from "@/lib/i18n";
import {
  AlarmClock, Music2, Bell, Brain, Bot, Sparkles, ListChecks, BarChart3,
  Plus, Trash2, Vibrate, Clock, Volume2, Check, X, Timer
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
  { id: "alarms", labelKey: "wake.tabs.alarms", icon: AlarmClock },
  { id: "ringtones", labelKey: "wake.tabs.ringtones", icon: Music2 },
  { id: "challenges", labelKey: "wake.tabs.challenges", icon: Brain },
  { id: "confirm", labelKey: "wake.tabs.confirm", icon: Bell },
  { id: "assistant", labelKey: "wake.tabs.assistant", icon: Bot },
  { id: "integrations", labelKey: "wake.tabs.integrations", icon: ListChecks },
  { id: "stats", labelKey: "wake.tabs.stats", icon: BarChart3 },
];

const DAY_LABELS_EN = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_LABELS_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

function WakeHubPage() {
  const [tab, setTab] = useState<TabId>("alarms");
  const { state: appState } = useStore(); 
  
  const currentLangCode = appState.language || "en";
  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  // دالة الترجمة المستقرة المتوافقة مع ملفك بالكامل
  const t = (key: string, replacements?: Record<string, string | number>): string => {
    let text = DICTIONARIES[currentLangCode]?.[key] || DICTIONARIES["en"]?.[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5" dir={currentLang.dir}>
        
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{t("wake.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("wake.desc")}</p>
            </div>
          </div>
        </div>

        {/* التبويبات المترجمة */}
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tTab) => {
            const Icon = tTab.icon;
            const active = tab === tTab.id;
            return (
              <button
                key={tTab.id}
                onClick={() => setTab(tTab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "border-transparent bg-gradient-primary text-primary-foreground shadow-soft"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(tTab.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          {tab === "alarms" && <AlarmsTab t={t} currentLang={currentLang} />}
          {tab === "ringtones" && <RingtonesTab t={t} />}
          {tab === "challenges" && <ChallengesTab t={t} />}
          {tab === "confirm" && <ConfirmTab t={t} currentLang={currentLang} />}
          {tab === "assistant" && <AssistantTab t={t} currentLang={currentLang} />}
          {tab === "integrations" && <IntegrationsTab t={t} />}
          {tab === "stats" && <StatsTab t={t} currentLang={currentLang} />}
        </div>
      </div>
    </AppShell>
  );
}

// ------------------ Alarms Tab ------------------
function AlarmsTab({ t, currentLang }: { t: any; currentLang: any }) {
  const wake = useWake();
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [creating, setCreating] = useState(false);
  const dayLabels = currentLang.dir === "rtl" ? DAY_LABELS_AR : DAY_LABELS_EN;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{t("wake.alarms.title")}</h2>
        <Button className="bg-gradient-primary" onClick={() => setCreating(true)}>
          <Plus className="mx-1 h-4 w-4" /> {t("wake.alarms.new")}
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
                    <span>{a.days.length === 0 ? t("wake.alarms.onetime") : a.days.map((d) => dayLabels[d]).join(" ")}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Music2 className="h-3 w-3" />{findRingtoneName(a.ringtoneId, wake.state.customs)}</span>
                    {a.vibrate && <span className="flex items-center gap-1"><Vibrate className="h-3 w-3" /> {t("wake.alarms.vibrate")}</span>}
                    {a.challenges.filter((c) => c !== "none").length > 0 && (
                      <span className="flex items-center gap-1">
                        <Brain className="h-3 w-3" /> 
                        {a.challenges.length}{" "}
                        {a.challenges.length > 1 ? t("wake.alarms.challenges") : t("wake.alarms.challenge")}
                      </span>
                    )}
                  </div>
                </div>
                <Switch checked={a.enabled} onCheckedChange={() => wake.toggleAlarm(a.id)} />
                <Button variant="outline" size="sm" onClick={() => setEditing(a)}>{t("wake.dialog.change")}</Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { if (confirm(t("wake.alarms.delete"))) { wake.deleteAlarm(a.id); toast.error(t("wake.toast.deleted")); } }}
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
          t={t}
          currentLang={currentLang}
        />
      )}
    </div>
  );
}

function AlarmDialog({ alarm, onClose, t, currentLang }: { alarm: Alarm | null; onClose: () => void; t: any; currentLang: any }) {
  const wake = useWake();
  const d = wake.state.defaults;
  const dayLabels = currentLang.dir === "rtl" ? DAY_LABELS_AR : DAY_LABELS_EN;

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
    toast.success(alarm ? t("wake.toast.updated") : t("wake.toast.created"));
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" dir={currentLang.dir}>
        <DialogHeader>
          <DialogTitle>{alarm ? t("wake.dialog.edit") : t("wake.dialog.new")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t("wake.dialog.time")}</Label>
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div>
            <Label>{t("wake.dialog.label")}</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div>
            <Label>{t("wake.dialog.repeat")}</Label>
            <div className="mt-2 flex gap-1">
              {dayLabels.map((l, i) => {
                const active = form.days.includes(i as WeekDay);
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i as WeekDay)}
                    className={`h-9 w-9 rounded-full text-sm font-semibold transition-all ${
                      active ? "bg-gradient-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{t("wake.dialog.ringtone")}</div>
                <div className="text-xs text-muted-foreground">{findRingtoneName(form.ringtoneId, wake.state.customs)}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowRingtones((v) => !v)}>
                {showRingtones ? t("wake.dialog.close") : t("wake.dialog.change")}
              </Button>
            </div>
            {showRingtones && (
              <div className="mt-3">
                <RingtoneLibrary selectedId={form.ringtoneId} onSelect={(id) => setForm({ ...form, ringtoneId: id })} volume={form.volume} compact />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-3">
            <Label>{t("wake.dialog.volume")} — {formatPercent(form.volume, currentLang.locale)}</Label>
            <Slider className="mt-3" value={[form.volume * 100]} max={100} onValueChange={(v) => setForm({ ...form, volume: (v[0] ?? 60) / 100 })} />
          </div>

          <div className="rounded-xl border border-border p-3">
            <Label>{t("wake.dialog.fade")} — {formatNumber(form.fadeInSeconds, currentLang.locale)}{t("wake.labels.secondsShort")}</Label>
            <Slider className="mt-3" value={[form.fadeInSeconds]} max={60} onValueChange={(v) => setForm({ ...form, fadeInSeconds: v[0] ?? 0 })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <Label>{t("wake.dialog.snooze")}</Label>
              <Slider className="mt-3" value={[form.snoozeMinutes]} max={30} onValueChange={(v) => setForm({ ...form, snoozeMinutes: v[0] ?? 5 })} />
            </div>
            <div className="rounded-xl border border-border p-3">
              <Label>{t("wake.dialog.maxSnooze")}</Label>
              <Slider className="mt-3" value={[form.snoozeMax]} max={10} onValueChange={(v) => setForm({ ...form, snoozeMax: v[0] ?? 3 })} />
            </div>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="mb-2 font-semibold">{t("wake.dialog.challengesTitle")}</div>
            <div className="flex flex-wrap gap-2">
              {(["math-easy", "math-medium", "math-hard", "shake", "sentence", "memory"] as Exclude<ChallengeKind, "none">[]).map((c) => {
                const active = form.challenges.includes(c);
                return (
                  <button key={c} onClick={() => toggleChallenge(c)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      active ? "bg-gradient-primary text-primary-foreground border-transparent" : "text-muted-foreground border-border"
                    }`}>
                    {challengeLabel(c, t)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t("wake.dialog.cancel")}</Button>
          <Button className="bg-gradient-primary" onClick={save}>{t("wake.dialog.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function challengeLabel(c: ChallengeKind, t: any): string {
  return {
    "none": t("wake.labels.none"),
    "math-easy": t("wake.labels.mathEasy"),
    "math-medium": t("wake.labels.mathMedium"),
    "math-hard": t("wake.labels.mathHard"),
    "shake": t("wake.labels.shake"),
    "sentence": t("wake.labels.sentence"),
    "memory": t("wake.labels.memory"),
    "focus": t("wake.labels.focus"),
  }[c];
}

// ------------------ Ringtones Tab ------------------
function RingtonesTab({ t }: { t: any }) {
  const wake = useWake();
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">{t("wake.tabs.ringtones")}</h2>
      <RingtoneLibrary selectedId={wake.state.defaults.ringtoneId} onSelect={(id) => wake.setDefaults({ ringtoneId: id })} volume={wake.state.defaults.volume} />
    </div>
  );
}

// ------------------ Challenges Tab ------------------
function ChallengesTab({ t }: { t: any }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">{t("wake.challenge.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("wake.challenge.desc")}</p>
    </div>
  );
}

// ------------------ Confirmation Tab ------------------
function ConfirmTab({ t, currentLang }: { t: any; currentLang: any }) {
  const wake = useWake();
  const confirmations = wake.state.history.filter((h) => h.confirmed !== undefined);
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">{t("wake.confirm.title")}</h2>
      <div className="space-y-2">
        {confirmations.map((h) => (
          <div key={h.id} className="flex justify-between rounded-lg border p-3 text-sm">
            <div>{formatDateTime(h.firedAt, currentLang.locale)}</div>
            <div>{h.confirmed ? t("wake.confirm.confirmed") : t("wake.confirm.missed")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------ Assistant Tab ------------------
function AssistantTab({ t, currentLang }: { t: any; currentLang: any }) {
  const wake = useWake();
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">{t("wake.assistant.title")}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label={t("wake.assistant.kpiSuccess")} value={formatPercent(0.85, currentLang.locale)} />
        <Kpi label={t("wake.assistant.kpiSnooze")} value={formatNumber(2, currentLang.locale)} />
        <Kpi label={t("wake.assistant.kpiStreak")} value={formatNumber(wake.state.streak, currentLang.locale)} />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4 bg-background">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

// ------------------ Integrations Tab ------------------
function IntegrationsTab({ t }: { t: any }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">{t("wake.integrations.title")}</h2>
    </div>
  );
}

// ------------------ Stats Tab ------------------
function StatsTab({ t, currentLang }: { t: any; currentLang: any }) {
  const wake = useWake();
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">{t("wake.stats.title")}</h2>
    </div>
  );
}

void DialogTrigger;
