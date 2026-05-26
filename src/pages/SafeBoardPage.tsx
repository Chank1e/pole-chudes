import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SafeVisual } from "../components/SafeVisual";
import { useDoorSound } from "../safe/useDoorSound";
import { useRejectSound } from "../safe/useRejectSound";
import { useSafeTheme } from "../safe/useSafeTheme";
import { useVictorySound } from "../safe/useVictorySound";
import { useSafeSocket } from "../useSafeSocket";

export function SafeBoardPage() {
  const [params] = useSearchParams();
  const chroma = params.get("chroma") === "1";
  const { connected, state } = useSafeSocket("safe-board");
  const [theme] = useSafeTheme();
  const playReject = useRejectSound();
  const playVictory = useVictorySound();
  const playDoor = useDoorSound();
  const lastEventSeqRef = useRef(0);
  const victoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popIndex, setPopIndex] = useState<number | null>(null);
  const [wrongTrigger, setWrongTrigger] = useState(0);

  const display = state?.display ?? ["-", "-", "-"];
  const phase = state?.phase ?? "idle";

  useEffect(() => {
    return () => {
      if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const seq = state.eventSeq;
    if (seq === lastEventSeqRef.current) return;
    lastEventSeqRef.current = seq;

    const ev = state.lastEvent;
    if (!ev) return;

    if (ev.type === "digit") {
      setPopIndex(ev.index);
      return;
    }
    if (ev.type === "wrong") {
      playReject();
      setPopIndex(null);
      setWrongTrigger((t) => t + 1);
      if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
      return;
    }
    if (ev.type === "success") {
      setPopIndex(null);

      if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);

      void playDoor(theme.doorSound);

      victoryTimerRef.current = setTimeout(() => {
        void playVictory();
      }, 920);
      return;
    }
    if (ev.type === "reset") {
      setPopIndex(null);
      setWrongTrigger(0);
      if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    }
  }, [state, playReject, playVictory, playDoor, theme.doorSound]);

  const rootClass = useMemo(
    () => `safe-board-root ${chroma ? "safe-board-root--chroma" : ""}`,
    [chroma],
  );

  return (
    <div className={rootClass}>
      <div className="safe-board">
        {!chroma && (
          <div className="safe-board__header">
            <div className="safe-board__title">Сейф</div>
            <div className={`safe-board__pill ${connected ? "safe-board__pill--ok" : "safe-board__pill--bad"}`}>
              {connected ? "синхронизация" : "нет связи"}
            </div>
          </div>
        )}

        {phase === "idle" && !chroma && (
          <div className="safe-board__hint">Ведущий ещё не активировал сейф</div>
        )}

        <div className="safe-board__stage">
          <SafeVisual
            display={display}
            phase={phase}
            popIndex={popIndex}
            chroma={chroma}
            theme={theme}
            wrongTrigger={wrongTrigger}
          />
        </div>
      </div>
    </div>
  );
}
