import { useId } from "react";

type Props = {
  left: number;
  bottom: number;
  size: number;
  color: string;
  shine: string;
  delay: number;
  layer: number;
  tilt?: number;
  compact?: boolean;
};

/** Огранённый алмаз — настоящий SVG с фасетами и бликами. */
export function DiamondGem({
  left,
  bottom,
  size,
  color,
  shine,
  delay,
  layer,
  tilt = 0,
  compact = false,
}: Props) {
  const sz = size * (compact ? 0.5 : 1);
  const uid = useId().replace(/[:]/g, "");
  const idL = `dg-l-${uid}`;
  const idT = `dg-t-${uid}`;
  const idD = `dg-d-${uid}`;
  const idP = `dg-p-${uid}`;

  return (
    <span
      className="diamond-gem"
      style={{
        left: `${left}%`,
        bottom: `${bottom}%`,
        width: sz,
        height: sz * 1.18,
        zIndex: layer,
        ["--dg-delay" as string]: `${delay}s`,
        ["--dg-tilt" as string]: `${tilt}deg`,
      }}
    >
      <span className="diamond-gem__inner">
        <svg
          className="diamond-gem__svg"
          viewBox="0 0 100 118"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <linearGradient id={idL} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={shine} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
            <linearGradient id={idT} x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor={shine} />
            </linearGradient>
            <linearGradient id={idD} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
            <linearGradient id={idP} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor="#0b1e35" />
            </linearGradient>
          </defs>

          {/* корона — левая грань (светлая) */}
          <polygon points="30,0 0,40 50,40" fill={`url(#${idL})`} />
          {/* корона — площадка (самая светлая) */}
          <polygon points="30,0 70,0 50,40" fill={`url(#${idT})`} />
          {/* корона — правая грань (тёмная) */}
          <polygon points="70,0 100,40 50,40" fill={`url(#${idD})`} />
          {/* павильон — левая */}
          <polygon points="0,40 50,40 50,118" fill={`url(#${idP})`} />
          {/* павильон — правая (темнее) */}
          <polygon points="100,40 50,40 50,118" fill={`url(#${idD})`} />

          {/* рёбра */}
          <polyline
            points="30,0 70,0 100,40 50,118 0,40 30,0"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* внутренние грани */}
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
          <line x1="30" y1="0" x2="50" y2="40" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          <line x1="70" y1="0" x2="50" y2="40" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
          <line x1="0" y1="40" x2="50" y2="118" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
          <line x1="100" y1="40" x2="50" y2="118" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" />

          {/* блик */}
          <ellipse
            cx="40"
            cy="16"
            rx="7"
            ry="4"
            fill="rgba(255,255,255,0.85)"
            className="diamond-gem__sparkle"
          />
        </svg>
      </span>
    </span>
  );
}
