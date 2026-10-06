import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { createPortal } from "./portal.js";
import { DatabaseSync } from "node:sqlite";

const ADMIN_PASSWORD = "Testing!Only-Phrase-7391";

async function fixture(t, mailHook = null) {
  const dir = mkdtempSync(join(tmpdir(), "liminal-portal-test-")),
    mail = [];
  const portal = createPortal({
      dataDir: dir,
      adminEmail: "owner@example.com",
      seedShowcase: false,
      sendMail: async (m) => {
        if (mailHook) await mailHook(m);
        mail.push(m);
      },
    }),
    server = createServer(portal.handler);
  await portal.ready;
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

test("queued acknowledgments retry without losing the request or changing attachments", async (t) => {
  let failTransport = true;
  const attempts = [];
  const { call, portal, mail } = await fixture(t, async (m) => {
    if (m.to === "retry@example.com") {
      attempts.push(m);
      if (failTransport) throw Error("Offline");
    }
  });
  const response = await call("/api/inquiries", {
    method: "POST",
    auth: false,
    data: {
      kind: "project",
      requestId: randomUUID(),
      name: "Retry client",
      email: "retry@example.com",
      message: "A project that must survive email downtime.",
    },
  });
  assert.equal(response.status, 201);
  await portal.flushMail();
  let job = portal.db
    .prepare("SELECT * FROM delivery_jobs WHERE id LIKE 'project-receipt/%'")
    .get();
  assert.equal(job.status, "pending");
  assert.equal(job.attempts, 1);
  assert.ok(JSON.parse(job.payload).attachments[0].content);
  failTransport = false;
  portal.db.prepare("UPDATE delivery_jobs SET next_attempt=0").run();
  await portal.flushMail();
  await portal.flushMail();
  job = portal.db
    .prepare("SELECT * FROM delivery_jobs WHERE id LIKE 'project-receipt/%'")
    .get();
  assert.equal(job.status, "sent");
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].key, attempts[1].key);
  assert.equal(
    attempts[0].attachments[0].content,
    attempts[1].attachments[0].content,
  );
  assert.equal(mail.filter((m) => m.to === "retry@example.com").length, 1);
});

test("subscription welcomes are sent once after confirmation, never after unsubscribe", async (t) => {
  const { call, portal, mail } = await fixture(t);
  await call("/api/subscribe", {
    method: "POST",
    auth: false,
    data: { email: "welcome@example.com", consent: true },
  });
  let token = mail.at(-1).cta.url.split("token=")[1];
  await call("/api/subscription", {
    method: "POST",
    auth: false,
    data: { token, action: "confirm" },
  });
  await call("/api/subscription", {
    method: "POST",
    auth: false,
    data: { token, action: "confirm" },
  });
  await portal.flushMail();
  assert.equal(
    mail.filter((m) => m.subject === "Bienvenue dans le cercle LIMINAL.")
      .length,
    1,
  );
  await call("/api/subscribe", {
    method: "POST",
    auth: false,
    data: { email: "cancelled@example.com", consent: true },
  });
  token = mail.at(-1).cta.url.split("token=")[1];
  await call("/api/subscription", {
    method: "POST",
    auth: false,
    data: { token, action: "confirm" },
  });
  await call("/api/subscription", {
    method: "POST",
    auth: false,
    data: { token, action: "unsubscribe" },
  });
  await portal.flushMail();
  assert.equal(
    mail.filter(
      (m) =>
        m.to === "cancelled@example.com" &&
        m.subject === "Bienvenue dans le cercle LIMINAL.",
    ).length,
    0,
  );
});

test("partners require authentication and support draft, publish, order, edit and delete", async (t) => {
  const { call, login } = await fixture(t);
  const value = {
    name: "Example Studio",
    logo: "/images/partner-forma.svg",
    order: 3,
    published: false,
    example: true,
  };
  assert.equal(
    (
      await call("/api/admin/partners", {
        method: "POST",
        auth: false,
        data: value,
      })
    ).status,
    401,
  );
  await login();
  assert.equal(
    (
      await call("/api/admin/partners", {
        method: "POST",
        data: value,
        headers: { "X-CSRF-Token": "bad" },
      })
    ).status,
    403,
  );
  for (const invalid of [
    { logo: "javascript:alert(1)" },
    { order: -1 },
    { order: "NaN" },
    { name: "" },
  ])
    assert.equal(
      (
        await call("/api/admin/partners", {
          method: "POST",
          data: { ...value, ...invalid },
        })
      ).status,
      400,
    );
  const created = await call("/api/admin/partners", {
    method: "POST",
    data: value,
  });
  assert.equal(created.status, 201);
  const { partner } = await created.json();
  assert.equal(
    (await (await call("/api/partners", { auth: false })).json()).partners
      .length,
    0,
  );
  assert.equal(
    (
      await call("/api/admin/partners/" + partner.id, {
        method: "PUT",
        data: { ...value, published: true, name: "Updated Studio" },
      })
    ).status,
    200,
  );
  await call("/api/admin/partners", {
    method: "POST",
    data: { ...value, name: "First Studio", order: 0, published: true },
  });
  const visible = (await (await call("/api/partners", { auth: false })).json())
    .partners;
  assert.deepEqual(
    visible.map((p) => p.name),
    ["First Studio", "Updated Studio"],
  );
  assert.equal(
    (await (await call("/api/admin/dashboard")).json()).partners.length,
    2,
  );
  assert.equal(
    (await call("/api/admin/partners/" + partner.id, { method: "DELETE" }))
      .status,
    200,
  );
  assert.equal(
    (
      await call("/api/admin/partners/" + partner.id, {
        method: "PUT",
        data: value,
      })
    ).status,
    404,
  );
  assert.equal(
    (await (await call("/api/partners", { auth: false })).json()).partners
      .length,
    1,
  );
});

test("showcase examples seed once and respect edits and deletions across restarts", async () => {
  const dir = mkdtempSync(join(tmpdir(), "liminal-showcase-test-"));
  const open = () => createPortal({ dataDir: dir, sendMail: async () => {} });
  let portal;
  try {
    portal = open();
    await portal.ready;
    portal.close();
    let db = new DatabaseSync(join(dir, "marks.sqlite"));
    assert.equal(db.prepare("SELECT count(*) n FROM partners").get().n, 6);
    assert.equal(db.prepare("SELECT count(*) n FROM testimonials").get().n, 2);
    const demo = db
      .prepare("SELECT * FROM projects WHERE slug='forma-launch-study'")
      .get();
    assert.equal(JSON.parse(demo.data).example, true);
    assert.equal(JSON.parse(demo.data).featured, true);
    db.prepare("DELETE FROM projects WHERE id=?").run(demo.id);
    const row = db.prepare("SELECT * FROM testimonials LIMIT 1").get();
    db.prepare("UPDATE testimonials SET data=? WHERE id=?").run(
      JSON.stringify({ ...JSON.parse(row.data), name: "Edited Name" }),
      row.id,
    );
    db.exec("DELETE FROM partners");
    db.close();
    portal = open();
    await portal.ready;
    portal.close();
    db = new DatabaseSync(join(dir, "marks.sqlite"));
    assert.equal(db.prepare("SELECT count(*) n FROM partners").get().n, 0);
    assert.equal(
      db
        .prepare(
          "SELECT count(*) n FROM projects WHERE slug='forma-launch-study'",
        )
        .get().n,
      0,
    );
    assert.equal(
      JSON.parse(
        db.prepare("SELECT data FROM testimonials WHERE id=?").get(row.id).data,
      ).name,
      "Edited Name",
    );
    assert.equal(db.prepare("SELECT count(*) n FROM testimonials").get().n, 2);
    db.close();
  } finally {
    const target = resolve(dir);
    assert.ok(
      target.startsWith(resolve(tmpdir()) + sep + "liminal-showcase-test-"),
    );
    rmSync(target, { recursive: true });
  }
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
    inquiriesDeleted: 0,
    marksDeleted: 0,
    subscribersDeleted: 0,
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

test("people management protects writes, hides drafts and validates unique public routes", async (t) => {
  const { call, login } = await fixture(t);
  const person = {
    name: "Example member",
    slug: "example-member",
    kind: "team",
    role: "Designer",
    description: "An example biography.",
    photo: "/images/aziz-saidi.jpg",
    order: 0,
    published: false,
  };
  assert.equal(
    (
      await call("/api/admin/people", {
        method: "POST",
        auth: false,
        data: person,
      })
    ).status,
    401,
  );
  await login();
  assert.equal(
    (
      await call("/api/admin/people", {
        method: "POST",
        data: person,
        headers: { "X-CSRF-Token": "bad" },
      })
    ).status,
    403,
  );
  for (const invalid of [
    { slug: "admin" },
    { slug: "our-story" },
    { slug: "Bad Slug" },
    { photo: "javascript:alert(1)" },
    { kind: "other" },
    { order: -1 },
  ])
    assert.equal(
      (
        await call("/api/admin/people", {
          method: "POST",
          data: { ...person, ...invalid },
        })
      ).status,
      400,
    );
  const created = await call("/api/admin/people", {
    method: "POST",
    data: person,
  });
  assert.equal(created.status, 201);
  const { person: saved } = await created.json();
  assert.equal(
    (await (await call("/api/people", { auth: false })).json()).people.length,
    0,
  );
  assert.equal(
    (await call("/api/admin/people", { method: "POST", data: person })).status,
    409,
  );
  assert.equal(
    (
      await call("/api/admin/people/" + saved.id, {
        method: "PUT",
        data: {
          ...person,
          published: true,
          translations: { en: { role: "Artist" } },
        },
      })
    ).status,
    200,
  );
  const list = (await (await call("/api/people", { auth: false })).json())
    .people;
  assert.equal(list[0].translations.en.role, "Artist");
  assert.equal(list[0].slug, person.slug);
  assert.equal(
    (await call("/api/admin/people/" + saved.id, { method: "DELETE" })).status,
    200,
  );
  assert.equal(
    (await (await call("/api/people", { auth: false })).json()).people.length,
    0,
  );
});

test("case studies persist optional narrative, ordering, featured state and image/video galleries", async (t) => {
  const { call, login } = await fixture(t);
  await login();
  const base = {
    slug: "case-study",
    title: "Study",
    category: "Campaign",
    description: "A production study",
    visual: "resonance",
    published: true,
    client: "Example",
    year: "2026",
    direction: "Direction",
    outcome: "Outcome",
    featured: true,
    order: 7,
    example: true,
    metrics: [{ value: "3", label: "Versions" }],
    gallery: [
      {
        url: "/images/partner-forma.svg",
        kind: "image",
        section: "work",
        layout: "wide",
        alt: "Composition",
        caption: "Example",
      },
      {
        url: "https://example.com/film.mp4",
        kind: "video",
        section: "bts",
        layout: "half",
        poster: "/images/aziz-saidi.jpg",
        alt: "Production study",
      },
    ],
    translations: {
      en: { direction: "Translated direction", outcome: "Translated outcome" },
    },
  };
  const made = await call("/api/admin/projects", {
    method: "POST",
    data: base,
  });
  assert.equal(made.status, 201);
  const { project } = await made.json();
  for (const invalid of [
    { order: -1 },
    { gallery: [{ ...base.gallery[0], url: "javascript:alert(1)" }] },
    { gallery: [{ ...base.gallery[0], alt: "" }] },
    { gallery: "bad" },
    { metrics: [null] },
  ])
    assert.equal(
      (
        await call("/api/admin/projects/" + project.id, {
          method: "PUT",
          data: { ...base, ...invalid },
        })
      ).status,
      400,
    );
  let rows = (await (await call("/api/projects", { auth: false })).json())
    .projects;
  let found = rows.find((p) => p.id === project.id);
  assert.equal(found.gallery.length, 2);
  assert.equal(found.translations.en.direction, "Translated direction");
  assert.equal(found.featured, true);
  assert.equal(found.order, 7);
  assert.equal(
    (
      await call("/api/admin/projects/" + project.id, {
        method: "PUT",
        data: {
          ...base,
          featured: false,
          order: 0,
          gallery: [],
          metrics: [],
          direction: "",
          outcome: "",
        },
      })
    ).status,
    200,
  );
  rows = (await (await call("/api/projects", { auth: false })).json()).projects;
  found = rows.find((p) => p.id === project.id);
  assert.equal(found.featured, false);
  assert.deepEqual(found.gallery, []);
  assert.equal(found.outcome, "");
});

test("project conversation stores scope, budget and notes and includes them in owner notification", async (t) => {
  const { call, login, mail } = await fixture(t);
  await login();
  const response = await call("/api/inquiries", {
    method: "POST",
    auth: false,
    data: {
      kind: "project",
      name: "Brand owner",
      email: "brand@example.com",
      message: "We are launching our new collection.",
      scope: "Film and stills",
      budget: "5 000–10 000 TND",
      notes: "Two locations",
      requestId: randomUUID(),
    },
  });
  assert.equal(response.status, 201);
  const dashboard = await (await call("/api/admin/dashboard")).json();
  const inquiry = dashboard.inquiries[0];
  assert.equal(inquiry.scope, "Film and stills");
  assert.equal(inquiry.budget, "5 000–10 000 TND");
  assert.equal(inquiry.notes, "Two locations");
  assert.ok(
    mail.some(
      (m) =>
        m.text.includes("Film and stills") && m.text.includes("Two locations"),
    ),
  );
});

test("gallery assets survive trash purge while referenced and are removed after the last project is purged", async (t) => {
  const { call, login } = await fixture(t);
  await login();
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
  const value = {
    title: "Media lifecycle",
    category: "Film",
    description: "Gallery media reference test",
    visual: "resonance",
    published: true,
    gallery: [
      {
        url: asset.url,
        kind: "video",
        section: "bts",
        layout: "wide",
        alt: "Behind the scenes",
      },
    ],
  };
  const first = await (
    await call("/api/admin/projects", {
      method: "POST",
      data: { ...value, slug: "gallery-one" },
    })
  ).json();
  const second = await (
    await call("/api/admin/projects", {
      method: "POST",
      data: { ...value, slug: "gallery-two" },
    })
  ).json();
  await call("/api/admin/projects/" + first.project.id, { method: "DELETE" });
  await call("/api/admin/trash", { method: "DELETE" });
  assert.equal((await call(asset.url, { auth: false })).status, 200);
  await call("/api/admin/projects/" + second.project.id, { method: "DELETE" });
  await call("/api/admin/trash", { method: "DELETE" });
  assert.equal((await call(asset.url, { auth: false })).status, 404);
});

test("continuous carousel presentation persists through project editing", async (t) => {
  const { call, login } = await fixture(t);
  await login();
  const data = {
    slug: "continuous",
    title: "Continuous",
    category: "Identity",
    description: "A continuous visual sequence",
    visual: "resonance",
    galleryMode: "sequence",
  };
  const r = await call("/api/admin/projects", { method: "POST", data });
  assert.equal(r.status, 201);
  const { project } = await r.json();
  assert.equal(project.galleryMode, "sequence");
  assert.equal(
    (
      await call("/api/admin/projects/" + project.id, {
        method: "PUT",
        data: { ...data, galleryMode: "invalid" },
      })
    ).status,
    400,
  );
  const edited = await call("/api/admin/projects/" + project.id, {
    method: "PUT",
    data: { ...data, galleryMode: "editorial" },
  });
  assert.equal(edited.status, 200);
  const dashboard = await (await call("/api/admin/dashboard")).json();
  assert.equal(
    dashboard.projects.find((p) => p.id === project.id).galleryMode,
    "editorial",
  );
});

test("audience CSV is private, escapes formulas and trash restore preserves unsubscribe", async (t) => {
  const { call, login, mail, portal } = await fixture(t);
  await login();
  assert.equal(
    (await call("/api/admin/audience.csv", { auth: false })).status,
    401,
  );
  await call("/api/subscribe", {
    method: "POST",
    auth: false,
    data: { email: "csv@example.com", name: "=FORMULA()", consent: true },
  });
  const token = mail.at(-1).cta.url.split("token=")[1];
  await call("/api/subscription", {
    method: "POST",
    auth: false,
    data: { token, action: "confirm" },
  });
  let csv = await (await call("/api/admin/audience.csv")).text();
  assert.match(csv, /'=FORMULA/);
  assert.match(csv, /csv@example.com/);
  await call("/api/admin/subscribers", {
    method: "PATCH",
    data: { email: "csv@example.com" },
  });
  await call("/api/admin/subscribers", {
    method: "DELETE",
    data: { email: "csv@example.com" },
  });
  let d = await (await call("/api/admin/dashboard")).json();
  assert.equal(d.subscribers.length, 0);
  assert.equal(d.trash.subscribers.length, 1);
  assert.equal(
    (
      await call("/api/subscription", {
        method: "POST",
        auth: false,
        data: { token, action: "confirm" },
      })
    ).status,
    400,
  );
  await call("/api/admin/subscribers", {
    method: "PUT",
    data: { email: "csv@example.com" },
  });
  d = await (await call("/api/admin/dashboard")).json();
  assert.equal(d.subscribers[0].status, "unsubscribed");
  assert.doesNotMatch(
    await (await call("/api/admin/audience.csv")).text(),
    /csv@example.com/,
  );
  await call("/api/admin/subscribers", {
    method: "DELETE",
    data: { email: "csv@example.com" },
  });
  await call("/api/admin/trash", { method: "DELETE" });
  assert.equal(
    portal.db.prepare("SELECT count(*) n FROM subscribers").get().n,
    0,
  );
});

test("project and join acknowledgments are idempotent, with private downloadable PDF and mark PNG", async (t) => {
  const { call, mail, portal } = await fixture(t);
  const data = {
    kind: "project",
    name: "Client",
    email: "client@example.com",
    message: "A coherent brand campaign.",
    requestId: randomUUID(),
    scope: "Film and stills",
  };
  const made = await call("/api/inquiries", {
    method: "POST",
    auth: false,
    data,
  });
  assert.equal(made.status, 201);
  const receipt = await made.json();
  const pdf = await call(receipt.download, { auth: false });
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers.get("cache-control"), /no-store/);
  assert.equal(
    Buffer.from(await pdf.arrayBuffer())
      .subarray(0, 4)
      .toString(),
    "%PDF",
  );
  await call("/api/inquiries", { method: "POST", auth: false, data });
  await portal.flushMail();
  const ack = mail.filter((m) => m.to === "client@example.com");
  assert.equal(ack.length, 1);
  assert.equal(ack[0].attachments[0].content_type, "application/pdf");
  assert.equal(ack[0].replyTo, "itsazizsaidi@gmail.com");
  for (const kind of ["career", "freelance", "sponsorship"])
    await call("/api/inquiries", {
      method: "POST",
      auth: false,
      data: {
        ...data,
        kind,
        email: kind + "@example.com",
        requestId: randomUUID(),
      },
    });
  const markReceipt = await (
    await call("/api/marks", { method: "POST", auth: false, data: mark() })
  ).json();
  const png = await call(markReceipt.download, { auth: false });
  assert.equal(png.headers.get("content-type"), "image/png");
  assert.equal(
    Buffer.from(await png.arrayBuffer())
      .subarray(1, 4)
      .toString(),
    "PNG",
  );
  await portal.flushMail();
  for (const kind of ["career", "freelance", "sponsorship"])
    assert.equal(mail.filter((m) => m.to === kind + "@example.com").length, 1);
  assert.ok(
    mail.some(
      (m) =>
        m.to === "visitor@example.com" &&
        m.attachments?.[0]?.content_type === "image/png",
    ),
  );
  portal.db.prepare("UPDATE receipt_links SET expires=0").run();
  assert.equal((await call(receipt.download, { auth: false })).status, 404);
});

test("community answers and links are controlled by admin, feedback is private and idempotent", async (t) => {
  const { call, login } = await fixture(t);
  const answer = {
    question: "A new question?",
    answer: "A carefully approved answer.",
    locale: "en",
    keywords: "testing",
    link: "/services",
    order: 0,
    published: false,
  };
  assert.equal(
    (
      await call("/api/admin/answers", {
        method: "POST",
        auth: false,
        data: answer,
      })
    ).status,
    401,
  );
  await login();
  const { id } = await (
    await call("/api/admin/answers", { method: "POST", data: answer })
  ).json();
  let visible = await (await call("/api/community", { auth: false })).json();
  assert.ok(!visible.answers.some((a) => a.id === id));
  await call("/api/admin/answers/" + id, {
    method: "PUT",
    data: { ...answer, published: true },
  });
  visible = await (await call("/api/community", { auth: false })).json();
  assert.ok(visible.answers.some((a) => a.id === id));
  assert.equal(
    (
      await call("/api/admin/answers/" + id, {
        method: "PUT",
        data: { ...answer, link: "javascript:alert(1)" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/api/admin/community", {
        method: "PUT",
        data: { instagram: "https://evil.example/" },
      })
    ).status,
    400,
  );
  const feedback = {
    requestId: randomUUID(),
    kind: "idea",
    message: "Consider adding more process details.",
    name: "A visitor",
  };
  await call("/api/feedback", { method: "POST", auth: false, data: feedback });
  await call("/api/feedback", { method: "POST", auth: false, data: feedback });
  const d = await (await call("/api/admin/dashboard")).json();
  assert.equal(d.feedback.length, 1);
  assert.equal(d.subscribers.length, 0);
  assert.equal(visible.feedback, undefined);
});

test("inquiries can be trashed, restored and permanently purged with private receipts revoked", async (t) => {
  const { call, login, portal } = await fixture(t);
  const response = await call('/api/inquiries', {method:'POST', auth:false, data:{requestId:randomUUID(),kind:'project',name:'Trash test',email:'trash@example.com',message:'A new brand production project.'}});
  assert.equal(response.status,201);
  const receipt = await response.json();
  await login();
  let dash = await (await call('/api/admin/dashboard')).json();
  const id = dash.inquiries[0].id;
  const path = '/api/admin/inquiries/'+id;
  assert.equal((await call(path,{method:'DELETE',auth:false})).status,401);
  assert.equal((await call(path,{method:'DELETE',headers:{'X-CSRF-Token':'wrong'}})).status,403);
  assert.equal((await call(path,{method:'DELETE'})).status,200);
  dash = await (await call('/api/admin/dashboard')).json();
  assert.equal(dash.inquiries.length,0);
  assert.equal(dash.trash.inquiries.length,1);
  if (receipt.download) assert.equal((await call(receipt.download,{auth:false})).status,404);
  assert.equal(portal.db.prepare("SELECT status FROM delivery_jobs WHERE id=?").get('project-receipt/'+id).status,'cancelled');
  assert.equal((await call(path+'/restore',{method:'PUT'})).status,200);
  assert.equal((await (await call('/api/admin/dashboard')).json()).inquiries.length,1);
  await call(path,{method:'DELETE'});
  assert.equal((await (await call('/api/admin/trash',{method:'DELETE'})).json()).inquiriesDeleted,1);
  assert.equal((await call(path+'/restore',{method:'PUT'})).status,404);
});
