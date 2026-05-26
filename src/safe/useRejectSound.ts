import { useCallback } from "react";
import { ensureAudioContext } from "./audio";

/** Short buzz via Web Audio — no external assets. */
export function useRejectSound() {
  const play = useCallback(async () => {
    try {
      const ctx = await ensureAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      /* ignore */
    }
  }, []);

  return () => {
    void play();
  };
}
