import type { WrongPreset } from "../safe/theme";

type Props = {
  preset: WrongPreset;
  trigger: number;
};

/**
 * Эффекты на «неверный код». Монтируется на phase=fail. Каждое срабатывание
 * меняет ключ — анимация перезапускается. Цвета чисто несовместимые с зелёным
 * хромакей-ключом (#00ff00) — можно выходить за коробку сейфа.
 */
export function SafeWrongFx({ preset, trigger }: Props) {
  if (preset === "shake" || trigger <= 0) return null;

  return (
    <div className={`wrong-fx wrong-fx--${preset}`} key={`${preset}-${trigger}`} aria-hidden>
      {preset === "cop" && <CopFx />}
      {preset === "siren" && <SirenFx />}
      {preset === "lightning" && <LightningFx />}
      {preset === "bomb" && <BombFx />}
    </div>
  );
}

function CopFx() {
  return (
    <>
      <div className="wrong-fx__cop">
        <svg viewBox="0 0 120 200" className="wrong-fx__cop-svg" aria-hidden>
          {/* туловище в синей форме */}
          <rect x="32" y="78" width="56" height="74" rx="8" fill="#1e3a8a" />
          <rect x="32" y="78" width="56" height="14" fill="#1d4ed8" />
          {/* пуговицы */}
          <circle cx="60" cy="98" r="2.5" fill="#fbbf24" />
          <circle cx="60" cy="112" r="2.5" fill="#fbbf24" />
          <circle cx="60" cy="126" r="2.5" fill="#fbbf24" />
          {/* значок */}
          <polygon points="48,90 52,86 56,90 52,98" fill="#fbbf24" />
          {/* шея */}
          <rect x="52" y="68" width="16" height="14" fill="#fcd5bb" />
          {/* голова */}
          <circle cx="60" cy="56" r="20" fill="#fcd5bb" />
          {/* фуражка */}
          <ellipse cx="60" cy="40" rx="26" ry="8" fill="#1e293b" />
          <path d="M34 40 Q60 16 86 40 L86 36 Q60 12 34 36 Z" fill="#1e293b" />
          <rect x="46" y="40" width="28" height="6" fill="#0f172a" />
          <circle cx="60" cy="32" r="3" fill="#fbbf24" />
          {/* глаза */}
          <circle cx="52" cy="58" r="1.6" fill="#0f172a" />
          <circle cx="68" cy="58" r="1.6" fill="#0f172a" />
          {/* злой рот */}
          <path d="M52 68 Q60 64 68 68" stroke="#7f1d1d" strokeWidth="1.6" fill="none" />
          {/* левая рука с дубинкой */}
          <g className="wrong-fx__cop-arm">
            <rect x="14" y="92" width="22" height="10" rx="5" fill="#1e3a8a" />
            <rect x="10" y="86" width="10" height="46" rx="4" fill="#0f172a" />
            <rect x="11" y="86" width="3" height="46" fill="#475569" />
          </g>
          {/* правая рука */}
          <rect x="84" y="92" width="22" height="10" rx="5" fill="#1e3a8a" />
          <rect x="80" y="100" width="14" height="22" rx="4" fill="#fcd5bb" />
          {/* ноги */}
          <rect x="40" y="152" width="14" height="38" rx="3" fill="#0f172a" />
          <rect x="66" y="152" width="14" height="38" rx="3" fill="#0f172a" />
          {/* ботинки */}
          <ellipse cx="46" cy="192" rx="11" ry="5" fill="#020617" />
          <ellipse cx="74" cy="192" rx="11" ry="5" fill="#020617" />
        </svg>
        <div className="wrong-fx__cop-impact" aria-hidden />
      </div>
      <div className="wrong-fx__cop-shout">БАМ!</div>
    </>
  );
}

function SirenFx() {
  return (
    <>
      <div className="wrong-fx__siren-dome" aria-hidden>
        <div className="wrong-fx__siren-beam wrong-fx__siren-beam--l" />
        <div className="wrong-fx__siren-beam wrong-fx__siren-beam--r" />
        <div className="wrong-fx__siren-cap" />
      </div>
      <div className="wrong-fx__siren-pulse" aria-hidden />
      <div className="wrong-fx__siren-label">WEE&nbsp;·&nbsp;WAH</div>
    </>
  );
}

function LightningFx() {
  return (
    <>
      <div className="wrong-fx__lightning-flash" aria-hidden />
      <svg viewBox="0 0 100 220" className="wrong-fx__lightning-bolt" aria-hidden>
        <polygon
          points="58,0 30,98 52,98 26,220 78,82 52,82 76,0"
          fill="#fef08a"
          stroke="#fde68a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon
          points="58,0 30,98 52,98 26,220 78,82 52,82 76,0"
          fill="white"
          opacity="0.55"
          transform="scale(0.6) translate(20,40)"
        />
      </svg>
    </>
  );
}

function BombFx() {
  return (
    <>
      <div className="wrong-fx__bomb" aria-hidden>
        <div className="wrong-fx__bomb-body">
          <div className="wrong-fx__bomb-shine" />
        </div>
        <div className="wrong-fx__bomb-fuse">
          <div className="wrong-fx__bomb-spark" />
        </div>
      </div>
      <div className="wrong-fx__bomb-puff" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="wrong-fx__bomb-label">пф-ф-ф…</div>
    </>
  );
}
