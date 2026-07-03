import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { ensureNotificationPermission } from "@/lib/notifications";
import {
  Moon, Sun, Bell, Languages, Trash2, Monitor, Music2, Volume2, Smartphone, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { LANGUAGES } from "@/lib/i18n";
import { makeI18n } from "@/lib/i18n";
import { RINGTONES, playRingtone, type RingtoneId } from "@/lib/sound";
import { Slider } from "@/components/ui/slider";
import {
  isNative, requestNativePermissions, fireTestAlarm,
} from "@/lib/native-alarms";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — LifeFlow AI" },
      { name: "description", content: "تخصيص اللغة والوضع الليلي والإشعارات." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, setLanguage, setTheme, setRingtone, setVolume, resetAll } = useStore();
  const { t } = makeI18n(state.language);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>

        <Section icon={<Languages className="h-4 w-4" />} title={t("settings.language")}>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <Choice
                key={l.code}
                active={state.language === l.code}
                onClick={() => setLanguage(l.code)}
              >
                {l.label}
              </Choice>
            ))}
          </div>
        </Section>

        <Section icon={<Sun className="h-4 w-4" />} title={t("settings.theme")}>
          <div className="flex gap-2">
            <Choice active={state.theme === "light"} onClick={() => setTheme("light")}>
              <Sun className="me-1 h-4 w-4" /> {t("settings.theme.light")}
            </Choice>
            <Choice active={state.theme === "dark"} onClick={() => setTheme("dark")}>
              <Moon className="me-1 h-4 w-4" /> {t("settings.theme.dark")}
            </Choice>
            <Choice active={state.theme === "system"} onClick={() => setTheme("system")}>
              <Monitor className="me-1 h-4 w-4" /> {t("settings.theme.system")}
            </Choice>
          </div>
        </Section>

        <Section icon={<Bell className="h-4 w-4" />} title={t("settings.notifications")}>
          <p className="mb-3 text-sm text-muted-foreground">{t("settings.notificationsHint")}</p>
          <Button
            onClick={async () => {
              const p = await ensureNotificationPermission();
              if (p === "granted") toast.success(t("settings.notificationsGranted"));
              else toast.error(t("settings.notificationsDenied"));
            }}
            className="bg-gradient-primary"
          >
            <Bell className="me-1 h-4 w-4" />
            {t("settings.enableNotifications")}
          </Button>
        </Section>

        {isNative() && (
          <Section icon={<Smartphone className="h-4 w-4" />} title={t("settings.native.title")}>
            <p className="mb-3 text-sm text-muted-foreground">{t("settings.native.desc")}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-gradient-primary"
                onClick={async () => {
                  const ok = await requestNativePermissions();
                  if (ok) toast.success(t("settings.native.granted"));
                  else toast.error(t("settings.native.denied"));
                }}
              >
                <Bell className="me-1 h-4 w-4" /> {t("settings.native.grant")}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await fireTestAlarm();
                  toast.info(t("settings.native.testing"));
                }}
              >
                <Zap className="me-1 h-4 w-4" /> {t("settings.native.test")}
              </Button>
            </div>
          </Section>
        )}

        <Section icon={<Music2 className="h-4 w-4" />} title={t("settings.ringtone")}>
          <div className="flex flex-wrap gap-2">
            {RINGTONES.map((r) => (
              <Choice
                key={r.id}
                active={state.ringtone === r.id}
                onClick={() => {
                  setRingtone(r.id);
                  playRingtone(r.id, state.volume);
                }}
              >
                {r.label}
              </Choice>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[Math.round(state.volume * 100)]}
              onValueChange={(v) => setVolume((v[0] ?? 50) / 100)}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="w-10 text-end text-xs text-muted-foreground">
              {Math.round(state.volume * 100)}%
            </span>
          </div>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => playRingtone(state.ringtone as RingtoneId, state.volume)}
          >
            {t("settings.testRingtone")}
          </Button>
        </Section>

        <Section icon={<Trash2 className="h-4 w-4" />} title={t("settings.reset")}>
          <p className="mb-3 text-sm text-muted-foreground">{t("settings.resetHint")}</p>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(t("settings.resetConfirm"))) {
                resetAll();
                toast.success(t("settings.resetDone"));
              }
            }}
          >
            {t("settings.resetButton")}
          </Button>
        </Section>

        <div className="pt-4 text-center text-xs text-muted-foreground">
          {t("settings.footer")}
        </div>
      </div>
    </AppShell>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
          {icon}
        </span>
        <h2 className="font-display text-base font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "border-transparent bg-gradient-primary text-primary-foreground shadow-soft"
          : "border-border bg-background text-foreground hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}