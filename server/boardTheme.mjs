export const PRESET_IDS = new Set([
  "default",
  "midnight",
  "aurora",
  "sunset",
  "ocean",
  "forest",
  "ember",
  "royal",
]);

/**
 * @param {unknown} raw
 * @returns {{ kind: 'preset'; id: string } | { kind: 'solid'; color: string } | null}
 */
export function normalizeBoardBackground(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {{ kind?: unknown; id?: unknown; color?: unknown }} */ (raw);
  if (o.kind === "preset" && typeof o.id === "string") {
    const id = o.id.trim();
    if (!PRESET_IDS.has(id)) return null;
    return { kind: "preset", id };
  }
  if (o.kind === "solid" && typeof o.color === "string") {
    const c = o.color.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(c)) return null;
    return { kind: "solid", color: c };
  }
  return null;
}
