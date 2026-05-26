import { useCallback, useEffect, useRef, useState } from "react";

function randomDigits(): string {
  return String(Math.floor(Math.random() * 1000)).padStart(3, "0");
}

export function toDigitDisplay(code: string): [string, string, string] {
  const d = code.replace(/\D/g, "").padStart(3, "0").slice(0, 3);
  return [d[0]!, d[1]!, d[2]!];
}

type SendFn = (msg: { type: "safeRandomCode" }) => void;

/** Слот-анимация: крутим цифры → сервер отдаёт код → плавная остановка. */
export function useRandomCodeRoll(hostCode: string | null, send: SendFn) {
  const [codeInput, setCodeInput] = useState("000");
  const [rolling, setRolling] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const landRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hostCodeRef = useRef(hostCode);
  const rollStartedAtRef = useRef(0);
  const landingRef = useRef(false);

  useEffect(() => {
    hostCodeRef.current = hostCode;
  }, [hostCode]);

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (landRef.current) clearInterval(landRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    tickRef.current = null;
    landRef.current = null;
    timeoutRef.current = null;
  }, []);

  const finishRoll = useCallback(
    (final: string) => {
      clearTimers();
      landingRef.current = false;
      setCodeInput(final);
      setRolling(false);
    },
    [clearTimers],
  );

  const landOnCode = useCallback(
    (final: string) => {
      if (landingRef.current) return;
      landingRef.current = true;
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;

      let step = 0;
      landRef.current = setInterval(() => {
        step += 1;
        if (step < 5) {
          setCodeInput(randomDigits());
        } else {
          finishRoll(final);
        }
      }, 75);
    },
    [finishRoll],
  );

  useEffect(() => {
    if (!rolling && hostCode) setCodeInput(hostCode);
  }, [hostCode, rolling]);

  useEffect(() => {
    if (!rolling || !hostCode) return;
    if (Date.now() - rollStartedAtRef.current < 420) return;
    landOnCode(hostCode);
  }, [hostCode, rolling, landOnCode]);

  const startRoll = useCallback(() => {
    if (rolling) return;
    clearTimers();
    landingRef.current = false;
    rollStartedAtRef.current = Date.now();
    setRolling(true);
    send({ type: "safeRandomCode" });

    tickRef.current = setInterval(() => {
      setCodeInput(randomDigits());
    }, 68);

    timeoutRef.current = setTimeout(() => {
      landOnCode(hostCodeRef.current ?? randomDigits());
    }, 2600);
  }, [clearTimers, landOnCode, rolling, send]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const previewDisplay = rolling ? toDigitDisplay(codeInput) : null;

  return {
    codeInput,
    setCodeInput,
    rolling,
    previewDisplay,
    startRoll,
  };
}
