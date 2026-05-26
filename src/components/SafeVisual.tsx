import { useEffect, useRef } from "react";
import type { SafePhase } from "../safe/types";
import { SafeTreasureBurst } from "./SafeTreasureBurst";

type Props = {
  display: [string, string, string];
  phase: SafePhase;
  popIndex?: number | null;
  compact?: boolean;
  /** OBS: ?chroma=1 — без внешних теней/свечений */
  chroma?: boolean;
  /** Конфетти/алмазы — только внутри интерьера */
  burstActive?: boolean;
};

const MOUNTAIN_GEMS: {
  left: number;
  bottom: number;
  size: number;
  color: string;
  highlight: string;
  delay: number;
}[] = [
  { left: 4, bottom: 0, size: 44, color: "#0891b2", highlight: "#67e8f9", delay: 0.5 },
  { left: 16, bottom: 2, size: 52, color: "#0e7490", highlight: "#a5f3fc", delay: 0.55 },
  { left: 28, bottom: 0, size: 58, color: "#0284c7", highlight: "#7dd3fc", delay: 0.52 },
  { left: 40, bottom: 4, size: 64, color: "#0369a1", highlight: "#bae6fd", delay: 0.58 },
  { left: 52, bottom: 0, size: 68, color: "#1d4ed8", highlight: "#38bdf8", delay: 0.54 },
  { left: 64, bottom: 2, size: 56, color: "#155e75", highlight: "#22d3ee", delay: 0.6 },
  { left: 76, bottom: 0, size: 48, color: "#047857", highlight: "#6ee7b7", delay: 0.62 },
  { left: 10, bottom: 14, size: 40, color: "#a21caf", highlight: "#f0abfc", delay: 0.65 },
  { left: 22, bottom: 18, size: 46, color: "#ca8a04", highlight: "#fde047", delay: 0.63 },
  { left: 34, bottom: 22, size: 50, color: "#1e40af", highlight: "#93c5fd", delay: 0.68 },
  { left: 46, bottom: 24, size: 54, color: "#0f766e", highlight: "#5eead4", delay: 0.66 },
  { left: 58, bottom: 20, size: 48, color: "#6d28d9", highlight: "#c4b5fd", delay: 0.7 },
  { left: 70, bottom: 16, size: 42, color: "#be185d", highlight: "#f9a8d4", delay: 0.72 },
  { left: 18, bottom: 32, size: 36, color: "#059669", highlight: "#a7f3d0", delay: 0.75 },
  { left: 30, bottom: 36, size: 40, color: "#d97706", highlight: "#fcd34d", delay: 0.73 },
  { left: 42, bottom: 38, size: 44, color: "#0e7490", highlight: "#67e8f9", delay: 0.78 },
  { left: 54, bottom: 34, size: 38, color: "#7c3aed", highlight: "#ddd6fe", delay: 0.76 },
  { left: 38, bottom: 48, size: 32, color: "#ca8a04", highlight: "#fef08a", delay: 0.82 },
  { left: 48, bottom: 50, size: 28, color: "#2563eb", highlight: "#93c5fd", delay: 0.85 },
  { left: 82, bottom: 10, size: 36, color: "#15803d", highlight: "#86efac", delay: 0.74 },
  { left: 2, bottom: 10, size: 34, color: "#e11d48", highlight: "#fda4af", delay: 0.71 },
];

export function SafeVisual({
  display,
  phase,
  popIndex = null,
  compact = false,
  chroma = false,
  burstActive = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const interiorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (popIndex === null || popIndex === undefined || !rootRef.current) return;
    const el = rootRef.current.querySelector(`[data-digit-idx="${popIndex}"]`);
    if (!el) return;
    el.classList.remove("safe-digit--pop");
    void (el as HTMLElement).offsetWidth;
    el.classList.add("safe-digit--pop");
  }, [popIndex, display.join("")]);

  const isFail = phase === "fail";
  const isOpen = phase === "success";
  const scale = compact ? 0.52 : 1;

  return (
    <div
      ref={rootRef}
      className={[
        "safe-visual",
        compact ? "safe-visual--compact" : "",
        chroma ? "safe-visual--chroma" : "",
        isFail ? "safe-visual--fail" : "",
        isOpen ? "safe-visual--unlocking safe-visual--open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={compact}
    >
      {!chroma && <div className="safe-visual__shadow" />}

      <div className="safe-visual__body">
        <div className="safe-visual__rim" />

        {/* Всё сокровище и эффекты — только здесь, overflow:hidden для OBS */}
        <div ref={interiorRef} className="safe-visual__interior">
          <div className="safe-visual__inner-glow" />

          <div className="safe-visual__mountain" aria-hidden>
            <div className="safe-visual__mountain-base" />
            <div className="safe-visual__mountain-gems">
              {MOUNTAIN_GEMS.map((g, i) => (
                <span
                  key={i}
                  className="safe-visual__mountain-gem"
                  style={{
                    left: `${g.left}%`,
                    bottom: `${g.bottom}%`,
                    width: g.size * scale,
                    height: g.size * scale * 1.15,
                    animationDelay: `${g.delay}s`,
                    backgroundColor: g.color,
                    boxShadow: `inset 0 2px 0 ${g.highlight}, inset 0 -3px 0 rgba(0,0,0,0.35)`,
                  }}
                />
              ))}
            </div>
          </div>

          <SafeTreasureBurst
            clipRef={interiorRef}
            originX={0.5}
            originY={0.72}
            active={burstActive && isOpen}
          />

          <div className="safe-visual__light-burst" aria-hidden />
          <div className="safe-visual__sparkles" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="safe-visual__spark" style={{ animationDelay: `${0.7 + i * 0.08}s` }} />
            ))}
          </div>
        </div>

        <div className="safe-visual__door">
          <div className="safe-visual__door-inner">
            <div className="safe-visual__handle" />
            <div className="safe-visual__dial">
              {display.map((ch, i) => (
                <span
                  key={i}
                  data-digit-idx={i}
                  className={`safe-digit ${ch !== "-" ? "safe-digit--filled" : ""}`}
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
          <div className="safe-visual__door-edge" aria-hidden />
        </div>

        <div className="safe-visual__hinge safe-visual__hinge--l" />
        <div className="safe-visual__hinge safe-visual__hinge--r" />
      </div>
    </div>
  );
}
