import type { DoorPreset } from "../safe/theme";

type Props = {
  preset: DoorPreset;
  active: boolean;
};

/**
 * Внешние эффекты открытия двери, выходящие за пределы корпуса сейфа.
 * Рендерится поверх корпуса, но снаружи `.safe-visual__body` — т.е. не
 * клипуется его overflow:hidden. Цвета жёлтые/оранжевые/белые/синие —
 * без зелёного, чтобы хромакей #00ff00 чисто резал контур.
 */
export function SafeDoorFx({ preset, active }: Props) {
  if (!active || preset === "classic") return null;

  return (
    <div className={`door-fx door-fx--${preset}`} key={preset} aria-hidden>
      {preset === "blast" && <BlastFx />}
      {preset === "vault" && <VaultFx />}
      {preset === "flash" && <FlashFx />}
    </div>
  );
}

function BlastFx() {
  return (
    <>
      <div className="door-fx__rays" />
      <div className="door-fx__smoke door-fx__smoke--tl" />
      <div className="door-fx__smoke door-fx__smoke--tr" />
      <div className="door-fx__smoke door-fx__smoke--bl" />
      <div className="door-fx__smoke door-fx__smoke--br" />
      <div className="door-fx__shock" />
      <div className="door-fx__sparks">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: i } as React.CSSProperties} />
        ))}
      </div>
    </>
  );
}

function VaultFx() {
  return (
    <>
      <div className="door-fx__handle-sparks">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: i } as React.CSSProperties} />
        ))}
      </div>
      <div className="door-fx__vault-rays" />
    </>
  );
}

function FlashFx() {
  return (
    <>
      <div className="door-fx__flash" />
      <div className="door-fx__stars">
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: i } as React.CSSProperties} />
        ))}
      </div>
    </>
  );
}
