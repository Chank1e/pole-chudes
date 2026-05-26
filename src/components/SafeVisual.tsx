import { useEffect, useRef } from "react";
import type { SafePhase } from "../safe/types";
import {
  DEFAULT_THEME,
  DIAMOND_PALETTES,
  DOOR_SPEED_MS,
  PILE_SCALE_VALUE,
  type SafeTheme,
} from "../safe/theme";
import { DiamondGem } from "./DiamondGem";
import { SafeConfetti } from "./SafeConfetti";

type Props = {
  display: [string, string, string];
  phase: SafePhase;
  popIndex?: number | null;
  compact?: boolean;
  chroma?: boolean;
  digitsRolling?: boolean;
  theme?: SafeTheme;
};

/** Позиции/размеры/наклон 12 камней в куче. Цвета подставляются из палитры темы. */
const GEM_LAYOUT = [
  { left: -10, bottom: -8, size: 118, layer: 1, delay: 0.52, tilt: -18 },
  { left: 8, bottom: -10, size: 148, layer: 2, delay: 0.58, tilt: 8 },
  { left: 32, bottom: -8, size: 162, layer: 3, delay: 0.55, tilt: -4 },
  { left: 54, bottom: -6, size: 140, layer: 2, delay: 0.6, tilt: 14 },
  { left: 74, bottom: -8, size: 115, layer: 1, delay: 0.53, tilt: 22 },
  { left: 0, bottom: 18, size: 98, layer: 2, delay: 0.68, tilt: -12 },
  { left: 22, bottom: 24, size: 125, layer: 4, delay: 0.72, tilt: 6 },
  { left: 46, bottom: 26, size: 112, layer: 3, delay: 0.7, tilt: -8 },
  { left: 66, bottom: 20, size: 95, layer: 2, delay: 0.74, tilt: 18 },
  { left: 14, bottom: 44, size: 82, layer: 3, delay: 0.82, tilt: -22 },
  { left: 38, bottom: 48, size: 88, layer: 4, delay: 0.86, tilt: 4 },
  { left: 58, bottom: 42, size: 76, layer: 3, delay: 0.8, tilt: 16 },
] as const;

export function SafeVisual({
  display,
  phase,
  popIndex = null,
  compact = false,
  chroma = false,
  digitsRolling = false,
  theme = DEFAULT_THEME,
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

  const palette = DIAMOND_PALETTES[theme.diamondPalette];
  const pileScale = PILE_SCALE_VALUE[theme.pileScale];
  const doorMs = DOOR_SPEED_MS[theme.doorSpeed];

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
      style={
        {
          ["--pile-scale" as string]: pileScale,
          ["--safe-door-ms" as string]: `${doorMs}ms`,
        } as React.CSSProperties
      }
      aria-hidden={compact}
    >
      {!chroma && <div className="safe-visual__shadow" />}

      <div className="safe-visual__body">
        <div className="safe-visual__rim" />

        <div ref={interiorRef} className="safe-visual__interior">
          <div className="safe-visual__inner-glow" />

          {!compact && (
            <SafeConfetti
              clipRef={interiorRef}
              active={isOpen}
              density={theme.confettiDensity}
            />
          )}

          <div className="safe-visual__mountain" aria-hidden>
            <div className="safe-visual__mountain-stack">
              {GEM_LAYOUT.map((pos, i) => {
                const stone = palette[i % palette.length]!;
                return (
                  <DiamondGem
                    key={i}
                    {...pos}
                    color={stone.color}
                    shine={stone.shine}
                    compact={compact}
                  />
                );
              })}
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
