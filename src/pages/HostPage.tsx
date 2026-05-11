import { useMemo, useState } from "react";
import { useGameSocket } from "../useGameSocket";
import { normalizeLetter } from "../ru";

const RU_LETTERS = [
  "Й",
  "Ц",
  "У",
  "К",
  "Е",
  "Н",
  "Г",
  "Ш",
  "Щ",
  "З",
  "Х",
  "Ъ",
  "Ф",
  "Ы",
  "В",
  "А",
  "П",
  "Р",
  "О",
  "Л",
  "Д",
  "Ж",
  "Э",
  "Я",
  "Ч",
  "С",
  "М",
  "И",
  "Т",
  "Ь",
  "Б",
  "Ю",
  "Ё",
];

export function HostPage() {
  const { connected, phase, publicState, apiKey, lastError, send } = useGameSocket();
  const [phrase, setPhrase] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const guessUrl = useMemo(() => {
    if (!apiKey) return "";
    const base = `${window.location.origin}/api/guess`;
    return `${base}?key=${encodeURIComponent(apiKey)}&letter=$(querystring)`;
  }, [apiKey]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Скопировано");
      setTimeout(() => setToast(null), 1200);
    } catch {
      setToast("Не удалось скопировать");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const start = () => {
    send({ type: "setWord", word: phrase });
  };

  const reset = () => {
    send({ type: "resetRound" });
  };

  const guess = (letter: string) => {
    send({ type: "guessLetter", letter });
  };

  return (
    <div className="host">
      <header className="host__header">
        <div>
          <h1 className="host__title">Панель ведущего</h1>
          <p className="host__sub">Фраза по умолчанию на русском · буквы Ё/Е совпадают при проверке</p>
        </div>
        <div className={`host__pill ${connected ? "host__pill--ok" : "host__pill--bad"}`}>
          {connected ? "онлайн" : "offline"}
        </div>
      </header>

      {toast && <div className="host__toast">{toast}</div>}
      {lastError && <div className="host__warn">Ошибка: {lastError}</div>}

      <section className="card">
        <h2 className="card__h">Новый раунд</h2>
        <label className="label" htmlFor="phrase">
          Слово или фраза
        </label>
        <textarea
          id="phrase"
          className="textarea"
          rows={3}
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="Например: СЛОВО ИЗ ПЯТИ БУКВ"
        />
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={start}>
            Запустить табло
          </button>
          <button type="button" className="btn" onClick={reset}>
            Сбросить раунд
          </button>
        </div>
        <p className="muted">
          Пробелы и дефисы разделяют «слова» на строке табло. Пунктуация (кроме дефиса) игнорируется.
        </p>
      </section>

      <section className="card">
        <h2 className="card__h">Буква из чата</h2>
        <p className="muted">
          Нажмите букву ниже, когда зритель назвал её в чате. Для Nightbot используйте шаблон URL
          (команда передаёт букву в конец URL).
        </p>
        <div className="kbd">
          {RU_LETTERS.map((l) => {
            const norm = normalizeLetter(l);
            const tried = publicState?.guessed.includes(norm) ?? false;
            return (
              <button
                key={l}
                type="button"
                className={`kbd__key ${tried ? "kbd__key--used" : ""}`}
                onClick={() => guess(l)}
                disabled={phase !== "playing"}
              >
                {l}
              </button>
            );
          })}
        </div>
        {publicState?.lastFeedback && (
          <p className="host__fb">
            Последний ход:{" "}
            {publicState.lastFeedback.type === "duplicate" && (
              <>повтор «{publicState.lastFeedback.letter}»</>
            )}
            {publicState.lastFeedback.type === "hit" && <>угадали «{publicState.lastFeedback.letter}»</>}
            {publicState.lastFeedback.type === "miss" && <>мимо «{publicState.lastFeedback.letter}»</>}
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="card__h">Интеграция Nightbot (customapi)</h2>
        <p className="muted">
          Nightbot дергает ваш URL снаружи: нужен белый IP или туннель (ngrok/cloudflared), и открытый
          порт до этого ПК. Команда: <code className="code">!буква A</code> — в конец URL подставится
          запрос.
        </p>
        <div className="mono">{guessUrl || "Ключ появится после подключения к серверу…"}</div>
        <div className="row">
          <button type="button" className="btn" disabled={!guessUrl} onClick={() => void copy(guessUrl)}>
            Скопировать URL для $(customapi …)
          </button>
        </div>
        <p className="muted">
          Пример: создайте команду, которая вызывает <code className="code">$(urlfetch URL)</code>, где в
          URL в конце подставляется буква из чата (см. документацию Nightbot:{" "}
          <code className="code">$(querystring)</code> или <code className="code">$(query)</code>).
        </p>
      </section>

      <section className="card">
        <h2 className="card__h">Ссылка для OBS</h2>
        <div className="mono">{`${window.location.origin}/board`}</div>
        <div className="row">
          <button type="button" className="btn" onClick={() => void copy(`${window.location.origin}/board`)}>
            Скопировать табло
          </button>
        </div>
      </section>
    </div>
  );
}
