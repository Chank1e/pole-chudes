import type { CSSProperties } from "react";
import type { BoardBackground } from "./types";

/** Labels shown on host (Russian). Order matches preset grid. */
export const BOARD_PRESET_META: { id: string; label: string }[] = [
  { id: "default", label: "Классика" },
  { id: "midnight", label: "Полночь" },
  { id: "aurora", label: "Аврора" },
  { id: "sunset", label: "Закат" },
  { id: "ocean", label: "Океан" },
  { id: "forest", label: "Лес" },
  { id: "ember", label: "Угли" },
  { id: "royal", label: "Королевский" },
];

export const BOARD_PRESET_CSS: Record<string, string> = {
  default:
    "radial-gradient(1200px 700px at 30% 0%, #1a2454 0%, #070a12 55%), radial-gradient(900px 600px at 90% 20%, #301b4d 0%, transparent 60%), #070a12",
  midnight:
    "radial-gradient(ellipse 120% 80% at 50% -10%, #312e81 0%, transparent 50%), radial-gradient(ellipse at bottom, #0f172a 0%, #020617 100%)",
  aurora:
    "radial-gradient(900px 500px at 20% 10%, rgba(52, 211, 153, 0.35) 0%, transparent 55%), radial-gradient(800px 500px at 80% 30%, rgba(139, 92, 246, 0.4) 0%, transparent 50%), linear-gradient(180deg, #042f2e 0%, #0f172a 100%)",
  sunset:
    "radial-gradient(1000px 600px at 70% -20%, rgba(251, 146, 60, 0.55) 0%, transparent 55%), radial-gradient(800px 500px at 10% 40%, rgba(236, 72, 153, 0.25) 0%, transparent 50%), linear-gradient(185deg, #1c1917 0%, #431407 45%, #0c0a09 100%)",
  ocean:
    "radial-gradient(ellipse at top right, #0369a1 0%, transparent 45%), radial-gradient(ellipse at bottom left, #164e63 0%, transparent 50%), linear-gradient(180deg, #082f49 0%, #020617 100%)",
  forest:
    "radial-gradient(ellipse at top left, #166534 0%, transparent 48%), radial-gradient(ellipse at bottom right, #14532d 0%, transparent 52%), linear-gradient(160deg, #052e16 0%, #0f172a 100%)",
  ember:
    "radial-gradient(900px 500px at 50% -15%, rgba(253, 186, 116, 0.45) 0%, transparent 55%), radial-gradient(700px 400px at 80% 80%, rgba(239, 68, 68, 0.35) 0%, transparent 50%), linear-gradient(180deg, #1c1917 0%, #450a0a 100%)",
  royal:
    "radial-gradient(ellipse at 30% 20%, #6d28d9 0%, transparent 45%), radial-gradient(ellipse at 70% 60%, #4c1d95 0%, transparent 50%), linear-gradient(165deg, #1e1b4b 0%, #0f0720 100%)",
};

export const DEFAULT_BOARD_BACKGROUND: BoardBackground = { kind: "preset", id: "default" };

export function boardBackgroundToStyle(bg: BoardBackground): CSSProperties {
  if (bg.kind === "solid") {
    return { background: bg.color };
  }
  const css = BOARD_PRESET_CSS[bg.id] ?? BOARD_PRESET_CSS.default;
  return {
    background: css,
    backgroundAttachment: "fixed",
  };
}
