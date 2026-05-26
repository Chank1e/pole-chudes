import { type RefObject, useEffect, useRef } from "react";

type Gem = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  hue: number;
  life: number;
};

type Props = {
  anchorRef: RefObject<HTMLDivElement | null>;
  active: boolean;
};

export function DiamondRain({ anchorRef, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const anchor = anchorRef.current;
    if (!canvas || !anchor) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const gems: Gem[] = [];
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const duration = 7000;
    const bounds = { w: 1, h: 1 };

    const resize = () => {
      const el = anchorRef.current;
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

    const spawnBurst = (cx: number, cy: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
        const spd = 4 + Math.random() * 7;
        gems.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd * (0.6 + Math.random()),
          vy: Math.sin(ang) * spd - 2,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.2,
          size: 8 + Math.random() * 14,
          hue: 185 + Math.random() * 55,
          life: 1,
        });
      }
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(anchor);
    spawnBurst(bounds.w * 0.5, bounds.h * 0.42, 48);

    const step = (now: number) => {
      const rawDt = now - last;
      last = now;
      elapsed += rawDt;
      const dt = Math.min(28, rawDt) / 16.67;

      if (elapsed < duration && Math.random() < 0.1) {
        spawnBurst(bounds.w * (0.35 + Math.random() * 0.3), bounds.h * 0.38, 5);
      }

      const w = bounds.w;
      const h = bounds.h;
      ctx.clearRect(0, 0, w, h);

      const grav = 0.14 * dt;
      for (let i = gems.length - 1; i >= 0; i--) {
        const p = gems[i]!;
        p.vy += grav;
        p.vx *= Math.pow(0.99, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= 0.0035 * dt;
        if (p.y > h + 40 || p.life <= 0) {
          gems.splice(i, 1);
          continue;
        }

        const a = Math.max(0, Math.min(1, p.life));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = a;
        const grad = ctx.createLinearGradient(-p.size, -p.size, p.size, p.size);
        grad.addColorStop(0, `hsla(${p.hue}, 95%, 72%, 1)`);
        grad.addColorStop(0.5, `hsla(${p.hue + 25}, 100%, 88%, 1)`);
        grad.addColorStop(1, `hsla(${p.hue + 10}, 90%, 55%, 1)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.72, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.72, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `hsla(${p.hue}, 100%, 95%, ${0.35 * a})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
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
  }, [active, anchorRef]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="diamond-rain" aria-hidden />;
}
