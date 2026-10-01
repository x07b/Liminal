import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  randomInt,
  createHash,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
  mkdirSync,
  existsSync,
  writeFileSync,
  readFileSync,
  createReadStream,
  statSync,
  unlinkSync,
} from "node:fs";
import { resolve } from "node:path";
import { projects as seeds } from "../src/content.js";
import { validateMark } from "./marks.js";

const derive = promisify(scrypt);
const hash = (value) =>
  createHash("sha256").update(String(value)).digest("hex");
const token = () => randomBytes(32).toString("hex");
const TRASH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const emailLogo = readFileSync(
  new URL("../public/brand/full-logo.svg", import.meta.url),
).toString("base64");
const emailOf = (value) =>
  typeof value === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) &&
  value.length <= 254
    ? value.trim().toLowerCase()
    : null;
const safe = (value, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const equal = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
let activeHashes = 0;
async function deriveKey(password, salt) {
  if (activeHashes >= 2) fail(429, "Trop de tentatives. Réessayez plus tard.");
  activeHashes++;
  try {
    return await derive(password, salt, 64, {
      N: 131072,
      r: 8,
      p: 1,
      maxmem: 256 * 1024 * 1024,
    });
  } finally {
    activeHashes--;
  }
}
export async function passwordHash(password) {
  const salt = token();
  const key = await deriveKey(password, salt);
  return `${salt}:${key.toString("hex")}`;
}
async function passwordMatches(password, stored) {
  const [salt, key] = stored.split(":");
  const candidate = await deriveKey(password, salt);
  return equal(candidate.toString("hex"), key);
}
function passwordValid(value) {
  return (
    typeof value === "string" &&
    value.length >= 14 &&
    value.length <= 128 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}
const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
function emailHtml({ subject, text, code, cta }) {
  const content = escapeHtml(text).replaceAll("\n", "<br>");
  return `<!doctype html><html><body style="margin:0;background:#efeee7;color:#24251f;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#efeee7;padding:34px 14px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#faf9f5;border:1px solid #d9d9cf"><tr><td style="padding:32px 38px;border-bottom:1px solid #deded4"><img src="cid:liminal-logo" width="190" alt="LIMINAL" style="display:block;width:190px;max-width:60%;height:auto"></td></tr><tr><td style="padding:42px 38px 34px"><p style="margin:0 0 15px;color:#de5a3c;font-size:11px;letter-spacing:2px;font-weight:700">LIMINAL / STUDIO NOTE</p><h1 style="margin:0 0 24px;font-size:31px;line-height:1.08;letter-spacing:-1px;font-weight:500">${escapeHtml(subject)}</h1><div style="font-size:15px;line-height:1.75;color:#55584c">${content}</div>${code ? `<div style="margin:30px 0;padding:22px 24px;background:#22231f;color:#f3f0da;font-size:34px;letter-spacing:9px;text-align:center;font-weight:700">${escapeHtml(code)}</div>` : ""}${cta?.url ? `<p style="margin:30px 0 0"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#de5a3c;color:#fff;text-decoration:none;padding:15px 20px;font-size:13px;font-weight:700">${escapeHtml(cta.label || "Ouvrir")}</a></p>` : ""}</td></tr><tr><td style="padding:22px 38px;border-top:1px solid #deded4;color:#858779;font-size:10px;letter-spacing:1.2px">LIMINAL · CREATIVE PRODUCTION HOUSE · TUNISIE</td></tr></table></td></tr></table></body></html>`;
}
function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(data));
}
async function body(req, limit = 65536, raw = false) {
  if (!raw && !req.headers["content-type"]?.startsWith("application/json"))
    fail(415, "Format invalide.");
  if (Number(req.headers["content-length"] || 0) > limit)
    fail(413, "Fichier ou message trop volumineux.");
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) fail(413, "Fichier ou message trop volumineux.");
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  if (raw) return buffer;
  try {
    const data = JSON.parse(buffer.toString());
    if (!data || typeof data !== "object" || Array.isArray(data)) throw Error();
    return data;
  } catch {
    fail(400, "Message invalide.");
  }
}
function publicMark(m) {
  const { id, name, x, y, rotation, ink, created_at } = m;
  return { id, name, x, y, rotation, ink, created_at };
}
function mediaURL(value) {
  if (!value) return "";
  if (typeof value !== "string" || value.length > 2000)
    fail(400, "Lien média invalide.");
  if (
    /^\/uploads\/[a-f0-9-]+\.(webp|png|jpg|mp4|webm)$/.test(value) ||
    /^\/images\/[a-zA-Z0-9_.-]+$/.test(value)
  )
    return value;
  try {
    const u = new URL(value);
    if (u.protocol === "https:" && !u.username && !u.password) return u.href;
  } catch {}
  fail(400, "Utilisez un média importé ou une URL HTTPS.");
}
function validateProject(data) {
  const slug = safe(data.slug, 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    fail(
      400,
      "Le slug doit contenir des lettres minuscules, chiffres et tirets.",
    );
  const p = {
    slug,
    published: data.published === true,
    visual: ["editorial", "resonance", "image", "video"].includes(data.visual)
      ? data.visual
      : "image",
    media: mediaURL(data.media),
    poster: mediaURL(data.poster),
    translations: {},
  };
  for (const key of [
    "title",
    "category",
    "type",
    "tags",
    "description",
    "context",
    "intention",
    "execution",
    "credit",
    "number",
  ])
    p[key] = safe(
      data[key],
      ["context", "intention", "execution"].includes(key) ? 4000 : 600,
    );
  if (!p.title || !p.category || !p.description)
    fail(400, "Titre, catégorie et description sont nécessaires.");
  if (["image", "video"].includes(p.visual) && !p.media)
    fail(400, "Ajoutez le média du projet.");
  p.deliverables = Array.isArray(data.deliverables)
    ? data.deliverables
        .slice(0, 20)
        .map((x) => safe(x, 150))
        .filter(Boolean)
    : [];
  for (const lang of ["en", "ar"]) {
    p.translations[lang] = {};
    for (const key of [
      "title",
      "category",
      "type",
      "tags",
      "description",
      "context",
      "intention",
      "execution",
      "credit",
    ])
      p.translations[lang][key] = safe(data.translations?.[lang]?.[key], 4000);
    p.translations[lang].deliverables = Array.isArray(
      data.translations?.[lang]?.deliverables,
    )
      ? data.translations[lang].deliverables
          .slice(0, 20)
          .map((x) => safe(x, 150))
      : [];
  }
  return p;
}
function validateTestimonial(data) {
  const item = {
    quote: safe(data.quote, 1200),
    name: safe(data.name, 120),
    role: safe(data.role, 140),
    company: safe(data.company, 140),
    signature: safe(data.signature, 120),
    avatar: mediaURL(data.avatar),
    logo: mediaURL(data.logo),
    published: data.published === true,
  };
  if (item.quote.length < 10 || item.name.length < 2)
    fail(400, "Ajoutez un témoignage et un nom valides.");
  return item;
}

export function createPortal({
  dataDir = resolve("data"),
  origin = process.env.SITE_ORIGIN,
  adminEmail = process.env.ADMIN_EMAIL || "itsazizsaidi@gmail.com",
  adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || adminEmail,
  mailMode = process.env.MAIL_MODE || "local",
  sendMail: customMail,
} = {}) {
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(resolve(dataDir, "uploads"), { recursive: true });
  const db = new DatabaseSync(resolve(dataDir, "marks.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS marks (id TEXT PRIMARY KEY,request_id TEXT UNIQUE NOT NULL,name TEXT NOT NULL,x REAL NOT NULL,y REAL NOT NULL,rotation REAL NOT NULL,ink TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,data TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY,request_id TEXT UNIQUE NOT NULL,kind TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,data TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY,name TEXT NOT NULL,status TEXT NOT NULL,consent_at TEXT NOT NULL,verified_at TEXT,token_hash TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admins (email TEXT PRIMARY KEY,password TEXT NOT NULL,verified_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS challenges (id TEXT PRIMARY KEY,email TEXT NOT NULL,code_hash TEXT NOT NULL,purpose TEXT NOT NULL,payload TEXT NOT NULL,expires INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY,email TEXT NOT NULL,csrf TEXT NOT NULL,expires INTEGER NOT NULL,last_seen INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY,action TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY,subject TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL,result TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS subscription_tokens (hash TEXT PRIMARY KEY,email TEXT NOT NULL,purpose TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS testimonials (id TEXT PRIMARY KEY,data TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  `);
  const columns = db
    .prepare("PRAGMA table_info(marks)")
    .all()
    .map((x) => x.name);
  if (!columns.includes("email"))
    db.exec(
      "ALTER TABLE marks ADD COLUMN email TEXT NOT NULL DEFAULT ''; ALTER TABLE marks ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';",
    );
  if (!columns.includes("deleted_at"))
    db.exec("ALTER TABLE marks ADD COLUMN deleted_at TEXT");
  const projectColumns = db
    .prepare("PRAGMA table_info(projects)")
    .all()
    .map((x) => x.name);
  if (!projectColumns.includes("deleted_at"))
    db.exec("ALTER TABLE projects ADD COLUMN deleted_at TEXT");
  // Idempotent seed migration. Existing edits and drafts are never overwritten.
  db.exec("CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)");
  if (
    !db.prepare("SELECT 1 FROM migrations WHERE name=?").get("seed-projects")
  ) {
    db.exec("BEGIN");
    try {
      for (const p of seeds)
        db.prepare(
          "INSERT OR IGNORE INTO projects(id,slug,data,updated_at) VALUES(?,?,?,?)",
        ).run(
          randomUUID(),
          p.slug,
          JSON.stringify({
            ...p,
            published: true,
            media: "",
            poster: "",
            translations: {},
          }),
          new Date().toISOString(),
        );
      db.prepare("INSERT INTO migrations VALUES(?)").run("seed-projects");
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  // Remove only the preview testimonials shipped during development. Real entries
  // created in the dashboard are preserved, whether published or still drafts.
  if (
    !db
      .prepare("SELECT 1 FROM migrations WHERE name=?")
      .get("remove-demo-testimonials")
  ) {
    db.exec("BEGIN");
    try {
      const remove = db.prepare("DELETE FROM testimonials WHERE id=?");
      for (const row of db.prepare("SELECT id,data FROM testimonials").all()) {
        try {
          if (JSON.parse(row.data).demo === true) remove.run(row.id);
        } catch {}
      }
      db.prepare("INSERT INTO migrations VALUES(?)").run(
        "remove-demo-testimonials",
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  const setupFile = resolve(dataDir, "ADMIN-SETUP.txt");
  if (!db.prepare("SELECT 1 FROM admins").get() && !existsSync(setupFile))
    writeFileSync(setupFile, token(), { mode: 0o600, flag: "wx" });
  const setupSecret = existsSync(setupFile)
    ? readFileSync(setupFile, "utf8").trim()
    : "";
  const dummyPassword = passwordHash(token());
  function audit(action, actor) {
    db.prepare("INSERT INTO audit(action,actor,created_at) VALUES(?,?,?)").run(
      action,
      actor,
      new Date().toISOString(),
    );
  }
  function limit(key, max = 8, windowMs = 900000) {
    const now = Date.now();
    db.prepare("DELETE FROM limits WHERE until<?").run(now);
    const r = db.prepare("SELECT * FROM limits WHERE key=?").get(key);
    if (r?.count >= max) fail(429, "Trop de tentatives. Réessayez plus tard.");
    db.prepare(
      "INSERT INTO limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
    ).run(key, 1, now + windowMs);
  }
  const localHost = (h) =>
    /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(h || "");
  function base(req) {
    if (origin) {
      const configured = new URL(origin);
      if (configured.protocol !== "https:" && !localHost(configured.host))
        fail(503, "HTTPS est nécessaire avant publication.");
      return origin.replace(/\/$/, "");
    }
    if (!localHost(req.headers.host))
      fail(503, "Configurez SITE_ORIGIN avant publication.");
    return `http://${req.headers.host}`;
  }
  async function sendMail({ to, subject, text, key, replyTo, code, cta }) {
    const html = emailHtml({ subject, text, code, cta });
    const plainText = `${text}${code ? `\n\nCode : ${code}` : ""}${cta?.url ? `\n\n${cta.label || "Ouvrir"} : ${cta.url}` : ""}`;
    if (customMail)
      return customMail({
        to,
        subject,
        text: plainText,
        html,
        key,
        replyTo,
        code,
        cta,
      });
    if (mailMode === "local") {
      const folder = resolve(dataDir, "mail-preview");
      mkdirSync(folder, { recursive: true });
      writeFileSync(
        resolve(folder, `${Date.now()}-${randomUUID()}.txt`),
        `LOCAL DEVELOPMENT — NOT SENT\nTo: ${to}\n${replyTo ? `Reply-To: ${replyTo}\n` : ""}Subject: ${subject}\n\n${plainText}`,
        { mode: 0o600 },
      );
      return;
    }
    if (
      mailMode !== "resend" ||
      !process.env.RESEND_API_KEY ||
      !process.env.MAIL_FROM
    )
      fail(503, "Envoi email non configuré.");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": key || randomUUID(),
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [to],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text: plainText,
        html,
        attachments: [
          {
            content: emailLogo,
            filename: "liminal-logo.svg",
            content_type: "image/svg+xml",
            content_id: "liminal-logo",
          },
        ],
      }),
    });
    if (!response.ok) fail(503, "Envoi email indisponible. Réessayez.");
  }
  async function notifyAdmin({ subject, text, key, replyTo }) {
    try {
      await sendMail({
        to: adminNotificationEmail,
        subject,
        text,
        key,
        replyTo,
      });
      return true;
    } catch (error) {
      console.error("Admin email notification failed:", error.message);
      return false;
    }
  }
  async function challenge(email, purpose, payload) {
    const id = token(),
      code = String(randomInt(100000, 1000000));
    db.prepare(
      "DELETE FROM challenges WHERE expires<? OR (email=? AND purpose=?)",
    ).run(Date.now(), email, purpose);
    db.prepare(
      "INSERT INTO challenges(id,email,code_hash,purpose,payload,expires) VALUES(?,?,?,?,?,?)",
    ).run(
      hash(id),
      email,
      hash(id + code),
      purpose,
      JSON.stringify(payload),
      Date.now() + 600000,
    );
    try {
      await sendMail({
        to: email,
        subject: "LIMINAL — Votre code de vérification",
        text: "Utilisez le code ci-dessous pour confirmer votre accès. Il reste valable pendant 10 minutes. Ne le partagez jamais. Si vous n’avez rien demandé, ignorez ce message.",
        code,
        key: `auth/${purpose}/${id}`,
      });
    } catch (e) {
      db.prepare("DELETE FROM challenges WHERE id=?").run(hash(id));
      throw e;
    }
    return id;
  }
  async function subscribe(email, name, req) {
    const existing = db
      .prepare("SELECT status FROM subscribers WHERE email=?")
      .get(email);
    if (existing?.status === "subscribed") return;
    limit("subscribe:" + email, 3, 3600000);
    const secret = token();
    db.prepare(
      "INSERT INTO subscribers VALUES(?,?, 'pending',?,NULL,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,status='pending',consent_at=excluded.consent_at,token_hash=excluded.token_hash",
    ).run(
      email,
      name,
      new Date().toISOString(),
      hash(secret),
      new Date().toISOString(),
    );
    db.prepare("INSERT INTO subscription_tokens VALUES(?,?,'confirm',?)").run(
      hash(secret),
      email,
      Date.now() + 7 * 86400000,
    );
    await sendMail({
      to: email,
      subject: "LIMINAL — Confirmez votre abonnement",
      text: "Confirmez votre choix de recevoir les nouvelles et offres de LIMINAL. Sans confirmation, aucun email promotionnel ne vous sera envoyé.",
      cta: {
        label: "Confirmer mon abonnement",
        url: `${base(req)}/subscription#token=${secret}`,
      },
    });
  }
  function session(req) {
    const raw = (req.headers.cookie || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("liminal_session="))
      ?.slice(16);
    if (!raw) return null;
    const row = db.prepare("SELECT * FROM sessions WHERE id=?").get(hash(raw));
    if (
      !row ||
      row.expires < Date.now() ||
      row.last_seen < Date.now() - 1800000
    ) {
      if (row) db.prepare("DELETE FROM sessions WHERE id=?").run(row.id);
      return null;
    }
    db.prepare("UPDATE sessions SET last_seen=? WHERE id=?").run(
      Date.now(),
      row.id,
    );
    return row;
  }
  const cookie = (value, secure, age = 28800) =>
    `liminal_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? "; Secure" : ""}`;
  function projectRows(all = false, deleted = false) {
    return db
      .prepare(
        `SELECT * FROM projects WHERE deleted_at ${deleted ? "IS NOT NULL" : "IS NULL"} ORDER BY rowid`,
      )
      .all()
      .map((r) => ({
        ...JSON.parse(r.data),
        id: r.id,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at,
      }))
      .filter((p) => all || p.published);
  }
  function deleteTrashed(cutoff = null) {
    const where = cutoff
      ? "deleted_at IS NOT NULL AND deleted_at<=?"
      : "deleted_at IS NOT NULL";
    const expiredProjects = db
      .prepare(`SELECT id,data FROM projects WHERE ${where}`)
      .all(...(cutoff ? [cutoff] : []));
    const projectsDeleted = db
      .prepare(`DELETE FROM projects WHERE ${where}`)
      .run(...(cutoff ? [cutoff] : [])).changes;
    const marksDeleted = db
      .prepare(`DELETE FROM marks WHERE ${where}`)
      .run(...(cutoff ? [cutoff] : [])).changes;
    const referenced = new Set();
    for (const row of db.prepare("SELECT data FROM projects").all()) {
      const project = JSON.parse(row.data);
      for (const value of [project.media, project.poster])
        if (typeof value === "string" && value.startsWith("/uploads/"))
          referenced.add(value);
    }
    for (const row of expiredProjects) {
      const project = JSON.parse(row.data);
      for (const value of [project.media, project.poster]) {
        if (
          typeof value !== "string" ||
          referenced.has(value) ||
          !/^\/uploads\/[a-f0-9-]+\.(webp|png|jpg|mp4|webm)$/.test(value)
        )
          continue;
        const file = resolve(dataDir, "." + value);
        if (existsSync(file)) unlinkSync(file);
      }
    }
    return { projectsDeleted, marksDeleted };
  }
  function purgeTrash() {
    return deleteTrashed(new Date(Date.now() - TRASH_TTL_MS).toISOString());
  }
  purgeTrash();

  async function handler(
    req,
    res,
    next = () => json(res, 404, { error: "Introuvable." }),
  ) {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/uploads/")) {
      if (!["GET", "HEAD"].includes(req.method))
        return json(res, 405, { error: "Méthode invalide." });
      if (
        !/^\/uploads\/[a-f0-9-]+\.(png|jpg|webp|mp4|webm)$/.test(url.pathname)
      )
        return json(res, 404, { error: "Introuvable." });
      const file = resolve(dataDir, "." + url.pathname);
      if (!existsSync(file)) return json(res, 404, { error: "Introuvable." });
      const size = statSync(file).size;
      const type = {
        png: "image/png",
        jpg: "image/jpeg",
        webp: "image/webp",
        mp4: "video/mp4",
        webm: "video/webm",
      }[file.split(".").at(-1)];
      const headers = {
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      };
      let start = 0,
        end = size - 1,
        status = 200;
      if (req.headers.range) {
        const m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        if (!m)
          return res
            .writeHead(416, { "Content-Range": `bytes */${size}` })
            .end();
        start = Number(m[1]);
        end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
        if (start > end || start >= size)
          return res
            .writeHead(416, { "Content-Range": `bytes */${size}` })
            .end();
        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
      }
      res.writeHead(status, { ...headers, "Content-Length": end - start + 1 });
      if (req.method === "HEAD") return res.end();
      createReadStream(file, { start, end }).pipe(res);
      return;
    }
    if (!url.pathname.startsWith("/api/")) return next();
    try {
      const appOrigin = base(req),
        secure = appOrigin.startsWith("https:");
      if (
        mailMode === "local" &&
        !customMail &&
        (!localHost(req.headers.host) ||
          secure ||
          !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
            req.socket.remoteAddress,
          ))
      )
        fail(
          503,
          "Le mode email local est réservé à localhost. Configurez le service email.",
        );
      if (req.headers.origin && req.headers.origin !== appOrigin)
        fail(403, "Origine non autorisée.");
      if (
        !["GET", "HEAD"].includes(req.method) &&
        req.headers["sec-fetch-site"] === "cross-site"
      )
        fail(403, "Origine non autorisée.");
      const path = url.pathname,
        ip = req.socket.remoteAddress || "local",
        now = new Date().toISOString();
      purgeTrash();
      if (path === "/api/projects" && req.method === "GET")
        return json(res, 200, { projects: projectRows() });
      if (path === "/api/testimonials" && req.method === "GET")
        return json(res, 200, {
          testimonials: db
            .prepare("SELECT * FROM testimonials ORDER BY rowid DESC")
            .all()
            .map((row) => ({ ...JSON.parse(row.data), id: row.id }))
            .filter((item) => item.published),
        });
      if (path === "/api/marks" && req.method === "GET") {
        const page = Number(url.searchParams.get("page") || 0);
        if (!Number.isSafeInteger(page) || page < 0)
          fail(400, "Page invalide.");
        const total = db
            .prepare(
              "SELECT count(*) n FROM marks WHERE status='approved' AND deleted_at IS NULL",
            )
            .get().n,
          pages = Math.max(1, Math.ceil(total / 24)),
          current = Math.min(page, pages - 1);
        return json(res, 200, {
          marks: db
            .prepare(
              "SELECT * FROM marks WHERE status='approved' AND deleted_at IS NULL ORDER BY rowid DESC LIMIT 24 OFFSET ?",
            )
            .all(current * 24)
            .map(publicMark),
          total,
          pages,
          page: current,
        });
      }
      if (path === "/api/marks" && req.method === "POST") {
        const data = await body(req, 4096),
          mark = validateMark(data),
          email = emailOf(data.email);
        if (!mark || !email)
          fail(400, "Vérifiez votre nom, votre email et votre empreinte.");
        const prior = db
          .prepare("SELECT id FROM marks WHERE request_id=?")
          .get(mark.requestId);
        if (prior) return json(res, 200, { id: prior.id, status: "pending" });
        limit("mark:" + ip, 5, 3600000);
        const id = randomUUID();
        db.prepare(
          "INSERT INTO marks(id,request_id,name,x,y,rotation,ink,created_at,email,status) VALUES(?,?,?,?,?,?,?,?,?,'pending')",
        ).run(
          id,
          mark.requestId,
          mark.name,
          mark.x,
          mark.y,
          mark.rotation,
          mark.ink,
          now,
          email,
        );
        let subscription = "none";
        if (data.subscribe === true) {
          try {
            await subscribe(email, mark.name, req);
            subscription = "confirmation-required";
          } catch {
            subscription = "unavailable";
          }
        }
        await notifyAdmin({
          subject: `[LIMINAL] Empreinte à valider — ${mark.name}`,
          text: `Une nouvelle empreinte attend votre validation.\n\nNom : ${mark.name}\nEmail : ${email}\nCouleur : ${mark.ink}\nNewsletter : ${data.subscribe === true ? "demandée, confirmation envoyée" : "non demandée"}\nDate : ${now}\n\nOuvrir l’administration : ${base(req)}/admin`,
          key: `mark/${id}`,
          replyTo: email,
        });
        return json(res, 201, { id, status: "pending", subscription });
      }
      if (path === "/api/inquiries" && req.method === "POST") {
        const data = await body(req, 12000),
          email = emailOf(data.email),
          name = safe(data.name, 100),
          message = safe(data.message, 3000);
        if (
          !email ||
          name.length < 2 ||
          message.length < 10 ||
          !["project", "career", "freelance", "sponsorship"].includes(
            data.kind,
          ) ||
          data.website ||
          !/^[a-f0-9-]{36}$/i.test(data.requestId || "")
        )
          fail(400, "Vérifiez les champs du formulaire.");
        const prior = db
          .prepare("SELECT id FROM inquiries WHERE request_id=?")
          .get(data.requestId);
        if (prior) return json(res, 200, { id: prior.id });
        limit("inquiry:" + ip, 8, 3600000);
        const id = randomUUID();
        const clean = {
          message,
          brand: safe(data.brand),
          type: safe(data.type),
          timing: safe(data.timing),
          craft: safe(data.craft),
          portfolio: safe(data.portfolio, 1000),
          locale: ["fr", "en", "ar"].includes(data.locale) ? data.locale : "fr",
        };
        if (clean.portfolio) {
          try {
            const link = new URL(clean.portfolio);
            if (!["http:", "https:"].includes(link.protocol)) throw Error();
          } catch {
            fail(400, "Lien portfolio invalide.");
          }
        }
        db.prepare(
          "INSERT INTO inquiries(id,request_id,kind,name,email,data,created_at) VALUES(?,?,?,?,?,?,?)",
        ).run(
          id,
          data.requestId,
          data.kind,
          name,
          email,
          JSON.stringify(clean),
          now,
        );
        const details = [
          clean.brand && `Marque : ${clean.brand}`,
          clean.type && `Besoin : ${clean.type}`,
          clean.timing && `Calendrier : ${clean.timing}`,
          clean.craft && `Spécialité : ${clean.craft}`,
          clean.portfolio && `Portfolio : ${clean.portfolio}`,
        ].filter(Boolean);
        await notifyAdmin({
          subject: `[LIMINAL] Nouvelle demande — ${name}`,
          text: `Une nouvelle demande est arrivée sur LIMINAL.\n\nType : ${data.kind}\nNom : ${name}\nEmail : ${email}${details.length ? `\n${details.join("\n")}` : ""}\n\nMessage :\n${message}\n\nDate : ${now}\n\nOuvrir l’administration : ${base(req)}/admin`,
          key: `inquiry/${id}`,
          replyTo: email,
        });
        return json(res, 201, { id });
      }
      if (path === "/api/subscription" && req.method === "POST") {
        limit("subscription:" + ip, 20);
        const data = await body(req);
        if (
          !/^[a-f0-9]{64}$/.test(data.token || "") ||
          !["confirm", "unsubscribe"].includes(data.action)
        )
          fail(400, "Lien invalide.");
        const link = db
          .prepare("SELECT * FROM subscription_tokens WHERE hash=?")
          .get(hash(data.token));
        if (
          !link ||
          (link.expires && link.expires < Date.now()) ||
          (data.action === "confirm" && link.purpose !== "confirm")
        )
          fail(400, "Lien invalide.");
        const entry = db
          .prepare("SELECT * FROM subscribers WHERE email=?")
          .get(link.email);
        if (!entry) fail(400, "Lien invalide.");
        if (data.action === "confirm" && entry.status === "unsubscribed")
          fail(400, "Ce lien a été désactivé. Demandez un nouvel abonnement.");
        db.prepare(
          "UPDATE subscribers SET status=?,verified_at=? WHERE email=?",
        ).run(
          data.action === "confirm" ? "subscribed" : "unsubscribed",
          data.action === "confirm" ? now : entry.verified_at,
          entry.email,
        );
        return json(res, 200, {
          status: data.action === "confirm" ? "subscribed" : "unsubscribed",
        });
      }
      if (path === "/api/auth/status" && req.method === "GET") {
        const s = session(req);
        return json(res, 200, {
          authenticated: !!s,
          email: s?.email,
          csrf: s?.csrf,
          setup: !db.prepare("SELECT 1 FROM admins").get(),
          localMail: mailMode === "local",
        });
      }
      if (
        ["/api/auth/setup", "/api/auth/login", "/api/auth/recover"].includes(
          path,
        ) &&
        req.method === "POST"
      ) {
        limit("auth:" + ip, 10);
        const data = await body(req, 4096);
        const email = emailOf(data.email);
        if (!email) fail(400, "Adresse email invalide.");
        if (
          !path.endsWith("/recover") &&
          (typeof data.password !== "string" || data.password.length > 128)
        )
          fail(400, "Identifiants invalides.");
        limit("auth-email:" + email, 8);
        let purpose = "login",
          payload = {};
        if (path.endsWith("/setup")) {
          if (
            db.prepare("SELECT 1 FROM admins").get() ||
            !equal(data.setupToken, setupSecret) ||
            email !== adminEmail.toLowerCase()
          )
            fail(403, "Configuration non autorisée.");
          if (!passwordValid(data.password))
            fail(400, "Le mot de passe ne respecte pas les critères indiqués.");
          purpose = "setup";
          payload.password = await passwordHash(data.password);
        } else {
          const admin = db
            .prepare("SELECT * FROM admins WHERE email=?")
            .get(email);
          if (path.endsWith("/recover")) {
            purpose = "recover";
            if (!admin)
              return json(res, 200, {
                challenge: token(),
                localMail: mailMode === "local",
              });
          } else {
            const match = await passwordMatches(
              data.password,
              admin?.password || (await dummyPassword),
            );
            if (!admin || !match) fail(401, "Identifiants invalides.");
          }
        }
        return json(res, 200, {
          challenge: await challenge(email, purpose, payload),
          localMail: mailMode === "local",
        });
      }
      if (path === "/api/auth/verify" && req.method === "POST") {
        limit("verify:" + ip, 20);
        const data = await body(req, 2048),
          id = hash(data.challenge || "");
        const c = db.prepare("SELECT * FROM challenges WHERE id=?").get(id);
        if (!c || c.expires < Date.now() || c.attempts >= 5)
          fail(401, "Code expiré ou invalide. Recommencez la connexion.");
        db.prepare("UPDATE challenges SET attempts=attempts+1 WHERE id=?").run(
          id,
        );
        if (
          !equal(hash((data.challenge || "") + String(data.code)), c.code_hash)
        )
          fail(401, "Code expiré ou invalide.");
        const payload = JSON.parse(c.payload);
        if (c.purpose === "recover") {
          const resetToken = token();
          db.exec("BEGIN");
          try {
            db.prepare("DELETE FROM challenges WHERE id=?").run(id);
            db.prepare(
              "INSERT INTO challenges(id,email,code_hash,purpose,payload,expires) VALUES(?,?,?,'password-reset','{}',?)",
            ).run(
              hash(resetToken),
              c.email,
              hash(resetToken),
              Date.now() + 600000,
            );
            audit("auth.recover.verified", c.email);
            db.exec("COMMIT");
          } catch (e) {
            db.exec("ROLLBACK");
            throw e;
          }
          return json(res, 200, { resetRequired: true, resetToken });
        }
        db.exec("BEGIN");
        try {
          db.prepare("DELETE FROM challenges WHERE id=?").run(id);
          if (c.purpose === "setup") {
            if (db.prepare("SELECT 1 FROM admins").get())
              fail(403, "Compte déjà configuré.");
            db.prepare("INSERT INTO admins VALUES(?,?,?)").run(
              c.email,
              payload.password,
              now,
            );
            try {
              unlinkSync(setupFile);
            } catch {}
          }
          const raw = token(),
            csrf = token();
          db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
          db.prepare("INSERT INTO sessions VALUES(?,?,?,?,?)").run(
            hash(raw),
            c.email,
            csrf,
            Date.now() + 28800000,
            Date.now(),
          );
          audit("auth." + c.purpose, c.email);
          db.exec("COMMIT");
          res.setHeader("Set-Cookie", cookie(raw, secure));
          return json(res, 200, { authenticated: true, email: c.email, csrf });
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      }
      if (path === "/api/auth/reset" && req.method === "POST") {
        limit("reset:" + ip, 10);
        const data = await body(req, 4096),
          resetToken = safe(data.resetToken, 128),
          reset = db
            .prepare(
              "SELECT * FROM challenges WHERE id=? AND purpose='password-reset'",
            )
            .get(hash(resetToken));
        if (!reset || reset.expires < Date.now())
          fail(401, "Cette autorisation a expiré. Recommencez.");
        if (!passwordValid(data.password))
          fail(400, "Le mot de passe ne respecte pas les critères indiqués.");
        const password = await passwordHash(data.password),
          raw = token(),
          csrf = token();
        db.exec("BEGIN");
        try {
          db.prepare("UPDATE admins SET password=? WHERE email=?").run(
            password,
            reset.email,
          );
          db.prepare("DELETE FROM sessions WHERE email=?").run(reset.email);
          db.prepare("DELETE FROM challenges WHERE email=?").run(reset.email);
          db.prepare("INSERT INTO sessions VALUES(?,?,?,?,?)").run(
            hash(raw),
            reset.email,
            csrf,
            Date.now() + 28800000,
            Date.now(),
          );
          audit("auth.password.reset", reset.email);
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
        res.setHeader("Set-Cookie", cookie(raw, secure));
        return json(res, 200, {
          authenticated: true,
          email: reset.email,
          csrf,
        });
      }
      if (path.startsWith("/api/admin/") || path === "/api/auth/logout") {
        const s = session(req);
        if (!s) fail(401, "Veuillez vous reconnecter.");
        if (
          !["GET", "HEAD"].includes(req.method) &&
          !equal(req.headers["x-csrf-token"], s.csrf)
        )
          fail(403, "Session invalide. Rechargez la page.");
        if (path === "/api/auth/logout" && req.method === "POST") {
          db.prepare("DELETE FROM sessions WHERE id=?").run(s.id);
          res.setHeader("Set-Cookie", cookie("", secure, 0));
          return json(res, 200, { ok: true });
        }
        if (path === "/api/admin/dashboard" && req.method === "GET")
          return json(res, 200, {
            projects: projectRows(true),
            marks: db
              .prepare(
                "SELECT * FROM marks WHERE deleted_at IS NULL ORDER BY rowid DESC",
              )
              .all()
              .map(({ request_id, ...m }) => m),
            trash: {
              projects: projectRows(true, true),
              marks: db
                .prepare(
                  "SELECT * FROM marks WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC",
                )
                .all()
                .map(({ request_id, ...m }) => m),
            },
            inquiries: db
              .prepare("SELECT * FROM inquiries ORDER BY rowid DESC")
              .all()
              .map(({ request_id, data, ...r }) => ({
                ...r,
                ...JSON.parse(data),
              })),
            subscribers: db
              .prepare(
                "SELECT email,name,status,consent_at,verified_at,created_at FROM subscribers ORDER BY created_at DESC",
              )
              .all(),
            audit: db
              .prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 40")
              .all(),
            campaigns: db
              .prepare(
                "SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 20",
              )
              .all(),
            testimonials: db
              .prepare("SELECT * FROM testimonials ORDER BY rowid DESC")
              .all()
              .map((row) => ({
                ...JSON.parse(row.data),
                id: row.id,
                created_at: row.created_at,
                updated_at: row.updated_at,
              })),
            localMail: mailMode === "local",
          });
        if (path === "/api/admin/trash" && req.method === "DELETE") {
          const result = deleteTrashed();
          audit(
            `trash.empty:${result.projectsDeleted}:${result.marksDeleted}`,
            s.email,
          );
          return json(res, 200, result);
        }
        if (path === "/api/admin/testimonials" && req.method === "POST") {
          const item = validateTestimonial(await body(req, 12000)),
            id = randomUUID();
          db.prepare(
            "INSERT INTO testimonials(id,data,created_at,updated_at) VALUES(?,?,?,?)",
          ).run(id, JSON.stringify(item), now, now);
          audit("testimonial.create:" + id, s.email);
          return json(res, 201, { testimonial: { ...item, id } });
        }
        const testimonialMatch = path.match(
          /^\/api\/admin\/testimonials\/([a-f0-9-]+)$/,
        );
        if (testimonialMatch && req.method === "PUT") {
          const item = validateTestimonial(await body(req, 12000));
          const result = db
            .prepare("UPDATE testimonials SET data=?,updated_at=? WHERE id=?")
            .run(JSON.stringify(item), now, testimonialMatch[1]);
          if (!result.changes) fail(404, "Témoignage introuvable.");
          audit("testimonial.update:" + testimonialMatch[1], s.email);
          return json(res, 200, { ok: true });
        }
        if (testimonialMatch && req.method === "DELETE") {
          const result = db
            .prepare("DELETE FROM testimonials WHERE id=?")
            .run(testimonialMatch[1]);
          if (!result.changes) fail(404, "Témoignage introuvable.");
          audit("testimonial.delete:" + testimonialMatch[1], s.email);
          return json(res, 200, { ok: true });
        }
        if (path === "/api/admin/projects" && req.method === "POST") {
          const p = validateProject(await body(req));
          const id = randomUUID();
          if (db.prepare("SELECT 1 FROM projects WHERE slug=?").get(p.slug))
            fail(409, "Ce slug existe déjà.");
          db.prepare(
            "INSERT INTO projects(id,slug,data,updated_at) VALUES(?,?,?,?)",
          ).run(id, p.slug, JSON.stringify(p), now);
          audit("project.create:" + p.slug, s.email);
          return json(res, 201, { project: { ...p, id } });
        }
        const projectMatch = path.match(
          /^\/api\/admin\/projects\/([a-f0-9-]+)$/,
        );
        if (projectMatch && req.method === "PUT") {
          const p = validateProject(await body(req));
          if (
            !db
              .prepare("SELECT 1 FROM projects WHERE id=?")
              .get(projectMatch[1])
          )
            fail(404, "Projet introuvable.");
          if (
            db
              .prepare("SELECT 1 FROM projects WHERE slug=? AND id<>?")
              .get(p.slug, projectMatch[1])
          )
            fail(409, "Ce slug existe déjà.");
          db.prepare(
            "UPDATE projects SET slug=?,data=?,updated_at=? WHERE id=?",
          ).run(p.slug, JSON.stringify(p), now, projectMatch[1]);
          audit("project.update:" + p.slug, s.email);
          return json(res, 200, { ok: true });
        }
        if (projectMatch && req.method === "DELETE") {
          const result = db
            .prepare(
              "UPDATE projects SET deleted_at=? WHERE id=? AND deleted_at IS NULL",
            )
            .run(now, projectMatch[1]);
          if (!result.changes) fail(404, "Projet introuvable.");
          audit("project.trash:" + projectMatch[1], s.email);
          return json(res, 200, { ok: true });
        }
        const projectRestoreMatch = path.match(
          /^\/api\/admin\/projects\/([a-f0-9-]+)\/restore$/,
        );
        if (projectRestoreMatch && req.method === "POST") {
          const result = db
            .prepare(
              "UPDATE projects SET deleted_at=NULL WHERE id=? AND deleted_at IS NOT NULL",
            )
            .run(projectRestoreMatch[1]);
          if (!result.changes) fail(404, "Projet introuvable.");
          audit("project.restore:" + projectRestoreMatch[1], s.email);
          return json(res, 200, { ok: true });
        }
        const markMatch = path.match(/^\/api\/admin\/marks\/([a-f0-9-]+)$/);
        if (markMatch && req.method === "PATCH") {
          const data = await body(req);
          if (!["approved", "rejected", "pending"].includes(data.status))
            fail(400, "Statut invalide.");
          const result = db
            .prepare(
              "UPDATE marks SET status=? WHERE id=? AND deleted_at IS NULL",
            )
            .run(data.status, markMatch[1]);
          if (!result.changes) fail(404, "Empreinte introuvable.");
          audit("mark." + data.status + ":" + markMatch[1], s.email);
          return json(res, 200, { ok: true });
        }
        if (markMatch && req.method === "DELETE") {
          const result = db
            .prepare(
              "UPDATE marks SET deleted_at=? WHERE id=? AND deleted_at IS NULL",
            )
            .run(now, markMatch[1]);
          if (!result.changes) fail(404, "Empreinte introuvable.");
          audit("mark.trash:" + markMatch[1], s.email);
          return json(res, 200, { ok: true });
        }
        const markRestoreMatch = path.match(
          /^\/api\/admin\/marks\/([a-f0-9-]+)\/restore$/,
        );
        if (markRestoreMatch && req.method === "POST") {
          const result = db
            .prepare(
              "UPDATE marks SET deleted_at=NULL WHERE id=? AND deleted_at IS NOT NULL",
            )
            .run(markRestoreMatch[1]);
          if (!result.changes) fail(404, "Empreinte introuvable.");
          audit("mark.restore:" + markRestoreMatch[1], s.email);
          return json(res, 200, { ok: true });
        }
        const inquiryMatch = path.match(
          /^\/api\/admin\/inquiries\/([a-f0-9-]+)$/,
        );
        if (inquiryMatch && req.method === "PATCH") {
          const data = await body(req);
          if (!["new", "reviewing", "replied", "closed"].includes(data.status))
            fail(400, "Statut invalide.");
          db.prepare("UPDATE inquiries SET status=? WHERE id=?").run(
            data.status,
            inquiryMatch[1],
          );
          audit("inquiry." + data.status + ":" + inquiryMatch[1], s.email);
          return json(res, 200, { ok: true });
        }
        if (path === "/api/admin/subscribers" && req.method === "PATCH") {
          const data = await body(req),
            email = emailOf(data.email);
          if (!email) fail(400, "Email invalide.");
          db.prepare(
            "UPDATE subscribers SET status='unsubscribed' WHERE email=?",
          ).run(email);
          audit("subscriber.unsubscribe", s.email);
          return json(res, 200, { ok: true });
        }
        if (path === "/api/admin/upload" && req.method === "POST") {
          limit("upload:" + s.email, 30, 3600000);
          const buffer = await body(req, 100 * 1024 * 1024, true);
          let extension = "";
          if (
            buffer.length >= 12 &&
            buffer
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          )
            extension = "png";
          else if (
            buffer.length >= 3 &&
            buffer[0] === 255 &&
            buffer[1] === 216 &&
            buffer[2] === 255
          )
            extension = "jpg";
          else if (
            buffer.length >= 12 &&
            buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP"
          )
            extension = "webp";
          else if (
            buffer.length >= 16 &&
            buffer.toString("ascii", 4, 8) === "ftyp"
          )
            extension = "mp4";
          else if (
            buffer.length >= 4 &&
            buffer.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]))
          )
            extension = "webm";
          if (!extension)
            fail(415, "Formats acceptés : JPG, PNG, WebP, MP4, WebM.");
          if (
            ["png", "jpg", "webp"].includes(extension) &&
            buffer.length > 15 * 1024 * 1024
          )
            fail(413, "Image : 15 Mo maximum.");
          const name = randomUUID() + "." + extension;
          writeFileSync(resolve(dataDir, "uploads", name), buffer, {
            flag: "wx",
          });
          audit("media.upload:" + name, s.email);
          return json(res, 201, {
            url: "/uploads/" + name,
            visual: ["mp4", "webm"].includes(extension) ? "video" : "image",
          });
        }
        if (path === "/api/admin/campaigns" && req.method === "POST") {
          const data = await body(req, 20000),
            subject = safe(data.subject, 150),
            message = safe(data.message, 10000);
          if (
            subject.length < 3 ||
            message.length < 10 ||
            data.confirm !== true ||
            !/^[a-f0-9-]{36}$/i.test(data.requestId || "")
          )
            fail(400, "Vérifiez et confirmez le message.");
          const previous = db
            .prepare("SELECT * FROM campaigns WHERE id=?")
            .get(data.requestId);
          if (previous) {
            if (previous.status === "sending")
              fail(
                409,
                "Cette campagne est déjà en cours. Consultez son historique avant de réessayer.",
              );
            return json(res, 200, JSON.parse(previous.result));
          }
          limit("campaign:" + s.email, 3, 3600000);
          const recipients = db
            .prepare(
              "SELECT * FROM subscribers WHERE status='subscribed' AND verified_at IS NOT NULL",
            )
            .all();
          if (!recipients.length) fail(400, "Aucun abonné confirmé.");
          if (recipients.length > 100)
            fail(
              400,
              "Au-delà de 100 abonnés, connectez un service de campagne dédié.",
            );
          const id = data.requestId;
          db.prepare("INSERT INTO campaigns VALUES(?,?,?,?,?,?)").run(
            id,
            subject,
            message,
            "sending",
            "{}",
            now,
          );
          let sent = 0,
            failed = 0;
          for (const person of recipients) {
            const secret = token();
            db.prepare(
              "INSERT INTO subscription_tokens VALUES(?,?,'unsubscribe',0)",
            ).run(hash(secret), person.email);
            try {
              await sendMail({
                to: person.email,
                subject,
                text: `${message}\n\nLIMINAL · Tunisie\nVous recevez ce message après avoir confirmé votre abonnement.\nSe désabonner : ${base(req)}/subscription#token=${secret}&action=unsubscribe`,
                key: id + "-" + hash(person.email),
              });
              sent++;
            } catch {
              failed++;
            }
          }
          const result = { sent, failed, local: mailMode === "local" };
          db.prepare("UPDATE campaigns SET status=?,result=? WHERE id=?").run(
            failed ? "partial" : "completed",
            JSON.stringify(result),
            id,
          );
          audit("campaign.send:" + id, s.email);
          return json(res, 200, result);
        }
      }
      return json(res, 404, { error: "Introuvable." });
    } catch (error) {
      if (!error.status) console.error("Portal error:", error.message);
      return json(res, error.status || 500, {
        error: error.status
          ? error.message
          : "Le service est indisponible. Réessayez.",
      });
    }
  }
  return { handler, close: () => db.close(), db, purgeTrash };
}
