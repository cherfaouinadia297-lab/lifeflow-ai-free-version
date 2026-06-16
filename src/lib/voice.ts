// Lightweight wrapper around the Web Speech API.
type SR = typeof window extends { SpeechRecognition: infer T } ? T : any;

export function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceSupported(): boolean {
  return !!getSpeechRecognition();
}

export interface VoiceSession {
  stop: () => void;
}

export function listenOnce(
  lang: string,
  onResult: (text: string) => void,
  onError?: (err: string) => void,
  onEnd?: () => void,
): VoiceSession | null {
  const Ctor = getSpeechRecognition();
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = lang;
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.continuous = false;
  r.onresult = (e: any) => {
    const text = e.results?.[0]?.[0]?.transcript ?? "";
    if (text) onResult(text);
  };
  r.onerror = (e: any) => onError?.(e?.error ?? "error");
  r.onend = () => onEnd?.();
  try { r.start(); } catch (e) { onError?.(String(e)); return null; }
  return { stop: () => { try { r.stop(); } catch {} } };
}
