import { useCallback, useRef } from "react";
import { ensureAudioContext } from "./audio";
import type { WrongPreset } from "./theme";

/**
 * Звуки под пресеты неверного кода. Полностью процедурно через WebAudio.
 *  - cop: короткий свисток + два «бамса» дубинки
 *  - siren: вой сирены WEE-WAH (2 цикла)
 *  - lightning: грохот грома + резкий «крек»
 *  - bomb: шипение фитиля + жирный фарт-пук в конце
 *  - shake: ничего (используется обычный playReject)
 */
export function useWrongSound() {
  const lastPlay = useRef(0);

  return useCallback(async (preset: WrongPreset) => {
    if (preset === "shake") return;
    const now = Date.now();
    if (now - lastPlay.current < 200) return;
    lastPlay.current = now;

    try {
      const ctx = await ensureAudioContext();
      if (!ctx) return;

      if (preset === "cop") playCop(ctx);
      else if (preset === "siren") playSiren(ctx);
      else if (preset === "lightning") playLightning(ctx);
      else if (preset === "bomb") playBomb(ctx);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[useWrongSound] play failed", e);
    }
  }, []);
}

function playCop(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  // Свисток — две высокие синусоиды
  const whistle = (start: number, freq: number, dur: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, start);
    o.frequency.linearRampToValueAtTime(freq * 1.02, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
    g.gain.setValueAtTime(0.35, start + dur - 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g);
    g.connect(master);
    o.start(start);
    o.stop(start + dur + 0.04);
  };

  whistle(t0, 2200, 0.18);
  whistle(t0 + 0.22, 2600, 0.22);

  // «БАМ!» — два удара (низкий thump)
  const thump = (start: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(180, start);
    o.frequency.exponentialRampToValueAtTime(40, start + 0.18);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.6, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    o.connect(lp);
    lp.connect(g);
    g.connect(master);
    o.start(start);
    o.stop(start + 0.25);
    // высокочастотный «крек» сверху
    const n = ctx.createBufferSource();
    n.buffer = makeNoise(ctx, 0.05);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, start);
    ng.gain.exponentialRampToValueAtTime(0.35, start + 0.003);
    ng.gain.exponentialRampToValueAtTime(0.0001, start + 0.06);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200;
    n.connect(hp);
    hp.connect(ng);
    ng.connect(master);
    n.start(start);
    n.stop(start + 0.08);
  };

  thump(t0 + 0.78);
  thump(t0 + 1.14);
}

function playSiren(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  const dur = 2.3;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.4, t0 + 0.1);
  master.gain.setValueAtTime(0.4, t0 + dur - 0.4);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  master.connect(ctx.destination);

  // Основной тон с резкими переходами между низом и верхом — классика WEE-WAH
  const o = ctx.createOscillator();
  o.type = "sawtooth";
  // 4 цикла WEE-WAH за 2с
  const steps: { t: number; f: number }[] = [
    { t: 0, f: 520 },
    { t: 0.28, f: 880 },
    { t: 0.56, f: 520 },
    { t: 0.84, f: 880 },
    { t: 1.12, f: 520 },
    { t: 1.4, f: 880 },
    { t: 1.68, f: 520 },
    { t: 1.96, f: 880 },
  ];
  for (const s of steps) {
    o.frequency.setValueAtTime(s.f, t0 + s.t);
  }

  // Полосовой для красоты тембра
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 900;
  bp.Q.value = 3;

  o.connect(bp);
  bp.connect(master);
  o.start(t0);
  o.stop(t0 + dur);
}

function playLightning(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);

  // Резкий «крак!» — broadband шум через highpass
  const crackBuf = makeNoise(ctx, 0.4);
  const crack = ctx.createBufferSource();
  crack.buffer = crackBuf;
  const crackHp = ctx.createBiquadFilter();
  crackHp.type = "highpass";
  crackHp.frequency.value = 2200;
  const crackG = ctx.createGain();
  crackG.gain.setValueAtTime(0.0001, t0 + 0.14);
  crackG.gain.exponentialRampToValueAtTime(0.7, t0 + 0.16);
  crackG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
  crack.connect(crackHp);
  crackHp.connect(crackG);
  crackG.connect(master);
  crack.start(t0 + 0.14);
  crack.stop(t0 + 0.55);

  // Низкий рокот после удара — затухающий шум
  const rumbleBuf = makeNoise(ctx, 1.4);
  const rumble = ctx.createBufferSource();
  rumble.buffer = rumbleBuf;
  const rumbleLp = ctx.createBiquadFilter();
  rumbleLp.type = "lowpass";
  rumbleLp.frequency.setValueAtTime(280, t0 + 0.18);
  rumbleLp.frequency.linearRampToValueAtTime(120, t0 + 1.5);
  const rumbleG = ctx.createGain();
  rumbleG.gain.setValueAtTime(0.0001, t0 + 0.18);
  rumbleG.gain.exponentialRampToValueAtTime(0.55, t0 + 0.25);
  rumbleG.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
  rumble.connect(rumbleLp);
  rumbleLp.connect(rumbleG);
  rumbleG.connect(master);
  rumble.start(t0 + 0.18);
  rumble.stop(t0 + 1.65);
}

function playBomb(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  // ШИПЕНИЕ ФИТИЛЯ — широкополосный шум через bandpass, ~1.7с
  const fuseDur = 1.7;
  const fuseBuf = makeNoise(ctx, fuseDur);
  const fuse = ctx.createBufferSource();
  fuse.buffer = fuseBuf;
  const fuseBp = ctx.createBiquadFilter();
  fuseBp.type = "bandpass";
  fuseBp.frequency.value = 3400;
  fuseBp.Q.value = 1.6;
  const fuseG = ctx.createGain();
  fuseG.gain.setValueAtTime(0.0001, t0);
  fuseG.gain.exponentialRampToValueAtTime(0.22, t0 + 0.08);
  fuseG.gain.setValueAtTime(0.22, t0 + fuseDur - 0.1);
  fuseG.gain.exponentialRampToValueAtTime(0.0001, t0 + fuseDur);
  fuse.connect(fuseBp);
  fuseBp.connect(fuseG);
  fuseG.connect(master);
  fuse.start(t0);
  fuse.stop(t0 + fuseDur + 0.05);

  // === ПЕРДУШКА: жирный wet fart на месте взрыва ===
  const fartStart = t0 + 1.78;
  const fartDur = 0.6;

  // основной тон — низкая square с резким падением и вибрато
  const fart = ctx.createOscillator();
  fart.type = "square";
  fart.frequency.setValueAtTime(120, fartStart);
  // болтанка частоты для wet-эффекта
  fart.frequency.setValueAtTime(150, fartStart + 0.05);
  fart.frequency.setValueAtTime(95, fartStart + 0.12);
  fart.frequency.setValueAtTime(135, fartStart + 0.2);
  fart.frequency.setValueAtTime(82, fartStart + 0.3);
  fart.frequency.setValueAtTime(110, fartStart + 0.42);
  fart.frequency.exponentialRampToValueAtTime(55, fartStart + fartDur);

  const fartG = ctx.createGain();
  fartG.gain.setValueAtTime(0.0001, fartStart);
  fartG.gain.exponentialRampToValueAtTime(0.7, fartStart + 0.02);
  fartG.gain.setValueAtTime(0.55, fartStart + 0.3);
  fartG.gain.exponentialRampToValueAtTime(0.0001, fartStart + fartDur);

  // lowpass — придаёт мокроту
  const fartLp = ctx.createBiquadFilter();
  fartLp.type = "lowpass";
  fartLp.frequency.setValueAtTime(700, fartStart);
  fartLp.frequency.linearRampToValueAtTime(300, fartStart + fartDur);
  fartLp.Q.value = 4;

  fart.connect(fartLp);
  fartLp.connect(fartG);
  fartG.connect(master);
  fart.start(fartStart);
  fart.stop(fartStart + fartDur + 0.05);

  // wet-шум поверх — придаёт «склизкость»
  const wetBuf = makeNoise(ctx, fartDur);
  const wet = ctx.createBufferSource();
  wet.buffer = wetBuf;
  const wetLp = ctx.createBiquadFilter();
  wetLp.type = "lowpass";
  wetLp.frequency.value = 380;
  const wetG = ctx.createGain();
  wetG.gain.setValueAtTime(0.0001, fartStart);
  wetG.gain.exponentialRampToValueAtTime(0.3, fartStart + 0.02);
  wetG.gain.exponentialRampToValueAtTime(0.0001, fartStart + fartDur);
  wet.connect(wetLp);
  wetLp.connect(wetG);
  wetG.connect(master);
  wet.start(fartStart);
  wet.stop(fartStart + fartDur + 0.05);
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
