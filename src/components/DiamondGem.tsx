type Props = {
  left: number;
  bottom: number;
  size: number;
  color: string;
  shine: string;
  delay: number;
  layer: number;
  compact?: boolean;
};

/** Крупный ограненный алмаз. */
export function DiamondGem({ left, bottom, size, color, shine, delay, layer, compact = false }: Props) {
  const sz = size * (compact ? 0.5 : 1);

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
        ["--dg-color" as string]: color,
        ["--dg-shine" as string]: shine,
      }}
    >
      <span className="diamond-gem__inner">
        <span className="diamond-gem__stone" />
        <span className="diamond-gem__facet diamond-gem__facet--l" />
        <span className="diamond-gem__facet diamond-gem__facet--r" />
        <span className="diamond-gem__shine" />
      </span>
    </span>
  );
}
