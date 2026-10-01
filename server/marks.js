import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export const INKS = ["terracotta", "charcoal", "olive"];
const PAGE_SIZE = 24;

export function createMarkStore(filename) {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS marks (
    id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
    x REAL NOT NULL, y REAL NOT NULL, rotation REAL NOT NULL,
    ink TEXT NOT NULL, created_at TEXT NOT NULL
  );`);
  const find = db.prepare("SELECT * FROM marks WHERE request_id = ?");
  const insert = db.prepare(
    "INSERT INTO marks VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const count = db.prepare("SELECT COUNT(*) AS total FROM marks");
  const list = db.prepare(
    "SELECT * FROM marks ORDER BY rowid DESC LIMIT ? OFFSET ?",
  );
  function publicMark(row) {
    const { request_id, ...mark } = row;
    return mark;
  }
  return {
    list(page = 0) {
      const { total } = count.get();
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const current = Math.min(page, pages - 1);
      return {
        marks: list.all(PAGE_SIZE, current * PAGE_SIZE).map(publicMark),
        total,
        page: current,
        pages,
      };
    },
    find(requestId) {
      const row = find.get(requestId);
      return row ? publicMark(row) : null;
    },
    add(value) {
      const mark = {
        id: randomUUID(),
        name: value.name,
        x: value.x,
        y: value.y,
        rotation: value.rotation,
        ink: value.ink,
        created_at: new Date().toISOString(),
      };
      insert.run(
        mark.id,
        value.requestId,
        mark.name,
        mark.x,
        mark.y,
        mark.rotation,
        mark.ink,
        mark.created_at,
      );
      return mark;
    },
    close() {
      db.close();
    },
  };
}

export function validateMark(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const name =
    typeof body.name === "string"
      ? body.name.normalize("NFKC").trim().replace(/\s+/gu, " ")
      : "";
  // Public names only; no HTML, links or control characters.
  if (
    name.length < 1 ||
    [...name].length > 24 ||
    !/^[\p{L}\p{M}\p{N} .’'_-]+$/u.test(name)
  )
    return null;
  if (
    !INKS.includes(body.ink) ||
    !/^[a-f0-9-]{36}$/i.test(body.requestId || "")
  )
    return null;
  if (
    typeof body.x !== "number" ||
    !Number.isFinite(body.x) ||
    body.x < 12 ||
    body.x > 88
  )
    return null;
  if (
    typeof body.y !== "number" ||
    !Number.isFinite(body.y) ||
    body.y < 16 ||
    body.y > 85
  )
    return null;
  if (
    typeof body.rotation !== "number" ||
    !Number.isFinite(body.rotation) ||
    Math.abs(body.rotation) > 25
  )
    return null;
  if (body.website) return null;
  return {
    name,
    ink: body.ink,
    requestId: body.requestId,
    x: body.x,
    y: body.y,
    rotation: body.rotation,
  };
}

export function createMarksHandler(
  store,
  { limit = 5, windowMs = 60 * 60 * 1000 } = {},
) {
  const requests = new Map();
  function json(res, status, payload) {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(payload));
  }
  return async function handle(
    req,
    res,
    next = () => json(res, 404, { error: "Introuvable." }),
  ) {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname !== "/api/marks") return next();
    try {
      if (req.method === "GET") {
        const page = Number(url.searchParams.get("page") || 0);
        if (!Number.isSafeInteger(page) || page < 0)
          return json(res, 400, { error: "Page invalide." });
        return json(res, 200, store.list(page));
      }
      if (req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return json(res, 405, { error: "Méthode non autorisée." });
      }
      // A same-origin page must initiate the request. No permissive CORS.
      if (
        req.headers.origin &&
        new URL(req.headers.origin).host !== req.headers.host
      )
        return json(res, 403, { error: "Origine non autorisée." });
      if (!req.headers["content-type"]?.startsWith("application/json"))
        return json(res, 415, { error: "Format non pris en charge." });
      let size = 0,
        data = "";
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 2048) return json(res, 413, { error: "Message trop long." });
        data += chunk;
      }
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        return json(res, 400, { error: "Message invalide." });
      }
      const value = validateMark(parsed);
      if (!value)
        return json(res, 400, {
          error: "Vérifiez votre prénom et choisissez une place sur le mur.",
        });
      const previous = store.find(value.requestId);
      if (previous) return json(res, 200, { mark: previous });
      const now = Date.now();
      for (const [key, record] of requests)
        if (record.until <= now) requests.delete(key);
      const key = req.socket.remoteAddress || "local";
      const record = requests.get(key) || { count: 0, until: now + windowMs };
      if (record.count >= limit) {
        res.setHeader(
          "Retry-After",
          String(Math.ceil((record.until - now) / 1000)),
        );
        return json(res, 429, {
          error:
            "Vous avez déjà laissé plusieurs traces. Revenez dans un moment.",
        });
      }
      if (requests.size >= 10000 && !requests.has(key))
        return json(res, 503, {
          error: "Le mur est très demandé. Réessayez dans un moment.",
        });
      const mark = store.add(value);
      record.count++;
      requests.set(key, record);
      return json(res, 201, { mark });
    } catch (error) {
      console.error("Marks API:", error.message);
      return json(res, 500, {
        error: "Le mur est momentanément indisponible. Réessayez.",
      });
    }
  };
}
