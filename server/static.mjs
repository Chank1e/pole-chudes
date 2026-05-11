import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

/** @type {Record<string, string>} */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * @param {string} rootDir absolute path to dist/
 */
export function createStaticHandler(rootDir) {
  const base = path.resolve(rootDir);

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {URL} url
   * @returns {Promise<boolean>} true if handled
   */
  return async function tryStatic(req, res, url) {
    if (req.method !== "GET" && req.method !== "HEAD") return false;

    const pathname = url.pathname || "/";
    if (pathname.includes("\0")) {
      res.writeHead(400);
      res.end();
      return true;
    }

    const parts = pathname === "/" ? [] : pathname.split("/").filter(Boolean);

    let candidate;
    if (pathname === "/" || parts.length === 0) {
      candidate = path.join(base, "index.html");
    } else {
      candidate = path.join(base, ...parts);
      const rel = path.relative(base, candidate);
      if (rel.startsWith("..") || path.isAbsolute(rel)) {
        res.writeHead(403);
        res.end();
        return true;
      }
    }

    let st = await fsp.stat(candidate).catch(() => null);
    let spaFallback = false;
    if (!st || !st.isFile()) {
      candidate = path.join(base, "index.html");
      spaFallback = true;
      st = await fsp.stat(candidate).catch(() => null);
    }

    if (!st || !st.isFile()) {
      res.writeHead(404);
      res.end();
      return true;
    }

    const ext = path.extname(candidate).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const cache =
      spaFallback || ext === ".html"
        ? "no-cache"
        : candidate.includes(`${path.sep}assets${path.sep}`)
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600";

    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", cache);

    if (req.method === "HEAD") {
      res.writeHead(200);
      res.end();
      return true;
    }

    res.writeHead(200);
    try {
      await pipeline(fs.createReadStream(candidate), res);
    } catch {
      try {
        res.destroy();
      } catch {
        /* ignore */
      }
    }
    return true;
  };
}
