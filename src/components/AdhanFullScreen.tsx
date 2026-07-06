import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { PRAYER_LABELS_AR } from "@/lib/prayer";
import {
  PRAYER_BACKGROUNDS,
  backgroundGradient,
  resolveAdhan,
} from "@/lib/adhan-library";
import { getLangMeta, t } from "@/lib/i18n";
import { MapPin, Volume2, VolumeX } from "lucide-react";

interface Props {
  prayerKey: string;
  onClose: () => void;
}

/** Full-screen prayer alarm overlay with looping video background and adhan
 *  audio. Renders above the entire app (fixed, z-[999]). Stays visible until
 *  the user presses "Stop" or the adhan audio ends naturally. */
export function AdhanFullScreen({ prayerKey, onClose }: Props) {
  const { state } = useStore();
  const lang = state.language;
  const meta = getLangMeta(lang);
  const tr = (k: string) => t(lang, k);

  const adhan = useMemo(
    () => resolveAdhan(state.prayer.adhanId, state.prayer.customAdhans),
    [state.prayer.adhanId, state.prayer.customAdhans],
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [now, setNow] = useState(new Date());
  const [muted, setMuted] = useState(false);
  const [elapsedS, setElapsedS] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const [videoOk, setVideoOk] = useState(true);

  // Ticker
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
      setElapsedS(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Play adhan
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.loop = false;
    if (adhan?.url) {
      audio.src = adhan.url;
      audio.volume = state.volume ?? 0.8;
      audio.play().catch(() => {
        /* browser autoplay may block; user will hit unmute */
      });
    }
    audioRef.current = audio;
    return () => {
      try {
        audio.pause();
        audio.src = "";
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adhan?.url]);

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
  };

  const stop = () => {
    try {
      audioRef.current?.pause();
    } catch {
      /* noop */
    }
    onClose();
  };

  const prayerLabel = PRAYER_LABELS_AR[prayerKey] ?? prayerKey;
  const bgUrl = PRAYER_BACKGROUNDS[prayerKey];
  const gradient = backgroundGradient(prayerKey);
  const city = state.prayer.coords?.city;

  const timeStr = new Intl.DateTimeFormat(meta.locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  const dateStr = new Intl.DateTimeFormat(meta.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const hijri = state.prayer.cache?.hijri;
  const elapsed = `${String(Math.floor(elapsedS / 60)).padStart(2, "0")}:${String(
    elapsedS % 60,
  ).padStart(2, "0")}`;

  return (
    <div
      dir={meta.dir}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-between overflow-hidden text-white"
      style={{ background: gradient }}
    >
      {/* Video background */}
      {bgUrl && videoOk && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src={bgUrl}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        />
      )}
      {/* Blur + darkening overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 flex w-full items-center justify-between p-6">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs backdrop-blur">
          <MapPin className="h-3.5 w-3.5" />
          <span>{city ?? tr("prayer.pickLocation")}</span>
        </div>
        <button
          onClick={toggleMute}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20"
          aria-label="mute"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Center */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-8 text-center">
        <div className="text-6xl drop-shadow">🕌</div>
        <div className="text-lg opacity-90 drop-shadow">
          {tr("adhan.timeFor")}
        </div>
        <h1 className="font-display text-6xl font-bold tracking-wide drop-shadow-lg sm:text-7xl">
          {tr(`prayer.${prayerKey.toLowerCase()}`)}
        </h1>
        {prayerLabel !== tr(`prayer.${prayerKey.toLowerCase()}`) && (
          <div className="text-xl opacity-80">{prayerLabel}</div>
        )}
        <div className="mt-4 rounded-2xl bg-black/25 px-6 py-4 backdrop-blur">
          <div className="font-mono text-5xl font-bold tabular-nums">{timeStr}</div>
          <div className="mt-1 text-sm opacity-80">{dateStr}</div>
          {hijri && <div className="mt-0.5 text-xs opacity-70">📿 {hijri}</div>}
        </div>
        {adhan?.reciter && (
          <div className="mt-2 text-xs opacity-80">
            {tr("adhan.reciter")}: {adhan.reciter}
          </div>
        )}
        <div className="mt-1 font-mono text-xs opacity-70">⏱ {elapsed}</div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex w-full flex-col items-center gap-3 p-8">
        <Button
          size="lg"
          className="h-14 w-full max-w-sm rounded-full bg-white/95 text-lg font-bold text-slate-900 shadow-lg hover:bg-white"
          onClick={stop}
        >
          {tr("adhan.stop")}
        </Button>
        <p className="text-xs opacity-70">{tr("adhan.hint")}</p>
      </div>
    </div>
  );
}