import { useEffect, useRef } from "react";
import type { SafePhase } from "../safe/types";

type Props = {
  display: [string, string, string];
  phase: SafePhase;
  /** Index of digit that just appeared (for pop animation). */
  popIndex?: number | null;
  compact?: boolean;
};

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

  return (
    <div
      ref={rootRef}
      className={`safe-visual ${compact ? "safe-visual--compact" : ""} ${isFail ? "safe-visual--fail" : ""} ${isOpen ? "safe-visual--open" : ""}`}
      aria-hidden={compact}
    >
      <div className="safe-visual__shadow" />
      <div className="safe-visual__body">
        <div className="safe-visual__rim" />
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
        </div>
        <div className="safe-visual__hinge safe-visual__hinge--l" />
        <div className="safe-visual__hinge safe-visual__hinge--r" />
      </div>
      <div className="safe-visual__loot" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="safe-visual__gem" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}
