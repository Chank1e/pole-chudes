import http from "node:http";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { WebSocketServer } from "ws";
import {
  phraseToCells,
  phraseFromCells,
  applyGuess,
  buildPublicState,
  normalizeLetter,
} from "./game.mjs";
import { createStaticHandler } from "./static.mjs";
import { normalizeBoardBackground } from "./boardTheme.mjs";
import { DEFAULT_TILE_THEME, normalizeTileTheme } from "./tileTheme.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");

const isDev = process.argv.includes("dev");

function resolveListenPort() {
  const raw = process.env.PORT ?? process.env.POLE_PORT;
  if (raw !== undefined && raw !== "") {
    const n = Number(raw);
    if (Number.isInteger(n) && n > 0 && n < 65536) return n;
    // eslint-disable-next-line no-console
    console.warn(`[pole-chudes] invalid PORT "${raw}", using default`);
  }
  return isDev ? 3847 : 8080;
}

const PORT = resolveListenPort();
const HOST = process.env.POLE_HOST || (isDev ? "127.0.0.1" : "0.0.0.0");

const API_KEY = process.env.POLE_API_KEY || randomBytes(12).toString("hex");

if (!isDev) {
  if (!existsSync(path.join(distDir, "index.html"))) {
    // eslint-disable-next-line no-console
    console.error("[pole-chudes] dist/index.html not found. Run: npm run build");
    process.exit(1);
  }
}

const tryStatic = !isDev ? createStaticHandler(distDir) : null;

/** @type {{ kind: 'preset'; id: string } | { kind: 'solid'; color: string }} */
let boardBackground = { kind: "preset", id: "default" };

/** @type {{ frontFace: string; faceBorder: string }} */
let tileTheme = { ...DEFAULT_TILE_THEME };

/** @type {{ cells: import('./game.mjs').Cell[]; guessed: Set<string>; wrongGuesses: Set<string> } | null} */
let model = null;

/** @type {import('ws').WebSocket[]} */
const sockets = [];

/**
 * @param {import('./game.mjs').Cell[]} cells
 */
function letterStats(cells) {
  let lettersTotal = 0;
  let lettersOpen = 0;
  for (const c of cells) {
    if (c.kind !== "letter") continue;
    lettersTotal++;
    if (c.revealed) lettersOpen++;
  }
  return { lettersTotal, lettersOpen };
}

/**
 * @param {import('ws').WebSocket} ws
 * @param {import('./game.mjs').PublicState | undefined} [overridePublic]
 */
function statePayloadFor(ws, overridePublic) {
  const idle = !model;
  /** @type {import('./game.mjs').PublicState | null} */
  let pub = null;
  if (!idle && model) {
    pub =
      overridePublic !== undefined
        ? overridePublic
        : buildPublicState(
            model.cells,
            Array.from(model.guessed),
            Array.from(model.wrongGuesses),
            null,
          );
  }

  /** @type {Record<string, unknown>} */
  const payload = {
    type: "state",
    phase: idle ? "idle" : "playing",
    public: pub,
    boardBackground,
    tileTheme,
    apiKey: API_KEY,
  };

  if (ws.clientRole === "host" && model) {
    payload.hostPhrase = phraseFromCells(model.cells);
    payload.hostStats = letterStats(model.cells);
  }

  return payload;
}

function broadcastStateAll(overridePublic) {
  for (const ws of sockets) {
    if (ws.readyState !== 1) continue;
    ws.send(JSON.stringify(statePayloadFor(ws, overridePublic)));
  }
}

function sendState(ws) {
  ws.send(JSON.stringify(statePayloadFor(ws)));
}

function broadcastState() {
  broadcastStateAll(undefined);
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

  broadcastStateAll(pub);
  return { ok: true, feedback: next.lastFeedback };
}

const server = http.createServer(async (req, res) => {
  if (String(req.headers.upgrade || "").toLowerCase() === "websocket") {
    return;
  }

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

  if (tryStatic) {
    const handled = await tryStatic(req, res, url);
    if (handled) return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  let clientRole = "board";
  try {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    if (u.searchParams.get("role") === "host") clientRole = "host";
  } catch {
    /* ignore */
  }
  ws.clientRole = clientRole;

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

    if (msg.type === "clientHello") {
      ws.clientRole = msg.role === "host" ? "host" : "board";
      sendState(ws);
      return;
    }

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
      broadcastStateAll(undefined);
      return;
    }

    if (msg.type === "setBoardBackground" && msg.background !== undefined) {
      const next = normalizeBoardBackground(msg.background);
      if (!next) {
        ws.send(JSON.stringify({ type: "error", message: "bad_background" }));
        return;
      }
      boardBackground = next;
      broadcastStateAll(undefined);
      return;
    }

    if (msg.type === "setTileTheme" && msg.tileTheme !== undefined) {
      const next = normalizeTileTheme(msg.tileTheme);
      if (!next) {
        ws.send(JSON.stringify({ type: "error", message: "bad_tile_theme" }));
        return;
      }
      tileTheme = next;
      broadcastStateAll(undefined);
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

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[pole-chudes] listening on ${HOST}:${PORT} — static UI, /api/guess, WebSocket /ws`);
  if (!isDev) {
    // eslint-disable-next-line no-console
    console.log(`[pole-chudes] static root: ${distDir}`);
    // eslint-disable-next-line no-console
    console.log(`[pole-chudes] board: http://127.0.0.1:${PORT}/board  host: http://127.0.0.1:${PORT}/host`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[pole-chudes] dev: Vite UI http://127.0.0.1:5173/ (API/WS proxied to this port)`);
  }
  // eslint-disable-next-line no-console
  console.log(`[pole-chudes] API key (for Nightbot/customapi): ${API_KEY}`);
});

/** @type {import('node:child_process').ChildProcess | null} */
let vite = null;

if (isDev) {
  vite = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", "5173"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });

  vite.on("exit", (code) => {
    if (code && code !== 0) process.exit(code ?? 1);
  });
}

function shutdown() {
  if (vite) {
    try {
      vite.kill("SIGTERM");
    } catch {
      /* ignore */
    }
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
