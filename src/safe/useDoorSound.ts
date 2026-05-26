import { useCallback, useRef } from "react";
import { ensureAudioContext } from "./audio";
import type { DoorSound } from "./theme";

/**
 * Процедурные звуки открытия двери. Никаких mp3 — всё генерируется WebAudio.
 *  - creak: длинный «скрип» (FM-модуляция + шуршащий шум, медленный sweep частоты)
 *  - metal: тяжёлый металлический лязг с эхом
 *  - magic: мистический «вуш» с подъёмом тона
 */
export function useDoorSound() {
  const lastPlay = useRef(0);

  return useCallback(async (preset: DoorSound) => {
    if (preset === "off") return;
    const now = Date.now();
    if (now - lastPlay.current < 250) return;
    lastPlay.current = now;

    try {
      const ctx = await ensureAudioContext();
      if (!ctx) return;

      if (preset === "creak") playCreak(ctx);
      else if (preset === "metal") playMetal(ctx);
      else if (preset === "magic") playMagic(ctx);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[useDoorSound] play failed", e);
    }
  }, []);
}

function playCreak(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  const dur = 1.6;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.45, t0 + 0.08);
  master.gain.setValueAtTime(0.45, t0 + dur - 0.4);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  master.connect(ctx.destination);

  // основной «скрипящий» тон — saw с медленным sweep вверх-вниз
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, t0);
  osc.frequency.linearRampToValueAtTime(320, t0 + 0.6);
  osc.frequency.linearRampToValueAtTime(260, t0 + 1.0);
  osc.frequency.linearRampToValueAtTime(340, t0 + dur);

  // лёгкое вибрато для «дрожащего» скрипа
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(7, t0);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(28, t0);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  // резонансный полосовой фильтр — «деревянный» оттенок
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(420, t0);
  bp.frequency.linearRampToValueAtTime(700, t0 + dur);
  bp.Q.setValueAtTime(7, t0);

  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.6;
  osc.connect(bp);
  bp.connect(oscGain);
  oscGain.connect(master);

  // подмешиваем шуршащий шум
  const noiseBuf = makeNoise(ctx, dur + 0.1);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseBp = ctx.createBiquadFilter();
  noiseBp.type = "bandpass";
  noiseBp.frequency.setValueAtTime(1400, t0);
  noiseBp.Q.setValueAtTime(4, t0);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, t0);
  noiseGain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.05);
  noiseGain.gain.exponentialRampToValueAtTime(0.06, t0 + dur);
  noise.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(master);

  osc.start(t0);
  osc.stop(t0 + dur);
  lfo.start(t0);
  lfo.stop(t0 + dur);
  noise.start(t0);
  noise.stop(t0 + dur + 0.05);
}

function playMetal(ctx: AudioContext) {
  const t0 = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  // эхо
  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = 0.18;
  const fb = ctx.createGain();
  fb.gain.value = 0.42;
  const echoOut = ctx.createGain();
  echoOut.gain.value = 0.45;
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(echoOut);
  echoOut.connect(master);

  const clank = (start: number, freq: number, gain: number) => {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc2.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, start + 0.4);
    osc2.frequency.setValueAtTime(freq * 1.51, start);
    osc2.frequency.exponentialRampToValueAtTime(freq * 0.78, start + 0.4);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 280;

    osc.connect(g);
    osc2.connect(g);
    g.connect(hp);
    hp.connect(master);
    hp.connect(delay);
    osc.start(start);
    osc2.start(start);
    osc.stop(start + 0.6);
    osc2.stop(start + 0.6);
  };

  clank(t0, 520, 0.35);
  clank(t0 + 0.22, 380, 0.28);
  clank(t0 + 0.55, 280, 0.32);

  // финальный «скрежет» — шум через резонатор
  const noise = ctx.createBufferSource();
  noise.buffer = makeNoise(ctx, 0.9);
  const nf = ctx.createBiquadFilter();
  nf.type = "bandpass";
  nf.frequency.setValueAtTime(2200, t0 + 0.6);
  nf.frequency.linearRampToValueAtTime(900, t0 + 1.4);
  nf.Q.value = 8;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t0 + 0.6);
  ng.gain.exponentialRampToValueAtTime(0.18, t0 + 0.7);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
  noise.connect(nf);
  nf.connect(ng);
  ng.connect(master);
  noise.start(t0 + 0.6);
  noise.stop(t0 + 1.5);
}

function playMagic(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  const dur = 1.4;

  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  // основной «свуш» — сладкий sweep вверх с лёгким bend
  const baseFreqs = [220, 277, 330, 440];
  baseFreqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, t0);
    osc.frequency.exponentialRampToValueAtTime(f * 4, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18 - i * 0.025, t0 + 0.15 + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  });

  // мерцающие верхние гармоники
  for (let i = 0; i < 8; i++) {
    const start = t0 + 0.1 + i * 0.12;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const f = 1200 + Math.random() * 2400;
    osc.frequency.setValueAtTime(f, start);
    osc.frequency.exponentialRampToValueAtTime(f * 1.3, start + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(g);
    g.connect(master);
    osc.start(start);
    osc.stop(start + 0.35);
  }
}

function makeNoise(ctx: AudioContext, duration: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.85;
  }
  return buf;
}
