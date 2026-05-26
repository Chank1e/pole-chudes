import { useEffect, useRef } from "react";
import type { SafePhase } from "../safe/types";
import { DiamondGem } from "./DiamondGem";

type Props = {
  display: [string, string, string];
  phase: SafePhase;
  popIndex?: number | null;
  compact?: boolean;
  chroma?: boolean;
  digitsRolling?: boolean;
};

/** Мало камней, но ОГРОМНЫХ — гора, не конфетти. */
const MEGA_GEMS = [
  { left: -10, bottom: -8, size: 118, layer: 1, color: "#0369a1", shine: "#7dd3fc", delay: 0.52 },
  { left: 8, bottom: -10, size: 148, layer: 2, color: "#0ea5e9", shine: "#bae6fd", delay: 0.58 },
  { left: 32, bottom: -8, size: 162, layer: 3, color: "#0284c7", shine: "#e0f2fe", delay: 0.55 },
  { left: 54, bottom: -6, size: 140, layer: 2, color: "#0891b2", shine: "#67e8f9", delay: 0.6 },
  { left: 74, bottom: -8, size: 115, layer: 1, color: "#155e75", shine: "#22d3ee", delay: 0.53 },
  { left: 0, bottom: 18, size: 98, layer: 2, color: "#1d4ed8", shine: "#93c5fd", delay: 0.68 },
  { left: 22, bottom: 24, size: 125, layer: 4, color: "#38bdf8", shine: "#f0f9ff", delay: 0.72 },
  { left: 46, bottom: 26, size: 112, layer: 3, color: "#06b6d4", shine: "#a5f3fc", delay: 0.7 },
  { left: 66, bottom: 20, size: 95, layer: 2, color: "#0e7490", shine: "#7dd3fc", delay: 0.74 },
  { left: 14, bottom: 44, size: 82, layer: 3, color: "#2563eb", shine: "#bfdbfe", delay: 0.82 },
  { left: 38, bottom: 48, size: 88, layer: 4, color: "#22d3ee", shine: "#ecfeff", delay: 0.86 },
  { left: 58, bottom: 42, size: 76, layer: 3, color: "#0369a1", shine: "#7dd3fc", delay: 0.8 },
] as const;

export function SafeVisual({
  display,
  phase,
  popIndex = null,
  compact = false,
  chroma = false,
  digitsRolling = false,
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

        <div ref={interiorRef} className="safe-visual__interior">
          <div className="safe-visual__inner-glow" />

          <div className="safe-visual__mountain" aria-hidden>
            <div className="safe-visual__mountain-stack">
              {MEGA_GEMS.map((g, i) => (
                <DiamondGem key={i} {...g} compact={compact} />
              ))}
            </div>
          </div>

          <div className="safe-visual__light-burst" aria-hidden />
        </div>

        <div className="safe-visual__door">
          <div className="safe-visual__door-inner">
            <div className="safe-visual__handle" />
            <div className="safe-visual__dial">
              {display.map((ch, i) => (
                <span
                  key={i}
                  data-digit-idx={i}
                  className={`safe-digit ${ch !== "-" ? "safe-digit--filled" : ""} ${digitsRolling ? "safe-digit--rolling" : ""}`}
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
