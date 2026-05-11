import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClientMessage, PublicState, ServerErrorMessage, ServerStateMessage } from "./types";

function wsUrlFromLocation(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

export function useGameSocket() {
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<"idle" | "playing">("idle");
  const [publicState, setPublicState] = useState<PublicState | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const applyMessage = useCallback((msg: ServerStateMessage | ServerErrorMessage) => {
    if (msg.type === "error") {
      setLastError(msg.message);
      return;
    }
    if (msg.type === "state") {
      setLastError(null);
      setPhase(msg.phase);
      setPublicState(msg.public);
      if (typeof msg.apiKey === "string") setApiKey(msg.apiKey);
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (stopped) return;
      const url = wsUrlFromLocation();
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
  }, [applyMessage]);

  const send = useMemo(() => {
    return (msg: ClientMessage) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify(msg));
    };
  }, []);

  return { connected, phase, publicState, apiKey, lastError, send };
}
