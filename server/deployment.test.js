import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

test("Vercel proxies API/uploads before frontend fallback and rejects invalid origins", async () => {
  const previous = process.env.BACKEND_ORIGIN;
  try {
    process.env.BACKEND_ORIGIN = "https://backend.example.com";
    const { config } = await import("../vercel.mjs?valid");
    assert.equal(config.rewrites[0].destination, "https://backend.example.com/api/:path*");
    assert.equal(config.rewrites[1].destination, "https://backend.example.com/uploads/:path*");
    process.env.BACKEND_ORIGIN = "http://unsafe.example.com/path";
    await assert.rejects(import("../vercel.mjs?invalid"), /HTTPS origin/);
    delete process.env.BACKEND_ORIGIN;
    await assert.rejects(import("../vercel.mjs?missing"), /Set BACKEND_ORIGIN/);
  } finally {
    if (previous === undefined) delete process.env.BACKEND_ORIGIN;
    else process.env.BACKEND_ORIGIN = previous;
  }
});

test("production serves deep links and protects private paths", { skip: !existsSync("dist/index.html") }, async (t) => {
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const dir = mkdtempSync(join(tmpdir(), "liminal-deploy-"));
  const child = spawn(process.execPath, ["server/index.js"], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", LIMINAL_DATA_DIR: dir, SITE_ORIGIN: `http://127.0.0.1:${port}`, MAIL_MODE: "local" },
    stdio: "ignore",
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = new Promise(resolve => child.once("exit", resolve));
      child.kill();
      await exited;
    }
    rmSync(dir, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { ready = (await fetch(`${base}/healthz`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, "production server started");
  for (const route of ["/", "/services", "/work", "/work/paravie", "/our-story", "/contact", "/lab", "/admin"]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("content-type"), /text\/html/);
  }
  for (const route of ["/.env", "/data/marks.sqlite", "/server/index.js", "/missing.js", "/api/missing"]) {
    assert.equal((await fetch(base + route)).status, 404, route);
  }
});
