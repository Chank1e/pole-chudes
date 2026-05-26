import { useCallback, useRef } from "react";
import { ensureAudioContext } from "./audio";

type Note = { freq: number; start: number; duration: number; gain: number; type?: OscillatorType };

const FANFARE: Note[] = [
  { freq: 392, start: 0, duration: 0.12, gain: 0.14, type: "triangle" },
  { freq: 523.25, start: 0.1, duration: 0.12, gain: 0.16, type: "triangle" },
  { freq: 659.25, start: 0.2, duration: 0.14, gain: 0.18, type: "triangle" },
  { freq: 783.99, start: 0.32, duration: 0.22, gain: 0.2, type: "triangle" },
  { freq: 1046.5, start: 0.48, duration: 0.55, gain: 0.22, type: "sine" },
  { freq: 1318.51, start: 0.55, duration: 0.45, gain: 0.1, type: "sine" },
  { freq: 1567.98, start: 0.62, duration: 0.5, gain: 0.08, type: "sine" },
  { freq: 523.25, start: 0.75, duration: 0.08, gain: 0.12, type: "square" },
  { freq: 659.25, start: 0.83, duration: 0.08, gain: 0.12, type: "square" },
  { freq: 783.99, start: 0.91, duration: 0.08, gain: 0.12, type: "square" },
  { freq: 1046.5, start: 0.99, duration: 0.7, gain: 0.2, type: "triangle" },
];

const SHIMMER: Note[] = [
  { freq: 2093, start: 0.5, duration: 0.15, gain: 0.04, type: "sine" },
  { freq: 2637, start: 0.65, duration: 0.15, gain: 0.035, type: "sine" },
  { freq: 3136, start: 0.8, duration: 0.2, gain: 0.03, type: "sine" },
  { freq: 3520, start: 1.0, duration: 0.25, gain: 0.028, type: "sine" },
];

/** Triumphant fanfare — no external audio files. */
export function useVictorySound() {
  const playingRef = useRef(false);

  const play = useCallback(async () => {
    if (playingRef.current) return;
    playingRef.current = true;

    try {
      const ctx = await ensureAudioContext();
      if (!ctx) return;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.85, ctx.currentTime + 0.04);
      master.gain.setValueAtTime(0.85, ctx.currentTime + 1.6);
      master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);
      master.connect(ctx.destination);

      const playNotes = (notes: Note[]) => {
        for (const n of notes) {
          const t0 = ctx.currentTime + n.start;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = n.type ?? "triangle";
          osc.frequency.setValueAtTime(n.freq, t0);
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(n.gain, t0 + 0.018);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.duration);
          osc.connect(g);
          g.connect(master);
          osc.start(t0);
          osc.stop(t0 + n.duration + 0.05);
        }
      };

      playNotes(FANFARE);
      playNotes(SHIMMER);

      const chordT = ctx.currentTime + 0.48;
      [523.25, 659.25, 783.99, 987.77].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, chordT);
        g.gain.setValueAtTime(0.0001, chordT);
        g.gain.exponentialRampToValueAtTime(0.06 - i * 0.008, chordT + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, chordT + 1.1);
        osc.connect(g);
        g.connect(master);
        osc.start(chordT);
        osc.stop(chordT + 1.2);
      });

      setTimeout(() => {
        playingRef.current = false;
      }, 2400);
    } catch {
      playingRef.current = false;
    }
  }, []);

  return play;
}
