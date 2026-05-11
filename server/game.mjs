/** @typedef {{ kind: 'letter'; ch: string; revealed: boolean }} LetterCell */
/** @typedef {{ kind: 'space' }} SpaceCell */
/** @typedef {LetterCell | SpaceCell} Cell */

/** @typedef {{
 *   cells: Cell[];
 *   guessed: string[];
 *   wrongGuesses: string[];
 *   lastFeedback: null | { type: 'duplicate' | 'hit' | 'miss'; letter: string };
 * }} PublicState */

const hasSegmenter = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function";

/**
 * @param {string} text
 * @returns {string[]}
 */
export function splitGraphemes(text) {
  if (!text) return [];
  if (hasSegmenter) {
    const seg = new Intl.Segmenter("ru", { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

/**
 * @param {string} ch
 */
export function normalizeLetter(ch) {
  const t = ch.trim();
  if (!t) return "";
  const u = t.toLocaleUpperCase("ru-RU");
  return u === "Ё" ? "Е" : u;
}

/**
 * @param {string} phrase
 * @returns {Cell[]}
 */
export function phraseToCells(phrase) {
  const g = splitGraphemes(phrase);
  /** @type {Cell[]} */
  const cells = [];
  for (const ch of g) {
    if (ch === " " || ch === "\t" || ch === "-" || ch === "—" || ch === "–") {
      cells.push({ kind: "space" });
      continue;
    }
    if (ch === "\n") {
      cells.push({ kind: "space" });
      continue;
    }
    const norm = normalizeLetter(ch);
    if (!norm) continue;
    cells.push({ kind: "letter", ch, revealed: false });
  }
  return cells;
}

/**
 * @param {Cell[]} cells
 * @param {string} letterNorm
 */
function letterInPhrase(cells, letterNorm) {
  for (const c of cells) {
    if (c.kind !== "letter") continue;
    if (normalizeLetter(c.ch) === letterNorm) return true;
  }
  return false;
}

/**
 * @param {Cell[]} cells
 * @param {string} letterNorm
 * @returns {Cell[]}
 */
function revealLetter(cells, letterNorm) {
  return cells.map((c) => {
    if (c.kind !== "letter") return c;
    if (normalizeLetter(c.ch) === letterNorm) {
      return { ...c, revealed: true };
    }
    return c;
  });
}

/**
 * @param {Cell[]} cells
 */
export function stripSecrets(cells) {
  return cells.map((c) => {
    if (c.kind === "space") return c;
    return c.revealed ? c : { kind: "letter", ch: "", revealed: false };
  });
}

/**
 * @param {Cell[]} cells
 * @param {string[]} guessed
 * @param {string[]} wrongGuesses
 * @param {PublicState['lastFeedback']} lastFeedback
 * @returns {PublicState}
 */
export function buildPublicState(cells, guessed, wrongGuesses, lastFeedback) {
  return {
    cells: stripSecrets(cells),
    guessed: [...guessed],
    wrongGuesses: [...wrongGuesses],
    lastFeedback,
  };
}

/**
 * @param {{
 *   cells: Cell[];
 *   guessed: Set<string>;
 *   wrongGuesses: Set<string>;
 * }} model
 * @param {string} rawLetter
 * @returns {{ cells: Cell[]; guessed: Set<string>; wrongGuesses: Set<string>; lastFeedback: PublicState['lastFeedback'] }}
 */
export function applyGuess(model, rawLetter) {
  const letterNorm = normalizeLetter(rawLetter);
  if (!letterNorm || letterNorm.length !== 1) {
    return { ...model, lastFeedback: null };
  }

  const guessed = new Set(model.guessed);
  const wrongGuesses = new Set(model.wrongGuesses);

  if (guessed.has(letterNorm)) {
    return {
      ...model,
      lastFeedback: { type: "duplicate", letter: letterNorm },
    };
  }

  guessed.add(letterNorm);

  const exists = letterInPhrase(model.cells, letterNorm);
  let cells = model.cells;
  if (exists) {
    cells = revealLetter(cells, letterNorm);
    return {
      cells,
      guessed,
      wrongGuesses,
      lastFeedback: { type: "hit", letter: letterNorm },
    };
  }

  wrongGuesses.add(letterNorm);
  return {
    cells,
    guessed,
    wrongGuesses,
    lastFeedback: { type: "miss", letter: letterNorm },
  };
}
