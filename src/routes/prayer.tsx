import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Compass, BellRing, Loader2, Search, Moon, Sun, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import {
  CALC_METHODS,
  PRAYER_KEYS,
  PRAYER_LABELS_AR,
  fetchPrayerTimes,
  geocodeCity,
  nextPrayer,
  reverseGeocode,
} from "@/lib/prayer";
import { todayLocal } from "@/lib/local-date";
import { t } from "@/lib/i18n";
import { getLangMeta } from "@/lib/i18n";

export const Route = createFileRoute("/prayer")({
  head: () => ({
    meta: [
      { title: "الصلاة — LifeFlow AI" },
      { name: "description", content: "أوقات الصلاة، التاريخ الهجري والميلادي، والعد التنازلي للأذان." },
    ],
  }),
  component: PrayerPage,
});

function fmtRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function PrayerPage() {
  const {
    state,
    setPrayerCoords,
    setPrayerMethod,
    setPrayerEnabled,
    setPrayerReminder,
    setPrayerCache,
  } = useStore();
  const { coords, method, enabled, reminderMinutes, cache } = state.prayer;
  const lang = state.language;
  const tr = (k: string) => t(lang, k);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Fetch when coords / method / day change
  const reload = async (force = false) => {
    if (!coords) return;
    const today = todayLocal();
    if (
      !force &&
      cache &&
      cache.date === today &&
      Date.now() - cache.fetchedAt < 6 * 60 * 60 * 1000
    ) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPrayerTimes(coords.lat, coords.lng, method);
      setPrayerCache(data);
    } catch {
      setError(tr("prayerLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lng, method]);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setPrayerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, city });
        setLoading(false);
      },
      () => {
        setError("تعذّر الوصول إلى موقعك. أدخل اسم المدينة يدويًا.");
        setLoading(false);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8000 },
    );
  };

  const searchCity = async () => {
    if (!cityInput.trim()) return;
    setLoading(true);
    setError(null);
    const r = await geocodeCity(cityInput.trim());
    setLoading(false);
    if (!r) {
      setError("لم نعثر على المدينة. حاول كتابتها بشكل آخر.");
      return;
    }
    setPrayerCoords({ lat: r.lat, lng: r.lng, city: r.city });
    setCityInput("");
  };

  const next = useMemo(
    () => (cache ? nextPrayer(cache.timings, new Date(now)) : null),
    [cache, now],
  );

  const gregorian = new Date(now).toLocaleDateString("ar-EG-u-ca-gregory", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const gregorianLocalized = new Date(now).toLocaleDateString(getLangMeta(lang).locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-display text-2xl font-bold">{tr("prayer")}</h1>
            {coords && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void reload(true)}
                disabled={loading}
              >
                <RefreshCw className={`me-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                {tr("refresh")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{tr("prayerSourceNote")}</p>
        </header>

        {/* Location card */}
        {!coords ? (
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              {tr("pickLocation")}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchCity()}
                  placeholder={tr("cityPlaceholder")}
                  className="pe-9"
                />
              </div>
              <Button onClick={searchCity} variant="secondary">
                {tr("search")}
              </Button>
              <Button onClick={useMyLocation} className="bg-gradient-primary">
                <MapPin className="me-2 h-4 w-4" />
                {tr("useMyLocation")}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </Card>
        ) : (
          <Card className="space-y-4 overflow-hidden border-0 bg-gradient-primary p-5 text-primary-foreground shadow-glow">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <MapPin className="h-4 w-4" />
                  {coords.city ?? `${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`}
                </div>
                <div className="mt-1 text-xs opacity-80">{gregorianLocalized || gregorian}</div>
                {cache?.hijri && (
                  <div className="mt-0.5 text-xs opacity-80">📿 {cache.hijri}</div>
                )}
              </div>
              {next && (
                <div className="text-end">
                  <div className="text-[11px] uppercase tracking-wide opacity-80">
                    {tr("nextPrayer")}
                  </div>
                  <div className="font-display text-xl font-bold">
                    {PRAYER_LABELS_AR[next.key]} · {next.time}
                  </div>
                  <div className="font-mono text-2xl font-bold tabular-nums">
                    {fmtRemaining(next.remainingMs)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/15 text-primary-foreground hover:bg-white/25"
                onClick={useMyLocation}
              >
                <Compass className="me-1.5 h-3.5 w-3.5" />
                {tr("updateLocation")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/15 text-primary-foreground hover:bg-white/25"
                onClick={() => setPrayerCoords(null)}
              >
                {tr("changeCity")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/15 text-primary-foreground hover:bg-white/25"
                onClick={() => void reload(true)}
                disabled={loading}
              >
                <RefreshCw className={`me-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                {tr("refresh")}
              </Button>
            </div>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {tr("loading")}
          </div>
        )}

        {/* Prayer cards */}
        {cache && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PRAYER_KEYS.map((key) => {
              const time = cache.timings[key];
              const isNext = next?.key === key;
              const isNight = key === "Fajr" || key === "Isha";
              return (
                <Card
                  key={key}
                  className={`relative overflow-hidden p-4 transition-all ${
                    isNext
                      ? "border-primary/60 bg-gradient-to-br from-primary/10 to-primary/5 shadow-glow"
                      : "hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-display text-base font-bold">
                      {PRAYER_LABELS_AR[key]}
                    </div>
                    {isNight ? (
                      <Moon className="h-4 w-4 text-primary/70" />
                    ) : (
                      <Sun className="h-4 w-4 text-primary/70" />
                    )}
                  </div>
                  <div className="mt-2 font-mono text-2xl font-bold tabular-nums">{time}</div>
                  {isNext && (
                    <div className="mt-1 text-[11px] font-medium text-primary">القادمة</div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BellRing className="h-3 w-3" />
                      تنبيه
                    </span>
                    <Switch
                      checked={enabled[key] ?? true}
                      onCheckedChange={(v) => setPrayerEnabled(key, !!v)}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Settings */}
        {coords && (
          <Card className="space-y-4 p-5">
            <h2 className="font-display text-lg font-bold">{tr("calcSettings")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">{tr("calcMethod")}</span>
                <Select
                  value={String(method)}
                  onValueChange={(v) => setPrayerMethod(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALC_METHODS.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">{tr("reminderBefore")}</span>
                <Select
                  value={String(reminderMinutes)}
                  onValueChange={(v) => setPrayerReminder(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 5, 10, 15, 30].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n === 0 ? tr("remindAtAdhan") : `${tr("reminderBefore")} — ${n}m`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </Card>
        )}
      </div>
    </AppShell>
  );
}