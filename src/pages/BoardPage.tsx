import { useEffect, useMemo, useRef } from "react";
import type { Cell } from "../types";
import { useGameSocket } from "../useGameSocket";

function rowLayout(cells: Cell[]): Cell[][] {
  const rows: Cell[][] = [];
  let cur: Cell[] = [];
  const flush = () => {
    if (cur.length) rows.push(cur);
    cur = [];
  };
  for (const c of cells) {
    if (c.kind === "space") {
      flush();
      continue;
    }
    cur.push(c);
  }
  flush();
  return rows;
}

function LetterTile({ cell }: { cell: Extract<Cell, { kind: "letter" }> }) {
  const revealed = cell.revealed;
  const letter = revealed ? cell.ch.toLocaleUpperCase("ru-RU") : "";

  return (
    <div className={`tile ${revealed ? "tile--revealed" : ""}`}>
      <div className="tile__inner">
        <div className="tile__face tile__face--back" aria-hidden />
        <div className="tile__face tile__face--front">
          <span className="tile__letter">{letter}</span>
        </div>
      </div>
    </div>
  );
}

export function BoardPage() {
  const { connected, phase, publicState } = useGameSocket();

  const rows = useMemo(() => (publicState ? rowLayout(publicState.cells) : []), [publicState]);

  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fb = publicState?.lastFeedback;
    if (!fb || !feedbackRef.current) return;
    feedbackRef.current.classList.remove("toast--pop");
    void feedbackRef.current.offsetWidth;
    feedbackRef.current.classList.add("toast--pop");
  }, [publicState?.lastFeedback]);

  const toast = useMemo(() => {
    const fb = publicState?.lastFeedback;
    if (!fb) return null;
    if (fb.type === "duplicate") return `Буква «${fb.letter}» уже была`;
    if (fb.type === "hit") return `Есть буква «${fb.letter}»`;
    return `Нет буквы «${fb.letter}»`;
  }, [publicState?.lastFeedback]);

  return (
    <div className="board">
      <div className="board__header">
        <div className="board__title">Поле чудес</div>
        <div className={`board__pill ${connected ? "board__pill--ok" : "board__pill--bad"}`}>
          {connected ? "синхронизация" : "нет связи"}
        </div>
      </div>

      <div ref={feedbackRef} className="toast" role="status">
        {toast}
      </div>

      {phase === "idle" && <div className="board__hint">Ведущий ещё не задал фразу</div>}

      {phase === "playing" && (
        <div className="board__grid" aria-live="polite">
          {rows.map((r, i) => (
            <div key={i} className="board__row">
              {r.map((c, j) =>
                c.kind === "letter" ? <LetterTile key={`${i}-${j}`} cell={c} /> : null,
              )}
            </div>
          ))}
        </div>
      )}

      {phase === "playing" && publicState && (
        <div className="wrong">
          <div className="wrong__label">Нет в слове</div>
          <div className="wrong__letters">
            {publicState.wrongGuesses.length === 0 ? (
              <span className="wrong__empty">пока пусто</span>
            ) : (
              publicState.wrongGuesses.map((l) => (
                <span key={l} className="wrong__chip">
                  {l}
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
