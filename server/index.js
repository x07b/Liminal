import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createPortal } from "./portal.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = resolve(root, "dist");
if (!existsSync(resolve(dist, "index.html")))
  throw new Error("Exécutez npm run build avant npm start.");
const store = createPortal({
  dataDir: resolve(process.env.LIMINAL_DATA_DIR || resolve(root, "data")),
});
const api = store.handler;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".json": "application/json",
};
const server = createServer((req, res) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' mailto:",
  );
  if (process.env.SITE_ORIGIN?.startsWith("https:"))
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  return api(req, res, () => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      return res.end();
    }
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400);
      return res.end();
    }
    if (pathname.startsWith("/api/")) {
      res.writeHead(404);
      return res.end();
    }
    const protectedPath = pathname
      .split("/")
      .some((part) => part.startsWith(".") && part.length > 1);
    if (
      protectedPath ||
      ["/data", "/work", "/server"].some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
      )
    ) {
      res.writeHead(404, { "Cache-Control": "no-store" });
      return res.end();
    }
    let file = resolve(dist, "." + pathname);
    if (!file.startsWith(dist + sep) && file !== dist) {
      res.writeHead(403);
      return res.end();
    }
    if (!existsSync(file) || !statSync(file).isFile()) {
      if (extname(pathname)) {
        res.writeHead(404);
        return res.end();
      }
      file = resolve(dist, "index.html");
    }
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": file.includes(`${sep}assets${sep}`)
        ? "public, max-age=31536000, immutable"
        : "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") return res.end();
    createReadStream(file).pipe(res);
  });
});
server.listen(
  Number(process.env.PORT || 5180),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      `LIMINAL: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 5180}`,
    ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      store.close();
      process.exit(0);
    }),
  );
