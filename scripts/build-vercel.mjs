import { cpSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export function outputConfig(origin) {
  if (!origin?.trim()) return {
    version: 3,
    routes: [
      { src: "/(?:api|uploads)(?:/.*)?", status: 404 },
      { handle: "filesystem" },
      { src: "/.*", dest: "/index.html" },
    ],
  };
  const backend = new URL(origin);
  if (backend.protocol !== "https:" || backend.username || backend.password || backend.pathname !== "/" || backend.search || backend.hash) {
    throw new Error("BACKEND_ORIGIN must be an HTTPS origin without a path, credentials or query string.");
  }
  const host = backend.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "[::1]" || host.startsWith("[::ffff:") || /^(127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
    throw new Error("BACKEND_ORIGIN must use a public production backend, not localhost or a private network address.");
  }
  return {
    version: 3,
    routes: [
      { src: "/(.*)", headers: { "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin" }, continue: true },
      { src: "/api(?:/(.*))?", dest: `${backend.origin}/api/$1`, headers: { "Cache-Control": "no-store" } },
      { src: "/uploads(?:/(.*))?", dest: `${backend.origin}/uploads/$1` },
      { handle: "filesystem" },
      { src: "/.*", dest: "/index.html" },
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = outputConfig(process.env.BACKEND_ORIGIN);
  // Reuse the project's single Vite build script; never bundle the persistent API.
  if (!process.env.npm_execpath) throw new Error("Run this script with npm run build:vercel.");
  const build = spawnSync(process.execPath, [process.env.npm_execpath, "run", "build"], { stdio: "inherit", env: { ...process.env, VITE_LIMINAL_PREVIEW: process.env.BACKEND_ORIGIN?.trim() ? "false" : "true" } });
  if (build.error) throw build.error;
  if (build.status !== 0) process.exit(build.status || 1);
  const output = resolve(".vercel/output");
  if (output !== resolve(process.cwd(), ".vercel", "output")) throw new Error("Unexpected build output directory.");
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });
  cpSync("dist", resolve(output, "static"), { recursive: true });
  writeFileSync(resolve(output, "config.json"), JSON.stringify(config, null, 2));
  console.log("Vercel Build Output API: static site and backend routes generated.");
}
