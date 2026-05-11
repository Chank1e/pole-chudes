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

export type ServerStateMessage =
  | { type: "state"; phase: "idle"; public: null; apiKey?: string }
  | { type: "state"; phase: "playing"; public: PublicState; apiKey?: string };

export type ServerErrorMessage = { type: "error"; message: string };

export type ClientMessage =
  | { type: "setWord"; word: string }
  | { type: "resetRound" }
  | { type: "guessLetter"; letter: string };
