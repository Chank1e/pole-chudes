/** @type {{ frontFace: string; faceBorder: string }} */
export const DEFAULT_TILE_THEME = {
  frontFace: "#5b6765",
  faceBorder: "#f6d365",
};

/**
 * @param {string | undefined} s
 */
export function normalizeHexColor(s) {
  if (typeof s !== "string") return null;
  const t = s.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(t) ? t : null;
}

/**
 * @param {unknown} raw
 */
export function normalizeTileTheme(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {{ frontFace?: unknown; faceBorder?: unknown }} */ (raw);
  const frontFace = normalizeHexColor(typeof o.frontFace === "string" ? o.frontFace : "");
  const faceBorder = normalizeHexColor(typeof o.faceBorder === "string" ? o.faceBorder : "");
  if (!frontFace || !faceBorder) return null;
  return { frontFace, faceBorder };
}
