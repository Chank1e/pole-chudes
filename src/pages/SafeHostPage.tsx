import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SafeVisual } from "../components/SafeVisual";
import { useRandomCodeRoll } from "../safe/useRandomCodeRoll";
import { useSafeSocket } from "../useSafeSocket";
import { useSafeTheme } from "../safe/useSafeTheme";
import {
  DENSITY_OPTIONS,
  DIAMOND_PALETTES,
  DOOR_PRESET_OPTIONS,
  DOOR_SOUND_OPTIONS,
  PALETTE_OPTIONS,
  SCALE_OPTIONS,
  SPEED_OPTIONS,
  WRONG_PRESET_OPTIONS,
} from "../safe/theme";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

type ChipOption<T extends string> = { value: T; label: string };

function ThemeRow<T extends string>({
  label,
  value,
  options,
  onPick,
  swatchOf,
}: {
  label: string;
  value: T;
  options: ChipOption<T>[];
  onPick: (next: T) => void;
  swatchOf?: (v: T) => string | null;
}) {
  return (
    <div className="theme-row">
      <span className="theme-row__label">{label}</span>
      <div className="theme-options">
        {options.map((opt) => {
          const active = opt.value === value;
          const dot = swatchOf?.(opt.value);
          return (
            <button
              key={String(opt.value)}
              type="button"
              className={`theme-chip ${dot ? "theme-chip--swatch" : ""} ${active ? "theme-chip--active" : ""}`}
              onClick={() => onPick(opt.value)}
              style={dot ? ({ ["--chip-dot" as string]: dot } as React.CSSProperties) : undefined}
            >
              {dot && <span className="theme-chip__dot" aria-hidden />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SafeHostPage() {
  const { connected, state, hostCode, lastError, send } = useSafeSocket("safe-host");
  const { codeInput, setCodeInput, rolling, previewDisplay, startRoll } = useRandomCodeRoll(
    hostCode,
    send,
  );
  const [theme, patchTheme] = useSafeTheme();
  const [toast, setToast] = useState<string | null>(null);

  const boardUrl = useMemo(() => `${window.location.origin}/safe/board?chroma=1`, []);
  const boardPreviewUrl = useMemo(() => `${window.location.origin}/safe/board`, []);

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

  const applyCode = () => {
    const code = codeInput.replace(/\D/g, "").padStart(3, "0").slice(0, 3);
    setCodeInput(code);
    send({ type: "safeSetCode", code });
  };


  const arm = () => {
    send({ type: "safeArm" });
  };

  const reset = () => {
    send({ type: "safeReset" });
  };

  const clearEntry = () => {
    send({ type: "safeClear" });
  };

  const pressDigit = (digit: string) => {
    send({ type: "safeDigit", digit });
  };

  const onCodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    setCodeInput(digits);
    if (digits.length === 3) {
      send({ type: "safeSetCode", code: digits });
    }
  };

  const phase = state?.phase ?? "idle";
  const boardDisplay = state?.display ?? ["-", "-", "-"];
  const previewDial = previewDisplay ?? boardDisplay;
  const canEnter = phase === "armed" || phase === "fail";

  return (
    <div className="host safe-host">
      <header className="host__header">
        <div>
          <h1 className="host__title">Сейф — панель ведущего</h1>
          <p className="host__sub">
            Трёхзначный код · ввод с клавиатуры как на домофоне · табло для OBS с хромакеем
          </p>
          <p className="host__sub">
            <Link to="/host">← Поле чудес</Link>
          </p>
        </div>
        <div className={`host__pill ${connected ? "host__pill--ok" : "host__pill--bad"}`}>
          {connected ? "онлайн" : "offline"}
        </div>
      </header>

      {toast && <div className="host__toast">{toast}</div>}
      {lastError && <div className="host__warn">Ошибка: {lastError}</div>}

      <section className={`card host-live ${phase !== "idle" ? "host-live--active" : ""}`}>
        <div className="host-live__top">
          <span className={`host-live__badge ${phase !== "idle" ? "host-live__badge--on" : ""}`}>
            {phase === "idle" && "Сейф выключен"}
            {phase === "armed" && "Ввод кода"}
            {phase === "fail" && "Неверный код"}
            {phase === "success" && "Открыто!"}
          </span>
          {hostCode && phase !== "idle" && (
            <span className="host-live__progress">Правильный код: {hostCode}</span>
          )}
        </div>
        <div className={`safe-host-preview ${rolling ? "safe-host-preview--rolling" : ""}`}>
          <SafeVisual
            display={previewDial}
            phase={phase}
            compact
            digitsRolling={rolling}
            theme={theme}
          />
        </div>
      </section>

      <section className="card">
        <h2 className="card__h">Код сейфа</h2>
        <label className="label" htmlFor="safe-code">
          Три цифры
        </label>
        <input
          id="safe-code"
          className={`safe-code-input ${rolling ? "safe-code-input--rolling" : ""}`}
          inputMode="numeric"
          maxLength={3}
          value={codeInput}
          onChange={(e) => onCodeChange(e.target.value)}
          onBlur={applyCode}
          placeholder="000"
          disabled={rolling}
          readOnly={rolling}
        />
        <div className="row">
          <button type="button" className="btn" onClick={applyCode} disabled={rolling}>
            Применить код
          </button>
          <button type="button" className="btn" onClick={startRoll} disabled={rolling}>
            {rolling ? "Крутим…" : "Случайный код"}
          </button>
        </div>
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={arm}>
            Активировать сейф
          </button>
          <button type="button" className="btn" onClick={reset}>
            Сбросить
          </button>
        </div>
        <p className="muted">
          После «Активировать» на табло появится сейф с «- - -». Вводите цифры ниже — они синхронно
          появятся на OBS.
        </p>
      </section>

      <section className="card">
        <h2 className="card__h">Ввод (домофон)</h2>
        <div className="numpad">
          {DIGITS.map((d) => (
            <button
              key={d}
              type="button"
              className="numpad__key"
              disabled={!canEnter}
              onClick={() => pressDigit(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="row">
          <button type="button" className="btn" disabled={!canEnter} onClick={clearEntry}>
            Стереть ввод
          </button>
        </div>
        {phase === "success" && (
          <p className="host__fb">Сейф открыт — нажмите «Сбросить» для нового розыгрыша.</p>
        )}
      </section>

      <section className="card">
        <h2 className="card__h">Тема табло</h2>
        <p className="muted">
          Меняется в реальном времени и сразу прилетает на OBS-табло (синхронизация через
          BroadcastChannel + localStorage — без ребилда и без перезагрузки источника).
        </p>
        <div className="theme-grid">
          <ThemeRow
            label="Палитра алмазов"
            value={theme.diamondPalette}
            options={PALETTE_OPTIONS}
            onPick={(v) => patchTheme({ diamondPalette: v })}
            swatchOf={(v) => DIAMOND_PALETTES[v][0]?.color ?? null}
          />
          <ThemeRow
            label="Конфетти"
            value={theme.confettiDensity}
            options={DENSITY_OPTIONS}
            onPick={(v) => patchTheme({ confettiDensity: v })}
          />
          <ThemeRow
            label="Размер кучи"
            value={theme.pileScale}
            options={SCALE_OPTIONS}
            onPick={(v) => patchTheme({ pileScale: v })}
          />
          <ThemeRow
            label="Скорость открытия двери"
            value={theme.doorSpeed}
            options={SPEED_OPTIONS}
            onPick={(v) => patchTheme({ doorSpeed: v })}
          />
          <ThemeRow
            label="Стиль открытия двери"
            value={theme.doorPreset}
            options={DOOR_PRESET_OPTIONS}
            onPick={(v) => patchTheme({ doorPreset: v })}
          />
          <ThemeRow
            label="Звук открытия"
            value={theme.doorSound}
            options={DOOR_SOUND_OPTIONS}
            onPick={(v) => patchTheme({ doorSound: v })}
          />
          <ThemeRow
            label="Неверный код"
            value={theme.wrongPreset}
            options={WRONG_PRESET_OPTIONS}
            onPick={(v) => patchTheme({ wrongPreset: v })}
          />
        </div>
      </section>

      <section className="card">
        <h2 className="card__h">Ссылка для OBS</h2>
        <p className="muted">
          Для хромакея используйте зелёный фон. В OBS: источник «Браузер» → URL ниже → фильтр «Хромакей»
          (#00ff00).
        </p>
        <div className="mono">{boardUrl}</div>
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={() => void copy(boardUrl)}>
            Скопировать (с хромакеем)
          </button>
          <button type="button" className="btn" onClick={() => void copy(boardPreviewUrl)}>
            Скопировать без хромакея
          </button>
        </div>
      </section>
    </div>
  );
}
