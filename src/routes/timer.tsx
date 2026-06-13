import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { playRingtone, RINGTONES, type RingtoneId } from "@/lib/sound";
import { t } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/timer")({
  head: () => ({
    meta: [
      { title: "الموقت — LifeFlow AI" },
      { name: "description", content: "موقت ذكي يرنّ عند انتهاء الوقت." },
    ],
  }),
  component: TimerPage,
});

const PRESETS = [5, 10, 15, 25, 30, 45, 60];

function TimerPage() {
  const { state } = useStore();
  const lang = state.language;
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          playRingtone(state.ringtone as RingtoneId, state.volume);
          toast.success(t(lang, "timerDone"));
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, state.ringtone, state.volume, lang]);

  const set = (m: number) => {
    setRunning(false);
    setMinutes(m);
    setRemaining(m * 60);
  };

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const total = minutes * 60;
  const pct = total ? ((total - remaining) / total) * 100 : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <TimerIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t(lang, "timer")}</h1>
            <p className="text-sm text-muted-foreground">{t(lang, "duration")}</p>
          </div>
        </div>

        <div className="relative grid place-items-center rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="relative h-56 w-56">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" className="fill-none stroke-muted" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="46"
                className="fill-none stroke-primary transition-[stroke-dashoffset] duration-500"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - pct / 100)}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display text-5xl font-bold tabular-nums text-foreground">
                  {mm}:{ss}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{minutes} min</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            {!running ? (
              <Button onClick={() => setRunning(true)} className="bg-gradient-primary" size="lg">
                <Play className="me-1 h-4 w-4" />
                {remaining < minutes * 60 && remaining > 0 ? t(lang, "resume") : t(lang, "start")}
              </Button>
            ) : (
              <Button onClick={() => setRunning(false)} variant="outline" size="lg">
                <Pause className="me-1 h-4 w-4" />
                {t(lang, "pause")}
              </Button>
            )}
            <Button onClick={() => set(minutes)} variant="ghost" size="lg">
              <RotateCcw className="me-1 h-4 w-4" />
              {t(lang, "reset")}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 text-sm font-medium text-foreground">{t(lang, "duration")}</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => set(m)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  minutes === m
                    ? "bg-gradient-primary text-primary-foreground shadow-soft"
                    : "border border-border bg-background text-foreground hover:border-primary"
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
          <div className="mt-4">
            <input
              type="number"
              min={1}
              max={180}
              value={minutes}
              onChange={(e) => set(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground"
            />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            النغمة الحالية:{" "}
            <span className="font-medium text-foreground">
              {RINGTONES.find((r) => r.id === state.ringtone)?.label ?? state.ringtone}
            </span>{" "}
            — يمكنك تغييرها من الإعدادات.
          </div>
        </div>
      </div>
    </AppShell>
  );
}