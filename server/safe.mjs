/** @typedef {'idle' | 'armed' | 'fail' | 'success'} SafePhase */

/**
 * @typedef {object} SafeEventDigit
 * @property {'digit'} type
 * @property {number} index
 * @property {string} digit
 */

/**
 * @typedef {object} SafeEventWrong
 * @property {'wrong'} type
 */

/**
 * @typedef {object} SafeEventSuccess
 * @property {'success'} type
 */

/**
 * @typedef {object} SafeEventReset
 * @property {'reset'} type
 */

/** @typedef {SafeEventDigit | SafeEventWrong | SafeEventSuccess | SafeEventReset} SafeEvent */

/**
 * @typedef {object} SafeModel
 * @property {SafePhase} phase
 * @property {string} code
 * @property {string} entered
 * @property {number} eventSeq
 * @property {SafeEvent | null} lastEvent
 */

/** @returns {SafeModel} */
export function createIdleSafe() {
  return {
    phase: "idle",
    code: "000",
    entered: "",
    eventSeq: 0,
    lastEvent: null,
  };
}

/**
 * @param {string} raw
 */
export function normalizeDigit(raw) {
  const c = String(raw).trim();
  if (/^\d$/.test(c)) return c;
  return null;
}

/**
 * @param {string} raw
 */
export function normalizeCode(raw) {
  const s = String(raw).replace(/\D/g, "").slice(0, 3);
  if (s.length !== 3) return null;
  return s;
}

export function randomCode() {
  return String(Math.floor(Math.random() * 1000)).padStart(3, "0");
}

/**
 * @param {string} entered
 */
export function displayDigits(entered) {
  return [0, 1, 2].map((i) => (i < entered.length ? entered[i] : "-"));
}

/**
 * @param {SafeModel} model
 * @param {boolean} includeHostCode
 */
export function buildSafeState(model, includeHostCode) {
  /** @type {Record<string, unknown>} */
  const payload = {
    type: "safeState",
    phase: model.phase,
    display: displayDigits(model.entered),
    enteredCount: model.entered.length,
    eventSeq: model.eventSeq,
    lastEvent: model.lastEvent,
  };
  if (includeHostCode) {
    payload.hostCode = model.code;
  }
  return payload;
}

/**
 * @param {SafeModel} model
 * @param {SafeEvent | null} event
 */
function bumpEvent(model, event) {
  model.eventSeq += 1;
  model.lastEvent = event;
}

/**
 * @param {SafeModel} model
 * @param {string} code
 */
export function setSafeCode(model, code) {
  const next = normalizeCode(code);
  if (!next) return { ok: false, error: "bad_code" };
  model.code = next;
  if (model.phase === "idle") {
    model.entered = "";
    model.lastEvent = null;
  }
  return { ok: true };
}

/**
 * @param {SafeModel} model
 */
export function armSafe(model) {
  model.phase = "armed";
  model.entered = "";
  bumpEvent(model, { type: "reset" });
  return { ok: true };
}

/**
 * @param {SafeModel} model
 */
export function resetSafe(model) {
  model.phase = "idle";
  model.entered = "";
  bumpEvent(model, { type: "reset" });
  return { ok: true };
}

/**
 * @param {SafeModel} model
 */
export function clearSafeEntry(model) {
  if (model.phase !== "armed" && model.phase !== "fail") {
    return { ok: false, error: "not_armed" };
  }
  model.phase = "armed";
  model.entered = "";
  bumpEvent(model, { type: "reset" });
  return { ok: true };
}

/**
 * @param {SafeModel} model
 * @param {string} digit
 */
export function appendSafeDigit(model, digit) {
  if (model.phase !== "armed" && model.phase !== "fail") {
    return { ok: false, error: "not_armed" };
  }
  const d = normalizeDigit(digit);
  if (!d) return { ok: false, error: "bad_digit" };
  if (model.entered.length >= 3) return { ok: false, error: "full" };

  model.phase = "armed";
  model.entered += d;
  const index = model.entered.length - 1;
  bumpEvent(model, { type: "digit", index, digit: d });

  if (model.entered.length < 3) {
    return { ok: true, result: "digit" };
  }

  if (model.entered === model.code) {
    model.phase = "success";
    bumpEvent(model, { type: "success" });
    return { ok: true, result: "success" };
  }

  model.phase = "fail";
  bumpEvent(model, { type: "wrong" });
  return { ok: true, result: "wrong" };
}

/**
 * After fail animation, host or auto can clear attempt.
 * @param {SafeModel} model
 */
export function recoverAfterFail(model) {
  if (model.phase !== "fail") return;
  model.phase = "armed";
  model.entered = "";
}
