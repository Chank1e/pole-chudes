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

/** Letter tile styling on /board (.tile__face--front bg + .tile__face border). */
export type TileTheme = {
  frontFace: string;
  faceBorder: string;
};

export type ServerStateMessage =
  | {
      type: "state";
      phase: "idle";
      public: null;
      boardBackground: BoardBackground;
      tileTheme: TileTheme;
      apiKey?: string;
    }
  | {
      type: "state";
      phase: "playing";
      public: PublicState;
      boardBackground: BoardBackground;
      tileTheme: TileTheme;
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
  | { type: "setBoardBackground"; background: BoardBackground }
  | { type: "setTileTheme"; tileTheme: TileTheme };
