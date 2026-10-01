import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { createPortal } from "./portal.js";

const ADMIN_PASSWORD = "Testing!Only-Phrase-7391";

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "liminal-portal-test-")),
    mail = [];
  const portal = createPortal({
      dataDir: dir,
      adminEmail: "owner@example.com",
      sendMail: async (m) => mail.push(m),
    }),
    server = createServer(portal.handler);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}`;
  let cookie = "",
    csrf = "";
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    portal.close();
    const target = resolve(dir);
    assert.ok(
      target.startsWith(resolve(tmpdir()) + sep + "liminal-portal-test-"),
    );
    rmSync(target, { recursive: true });
  });
  async function call(
    path,
    { method = "GET", data, auth = true, headers = {}, raw } = {},
  ) {
    const response = await fetch(url + path, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(auth ? { Cookie: cookie, "X-CSRF-Token": csrf } : {}),
        ...headers,
      },
      body: raw || (data ? JSON.stringify(data) : undefined),
    });
    return response;
  }
  async function login(setup = true) {
    const r = await call("/api/auth/" + (setup ? "setup" : "login"), {
      method: "POST",
      data: {
        email: "owner@example.com",
        password: ADMIN_PASSWORD,
        setupToken: setup
          ? readFileSync(join(dir, "ADMIN-SETUP.txt"), "utf8")
          : "",
      },
    });
    assert.equal(r.status, 200);
    const { challenge } = await r.json(),
      code = mail.at(-1).text.match(/\b\d{6}\b/)[0];
    const verify = await call("/api/auth/verify", {
      method: "POST",
      data: { challenge, code },
    });
    assert.equal(verify.status, 200);
    cookie = verify.headers.get("set-cookie").split(";")[0];
    const result = await verify.json();
    csrf = result.csrf;
    return { challenge, code, cookie, csrf };
  }
  return { call, login, mail, portal, url, dir };
}
const mark = (extra) => ({
  name: "Test visitor",
  email: "visitor@example.com",
  x: 50,
  y: 50,
  rotation: 10,
  ink: "olive",
  requestId: randomUUID(),
  ...extra,
});

test("owner setup, email challenge, private session, CSRF, replay, expiry and logout", async (t) => {
  const { call, login, mail, portal } = await fixture(t);
  assert.equal(
    (await call("/api/admin/dashboard", { auth: false })).status,
    401,
  );
  assert.equal(
    (
      await call("/api/auth/setup", {
        method: "POST",
        data: {
          email: "intruder@example.com",
          password: "test-password-long",
          setupToken: "bad",
        },
      })
    ).status,
    403,
  );
  const auth = await login();
  assert.ok(auth.cookie.startsWith("liminal_session="));
  assert.match(mail.at(-1).html, /cid:liminal-logo/);
  assert.match(mail.at(-1).html, new RegExp(auth.code));
  const state = await (await call("/api/auth/status")).json();
  assert.equal(state.authenticated, true);
  assert.equal(
    (
      await call("/api/auth/verify", {
        method: "POST",
        data: { challenge: auth.challenge, code: auth.code },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call("/api/admin/subscribers", {
        method: "PATCH",
        data: { email: "visitor@example.com" },
        headers: { "X-CSRF-Token": "bad" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/api/admin/dashboard", {
        headers: { Origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  assert.equal(
    (await call("/api/auth/logout", { method: "POST", data: {} })).status,
    200,
  );
  assert.equal((await call("/api/admin/dashboard")).status, 401);
  await login(false);
  portal.db
    .prepare("UPDATE sessions SET last_seen=?")
    .run(Date.now() - 1900000);
  assert.equal((await call("/api/admin/dashboard")).status, 401);
});

test("forgot password verifies the admin email and code before accepting a strong replacement", async (t) => {
  const { call, login, mail } = await fixture(t);
  await login();
  await call("/api/auth/logout", { method: "POST", data: {} });
  mail.length = 0;
  const unknown = await call("/api/auth/recover", {
    method: "POST",
    data: { email: "someone@example.com" },
    auth: false,
  });
  assert.equal(unknown.status, 200);
  assert.equal(mail.length, 0);
  const recovery = await call("/api/auth/recover", {
    method: "POST",
    data: { email: "owner@example.com" },
    auth: false,
  });
  assert.equal(recovery.status, 200);
  const { challenge } = await recovery.json();
  const code = mail.at(-1).text.match(/\b\d{6}\b/)[0];
  const verified = await call("/api/auth/verify", {
    method: "POST",
    data: { challenge, code },
    auth: false,
  });
  const authorization = await verified.json();
  assert.equal(authorization.resetRequired, true);
  assert.equal(
    (
      await call("/api/auth/reset", {
        method: "POST",
        data: { resetToken: authorization.resetToken, password: "too-weak" },
        auth: false,
      })
    ).status,
    400,
  );
  const nextPassword = "Another!Secure-Password-42";
  const reset = await call("/api/auth/reset", {
    method: "POST",
    data: { resetToken: authorization.resetToken, password: nextPassword },
    auth: false,
  });
  assert.equal(reset.status, 200);
  assert.equal((await reset.json()).authenticated, true);
  assert.equal(
    (
      await call("/api/auth/login", {
        method: "POST",
        data: { email: "owner@example.com", password: ADMIN_PASSWORD },
        auth: false,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call("/api/auth/login", {
        method: "POST",
        data: { email: "owner@example.com", password: nextPassword },
        auth: false,
      })
    ).status,
    200,
  );
});

test("marks wait for approval, expose no email, preserve retries; opt-in confirmation and unsubscribe", async (t) => {
  const { call, login, mail } = await fixture(t);
  await login();
  mail.length = 0;
  const value = mark({ subscribe: true }),
    r = await call("/api/marks", { method: "POST", data: value, auth: false });
  assert.equal(r.status, 201);
  const saved = await r.json();
  assert.equal(
    (await (await call("/api/marks", { auth: false })).json()).total,
    0,
  );
  assert.equal(mail.length, 2);
  assert.equal(mail[1].to, "owner@example.com");
  assert.match(mail[1].subject, /Empreinte à valider/);
  assert.equal(
    (await (await call("/api/marks", { method: "POST", data: value })).json())
      .id,
    saved.id,
  );
  assert.equal(mail.length, 2);
  let dash = await (await call("/api/admin/dashboard")).json();
  assert.equal(dash.marks[0].status, "pending");
  assert.equal(dash.marks[0].email, value.email);
  assert.equal(dash.subscribers[0].status, "pending");
  await call("/api/admin/marks/" + saved.id, {
    method: "PATCH",
    data: { status: "approved" },
  });
  const publicData = await (await call("/api/marks", { auth: false })).json();
  assert.equal(publicData.total, 1);
  assert.equal(publicData.marks[0].email, undefined);
  assert.equal(publicData.marks[0].request_id, undefined);
  assert.equal(
    (
      await call("/api/admin/marks/" + saved.id, {
        method: "DELETE",
      })
    ).status,
    200,
  );
  assert.equal((await (await call("/api/marks")).json()).total, 0);
  dash = await (await call("/api/admin/dashboard")).json();
  assert.equal(dash.trash.marks[0].id, saved.id);
  assert.equal(
    (
      await call("/api/admin/marks/" + saved.id + "/restore", {
        method: "POST",
        data: {},
      })
    ).status,
    200,
  );
  assert.equal((await (await call("/api/marks")).json()).total, 1);
  const confirmation = mail[0].text.match(/token=([a-f0-9]+)/)[1];
  assert.equal(
    (
      await call("/api/subscription", {
        method: "POST",
        data: { token: confirmation, action: "confirm" },
        auth: false,
      })
    ).status,
    200,
  );
  const campaign = await call("/api/admin/campaigns", {
    method: "POST",
    data: {
      subject: "Studio news",
      message: "A message for our community.",
      confirm: true,
      requestId: randomUUID(),
    },
  });
  assert.equal(campaign.status, 200);
  assert.equal((await campaign.json()).sent, 1);
  const unsubscribe = mail.at(-1).text.match(/token=([a-f0-9]+)/)[1];
  await call("/api/admin/campaigns", {
    method: "POST",
    data: {
      subject: "Second news",
      message: "Another message for our community.",
      confirm: true,
      requestId: randomUUID(),
    },
  });
  assert.equal(
    (
      await call("/api/subscription", {
        method: "POST",
        data: { token: unsubscribe, action: "unsubscribe" },
        auth: false,
      })
    ).status,
    200,
  );
  dash = await (await call("/api/admin/dashboard")).json();
  assert.equal(dash.subscribers[0].status, "unsubscribed");
  assert.equal(
    (
      await call("/api/subscription", {
        method: "POST",
        data: { token: confirmation, action: "confirm" },
        auth: false,
      })
    ).status,
    400,
  );
  await call("/api/marks", {
    method: "POST",
    data: mark({ email: "private@example.com" }),
  });
  dash = await (await call("/api/admin/dashboard")).json();
  assert.equal(dash.subscribers.length, 1);
  await call("/api/admin/marks/" + saved.id, {
    method: "PATCH",
    data: { status: "rejected" },
  });
  assert.equal((await (await call("/api/marks")).json()).total, 0);
});

test("project drafts, trash, editing, video upload and range playback; private inquiry inbox", async (t) => {
  const { call, login, mail } = await fixture(t);
  await login();
  const initial = await (await call("/api/projects", { auth: false })).json();
  assert.equal(initial.projects.length, 2);
  const media = Buffer.concat([
    Buffer.from([0, 0, 0, 24]),
    Buffer.from("ftypisom"),
    Buffer.alloc(64),
  ]);
  const upload = await call("/api/admin/upload", {
    method: "POST",
    raw: media,
    headers: { "Content-Type": "application/octet-stream" },
  });
  assert.equal(upload.status, 201);
  const asset = await upload.json();
  assert.equal(asset.visual, "video");
  const range = await call(asset.url, {
    headers: { Range: "bytes=0-15" },
    auth: false,
  });
  assert.equal(range.status, 206);
  assert.equal((await range.arrayBuffer()).byteLength, 16);
  const value = {
    ...initial.projects[0],
    slug: "test-video",
    title: "Test Video",
    visual: "video",
    media: asset.url,
    published: false,
  };
  const made = await call("/api/admin/projects", {
    method: "POST",
    data: value,
  });
  assert.equal(made.status, 201);
  const { project } = await made.json();
  assert.equal((await (await call("/api/projects")).json()).projects.length, 2);
  assert.equal(
    (
      await call("/api/admin/projects/" + project.id, {
        method: "PUT",
        data: { ...value, published: true },
      })
    ).status,
    200,
  );
  assert.equal((await (await call("/api/projects")).json()).projects.length, 3);
  assert.equal(
    (
      await call("/api/admin/projects/" + project.id, {
        method: "DELETE",
      })
    ).status,
    200,
  );
  assert.equal((await (await call("/api/projects")).json()).projects.length, 2);
  let trash = (await (await call("/api/admin/dashboard")).json()).trash;
  assert.equal(trash.projects[0].id, project.id);
  assert.equal(
    (
      await call("/api/admin/projects/" + project.id + "/restore", {
        method: "POST",
        data: {},
      })
    ).status,
    200,
  );
  assert.equal((await (await call("/api/projects")).json()).projects.length, 3);
  assert.equal(
    (
      await call("/api/admin/projects", {
        method: "POST",
        data: { ...value, slug: "unsafe", media: "javascript:alert(1)" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/api/admin/upload", {
        method: "POST",
        raw: Buffer.from('<svg onload="alert(1)"></svg>'),
        headers: { "Content-Type": "image/svg+xml" },
      })
    ).status,
    415,
  );
  const inquiry = {
    requestId: randomUUID(),
    kind: "sponsorship",
    name: "Partner test",
    email: "partner@example.com",
    message: "A sponsorship proposal for LIMINAL.",
    portfolio: "https://example.com",
    locale: "en",
  };
  assert.equal(
    (
      await call("/api/inquiries", {
        method: "POST",
        data: inquiry,
        auth: false,
      })
    ).status,
    201,
  );
  assert.equal(mail.at(-1).to, "owner@example.com");
  assert.match(mail.at(-1).subject, /Nouvelle demande/);
  assert.equal(
    (
      await call("/api/inquiries", {
        method: "POST",
        data: inquiry,
        auth: false,
      })
    ).status,
    200,
  );
  const dash = await (await call("/api/admin/dashboard")).json();
  assert.equal(dash.inquiries.length, 1);
  assert.equal(dash.inquiries[0].kind, "sponsorship");
  assert.equal(
    (
      await call("/api/admin/inquiries/" + dash.inquiries[0].id, {
        method: "PATCH",
        data: { status: "reviewing" },
      })
    ).status,
    200,
  );
  assert.equal(
    (await call("/api/admin/dashboard", { auth: false })).status,
    401,
  );
  await call("/api/admin/projects/" + project.id, { method: "DELETE" });
  const emptied = await call("/api/admin/trash", { method: "DELETE" });
  assert.deepEqual(await emptied.json(), {
    projectsDeleted: 1,
    marksDeleted: 0,
  });
  trash = (await (await call("/api/admin/dashboard")).json()).trash;
  assert.equal(trash.projects.length, 0);
  assert.equal((await call(asset.url, { auth: false })).status, 404);
});

test("testimonials support drafts, publishing, editing and removal", async (t) => {
  const { call, login } = await fixture(t);
  await login();
  const initial = await (
    await call("/api/testimonials", { auth: false })
  ).json();
  assert.equal(initial.testimonials.length, 0);
  const value = {
    quote: "A clear and thoughtful collaboration from start to finish.",
    name: "Client Test",
    role: "Founder",
    company: "Studio Test",
    signature: "Client",
    avatar: "",
    logo: "",
    published: false,
  };
  const created = await call("/api/admin/testimonials", {
    method: "POST",
    data: value,
  });
  assert.equal(created.status, 201);
  const { testimonial } = await created.json();
  assert.equal(
    (await (await call("/api/testimonials", { auth: false })).json())
      .testimonials.length,
    0,
  );
  assert.equal(
    (
      await call("/api/admin/testimonials/" + testimonial.id, {
        method: "PUT",
        data: { ...value, published: true },
      })
    ).status,
    200,
  );
  assert.equal(
    (await (await call("/api/testimonials", { auth: false })).json())
      .testimonials.length,
    1,
  );
  const dash = await (await call("/api/admin/dashboard")).json();
  assert.equal(dash.testimonials.length, 1);
  assert.equal(
    (
      await call("/api/admin/testimonials/" + testimonial.id, {
        method: "DELETE",
      })
    ).status,
    200,
  );
  assert.equal(
    (await (await call("/api/testimonials", { auth: false })).json())
      .testimonials.length,
    0,
  );
});

test("invalid credentials, challenge attempt limits, malformed bodies and method protection", async (t) => {
  const { call, login, mail } = await fixture(t);
  await login();
  assert.equal(
    (
      await call("/api/auth/login", {
        method: "POST",
        data: { email: "owner@example.com", password: "wrong" },
      })
    ).status,
    401,
  );
  const result = await (
    await call("/api/auth/login", {
      method: "POST",
      data: {
        email: "owner@example.com",
        password: ADMIN_PASSWORD,
      },
    })
  ).json();
  const code = mail.at(-1).text.match(/\b\d{6}\b/)[0];
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await call("/api/auth/verify", {
          method: "POST",
          data: { challenge: result.challenge, code: "000000" },
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await call("/api/auth/verify", {
        method: "POST",
        data: { challenge: result.challenge, code },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call("/api/marks", {
        method: "POST",
        data: mark({ name: "<script>" }),
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/api/inquiries", {
        method: "POST",
        raw: "{",
        headers: { "Content-Type": "application/json" },
      })
    ).status,
    400,
  );
  assert.notEqual((await call("/api/marks", { method: "DELETE" })).status, 200);
});
