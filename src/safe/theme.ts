export type DiamondPalette = "blue" | "gold" | "ruby" | "rainbow";
export type ConfettiDensity = "off" | "low" | "normal" | "heavy";
export type PileScale = "small" | "normal" | "huge";
export type DoorSpeed = "slow" | "normal" | "fast";
export type DoorPreset = "classic" | "blast" | "vault" | "flash";
export type WrongPreset = "shake" | "cop" | "siren" | "lightning" | "bomb";
export type DoorSound = "off" | "creak" | "metal" | "magic";

export type SafeTheme = {
  diamondPalette: DiamondPalette;
  confettiDensity: ConfettiDensity;
  pileScale: PileScale;
  doorSpeed: DoorSpeed;
  doorPreset: DoorPreset;
  wrongPreset: WrongPreset;
  doorSound: DoorSound;
};

export const DEFAULT_THEME: SafeTheme = {
  diamondPalette: "blue",
  confettiDensity: "normal",
  pileScale: "normal",
  doorSpeed: "normal",
  doorPreset: "blast",
  wrongPreset: "cop",
  doorSound: "creak",
};

export const PALETTE_OPTIONS: { value: DiamondPalette; label: string }[] = [
  { value: "blue", label: "Сапфир" },
  { value: "gold", label: "Золото" },
  { value: "ruby", label: "Рубин" },
  { value: "rainbow", label: "Радуга" },
];

export const DENSITY_OPTIONS: { value: ConfettiDensity; label: string }[] = [
  { value: "off", label: "Выкл" },
  { value: "low", label: "Мало" },
  { value: "normal", label: "Норма" },
  { value: "heavy", label: "Много" },
];

export const SCALE_OPTIONS: { value: PileScale; label: string }[] = [
  { value: "small", label: "Меньше" },
  { value: "normal", label: "Норма" },
  { value: "huge", label: "Огромная" },
];

export const SPEED_OPTIONS: { value: DoorSpeed; label: string }[] = [
  { value: "slow", label: "Медленно" },
  { value: "normal", label: "Норма" },
  { value: "fast", label: "Быстро" },
];

export const DOOR_PRESET_OPTIONS: { value: DoorPreset; label: string }[] = [
  { value: "classic", label: "Классика" },
  { value: "blast", label: "Взрыв" },
  { value: "vault", label: "Банковский" },
  { value: "flash", label: "Вспышка" },
];

export const WRONG_PRESET_OPTIONS: { value: WrongPreset; label: string }[] = [
  { value: "shake", label: "Тряска" },
  { value: "cop", label: "Коп с палкой" },
  { value: "siren", label: "Сирена" },
  { value: "lightning", label: "Молния" },
  { value: "bomb", label: "Бомба-пукалка" },
];

export const DOOR_SOUND_OPTIONS: { value: DoorSound; label: string }[] = [
  { value: "off", label: "Тишина" },
  { value: "creak", label: "Скрип" },
  { value: "metal", label: "Лязг" },
  { value: "magic", label: "Магия" },
];

export type Stone = { color: string; shine: string };

/**
 * 12 камней под позиции в MEGA_GEMS. Палитры подобраны без чисто-зелёных
 * (hsl 120 ±20°), чтобы не было пересечений с ключом хромакея #00ff00.
 */
export const DIAMOND_PALETTES: Record<DiamondPalette, Stone[]> = {
  blue: [
    { color: "#0369a1", shine: "#7dd3fc" },
    { color: "#0ea5e9", shine: "#bae6fd" },
    { color: "#0284c7", shine: "#e0f2fe" },
    { color: "#0891b2", shine: "#67e8f9" },
    { color: "#155e75", shine: "#22d3ee" },
    { color: "#1d4ed8", shine: "#93c5fd" },
    { color: "#38bdf8", shine: "#f0f9ff" },
    { color: "#06b6d4", shine: "#a5f3fc" },
    { color: "#0e7490", shine: "#7dd3fc" },
    { color: "#2563eb", shine: "#bfdbfe" },
    { color: "#22d3ee", shine: "#ecfeff" },
    { color: "#0369a1", shine: "#7dd3fc" },
  ],
  gold: [
    { color: "#b45309", shine: "#fde68a" },
    { color: "#d97706", shine: "#fef3c7" },
    { color: "#ca8a04", shine: "#fef9c3" },
    { color: "#a16207", shine: "#fde047" },
    { color: "#92400e", shine: "#fcd34d" },
    { color: "#854d0e", shine: "#facc15" },
    { color: "#eab308", shine: "#fef9c3" },
    { color: "#f59e0b", shine: "#fef3c7" },
    { color: "#a16207", shine: "#fde68a" },
    { color: "#b45309", shine: "#fcd34d" },
    { color: "#facc15", shine: "#fffbeb" },
    { color: "#d97706", shine: "#fde047" },
  ],
  ruby: [
    { color: "#9f1239", shine: "#fda4af" },
    { color: "#be123c", shine: "#fecdd3" },
    { color: "#e11d48", shine: "#fecaca" },
    { color: "#881337", shine: "#fb7185" },
    { color: "#7f1d1d", shine: "#fca5a5" },
    { color: "#dc2626", shine: "#fee2e2" },
    { color: "#f43f5e", shine: "#ffe4e6" },
    { color: "#b91c1c", shine: "#fda4af" },
    { color: "#9f1239", shine: "#fb7185" },
    { color: "#be185d", shine: "#fbcfe8" },
    { color: "#e11d48", shine: "#fecdd3" },
    { color: "#881337", shine: "#f87171" },
  ],
  rainbow: [
    { color: "#0369a1", shine: "#7dd3fc" },
    { color: "#d97706", shine: "#fde68a" },
    { color: "#9f1239", shine: "#fda4af" },
    { color: "#7e22ce", shine: "#d8b4fe" },
    { color: "#0891b2", shine: "#67e8f9" },
    { color: "#c2410c", shine: "#fed7aa" },
    { color: "#2563eb", shine: "#bfdbfe" },
    { color: "#be185d", shine: "#fbcfe8" },
    { color: "#a16207", shine: "#fde68a" },
    { color: "#6d28d9", shine: "#c4b5fd" },
    { color: "#0ea5e9", shine: "#bae6fd" },
    { color: "#dc2626", shine: "#fee2e2" },
  ],
};

export const PILE_SCALE_VALUE: Record<PileScale, number> = {
  small: 0.78,
  normal: 1,
  huge: 1.22,
};

export const DOOR_SPEED_MS: Record<DoorSpeed, number> = {
  slow: 2200,
  normal: 1450,
  fast: 850,
};

export const DENSITY_CONFIG: Record<
  ConfettiDensity,
  { target: number; initial: number; spawnChance: number; spawnBurst: number }
> = {
  off: { target: 0, initial: 0, spawnChance: 0, spawnBurst: 0 },
  low: { target: 30, initial: 22, spawnChance: 0.3, spawnBurst: 1 },
  normal: { target: 70, initial: 55, spawnChance: 0.5, spawnBurst: 3 },
  heavy: { target: 140, initial: 95, spawnChance: 0.8, spawnBurst: 5 },
};
