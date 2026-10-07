import test from "node:test";
import assert from "node:assert/strict";
import { previewRequest, readPreview } from "../src/preview-store.js";
test("preview records stay isolated and retries do not duplicate submissions", async () => {
  const store = new Map();
  const storage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
  const options = { method: "POST", data: { name: "Demo", requestId: "one" } };
  await previewRequest("/api/inquiries", options, storage);
  await previewRequest("/api/inquiries", options, storage);
  assert.equal(readPreview(storage).inquiries.length, 1);
  assert.deepEqual(await previewRequest("/api/projects", {}, storage), { projects: [] });
  await assert.rejects(previewRequest("/api/admin/campaigns", { method: "POST" }, storage), /No email/);
});
