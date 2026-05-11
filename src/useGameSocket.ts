import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoardBackground, ClientMessage, PublicState, ServerErrorMessage, ServerStateMessage } from "./types";
import { DEFAULT_BOARD_BACKGROUND } from "./boardTheme";

export type SocketRole = "host" | "board";

function wsUrlFromLocation(role: SocketRole): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const base = `${proto}//${window.location.host}/ws`;
  return role === "host" ? `${base}?role=host` : base;
}

export function useGameSocket(role: SocketRole = "board") {
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<"idle" | "playing">("idle");
  const [publicState, setPublicState] = useState<PublicState | null>(null);
  const [boardBackground, setBoardBackground] = useState<BoardBackground>(DEFAULT_BOARD_BACKGROUND);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [hostPhrase, setHostPhrase] = useState<string | null>(null);
  const [hostStats, setHostStats] = useState<{ lettersTotal: number; lettersOpen: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const applyMessage = useCallback(
    (msg: ServerStateMessage | ServerErrorMessage) => {
      if (msg.type === "error") {
        setLastError(msg.message);
        return;
      }
      if (msg.type === "state") {
        setLastError(null);
        setPhase(msg.phase);
        setPublicState(msg.public);
        setBoardBackground(msg.boardBackground ?? DEFAULT_BOARD_BACKGROUND);
        if (typeof msg.apiKey === "string") setApiKey(msg.apiKey);

        if (role === "host") {
          if (msg.phase === "idle") {
            setHostPhrase(null);
            setHostStats(null);
          } else {
            setHostPhrase(msg.hostPhrase ?? null);
            setHostStats(msg.hostStats ?? null);
          }
        }
      }
    },
    [role],
  );

  useEffect(() => {
    let stopped = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (stopped) return;
      const url = wsUrlFromLocation(role);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        setConnected(true);
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        attempt += 1;
        const delay = Math.min(10_000, 500 + attempt * 350);
        timer = setTimeout(connect, delay);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as ServerStateMessage | ServerErrorMessage;
          applyMessage(msg);
        } catch {
          /* ignore */
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [applyMessage, role]);

  const send = useMemo(() => {
    return (msg: ClientMessage) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify(msg));
    };
  }, []);

  return {
    connected,
    phase,
    publicState,
    boardBackground,
    apiKey,
    lastError,
    send,
    hostPhrase,
    hostStats,
  };
}
