export type LetterCell = { kind: "letter"; ch: string; revealed: boolean };
export type SpaceCell = { kind: "space" };
export type Cell = LetterCell | SpaceCell;

export type Feedback =
  | { type: "duplicate"; letter: string }
  | { type: "hit"; letter: string }
  | { type: "miss"; letter: string };

export type PublicState = {
  cells: Cell[];
  guessed: string[];
  wrongGuesses: string[];
  lastFeedback: Feedback | null;
};

/** Synced to OBS board — server validates presets / hex color. */
export type BoardBackground =
  | { kind: "preset"; id: string }
  | { kind: "solid"; color: string };

export type ServerStateMessage =
  | {
      type: "state";
      phase: "idle";
      public: null;
      boardBackground: BoardBackground;
      apiKey?: string;
    }
  | {
      type: "state";
      phase: "playing";
      public: PublicState;
      boardBackground: BoardBackground;
      /** Only sent to clients that registered as host (see clientHello) */
      hostPhrase?: string;
      hostStats?: { lettersTotal: number; lettersOpen: number };
      apiKey?: string;
    };

export type ServerErrorMessage = { type: "error"; message: string };

export type ClientMessage =
  | { type: "clientHello"; role: "host" | "board" }
  | { type: "setWord"; word: string }
  | { type: "resetRound" }
  | { type: "guessLetter"; letter: string }
  | { type: "setBoardBackground"; background: BoardBackground };
