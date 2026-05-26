export type SafePhase = "idle" | "armed" | "fail" | "success";

export type SafeEvent =
  | { type: "digit"; index: number; digit: string }
  | { type: "wrong" }
  | { type: "success" }
  | { type: "reset" };

export type SafePublicState = {
  phase: SafePhase;
  display: [string, string, string];
  enteredCount: number;
  eventSeq: number;
  lastEvent: SafeEvent | null;
};

export type SafeServerStateMessage = {
  type: "safeState";
  phase: SafePhase;
  display: [string, string, string];
  enteredCount: number;
  eventSeq: number;
  lastEvent: SafeEvent | null;
  hostCode?: string;
};

export type SafeClientMessage =
  | { type: "clientHello"; role: "safe-host" | "safe-board" }
  | { type: "safeSetCode"; code: string }
  | { type: "safeRandomCode" }
  | { type: "safeArm" }
  | { type: "safeReset" }
  | { type: "safeClear" }
  | { type: "safeDigit"; digit: string };
