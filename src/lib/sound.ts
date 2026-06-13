export type RingtoneId = "classic" | "chime" | "digital" | "bell" | "calm" | "alert";

export const RINGTONES: { id: RingtoneId; label: string }[] = [
  { id: "classic", label: "كلاسيكية" },
  { id: "chime", label: "رنين ناعم" },
  { id: "digital", label: "رقمية" },
  { id: "bell", label: "جرس" },
  { id: "calm", label: "هادئة" },
  { id: "alert", label: "تنبيه قوي" },
];

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(
  context: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, context.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, context.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
  osc.connect(gain).connect(context.destination);
  osc.start(context.currentTime + start);
  osc.stop(context.currentTime + start + duration + 0.05);
}

export function playRingtone(id: RingtoneId = "classic", volume = 0.5) {
  const c = getCtx();
  if (!c) return;
  const v = Math.max(0, Math.min(1, volume));
  switch (id) {
    case "classic":
      [0, 0.25, 0.5].forEach((t) => {
        beep(c, 880, t, 0.18, v, "sine");
        beep(c, 660, t + 0.09, 0.18, v * 0.8, "sine");
      });
      break;
    case "chime":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => beep(c, f, i * 0.18, 0.4, v * 0.6, "triangle"));
      break;
    case "digital":
      for (let i = 0; i < 6; i++) beep(c, i % 2 === 0 ? 1200 : 900, i * 0.12, 0.08, v, "square");
      break;
    case "bell":
      [0, 0.6].forEach((t) => {
        beep(c, 1318.5, t, 1.2, v * 0.6, "sine");
        beep(c, 1760, t, 1.0, v * 0.4, "sine");
      });
      break;
    case "calm":
      [440, 554.37, 659.25].forEach((f, i) => beep(c, f, i * 0.35, 0.8, v * 0.5, "sine"));
      break;
    case "alert":
      for (let i = 0; i < 8; i++) beep(c, i % 2 === 0 ? 1000 : 700, i * 0.1, 0.08, v, "sawtooth");
      break;
  }
}