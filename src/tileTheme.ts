import type { CSSProperties } from "react";
import type { TileTheme } from "./types";

/** Matches board defaults before host overrides */
export const DEFAULT_TILE_THEME: TileTheme = {
  frontFace: "#5b6765",
  faceBorder: "#f6d365",
};

export function tileThemeToCssVars(theme: TileTheme): CSSProperties {
  return {
    "--tile-face-front-bg": theme.frontFace,
    "--tile-face-border": theme.faceBorder,
  } as CSSProperties;
}
