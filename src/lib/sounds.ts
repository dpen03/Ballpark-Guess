// Lightweight Web Audio sound effects -- no asset downloads, all synthesized.
// Quiet, kid-friendly, snappy.

let ctx: AudioContext | null = null;
let muted: boolean | null = null;

const STORAGE_KEY = "ballpark-muted";

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  if (muted !== null) return muted;
  if (typeof window === "undefined") return false;
  muted = window.localStorage.getItem(STORAGE_KEY) === "1";
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  }
}

function blip(
  freq: number,
  durationMs: number,
  type: OscillatorType = "sine",
  gain = 0.06,
) {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(c.destination);
  const now = c.currentTime;
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

function chord(freqs: number[], durationMs: number, gain = 0.05) {
  freqs.forEach((f, i) => setTimeout(() => blip(f, durationMs, "triangle", gain), i * 35));
}

export const sfx = {
  tap: () => blip(520, 70, "square", 0.04),
  lock: () => chord([523.25, 783.99], 180, 0.06), // C5 + G5
  unlock: () => blip(330, 90, "triangle", 0.05),
  correct: () => chord([523.25, 659.25, 783.99, 1046.5], 220, 0.07), // C E G C major
  wrong: () => chord([220, 196], 180, 0.05),
  countdown: () => blip(880, 60, "sine", 0.045),
  buzzer: () => blip(180, 280, "sawtooth", 0.06),
  cheer: () => chord([392, 523.25, 659.25, 880], 260, 0.07),
  scoreUp: () => blip(987.77, 110, "triangle", 0.06), // B5
};
