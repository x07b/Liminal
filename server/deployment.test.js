import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

test("Vercel output routes preserve API, uploads and static assets before SPA fallback", async () => {
  const { outputConfig } = await import("../scripts/build-vercel.mjs");
  const config = JSON.parse(JSON.stringify(outputConfig("https://backend.example.com")));
  assert.equal(config.version, 3);
  assert.equal(config.routes[1].dest, "https://backend.example.com/api/$1");
  assert.equal(config.routes[2].dest, "https://backend.example.com/uploads/$1");
  assert.equal(config.routes[3].handle, "filesystem");
  assert.equal(config.routes[4].dest, "/index.html");
  assert.throws(() => outputConfig("http://unsafe.example.com/path"), /HTTPS origin/);
  assert.throws(() => outputConfig(), /Set BACKEND_ORIGIN/);
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
