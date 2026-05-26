export function getAudioContext(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    return new Ctx();
  } catch {
    return null;
  }
}

let sharedCtx: AudioContext | null = null;
let warnedSuspended = false;

function getCtx(): AudioContext | null {
  if (sharedCtx) return sharedCtx;
  const Ctx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  try {
    sharedCtx = new Ctx();
  } catch {
    return null;
  }
  return sharedCtx;
}

export async function ensureAudioContext(): Promise<AudioContext | null> {
  const ctx = getCtx();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* не было user-gesture — попробуем при следующем событии */
    }
  }
  if (ctx.state !== "running") {
    if (!warnedSuspended) {
      warnedSuspended = true;
      // eslint-disable-next-line no-console
      console.warn(
        "[audio] AudioContext is suspended. Кликни/тапни по странице один раз — браузер требует user-gesture для разблокировки звука.",
      );
    }
    return null;
  }
  warnedSuspended = false;
  return ctx;
}

/**
 * Подключить разблокировку аудио к первому user-gesture на документе.
 * После первого клика/нажатия Web Audio начнёт звучать.
 */
export function attachAudioUnlock(): () => void {
  const unlock = () => {
    void ensureAudioContext();
  };
  const opts: AddEventListenerOptions = { capture: true };
  window.addEventListener("pointerdown", unlock, opts);
  window.addEventListener("keydown", unlock, opts);
  window.addEventListener("touchstart", unlock, opts);
  return () => {
    window.removeEventListener("pointerdown", unlock, opts);
    window.removeEventListener("keydown", unlock, opts);
    window.removeEventListener("touchstart", unlock, opts);
  };
}
