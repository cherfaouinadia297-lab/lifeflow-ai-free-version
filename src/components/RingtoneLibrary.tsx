import { useMemo, useRef, useState, useEffect } from "react";
import { Search, Play, Square, Star, Upload, Trash2, Pencil, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BUILT_IN_RINGTONES,
  RINGTONE_CATEGORIES,
  type RingtoneCategory,
  playAny,
  stopAllPreview,
  findRingtoneName,
} from "@/lib/ringtones-catalog";
import { useWake } from "@/lib/wake-store";
import { toast } from "sonner";

interface Props {
  selectedId?: string;
  onSelect?: (id: string) => void;
  volume?: number;
  compact?: boolean;
}

const ALL_TAB = "__all__";
const FAV_TAB = "__fav__";
const RECENT_TAB = "__recent__";
const CUSTOM_TAB = "__custom__";

export function RingtoneLibrary({ selectedId, onSelect, volume = 0.6, compact }: Props) {
  const wake = useWake();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>(ALL_TAB);
  const [playing, setPlaying] = useState<string | null>(null);
  const stopFn = useRef<(() => void) | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => () => { stopAllPreview(); }, []);

  const allItems = useMemo(() => {
    const custom = wake.state.customs.map((c) => ({
      id: c.id, name: c.name, category: "custom" as const, hint: "Custom",
    }));
    const built = BUILT_IN_RINGTONES.map((r) => ({
      id: r.id, name: r.name, category: r.category as string, hint: undefined,
    }));
    return [...built, ...custom];
  }, [wake.state.customs]);

  const filtered = useMemo(() => {
    let list = allItems;
    if (tab === FAV_TAB) list = list.filter((i) => wake.state.favorites.includes(i.id));
    else if (tab === RECENT_TAB) {
      const order = wake.state.recents;
      list = order.map((id) => allItems.find((i) => i.id === id)).filter(Boolean) as typeof allItems;
    } else if (tab === CUSTOM_TAB) list = list.filter((i) => i.category === "custom");
    else if (tab !== ALL_TAB) list = list.filter((i) => i.category === tab);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(needle));
    }
    return list;
  }, [allItems, tab, q, wake.state.favorites, wake.state.recents]);

  const preview = (id: string) => {
    if (playing === id) {
      stopFn.current?.();
      stopFn.current = null;
      setPlaying(null);
      return;
    }
    stopFn.current?.();
    stopFn.current = playAny(id, wake.state.customs, { volume, duration: 5 });
    setPlaying(id);
    setTimeout(() => { if (playing === id) setPlaying(null); }, 5200);
  };

  const handleSelect = (id: string) => {
    onSelect?.(id);
    wake.markRecent(id);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const f of files) {
      if (f.size > 2 * 1024 * 1024) {
        toast.error(`${f.name}: file too large (max 2 MB for browser preview)`);
        continue;
      }
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(f);
      });
      wake.addCustomRingtone({
        name: f.name.replace(/\.[^.]+$/, ""),
        mime: f.type || "audio/mpeg",
        size: f.size,
        dataUrl,
      });
      toast.success(`Added ${f.name}`);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ringtones…"
            className="ps-9"
          />
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/x-m4a,.mp3,.wav,.ogg,.m4a,.aac"
            multiple
            hidden
            onChange={onFile}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="me-1 h-4 w-4" /> Import
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={tab === ALL_TAB} onClick={() => setTab(ALL_TAB)}>All</Chip>
        <Chip active={tab === FAV_TAB} onClick={() => setTab(FAV_TAB)}>
          <Star className="me-1 inline h-3 w-3" /> Favorites
        </Chip>
        <Chip active={tab === RECENT_TAB} onClick={() => setTab(RECENT_TAB)}>
          <Clock className="me-1 inline h-3 w-3" /> Recent
        </Chip>
        <Chip active={tab === CUSTOM_TAB} onClick={() => setTab(CUSTOM_TAB)}>Custom</Chip>
        {RINGTONE_CATEGORIES.map((c) => (
          <Chip key={c.id} active={tab === c.id} onClick={() => setTab(c.id as RingtoneCategory)}>
            <span className="me-1">{c.emoji}</span>{c.label}
          </Chip>
        ))}
      </div>

      <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No ringtones match your search.
          </div>
        )}
        {filtered.map((r) => {
          const isSelected = selectedId === r.id;
          const isFav = wake.state.favorites.includes(r.id);
          const isPlaying = playing === r.id;
          const isCustom = r.category === "custom";
          const isRenaming = renaming?.id === r.id;
          return (
            <div
              key={r.id}
              className={`group flex items-center gap-3 rounded-xl border p-3 transition-all ${
                isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <button
                onClick={() => preview(r.id)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft"
                aria-label={isPlaying ? "Stop" : "Preview"}
              >
                {isPlaying ? <Square className="h-4 w-4" /> : <Play className="ms-0.5 h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                {isRenaming ? (
                  <div className="flex gap-1">
                    <Input
                      value={renaming!.name}
                      onChange={(e) => setRenaming({ id: r.id, name: e.target.value })}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => {
                        if (renaming!.name.trim()) wake.renameCustom(r.id, renaming!.name.trim());
                        setRenaming(null);
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="truncate text-sm font-semibold text-foreground">{r.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.hint ?? RINGTONE_CATEGORIES.find((c) => c.id === r.category)?.label ?? r.category}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => wake.toggleFavorite(r.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Favorite"
                >
                  <Star className={`h-4 w-4 ${isFav ? "fill-yellow-400 text-yellow-500" : ""}`} />
                </button>
                {isCustom && (
                  <>
                    <button
                      onClick={() => setRenaming({ id: r.id, name: r.name })}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                      aria-label="Rename"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${r.name}"?`)) wake.deleteCustom(r.id);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {onSelect && (
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={isSelected ? "bg-gradient-primary" : ""}
                    onClick={() => handleSelect(r.id)}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all ${
        active
          ? "border-transparent bg-gradient-primary text-primary-foreground shadow-soft"
          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export { findRingtoneName };