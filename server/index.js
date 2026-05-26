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
import {
  appendSafeDigit,
  armSafe,
  clearSafeEntry,
  createIdleSafe,
  buildSafeState,
  randomCode,
  recoverAfterFail,
  resetSafe,
  setSafeCode,
} from "./safe.mjs";

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
const VITE_DEV_PORT = Number(process.env.VITE_PORT) || 5173;

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

/** @type {import('./safe.mjs').SafeModel} */
let safeModel = createIdleSafe();

/** @type {ReturnType<typeof setTimeout> | null} */
let safeFailTimer = null;

/** @type {import('ws').WebSocket[]} */
const sockets = [];

/** @param {import('ws').WebSocket} ws */
function isPoleClient(ws) {
  return ws.clientRole === "host" || ws.clientRole === "board";
}

/** @param {import('ws').WebSocket} ws */
function isSafeClient(ws) {
  return ws.clientRole === "safe-host" || ws.clientRole === "safe-board";
}

function scheduleSafeFailRecovery() {
  if (safeFailTimer) clearTimeout(safeFailTimer);
  safeFailTimer = setTimeout(() => {
    safeFailTimer = null;
    if (safeModel.phase === "fail") {
      recoverAfterFail(safeModel);
      broadcastSafeState();
    }
  }, 2800);
}

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
    if (!isPoleClient(ws)) continue;
    ws.send(JSON.stringify(statePayloadFor(ws, overridePublic)));
  }
}

function sendState(ws) {
  if (isPoleClient(ws)) {
    ws.send(JSON.stringify(statePayloadFor(ws)));
  } else if (isSafeClient(ws)) {
    ws.send(JSON.stringify(buildSafeState(safeModel, ws.clientRole === "safe-host")));
  }
}

function broadcastState() {
  broadcastStateAll(undefined);
}

function broadcastSafeState() {
  for (const ws of sockets) {
    if (ws.readyState !== 1) continue;
    if (!isSafeClient(ws)) continue;
    ws.send(JSON.stringify(buildSafeState(safeModel, ws.clientRole === "safe-host")));
  }
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

  if (isDev && req.method === "GET" && !url.pathname.startsWith("/api")) {
    const target = `http://127.0.0.1:${VITE_DEV_PORT}${url.pathname}${url.search}`;
    res.writeHead(302, { Location: target, "Content-Type": "text/html; charset=utf-8" });
    res.end(
      `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${target}"><title>Dev</title></head><body><p>UI в dev только на Vite. Переход: <a href="${target}">${target}</a></p></body></html>`,
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

/**
 * @param {string | null} roleParam
 */
function resolveClientRole(roleParam) {
  if (roleParam === "host") return "host";
  if (roleParam === "safe-host") return "safe-host";
  if (roleParam === "safe-board") return "safe-board";
  return "board";
}

wss.on("connection", (ws, req) => {
  let clientRole = "board";
  try {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    clientRole = resolveClientRole(u.searchParams.get("role"));
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
      const role = msg.role;
      ws.clientRole =
        role === "host"
          ? "host"
          : role === "safe-host"
            ? "safe-host"
            : role === "safe-board"
              ? "safe-board"
              : "board";
      sendState(ws);
      return;
    }

    if (msg.type === "safeSetCode" && typeof msg.code === "string") {
      const result = setSafeCode(safeModel, msg.code);
      if (!result.ok) {
        ws.send(JSON.stringify({ type: "error", message: result.error }));
        return;
      }
      broadcastSafeState();
      return;
    }

    if (msg.type === "safeRandomCode") {
      safeModel.code = randomCode();
      broadcastSafeState();
      return;
    }

    if (msg.type === "safeArm") {
      armSafe(safeModel);
      broadcastSafeState();
      return;
    }

    if (msg.type === "safeReset") {
      if (safeFailTimer) {
        clearTimeout(safeFailTimer);
        safeFailTimer = null;
      }
      resetSafe(safeModel);
      broadcastSafeState();
      return;
    }

    if (msg.type === "safeClear") {
      if (safeFailTimer) {
        clearTimeout(safeFailTimer);
        safeFailTimer = null;
      }
      clearSafeEntry(safeModel);
      broadcastSafeState();
      return;
    }

    if (msg.type === "safeDigit" && typeof msg.digit === "string") {
      const result = appendSafeDigit(safeModel, msg.digit);
      if (!result.ok) {
        ws.send(JSON.stringify({ type: "error", message: result.error }));
        return;
      }
      broadcastSafeState();
      if (result.result === "wrong") {
        scheduleSafeFailRecovery();
      }
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

/** @type {import('node:child_process').ChildProcess | null} */
let vite = null;

function startViteDev() {
  vite = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", String(VITE_DEV_PORT)], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });

  vite.on("exit", (code) => {
    if (code && code !== 0) process.exit(code ?? 1);
  });
}

server.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error(`[pole-chudes] cannot listen on ${HOST}:${PORT}: ${err.message}`);
  if (/** @type {NodeJS.ErrnoException} */ (err).code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(`[pole-chudes] порт занят. Освободи: lsof -ti :${PORT} :${VITE_DEV_PORT} | xargs kill`);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[pole-chudes] listening on ${HOST}:${PORT} — static UI, /api/guess, WebSocket /ws`);
  if (!isDev) {
    // eslint-disable-next-line no-console
    console.log(`[pole-chudes] static root: ${distDir}`);
    // eslint-disable-next-line no-console
    console.log(`[pole-chudes] board: http://127.0.0.1:${PORT}/board  host: http://127.0.0.1:${PORT}/host`);
    console.log(
      `[pole-chudes] safe: http://127.0.0.1:${PORT}/safe/board?chroma=1  host: http://127.0.0.1:${PORT}/safe/host`,
    );
  } else {
    startViteDev();
    // eslint-disable-next-line no-console
    console.log(`[pole-chudes] dev UI:  http://127.0.0.1:${VITE_DEV_PORT}/`);
    // eslint-disable-next-line no-console
    console.log(`[pole-chudes] dev host: http://127.0.0.1:${VITE_DEV_PORT}/host`);
    // eslint-disable-next-line no-console
    console.log(`[pole-chudes] dev safe: http://127.0.0.1:${VITE_DEV_PORT}/safe/host`);
    // eslint-disable-next-line no-console
    console.log(`[pole-chudes] API/WS проксируются с :${VITE_DEV_PORT} → :${PORT}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[pole-chudes] API key (for Nightbot/customapi): ${API_KEY}`);
});

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
