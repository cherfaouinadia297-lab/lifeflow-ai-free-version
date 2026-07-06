import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PRAYER_KEYS } from "@/lib/prayer";
import { AdhanFullScreen } from "./AdhanFullScreen";

/** Watches prayer.cache timings and mounts <AdhanFullScreen /> at the exact
 *  moment (HH:mm match on local clock). Debounced with a per-day fired set
 *  in sessionStorage so we don't retrigger while the user is stopping it. */
export function PrayerAdhanController() {
  const { state } = useStore();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const cache = state.prayer.cache;
    if (!cache) return;
    const enabled = state.prayer.enabled;

    const check = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const nowHM = `${hh}:${mm}`;
      const dayKey = `adhan-fired-${now.toISOString().slice(0, 10)}`;
      const fired: string[] = JSON.parse(sessionStorage.getItem(dayKey) ?? "[]");
      for (const key of PRAYER_KEYS) {
        if (!(enabled[key] ?? true)) continue;
        const time = cache.timings[key];
        if (!time) continue;
        if (time === nowHM && !fired.includes(key)) {
          fired.push(key);
          sessionStorage.setItem(dayKey, JSON.stringify(fired));
          setActive(key);
          break;
        }
      }
    };

    check();
    const id = window.setInterval(check, 15_000);
    return () => window.clearInterval(id);
  }, [state.prayer.cache, state.prayer.enabled]);

  if (!active) return null;
  return <AdhanFullScreen prayerKey={active} onClose={() => setActive(null)} />;
}

/** Manual preview helper — used by the "Preview adhan" button. */
export function useAdhanPreview() {
  const [active, setActive] = useState<string | null>(null);
  return {
    active,
    open: (key: string) => setActive(key),
    close: () => setActive(null),
  };
}