import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DiamondRain } from "../components/DiamondRain";
import { SafeVisual } from "../components/SafeVisual";
import { useRejectSound } from "../safe/useRejectSound";
import { useSafeSocket } from "../useSafeSocket";

export function SafeBoardPage() {
  const [params] = useSearchParams();
  const chroma = params.get("chroma") === "1";
  const { connected, state } = useSafeSocket("safe-board");
  const playReject = useRejectSound();
  const stageRef = useRef<HTMLDivElement>(null);
  const lastEventSeqRef = useRef(0);
  const [popIndex, setPopIndex] = useState<number | null>(null);
  const [showRain, setShowRain] = useState(false);

  const display = state?.display ?? ["-", "-", "-"];
  const phase = state?.phase ?? "idle";

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
      return;
    }
    if (ev.type === "success") {
      setShowRain(true);
      setPopIndex(null);
      return;
    }
    if (ev.type === "reset") {
      setShowRain(false);
      setPopIndex(null);
    }
  }, [state, playReject]);

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

        <div className="safe-board__stage" ref={stageRef}>
          <SafeVisual display={display} phase={phase} popIndex={popIndex} />
          <DiamondRain anchorRef={stageRef} active={showRain && phase === "success"} />
        </div>
      </div>
    </div>
  );
}
