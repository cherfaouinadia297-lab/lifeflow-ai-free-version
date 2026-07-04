// Extended ringtone catalog for the Wake Up module.
// Uses the Web Audio API to synthesize 40+ unique built-in tones so we
// don't ship any binary assets. Custom user-imported tracks are played
// through <audio> from a Blob URL.

export type RingtoneCategory =
  | "classic"
  | "gentle"
  | "loud"
  | "nature"
  | "rain"
  | "meditation"
  | "digital"
  | "bells"
  | "electronic"
  | "funny";

export interface RingtoneDef {
  id: string;
  name: string;
  category: RingtoneCategory;
  /** description shown under name */
  hint?: string;
  /** builder params for the synth engine */
  synth: SynthPattern;
}

export interface SynthPattern {
  /** note frequencies in Hz played sequentially */
  notes: number[];
  /** duration per note in seconds */
  noteDur: number;
  /** gap between notes in seconds */
  gap: number;
  /** oscillator type */
  wave: OscillatorType;
  /** whether to loop the melody (repeat during the total window) */
  loop?: boolean;
  /** optional detune in cents added to a second osc for chorus-like body */
  chorus?: number;
  /** attack seconds — smaller = punchier, larger = gentler */
  attack?: number;
  /** release seconds — larger = smoother tail */
  release?: number;
  /** vibrato depth in Hz */
  vibrato?: number;
  /** optional white-noise burst amount (0..1) for rain/nature textures */
  noise?: number;
}

export const RINGTONE_CATEGORIES: { id: RingtoneCategory; label: string; emoji: string }[] = [
  { id: "classic", label: "Classic", emoji: "⏰" },
  { id: "gentle", label: "Gentle", emoji: "🌸" },
  { id: "loud", label: "Loud", emoji: "📢" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "rain", label: "Rain & Ocean", emoji: "🌧️" },
  { id: "meditation", label: "Meditation", emoji: "🧘" },
  { id: "digital", label: "Digital", emoji: "💾" },
  { id: "bells", label: "Bells", emoji: "🔔" },
  { id: "electronic", label: "Electronic", emoji: "🎛️" },
  { id: "funny", label: "Funny", emoji: "😄" },
];

export const BUILT_IN_RINGTONES: RingtoneDef[] = [
  // Classic (4)
  { id: "clx-morning",  name: "Morning Bell",     category: "classic", synth: { notes: [880, 660, 880, 660], noteDur: 0.18, gap: 0.05, wave: "sine", loop: true } },
  { id: "clx-retro",    name: "Retro Alarm",      category: "classic", synth: { notes: [1000, 700], noteDur: 0.12, gap: 0.06, wave: "square", loop: true } },
  { id: "clx-analog",   name: "Analog Clock",     category: "classic", synth: { notes: [520, 780, 520, 780], noteDur: 0.15, gap: 0.05, wave: "triangle", loop: true, chorus: 6 } },
  { id: "clx-buzzer",   name: "Old Buzzer",       category: "classic", synth: { notes: [420, 420], noteDur: 0.25, gap: 0.08, wave: "sawtooth", loop: true } },
  // Gentle (4)
  { id: "gen-sunrise",  name: "Sunrise",          category: "gentle", synth: { notes: [523.25, 659.25, 783.99], noteDur: 0.4, gap: 0.1, wave: "sine", loop: true, attack: 0.15, release: 0.4 } },
  { id: "gen-feather",  name: "Feather",          category: "gentle", synth: { notes: [440, 554.37, 659.25], noteDur: 0.5, gap: 0.15, wave: "sine", loop: true, attack: 0.2, release: 0.5 } },
  { id: "gen-soft",     name: "Soft Chime",       category: "gentle", synth: { notes: [659, 987, 1318], noteDur: 0.6, gap: 0.2, wave: "triangle", loop: true, attack: 0.25, release: 0.6 } },
  { id: "gen-dew",      name: "Morning Dew",      category: "gentle", synth: { notes: [392, 523, 659, 783], noteDur: 0.35, gap: 0.12, wave: "sine", loop: true, attack: 0.18, release: 0.4, chorus: 4 } },
  // Loud (4)
  { id: "loud-siren",   name: "Siren",            category: "loud", synth: { notes: [900, 1400], noteDur: 0.25, gap: 0.0, wave: "sawtooth", loop: true, vibrato: 20 } },
  { id: "loud-air",     name: "Air Horn",         category: "loud", synth: { notes: [220, 260, 220], noteDur: 0.4, gap: 0.05, wave: "sawtooth", loop: true } },
  { id: "loud-fire",    name: "Fire Bell",        category: "loud", synth: { notes: [1200, 1200, 1200, 1200], noteDur: 0.08, gap: 0.04, wave: "square", loop: true } },
  { id: "loud-truck",   name: "Truck Alarm",      category: "loud", synth: { notes: [700, 1000, 700, 1000], noteDur: 0.1, gap: 0.03, wave: "square", loop: true } },
  // Nature (4)
  { id: "nat-birds",    name: "Morning Birds",    category: "nature", synth: { notes: [2100, 2400, 1900, 2600], noteDur: 0.09, gap: 0.18, wave: "sine", loop: true, attack: 0.02, release: 0.15 } },
  { id: "nat-crickets", name: "Crickets",         category: "nature", synth: { notes: [3000, 3000], noteDur: 0.04, gap: 0.06, wave: "triangle", loop: true, noise: 0.05 } },
  { id: "nat-forest",   name: "Forest",           category: "nature", synth: { notes: [1800, 2200, 1600], noteDur: 0.12, gap: 0.25, wave: "sine", loop: true, noise: 0.08 } },
  { id: "nat-frog",     name: "Frog Pond",        category: "nature", synth: { notes: [180, 200, 180], noteDur: 0.12, gap: 0.4, wave: "sawtooth", loop: true } },
  // Rain & Ocean (4)
  { id: "rain-soft",    name: "Soft Rain",        category: "rain", synth: { notes: [200], noteDur: 1.0, gap: 0.0, wave: "sine", loop: true, noise: 0.9, attack: 0.5, release: 0.5 } },
  { id: "rain-storm",   name: "Rain Storm",       category: "rain", synth: { notes: [120], noteDur: 1.2, gap: 0.0, wave: "sine", loop: true, noise: 1.0, attack: 0.3, release: 0.3 } },
  { id: "rain-ocean",   name: "Ocean Waves",      category: "rain", synth: { notes: [80, 100], noteDur: 1.8, gap: 0.0, wave: "sine", loop: true, noise: 0.7, attack: 0.8, release: 0.8 } },
  { id: "rain-brook",   name: "Bubbling Brook",   category: "rain", synth: { notes: [300, 500], noteDur: 0.6, gap: 0.0, wave: "triangle", loop: true, noise: 0.5 } },
  // Meditation (4)
  { id: "med-om",       name: "Om Chant",         category: "meditation", synth: { notes: [130, 195], noteDur: 2.0, gap: 0.2, wave: "sine", loop: true, attack: 0.6, release: 1.0, chorus: 8 } },
  { id: "med-tibetan",  name: "Tibetan Bowl",     category: "meditation", synth: { notes: [220, 330, 440], noteDur: 2.5, gap: 0.4, wave: "sine", loop: true, attack: 0.4, release: 1.5, chorus: 12, vibrato: 3 } },
  { id: "med-crystal",  name: "Crystal Bowl",     category: "meditation", synth: { notes: [523, 659, 783], noteDur: 2.0, gap: 0.3, wave: "sine", loop: true, attack: 0.5, release: 1.2, chorus: 15 } },
  { id: "med-mantra",   name: "Mantra",           category: "meditation", synth: { notes: [147, 220, 293], noteDur: 1.8, gap: 0.25, wave: "sine", loop: true, attack: 0.5, release: 1.0, chorus: 6 } },
  // Digital (4)
  { id: "dig-beep",     name: "Digital Beep",     category: "digital", synth: { notes: [1200, 900, 1200, 900, 1200, 900], noteDur: 0.08, gap: 0.04, wave: "square", loop: true } },
  { id: "dig-arcade",   name: "Arcade",           category: "digital", synth: { notes: [660, 880, 1100, 880], noteDur: 0.1, gap: 0.03, wave: "square", loop: true } },
  { id: "dig-pulse",    name: "Data Pulse",       category: "digital", synth: { notes: [1500, 1500, 1500], noteDur: 0.06, gap: 0.06, wave: "square", loop: true } },
  { id: "dig-radar",    name: "Radar Ping",       category: "digital", synth: { notes: [1000], noteDur: 0.15, gap: 0.85, wave: "sine", loop: true, release: 0.4 } },
  // Bells (4)
  { id: "bell-church",  name: "Church Bell",      category: "bells", synth: { notes: [523, 391], noteDur: 1.5, gap: 0.5, wave: "triangle", loop: true, release: 1.2, chorus: 10 } },
  { id: "bell-desk",    name: "Desk Bell",        category: "bells", synth: { notes: [1318], noteDur: 1.2, gap: 0.6, wave: "sine", loop: true, release: 1.0, chorus: 4 } },
  { id: "bell-wind",    name: "Wind Chimes",      category: "bells", synth: { notes: [1046, 1318, 1568, 2093], noteDur: 0.7, gap: 0.2, wave: "sine", loop: true, release: 0.8, chorus: 6 } },
  { id: "bell-cow",     name: "Cowbell",          category: "bells", synth: { notes: [560, 800], noteDur: 0.14, gap: 0.14, wave: "square", loop: true, release: 0.1 } },
  // Electronic (4)
  { id: "elec-synth",   name: "Synthwave",        category: "electronic", synth: { notes: [220, 330, 440, 330], noteDur: 0.18, gap: 0.02, wave: "sawtooth", loop: true, chorus: 8 } },
  { id: "elec-house",   name: "House Beat",       category: "electronic", synth: { notes: [80, 80, 80, 80], noteDur: 0.1, gap: 0.15, wave: "sine", loop: true } },
  { id: "elec-laser",   name: "Laser",            category: "electronic", synth: { notes: [2000, 400], noteDur: 0.25, gap: 0.1, wave: "sawtooth", loop: true, vibrato: 40 } },
  { id: "elec-modem",   name: "Modem",            category: "electronic", synth: { notes: [1200, 2400, 900, 1800], noteDur: 0.12, gap: 0.02, wave: "square", loop: true, noise: 0.2 } },
  // Funny (4)
  { id: "fun-duck",     name: "Rubber Duck",      category: "funny", synth: { notes: [400, 800], noteDur: 0.12, gap: 0.3, wave: "square", loop: true } },
  { id: "fun-boing",    name: "Boing",            category: "funny", synth: { notes: [200, 800, 200], noteDur: 0.2, gap: 0.2, wave: "sine", loop: true, vibrato: 50 } },
  { id: "fun-slide",    name: "Slide Whistle",    category: "funny", synth: { notes: [300, 600, 1200, 600, 300], noteDur: 0.15, gap: 0.02, wave: "triangle", loop: true } },
  { id: "fun-cluck",    name: "Chicken Cluck",    category: "funny", synth: { notes: [800, 600, 800, 600], noteDur: 0.06, gap: 0.14, wave: "square", loop: true } },
];

// ---------- Audio engine ----------

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Playing {
  stop: () => void;
}

let current: Playing | null = null;

/** Play a builtin ringtone by id. Returns a stop function. */
export function playBuiltin(id: string, options: { volume?: number; fadeIn?: number; duration?: number } = {}): () => void {
  const def = BUILT_IN_RINGTONES.find((r) => r.id === id);
  if (!def) return () => {};
  const c = getCtx();
  if (!c) return () => {};
  stopCurrent();

  const vol = Math.max(0, Math.min(1, options.volume ?? 0.6));
  const fadeIn = Math.max(0, options.fadeIn ?? 0);
  const totalDuration = options.duration ?? 6; // preview default

  const master = c.createGain();
  master.gain.setValueAtTime(fadeIn > 0 ? 0.0001 : vol, c.currentTime);
  if (fadeIn > 0) master.gain.exponentialRampToValueAtTime(vol, c.currentTime + fadeIn);
  master.connect(c.destination);

  const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  const s = def.synth;
  const patternDur = s.notes.length * (s.noteDur + s.gap);
  const iterations = s.loop ? Math.max(1, Math.ceil(totalDuration / patternDur)) : 1;

  for (let i = 0; i < iterations; i++) {
    for (let n = 0; n < s.notes.length; n++) {
      const startAt = c.currentTime + i * patternDur + n * (s.noteDur + s.gap);
      const freq = s.notes[n];
      const g = c.createGain();
      const attack = s.attack ?? 0.02;
      const release = s.release ?? Math.max(0.05, s.noteDur * 0.4);
      g.gain.setValueAtTime(0.0001, startAt);
      g.gain.exponentialRampToValueAtTime(1, startAt + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + s.noteDur + release);
      g.connect(master);

      const osc = c.createOscillator();
      osc.type = s.wave;
      osc.frequency.setValueAtTime(freq, startAt);
      if (s.vibrato) {
        const lfo = c.createOscillator();
        const lfoGain = c.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = s.vibrato;
        lfo.connect(lfoGain).connect(osc.frequency);
        lfo.start(startAt);
        lfo.stop(startAt + s.noteDur + release);
      }
      osc.connect(g);
      osc.start(startAt);
      osc.stop(startAt + s.noteDur + release + 0.05);
      nodes.push(osc);

      if (s.chorus) {
        const osc2 = c.createOscillator();
        osc2.type = s.wave;
        osc2.frequency.setValueAtTime(freq, startAt);
        osc2.detune.value = s.chorus;
        osc2.connect(g);
        osc2.start(startAt);
        osc2.stop(startAt + s.noteDur + release + 0.05);
        nodes.push(osc2);
      }

      if (s.noise && s.noise > 0) {
        const bufferSize = Math.max(1, Math.floor(c.sampleRate * s.noteDur));
        const buf = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let k = 0; k < bufferSize; k++) data[k] = (Math.random() * 2 - 1) * s.noise;
        const noiseSrc = c.createBufferSource();
        noiseSrc.buffer = buf;
        const ng = c.createGain();
        ng.gain.value = 0.4;
        noiseSrc.connect(ng).connect(master);
        noiseSrc.start(startAt);
        noiseSrc.stop(startAt + s.noteDur);
        nodes.push(noiseSrc);
      }
    }
  }

  const stop = () => {
    try {
      master.gain.cancelScheduledValues(c.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.1);
    } catch { /* noop */ }
    setTimeout(() => {
      for (const n of nodes) { try { n.stop(); } catch { /* noop */ } }
      try { master.disconnect(); } catch { /* noop */ }
    }, 150);
    if (current && current.stop === stop) current = null;
  };
  current = { stop };
  return stop;
}

export function stopCurrent() {
  if (current) {
    try { current.stop(); } catch { /* noop */ }
    current = null;
  }
}

// ---------- Custom user ringtones ----------

export interface CustomRingtone {
  id: string; // custom-<uuid>
  name: string;
  mime: string;
  size: number;
  /** base64 data URL — persisted in localStorage for offline access */
  dataUrl: string;
  addedAt: number;
}

let currentAudio: HTMLAudioElement | null = null;
export function playCustom(dataUrl: string, options: { volume?: number; fadeIn?: number } = {}): () => void {
  stopCustom();
  const audio = new Audio(dataUrl);
  audio.loop = true;
  const vol = Math.max(0, Math.min(1, options.volume ?? 0.6));
  const fadeIn = Math.max(0, options.fadeIn ?? 0);
  audio.volume = fadeIn > 0 ? 0 : vol;
  void audio.play().catch(() => {});
  if (fadeIn > 0) {
    const steps = 20;
    const stepMs = (fadeIn * 1000) / steps;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      audio.volume = Math.min(vol, (i / steps) * vol);
      if (i >= steps) clearInterval(iv);
    }, stepMs);
  }
  currentAudio = audio;
  return () => {
    audio.pause();
    audio.src = "";
    if (currentAudio === audio) currentAudio = null;
  };
}

export function stopCustom() {
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.src = ""; } catch { /* noop */ }
    currentAudio = null;
  }
}

export function stopAllPreview() {
  stopCurrent();
  stopCustom();
}

/** Play any ringtone by id — builtin id or custom (looked up in the provided list). */
export function playAny(
  id: string,
  customs: CustomRingtone[],
  opts: { volume?: number; fadeIn?: number; duration?: number } = {},
): () => void {
  if (id.startsWith("custom-")) {
    const c = customs.find((x) => x.id === id);
    if (!c) return () => {};
    return playCustom(c.dataUrl, opts);
  }
  return playBuiltin(id, opts);
}

export function findRingtoneName(id: string, customs: CustomRingtone[]): string {
  if (id.startsWith("custom-")) {
    return customs.find((c) => c.id === id)?.name ?? "Custom";
  }
  return BUILT_IN_RINGTONES.find((r) => r.id === id)?.name ?? "—";
}