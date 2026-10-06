import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export function outputConfig(origin) {
  if (!origin) throw new Error("Set BACKEND_ORIGIN in Vercel to your persistent backend HTTPS origin.");
  const backend = new URL(origin);
  if (backend.protocol !== "https:" || backend.username || backend.password || backend.pathname !== "/" || backend.search || backend.hash) {
    throw new Error("BACKEND_ORIGIN must be an HTTPS origin without a path, credentials or query string.");
  }
  return {
    version: 3,
    routes: [
      {
        src: "/(.*)",
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        },
        continue: true,
      },
      // Proxy API and uploads to the persistent backend before SPA fallback.
      { src: "/api(?:/(.*))?", dest: `${backend.origin}/api/$1`, headers: { "Cache-Control": "no-store" } },
      { src: "/uploads(?:/(.*))?", dest: `${backend.origin}/uploads/$1` },
      { handle: "filesystem" },
      { src: "/.*", dest: "/index.html" },
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = outputConfig(process.env.BACKEND_ORIGIN);
  const build = spawnSync(process.execPath, ["node_modules/vite/bin/vite.js", "build", "--configLoader", "native"], { stdio: "inherit" });
  if (build.error) throw build.error;
  if (build.status !== 0) process.exit(build.status || 1);
  mkdirSync(".vercel/output", { recursive: true });
  cpSync("dist", ".vercel/output/static", { recursive: true });
  writeFileSync(".vercel/output/config.json", JSON.stringify(config, null, 2));
  console.log("Vercel Build Output API: static site and backend routes generated.");
}
