import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SafeClientMessage,
  SafePublicState,
  SafeServerStateMessage,
} from "./safe/types";
import type { ServerErrorMessage } from "./types";

export type SafeSocketRole = "safe-host" | "safe-board";

function wsUrlFromLocation(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

export function useSafeSocket(role: SafeSocketRole) {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<SafePublicState | null>(null);
  const [hostCode, setHostCode] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingRef = useRef<SafeClientMessage[]>([]);

  const applyMessage = useCallback(
    (msg: SafeServerStateMessage | ServerErrorMessage) => {
      if (msg.type === "error") {
        setLastError(msg.message);
        return;
      }
      if (msg.type === "safeState") {
        setLastError(null);
        setState({
          phase: msg.phase,
          display: msg.display,
          enteredCount: msg.enteredCount,
          eventSeq: msg.eventSeq,
          lastEvent: msg.lastEvent,
        });
        if (role === "safe-host" && typeof msg.hostCode === "string") {
          setHostCode(msg.hostCode);
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
      const url = `${wsUrlFromLocation()}?role=${encodeURIComponent(role)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      const flushPending = () => {
        const q = pendingRef.current;
        pendingRef.current = [];
        for (const m of q) {
          ws.send(JSON.stringify(m));
        }
      };

      ws.onopen = () => {
        attempt = 0;
        setConnected(true);
        ws.send(JSON.stringify({ type: "clientHello", role }));
        flushPending();
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
          const msg = JSON.parse(String(ev.data)) as SafeServerStateMessage | ServerErrorMessage;
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
    return (msg: SafeClientMessage) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
        return;
      }
      if (pendingRef.current.length < 64) {
        pendingRef.current.push(msg);
      }
    };
  }, []);

  return {
    connected,
    state,
    hostCode,
    lastError,
    send,
  };
}
