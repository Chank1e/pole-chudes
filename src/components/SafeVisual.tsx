import { useEffect, useMemo, useRef } from "react";
import type { SafePhase } from "../safe/types";

type Props = {
  display: [string, string, string];
  phase: SafePhase;
  popIndex?: number | null;
  compact?: boolean;
};

/** Positions for the interior diamond pile (percent inside interior box). */
const PILE_GEMS: { left: number; bottom: number; size: number; hue: number; delay: number }[] = [
  { left: 8, bottom: 2, size: 28, hue: 195, delay: 0.55 },
  { left: 22, bottom: 0, size: 34, hue: 200, delay: 0.62 },
  { left: 38, bottom: 4, size: 42, hue: 188, delay: 0.58 },
  { left: 52, bottom: 0, size: 48, hue: 205, delay: 0.65 },
  { left: 66, bottom: 6, size: 40, hue: 192, delay: 0.6 },
  { left: 78, bottom: 2, size: 32, hue: 198, delay: 0.68 },
  { left: 14, bottom: 18, size: 24, hue: 210, delay: 0.72 },
  { left: 30, bottom: 22, size: 30, hue: 185, delay: 0.7 },
  { left: 46, bottom: 26, size: 36, hue: 202, delay: 0.75 },
  { left: 58, bottom: 24, size: 32, hue: 190, delay: 0.73 },
  { left: 72, bottom: 20, size: 26, hue: 208, delay: 0.78 },
  { left: 20, bottom: 34, size: 20, hue: 195, delay: 0.82 },
  { left: 40, bottom: 38, size: 26, hue: 200, delay: 0.8 },
  { left: 55, bottom: 36, size: 22, hue: 188, delay: 0.85 },
  { left: 35, bottom: 48, size: 18, hue: 205, delay: 0.88 },
  { left: 48, bottom: 50, size: 16, hue: 192, delay: 0.9 },
  { left: 5, bottom: 12, size: 18, hue: 198, delay: 0.76 },
  { left: 88, bottom: 14, size: 16, hue: 210, delay: 0.74 },
  { left: 62, bottom: 42, size: 14, hue: 185, delay: 0.92 },
  { left: 26, bottom: 44, size: 12, hue: 202, delay: 0.94 },
];

export function SafeVisual({ display, phase, popIndex = null, compact = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

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
  const isUnlocking = isOpen;

  const pile = useMemo(() => PILE_GEMS, []);

  return (
    <div
      ref={rootRef}
      className={[
        "safe-visual",
        compact ? "safe-visual--compact" : "",
        isFail ? "safe-visual--fail" : "",
        isUnlocking ? "safe-visual--unlocking" : "",
        isOpen ? "safe-visual--open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={compact}
    >
      <div className="safe-visual__shadow" />

      <div className="safe-visual__body">
        <div className="safe-visual__rim" />

        <div className="safe-visual__interior">
          <div className="safe-visual__inner-glow" />
          <div className="safe-visual__treasure-pile" aria-hidden>
            {pile.map((g, i) => (
              <span
                key={i}
                className="safe-visual__pile-gem"
                style={{
                  left: `${g.left}%`,
                  bottom: `${g.bottom}%`,
                  width: compact ? g.size * 0.55 : g.size,
                  height: compact ? g.size * 0.65 : g.size * 1.15,
                  animationDelay: `${g.delay}s`,
                  ["--gem-hue" as string]: `${g.hue}deg`,
                }}
              />
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
        <div className="safe-visual__light-burst" aria-hidden />
        <div className="safe-visual__sparkles" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="safe-visual__spark" style={{ animationDelay: `${0.7 + i * 0.08}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
