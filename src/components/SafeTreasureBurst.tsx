import { type RefObject, useEffect, useRef } from "react";

type ParticleKind = "confetti" | "diamond";

type Particle = {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  hue: number;
  sat: number;
  life: number;
  decay: number;
};

type Props = {
  /** Контейнер с overflow:hidden — частицы не выходят за сейф */
  clipRef: RefObject<HTMLDivElement | null>;
  originX?: number;
  originY?: number;
  active: boolean;
};

/** Без зелёного — не бить по хромакею #00ff00 */
const CONFETTI_HUES = [45, 330, 200, 280, 15, 185, 25, 300];

function spawnFromPile(
  particles: Particle[],
  ox: number,
  oy: number,
  w: number,
  h: number,
  gems: number,
  confetti: number,
) {
  const spreadX = w * 0.35;
  const spreadY = h * 0.12;

  for (let i = 0; i < gems; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const spd = 2.5 + Math.random() * 5;
    particles.push({
      kind: "diamond",
      x: ox + (Math.random() - 0.5) * spreadX,
      y: oy + (Math.random() - 0.5) * spreadY,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 2,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.18,
      w: 5 + Math.random() * 9,
      h: 5 + Math.random() * 9,
      hue: 185 + Math.random() * 50,
      sat: 90 + Math.random() * 10,
      life: 1,
      decay: 0.004 + Math.random() * 0.003,
    });
  }
  for (let i = 0; i < confetti; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
    const spd = 3 + Math.random() * 6;
    particles.push({
      kind: "confetti",
      x: ox + (Math.random() - 0.5) * spreadX,
      y: oy + (Math.random() - 0.5) * spreadY,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 2.5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.28,
      w: 4 + Math.random() * 6,
      h: 6 + Math.random() * 10,
      hue: CONFETTI_HUES[Math.floor(Math.random() * CONFETTI_HUES.length)]!,
      sat: 85 + Math.random() * 15,
      life: 1,
      decay: 0.0045 + Math.random() * 0.003,
    });
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, p: Particle, a: number) {
  const s = p.w;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = a;
  ctx.fillStyle = `hsl(${p.hue}, ${p.sat}%, 62%)`;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.75, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.75, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${0.5 * a})`;
  ctx.fillRect(-s * 0.2, -s * 0.55, s * 0.4, s * 0.35);
  ctx.restore();
}

function drawConfetti(ctx: CanvasRenderingContext2D, p: Particle, a: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = a * 0.95;
  ctx.fillStyle = `hsl(${p.hue}, ${p.sat}%, 52%)`;
  ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
  ctx.restore();
}

export function SafeTreasureBurst({
  clipRef,
  originX = 0.5,
  originY = 0.72,
  active,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const clipEl = clipRef.current;
    if (!canvas || !clipEl) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const particles: Particle[] = [];
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const duration = 9000;
    const bounds = { w: 1, h: 1 };
    let ox = 0;
    let oy = 0;

    const resize = () => {
      const el = clipRef.current;
      if (!el || !canvas) return;
      bounds.w = Math.max(1, el.clientWidth);
      bounds.h = Math.max(1, el.clientHeight);
      ox = bounds.w * originX;
      oy = bounds.h * originY;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(bounds.w * dpr);
      canvas.height = Math.floor(bounds.h * dpr);
      canvas.style.width = `${bounds.w}px`;
      canvas.style.height = `${bounds.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(clipEl);

    const burst = () => spawnFromPile(particles, ox, oy, bounds.w, bounds.h, 16, 20);
    burst();
    const t2 = setTimeout(burst, 450);
    const t3 = setTimeout(burst, 950);

    const step = (now: number) => {
      const rawDt = now - last;
      last = now;
      elapsed += rawDt;
      const dt = Math.min(28, rawDt) / 16.67;

      if (elapsed > 700 && elapsed < duration - 500 && Math.random() < 0.12) {
        spawnFromPile(particles, ox, oy, bounds.w, bounds.h, 3, 6);
      }

      const w = bounds.w;
      const h = bounds.h;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.clip();

      const grav = 0.11 * dt;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.vy += grav;
        p.vx *= Math.pow(0.99, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= p.decay * dt * 18;

        if (p.x < -8 || p.x > w + 8 || p.y < -8 || p.y > h + 8 || p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const a = Math.max(0, Math.min(1, p.life));
        if (p.kind === "diamond") drawDiamond(ctx, p, a);
        else drawConfetti(ctx, p, a);
      }
      ctx.restore();

      if (elapsed < duration) {
        raf = requestAnimationFrame(step);
      } else {
        ro.disconnect();
      }
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active, clipRef, originX, originY]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="safe-visual__burst-canvas" aria-hidden />;
}
