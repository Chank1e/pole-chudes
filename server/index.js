import http from "node:http";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { WebSocketServer } from "ws";
import {
  phraseToCells,
  applyGuess,
  buildPublicState,
  normalizeLetter,
} from "./game.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PORT = Number(process.env.POLE_SYNC_PORT || 3847);
const API_KEY = process.env.POLE_API_KEY || randomBytes(12).toString("hex");

/** @type {{ cells: import('./game.mjs').Cell[]; guessed: Set<string>; wrongGuesses: Set<string> } | null} */
let model = null;

/** @type {import('ws').WebSocket[]} */
const sockets = [];

function broadcast(obj) {
  const data = JSON.stringify(obj);
  for (const ws of sockets) {
    if (ws.readyState === 1) ws.send(data);
  }
}

function getPublicState() {
  if (!model) {
    return { phase: "idle", public: null };
  }
  return {
    phase: "playing",
    public: buildPublicState(
      model.cells,
      Array.from(model.guessed),
      Array.from(model.wrongGuesses),
      null,
    ),
  };
}

function sendState(ws) {
  ws.send(JSON.stringify({ type: "state", ...getPublicState(), apiKey: API_KEY }));
}

function broadcastState() {
  broadcast({ type: "state", ...getPublicState() });
}

/**
 * @param {string} raw
 */
function guessFromString(raw) {
  if (!model) return { ok: false, error: "no_round" };
  const g = normalizeLetter(raw);
  if (!g) return { ok: false, error: "bad_letter" };

  const next = applyGuess(model, raw);
  model = {
    cells: next.cells,
    guessed: next.guessed,
    wrongGuesses: next.wrongGuesses,
  };

  const pub = buildPublicState(
    model.cells,
    Array.from(model.guessed),
    Array.from(model.wrongGuesses),
    next.lastFeedback,
  );

  broadcast({ type: "state", phase: "playing", public: pub });
  return { ok: true, feedback: next.lastFeedback };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/guess") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const key = url.searchParams.get("key") || "";
    const letter = url.searchParams.get("letter") || url.searchParams.get("l") || "";
    if (key !== API_KEY) {
      res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: "forbidden" }));
      return;
    }
    const result = guessFromString(letter);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  sockets.push(ws);
  sendState(ws);

  ws.on("message", (buf) => {
    let msg;
    try {
      msg = JSON.parse(String(buf));
    } catch {
      return;
    }

    if (!msg || typeof msg !== "object") return;

    if (msg.type === "setWord" && typeof msg.word === "string") {
      const cells = phraseToCells(msg.word);
      if (!cells.some((c) => c.kind === "letter")) {
        ws.send(JSON.stringify({ type: "error", message: "empty_phrase" }));
        return;
      }
      model = {
        cells,
        guessed: new Set(),
        wrongGuesses: new Set(),
      };
      broadcastState();
      return;
    }

    if (msg.type === "resetRound") {
      model = null;
      broadcast({ type: "state", phase: "idle", public: null });
      return;
    }

    if (msg.type === "guessLetter" && typeof msg.letter === "string") {
      guessFromString(msg.letter);
      return;
    }
  });

  ws.on("close", () => {
    const i = sockets.indexOf(ws);
    if (i !== -1) sockets.splice(i, 1);
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[pole-chudes] sync+wss on http://127.0.0.1:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[pole-chudes] API key (for Nightbot/customapi): ${API_KEY}`);
});

const vite = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", "5173"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

function shutdown() {
  try {
    vite.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  try {
    server.close();
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
vite.on("exit", (code) => {
  if (code && code !== 0) process.exit(code ?? 1);
});
