import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THEME, type SafeTheme } from "./theme";

const STORAGE_KEY = "safe-theme-v1";
const CHANNEL_NAME = "safe-theme";

function load(): SafeTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as Partial<SafeTheme>;
    return { ...DEFAULT_THEME, ...parsed };
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Тема настройки сейфа. Хранится в localStorage и синхронизируется между
 * вкладками/окнами (хост и OBS-табло — одно происхождение) через
 * BroadcastChannel. Серверу о теме знать не нужно.
 */
export function useSafeTheme(): readonly [SafeTheme, (patch: Partial<SafeTheme>) => void] {
  const [theme, setTheme] = useState<SafeTheme>(load);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const ch = new BroadcastChannel(CHANNEL_NAME);
    const onMessage = (e: MessageEvent<SafeTheme>) => {
      if (e.data && typeof e.data === "object") {
        setTheme({ ...DEFAULT_THEME, ...e.data });
      }
    };
    ch.addEventListener("message", onMessage);
    return () => {
      ch.removeEventListener("message", onMessage);
      ch.close();
    };
  }, []);

  // Резервный канал — если другая вкладка пишет в storage напрямую
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        setTheme({ ...DEFAULT_THEME, ...(JSON.parse(e.newValue) as Partial<SafeTheme>) });
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const patch = useCallback((p: Partial<SafeTheme>) => {
    setTheme((prev) => {
      const next = { ...prev, ...p };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      try {
        if ("BroadcastChannel" in window) {
          const ch = new BroadcastChannel(CHANNEL_NAME);
          ch.postMessage(next);
          ch.close();
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return [theme, patch] as const;
}
