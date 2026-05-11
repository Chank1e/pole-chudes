import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  r: number;
  g: number;
  b: number;
  size: number;
  spark: boolean;
};

function pickColors(): [number, number, number] {
  const palettes: [number, number, number][] = [
    [246, 211, 101],
    [253, 160, 133],
    [70, 240, 165],
    [167, 139, 250],
    [255, 214, 102],
    [255, 92, 122],
  ];
  return palettes[Math.floor(Math.random() * palettes.length)]!;
}

function burst(
  particles: Particle[],
  cx: number,
  cy: number,
  count: number,
  power: number,
) {
  const [br, bg, bb] = pickColors();
  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const spd = power * (0.55 + Math.random() * 0.9);
    const jitter = 0.85 + Math.random() * 0.3;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(ang) * spd * jitter,
      vy: Math.sin(ang) * spd * jitter,
      life: 1,
      decay: 0.006 + Math.random() * 0.01,
      r: Math.min(255, br + Math.floor((Math.random() - 0.5) * 40)),
      g: Math.min(255, bg + Math.floor((Math.random() - 0.5) * 40)),
      b: Math.min(255, bb + Math.floor((Math.random() - 0.5) * 40)),
      size: 1.6 + Math.random() * 2.4,
      spark: Math.random() < 0.35,
    });
  }
}

function ring(particles: Particle[], cx: number, cy: number, n: number, speed: number) {
  const [br, bg, bb] = pickColors();
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      life: 1,
      decay: 0.0045 + Math.random() * 0.006,
      r: br,
      g: bg,
      b: bb,
      size: 2 + Math.random() * 1.5,
      spark: false,
    });
  }
}

type Props = {
  onDone?: () => void;
};

export function Fireworks({ onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const particles: Particle[] = [];
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const duration = 9000;
    let nextBurst = 0;
    let burstIndex = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const scheduleBurst = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * (0.15 + Math.random() * 0.7);
      const cy = h * (0.12 + Math.random() * 0.45);

      burst(particles, cx, cy, 72 + Math.floor(Math.random() * 40), 5 + Math.random() * 4);
      ring(particles, cx, cy, 28, 2.5 + Math.random() * 2);

      if (burstIndex % 3 === 0) {
        burst(
          particles,
          cx + (Math.random() - 0.5) * 80,
          cy + (Math.random() - 0.5) * 60,
          48,
          3.5,
        );
      }
      burstIndex += 1;
      nextBurst = t + 320 + Math.random() * 700;
    };

    const step = (now: number) => {
      const rawDt = now - last;
      last = now;
      const dt = Math.min(28, rawDt) / 16.67;

      elapsed += rawDt;
      if (elapsed >= nextBurst && elapsed < duration - 400) {
        scheduleBurst(elapsed);
      }

      ctx.fillStyle = "rgba(7, 10, 18, 0.14)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      const g = 0.11 * dt;
      const drag = Math.pow(0.985, dt);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.vy += g;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt * 18;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const a = Math.max(0, Math.min(1, p.life));
        ctx.globalAlpha = a * (p.spark ? 0.95 : 0.88);
        ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + 0.4 * a), 0, Math.PI * 2);
        ctx.fill();
        if (p.spark && a > 0.35) {
          ctx.globalAlpha = a * 0.35;
          ctx.fillRect(p.x - p.size * 3, p.y - 0.6, p.size * 6, 1.2);
        }
      }
      ctx.globalAlpha = 1;

      if (elapsed < duration) {
        raf = requestAnimationFrame(step);
      } else {
        window.removeEventListener("resize", resize);
        onDoneRef.current?.();
      }
    };

    scheduleBurst(-100);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fireworks" aria-hidden />;
}
