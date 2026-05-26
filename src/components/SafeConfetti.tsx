import { type RefObject, useEffect, useRef } from "react";
import { DENSITY_CONFIG, type ConfettiDensity } from "../safe/theme";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  hue: number;
  sat: number;
  light: number;
  phase: number;
  sway: number;
};

/** Без зелёного (hsl 120) — не бьём по хромакею #00ff00. */
const HUES = [45, 330, 200, 280, 15, 185, 25, 300, 50, 320, 260, 350];

type Props = {
  /** Контейнер с overflow:hidden — конфетти не вылезет из интерьера сейфа. */
  clipRef: RefObject<HTMLDivElement | null>;
  active: boolean;
  density?: ConfettiDensity;
};

/**
 * Бесконечное конфетти за горой алмазов. Постоянно подсыпает новые частицы,
 * чтобы поток не пропадал, пока сейф открыт.
 */
export function SafeConfetti({ clipRef, active, density = "normal" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || density === "off") return;
    const config = DENSITY_CONFIG[density];
    const canvas = canvasRef.current;
    const clipEl = clipRef.current;
    if (!canvas || !clipEl) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const pieces: Piece[] = [];
    let raf = 0;
    let last = performance.now();
    const bounds = { w: 1, h: 1 };

    const resize = () => {
      const el = clipRef.current;
      if (!el || !canvas) return;
      bounds.w = Math.max(1, el.clientWidth);
      bounds.h = Math.max(1, el.clientHeight);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(bounds.w * dpr);
      canvas.height = Math.floor(bounds.h * dpr);
      canvas.style.width = `${bounds.w}px`;
      canvas.style.height = `${bounds.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const make = (fromTop: boolean): Piece => ({
      x: Math.random() * bounds.w,
      y: fromTop ? -10 - Math.random() * 80 : Math.random() * bounds.h * 0.6,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 0.8 + Math.random() * 2.2,
      w: 6 + Math.random() * 8,
      h: 9 + Math.random() * 14,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.28,
      hue: HUES[Math.floor(Math.random() * HUES.length)]!,
      sat: 85 + Math.random() * 15,
      light: 52 + Math.random() * 14,
      phase: Math.random() * Math.PI * 2,
      sway: 0.6 + Math.random() * 1.4,
    });

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(clipEl);

    // Стартовый «дождь» — сразу заполняем интерьер.
    for (let i = 0; i < config.initial; i++) pieces.push(make(false));

    const step = (now: number) => {
      const rawDt = now - last;
      last = now;
      const dt = Math.min(28, rawDt) / 16.67;

      // постоянная подсыпка сверху, чтобы поток не иссяк
      if (pieces.length < config.target && Math.random() < config.spawnChance) {
        const need = Math.min(config.spawnBurst, config.target - pieces.length);
        for (let i = 0; i < need; i++) pieces.push(make(true));
      }

      ctx.clearRect(0, 0, bounds.w, bounds.h);

      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i]!;
        p.phase += 0.06 * dt;
        p.vy += 0.018 * dt;
        p.x += (p.vx + Math.sin(p.phase) * p.sway * 0.35) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        if (p.y > bounds.h + 24 || p.x < -40 || p.x > bounds.w + 40) {
          pieces.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // лёгкое «мерцание» через изменение ширины — имитация переворота
        const flip = Math.cos(p.phase);
        ctx.scale(1, flip);
        ctx.fillStyle = `hsl(${p.hue}, ${p.sat}%, ${p.light}%)`;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active, clipRef, density]);

  if (!active || density === "off") return null;
  return <canvas ref={canvasRef} className="safe-visual__confetti" aria-hidden />;
}
