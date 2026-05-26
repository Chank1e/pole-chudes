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
  anchorRef: RefObject<HTMLDivElement | null>;
  /** Normalized spawn origin inside stage (0–1). */
  originX?: number;
  originY?: number;
  active: boolean;
};

const CONFETTI_HUES = [45, 330, 200, 140, 280, 15, 185];

function spawnFromPile(
  particles: Particle[],
  ox: number,
  oy: number,
  gems: number,
  confetti: number,
) {
  for (let i = 0; i < gems; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const spd = 5 + Math.random() * 11;
    particles.push({
      kind: "diamond",
      x: ox + (Math.random() - 0.5) * 36,
      y: oy + (Math.random() - 0.5) * 20,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.22,
      w: 7 + Math.random() * 12,
      h: 7 + Math.random() * 12,
      hue: 185 + Math.random() * 50,
      sat: 90 + Math.random() * 10,
      life: 1,
      decay: 0.0028 + Math.random() * 0.002,
    });
  }
  for (let i = 0; i < confetti; i++) {
    const ang = (Math.random() - 0.5) * Math.PI * 1.35 - Math.PI / 2;
    const spd = 6 + Math.random() * 14;
    particles.push({
      kind: "confetti",
      x: ox + (Math.random() - 0.5) * 48,
      y: oy + (Math.random() - 0.5) * 24,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      w: 5 + Math.random() * 8,
      h: 8 + Math.random() * 14,
      hue: CONFETTI_HUES[Math.floor(Math.random() * CONFETTI_HUES.length)]!,
      sat: 85 + Math.random() * 15,
      life: 1,
      decay: 0.003 + Math.random() * 0.0025,
    });
  }
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  a: number,
) {
  const s = p.w;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = a;
  const grad = ctx.createLinearGradient(-s, -s, s, s);
  grad.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, 78%, 1)`);
  grad.addColorStop(0.45, `hsla(${p.hue + 20}, 100%, 92%, 1)`);
  grad.addColorStop(1, `hsla(${p.hue + 8}, ${p.sat}%, 48%, 1)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.75, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.75, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `hsla(${p.hue}, 100%, 98%, ${0.45 * a})`;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}

function drawConfetti(ctx: CanvasRenderingContext2D, p: Particle, a: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = a * 0.95;
  ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, 58%, 1)`;
  ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
  ctx.fillStyle = `hsla(${p.hue}, 100%, 82%, ${0.35 * a})`;
  ctx.fillRect(-p.w / 4, -p.h / 4, p.w / 2, p.h / 3);
  ctx.restore();
}

export function SafeTreasureBurst({
  anchorRef,
  originX = 0.5,
  originY = 0.52,
  active,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const anchor = anchorRef.current;
    if (!canvas || !anchor) return;
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
      const el = anchorRef.current;
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
    ro.observe(anchor);

    const burst = () => spawnFromPile(particles, ox, oy, 22, 28);
    burst();
    setTimeout(burst, 400);
    setTimeout(burst, 900);

    const step = (now: number) => {
      const rawDt = now - last;
      last = now;
      elapsed += rawDt;
      const dt = Math.min(28, rawDt) / 16.67;

      if (elapsed > 600 && elapsed < duration - 500 && Math.random() < 0.14) {
        spawnFromPile(particles, ox, oy, 4, 8);
      }

      const w = bounds.w;
      const h = bounds.h;
      ctx.clearRect(0, 0, w, h);

      const grav = 0.13 * dt;
      const wind = Math.sin(elapsed * 0.002) * 0.08 * dt;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.vy += grav;
        p.vx += wind;
        p.vx *= Math.pow(0.992, dt);
        p.vy *= Math.pow(0.998, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= p.decay * dt * 18;
        if (p.y > h + 50 || p.x < -40 || p.x > w + 40 || p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const a = Math.max(0, Math.min(1, p.life));
        if (p.kind === "diamond") drawDiamond(ctx, p, a);
        else drawConfetti(ctx, p, a);
      }

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
    };
  }, [active, anchorRef, originX, originY]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="safe-treasure-burst" aria-hidden />;
}
