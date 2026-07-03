import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Loader2, Search, Droplets, Wind, ThermometerSun, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { describeWeatherCode, fetchWeather } from "@/lib/weather";
import { geocodeCity, reverseGeocode } from "@/lib/prayer";
import { makeI18n } from "@/lib/i18n";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "الطقس — LifeFlow AI" },
      { name: "description", content: "حالة الطقس الحالية والتوقعات الساعية والأسبوعية." },
    ],
  }),
  component: WeatherPage,
});

function WeatherPage() {
  const { state, setWeatherCoords, setWeatherCache } = useStore();
  const i18n = makeI18n(state.language);
  const { t } = i18n;
  const { coords, cache } = state.weather;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState("");

  const refresh = async (lat: number, lng: number, city?: string) => {
    try {
      setLoading(true);
      setError(null);
      const w = await fetchWeather(lat, lng, city);
      setWeatherCache(w);
    } catch {
      setError(t("weather.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!coords) return;
    if (cache && Date.now() - cache.fetchedAt < 30 * 60 * 1000) return;
    void refresh(coords.lat, coords.lng, coords.city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lng]);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setError(t("weather.geolocationUnsupported"));
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setWeatherCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, city });
      },
      () => {
        setError(t("prayer.locationDenied"));
        setLoading(false);
      },
    );
  };

  const searchCity = async () => {
    if (!cityInput.trim()) return;
    setLoading(true);
    const r = await geocodeCity(cityInput.trim());
    if (!r) {
      setError(t("weather.cityNotFound"));
      setLoading(false);
      return;
    }
    setWeatherCoords({ lat: r.lat, lng: r.lng, city: r.city });
    setCityInput("");
  };

  const cur = cache?.current;
  const desc = cur ? describeWeatherCode(cur.code, cur.isDay) : null;
  const greeting = cur
    ? cur.code === 0
      ? t("weather.greet.sunny")
      : cur.code >= 61 && cur.code <= 82
        ? t("weather.greet.rain")
        : cur.code >= 71 && cur.code <= 86
          ? t("weather.greet.snow")
          : cur.code >= 95
            ? t("weather.greet.storm")
            : t("weather.greet.mild")
    : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-bold">{t("weather.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("weather.subtitle")}</p>
        </header>

        {!coords ? (
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" /> {t("weather.pickLocation")}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchCity()}
                  placeholder={t("weather.cityPlaceholder")}
                  className="pe-9"
                />
              </div>
              <Button onClick={searchCity} variant="secondary">{t("common.search")}</Button>
              <Button onClick={useMyLocation} className="bg-gradient-primary">
                <MapPin className="me-2 h-4 w-4" /> {t("weather.useMyLocation")}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </Card>
        ) : (
          <>
            {/* Current */}
            <Card
              className={`relative overflow-hidden border-0 p-6 text-primary-foreground shadow-glow ${
                cur?.isDay
                  ? "bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-500"
                  : "bg-gradient-to-br from-indigo-700 via-purple-800 to-slate-900"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <MapPin className="h-4 w-4" />
                    {coords.city ?? `${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`}
                  </div>
                  <div className="mt-1 text-xs opacity-80">{greeting}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/15 text-primary-foreground hover:bg-white/25"
                    onClick={() => coords && refresh(coords.lat, coords.lng, coords.city)}
                  >
                    <RefreshCw className="me-1.5 h-3.5 w-3.5" /> {t("common.refresh")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/15 text-primary-foreground hover:bg-white/25"
                    onClick={() => setWeatherCoords(null)}
                  >
                    {t("weather.changeCity")}
                  </Button>
                </div>
              </div>
              {cur && desc && (
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <div className="font-display text-6xl font-bold">
                      {Math.round(cur.temperature)}°
                    </div>
                    <div className="mt-1 text-sm opacity-90">{desc.label}</div>
                  </div>
                  <div className="text-7xl drop-shadow-lg">{desc.emoji}</div>
                </div>
              )}
              {cur && (
                <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl bg-white/15 p-3">
                    <ThermometerSun className="mb-1 h-4 w-4" />
                    <div className="opacity-80">{t("weather.feelsLike")}</div>
                    <div className="text-base font-bold">{Math.round(cur.apparent)}°</div>
                  </div>
                  <div className="rounded-xl bg-white/15 p-3">
                    <Droplets className="mb-1 h-4 w-4" />
                    <div className="opacity-80">{t("weather.humidity")}</div>
                    <div className="text-base font-bold">{cur.humidity}%</div>
                  </div>
                  <div className="rounded-xl bg-white/15 p-3">
                    <Wind className="mb-1 h-4 w-4" />
                    <div className="opacity-80">{t("weather.wind")}</div>
                    <div className="text-base font-bold">{Math.round(cur.windSpeed)} {t("weather.windUnit")}</div>
                  </div>
                </div>
              )}
            </Card>

            {/* Hourly */}
            {cache && cache.hourly.length > 0 && (
              <Card className="p-4">
                <h2 className="mb-3 font-display text-base font-bold">{t("weather.hourly")}</h2>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {cache.hourly.map((h) => {
                    const d = describeWeatherCode(h.code, true);
                    const hour = i18n.formatTime(new Date(h.time));
                    return (
                      <div
                        key={h.time}
                        className="flex min-w-[68px] flex-col items-center gap-1 rounded-xl border border-border/60 bg-card p-2 text-center"
                      >
                        <span className="text-[10px] text-muted-foreground">{hour}</span>
                        <span className="text-xl">{d.emoji}</span>
                        <span className="text-sm font-bold">{Math.round(h.temp)}°</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Daily */}
            {cache && cache.daily.length > 0 && (
              <Card className="p-4">
                <h2 className="mb-3 font-display text-base font-bold">{t("weather.next7")}</h2>
                <div className="divide-y divide-border/50">
                  {cache.daily.map((d, i) => {
                    const desc2 = describeWeatherCode(d.code, true);
                    const day =
                      i === 0
                        ? t("common.today")
                        : i18n.formatDate(new Date(d.date), { weekday: "long", year: undefined, month: undefined, day: undefined });
                    return (
                      <div
                        key={d.date}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm"
                      >
                        <span className="w-20 font-medium">{day}</span>
                        <span className="flex-1 text-center text-xl">{desc2.emoji}</span>
                        <span className="w-14 text-xs text-muted-foreground">{desc2.label}</span>
                        <span className="w-24 text-end font-mono tabular-nums">
                          <span className="text-muted-foreground">{Math.round(d.min)}°</span>
                          <span className="mx-1">/</span>
                          <span className="font-bold">{Math.round(d.max)}°</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}
          </div>
        )}
        {error && coords && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </AppShell>
  );
}