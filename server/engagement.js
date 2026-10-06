import { randomUUID, randomBytes, createHash } from "node:crypto";
import { briefPDF, boardPNG } from "./receipts.js";

const hash = (s) => createHash("sha256").update(s).digest("hex");
const clean = (s, n = 200) =>
  typeof s === "string" ? s.trim().slice(0, n) : "";
const csvCell = (s) =>
  '"' +
  String(s ?? "")
    .replace(/^[=+@\-\t\r]/, "'$&")
    .replaceAll('"', '""') +
  '"';
export function createEngagement({
  db,
  sendMail,
  json,
  body,
  fail,
  limit,
  base,
  audit,
}) {
  db.exec(`CREATE TABLE IF NOT EXISTS engagement_settings (id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS assistant_answers (id TEXT PRIMARY KEY,data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS community_feedback (id TEXT PRIMARY KEY,request_id TEXT UNIQUE NOT NULL,data TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS receipt_links (hash TEXT PRIMARY KEY,kind TEXT NOT NULL,entity_id TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS delivery_jobs (id TEXT PRIMARY KEY,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_attempt INTEGER NOT NULL DEFAULT 0,last_error TEXT,created_at TEXT NOT NULL);`);
  if (
    !db
      .prepare("PRAGMA table_info(subscribers)")
      .all()
      .some((c) => c.name === "deleted_at")
  )
    db.exec("ALTER TABLE subscribers ADD COLUMN deleted_at TEXT");
  db.prepare("INSERT OR IGNORE INTO engagement_settings VALUES(1,?)").run(
    JSON.stringify({
      email: "itsazizsaidi@gmail.com",
      instagram: "https://www.instagram.com/",
      facebook: "https://www.facebook.com/",
      whatsapp: "",
      socialDemo: true,
    }),
  );
  if (
    !db
      .prepare("SELECT 1 FROM migrations WHERE name=?")
      .get("assistant-starter")
  ) {
    const rows = [
      {
        question: "Que peut-on confier à LIMINAL ?",
        answer:
          "Direction créative, films et contenus, motion et post-production, ou partenariat créatif dans la durée. Nous définissons le bon périmètre avec vous.",
        keywords: "services,production,film,motion,what do you do",
        locale: "fr",
        link: "/services",
      },
      {
        question: "Comment démarrer un projet ?",
        answer:
          "Partagez votre objectif, les formats imaginés et votre calendrier. Nous reviendrons vers vous pour préciser la direction et le périmètre.",
        keywords: "start,brief,contact,projet",
        locale: "fr",
        link: "/contact",
      },
      {
        question: "Quel budget prévoir ?",
        answer:
          "Le budget dépend du périmètre, du tournage, des formats et du calendrier. Présentez-nous votre projet pour une proposition adaptée.",
        keywords: "prix,tarif,budget,cost,price",
        locale: "fr",
        link: "/contact",
      },
      {
        question: "What can I hire LIMINAL for?",
        answer:
          "Creative direction, film and content production, motion and post-production, or an ongoing creative partnership. We define the right scope with you.",
        keywords: "services,film,motion,production",
        locale: "en",
        link: "/services",
      },
      {
        question: "How do I start a project?",
        answer:
          "Tell us your objective, expected formats and timing. We will get back to you to discuss the direction and scope.",
        keywords: "start,brief,contact,price,budget",
        locale: "en",
        link: "/contact",
      },
      {
        question: "كيف نبدأ مشروعاً مع ليمينال؟",
        answer:
          "شاركنا هدفك والصيغ التي تتصورها والموعد المناسب. نتواصل معك لتحديد الاتجاه الإبداعي ونطاق الإنتاج.",
        keywords: "مشروع,سعر,تواصل,بداية",
        locale: "ar",
        link: "/contact",
      },
    ];
    for (const [order, row] of rows.entries())
      db.prepare("INSERT INTO assistant_answers VALUES(?,?)").run(
        randomUUID(),
        JSON.stringify({ ...row, order, published: true }),
      );
    db.prepare("INSERT INTO migrations VALUES(?)").run("assistant-starter");
  }
  const settings = () =>
    JSON.parse(
      db.prepare("SELECT data FROM engagement_settings WHERE id=1").get().data,
    );
  const answers = (admin = false) =>
    db
      .prepare("SELECT * FROM assistant_answers")
      .all()
      .map((r) => ({ ...JSON.parse(r.data), id: r.id }))
      .filter((r) => admin || r.published)
      .sort((a, b) => a.order - b.order);
  const socialText = () => {
    const s = settings();
    return s.socialDemo
      ? ""
      : Object.entries({
          Instagram: s.instagram,
          Facebook: s.facebook,
          WhatsApp: s.whatsapp,
        })
          .filter(([, v]) => v)
          .map(([k, v]) => `${k} : ${v}`)
          .join("\n");
  };
  function queue(id, payload) {
    db.prepare(
      "INSERT OR IGNORE INTO delivery_jobs(id,payload,created_at) VALUES(?,?,?)",
    ).run(id, JSON.stringify(payload), new Date().toISOString());
  }
  function receipt(kind, id) {
    const token = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO receipt_links VALUES(?,?,?,?)").run(
      hash(token),
      kind,
      id,
      Date.now() + 7 * 86400000,
    );
    return `/api/receipts/${token}/${kind === "brief" ? "brief.pdf" : "mark.png"}`;
  }
  async function attachment(kind, id) {
    if (kind === "brief") {
      const row = db.prepare("SELECT * FROM inquiries WHERE id=? AND deleted_at IS NULL").get(id);
      if (!row) fail(404, "Document introuvable.");
      return {
        filename: "LIMINAL-brief.pdf",
        content_type: "application/pdf",
        content: (await briefPDF({ ...row, ...JSON.parse(row.data) })).toString(
          "base64",
        ),
      };
    }
    const own = db
      .prepare("SELECT * FROM marks WHERE id=? AND deleted_at IS NULL")
      .get(id);
    if (!own) fail(404, "Empreinte introuvable.");
    return {
      filename: "LIMINAL-your-mark.png",
      content_type: "image/png",
      content: (
        await boardPNG(
          db
            .prepare(
              "SELECT * FROM marks WHERE status='approved' AND deleted_at IS NULL ORDER BY rowid DESC LIMIT 23",
            )
            .all(),
          own,
        )
      ).toString("base64"),
    };
  }
  let active = null,
    closed = false;
  async function drain() {
    if (active || closed) return active;
    active = (async () => {
      const jobs = db
        .prepare(
          "SELECT * FROM delivery_jobs WHERE status='pending' AND next_attempt<=? ORDER BY created_at LIMIT 8",
        )
        .all(Date.now());
      for (const job of jobs) {
        try {
          const p = JSON.parse(job.payload);
          if (job.id.startsWith("subscription-welcome/")) {
            const contact = db
              .prepare(
                "SELECT status,deleted_at FROM subscribers WHERE email=?",
              )
              .get(p.to);
            if (
              !contact ||
              contact.deleted_at ||
              contact.status !== "subscribed"
            ) {
              db.prepare(
                "UPDATE delivery_jobs SET status='cancelled' WHERE id=?",
              ).run(job.id);
              continue;
            }
          }
          if (!p.attachments) {
            p.attachments = p.attachment
              ? [await attachment(p.attachment.kind, p.attachment.id)]
              : [];
            db.prepare("UPDATE delivery_jobs SET payload=? WHERE id=?").run(
              JSON.stringify(p),
              job.id,
            );
          }
          await sendMail({
            ...p,
            replyTo: p.replyTo || settings().email,
            key: job.id,
          });
          if (closed) return;
          db.prepare(
            "UPDATE delivery_jobs SET status='sent',attempts=attempts+1,last_error=NULL WHERE id=?",
          ).run(job.id);
        } catch (error) {
          if (closed) return;
          db.prepare(
            "UPDATE delivery_jobs SET status=?,attempts=attempts+1,next_attempt=?,last_error=? WHERE id=?",
          ).run(
            error.mailPermanent || job.attempts >= 3 ? "failed" : "pending",
            Date.now() + Math.min(3600000, 60000 * 2 ** job.attempts),
            error.mailPermanent ? error.message : "Envoi non abouti. Vérifiez Resend et le domaine expéditeur.",
            job.id,
          );
        }
      }
    })().finally(() => {
      active = null;
    });
    return active;
  }
  const timer = setInterval(() => {
    drain().catch(() => {});
  }, 15000);
  timer.unref();
  function submission({ kind, id, name, email, req }) {
    const isProject = kind === "project";
    const isMark = kind === "mark";
    const path =
      isProject || isMark ? receipt(isMark ? "mark" : "brief", id) : null;
    queue(`${kind}-receipt/${id}`, {
      to: email,
      subject: isMark
        ? "LIMINAL — Votre trace commence ici"
        : isProject
          ? "LIMINAL — Votre brief est bien arrivé"
          : "LIMINAL — Merci pour votre proposition",
      text: `Bonjour ${name},\n\n${isMark ? "Merci de rejoindre notre communauté créative. Votre empreinte attend notre validation avant de rejoindre le mur public. Votre aperçu personnel est joint à ce message." : isProject ? "Votre projet est bien arrivé. Votre brief est joint en PDF. Nous allons le lire, puis revenir vers vous pour préciser la direction, le périmètre et les prochaines étapes." : "Nous avons reçu votre demande. Nous allons découvrir votre profil et votre proposition, puis vous répondre par email."}\n\nVous pouvez répondre directement à ce message.\nLIMINAL · Creative Production House\n${socialText()}`,
      cta: {
        label: isMark ? "Découvrir le mur" : "Découvrir notre travail",
        url: base(req) + (isMark ? "/our-story#leave-your-mark" : "/projects"),
      },
      ...(path ? { attachment: { kind: isMark ? "mark" : "brief", id } } : {}),
    });
    return path;
  }
  function welcome(entry, req) {
    queue("subscription-welcome/" + hash(entry.email + entry.consent_at), {
      to: entry.email,
      subject: "Bienvenue dans le cercle LIMINAL.",
      text: `Bonjour ${entry.name},\n\nVotre abonnement est confirmé. Vous recevrez les nouvelles du studio, nos projets et nos prochaines collaborations.\n\n${socialText()}`,
      cta: { label: "Explorer LIMINAL", url: base(req) + "/projects" },
    });
  }
  async function publicRoute(req, res, path, url) {
    if (path === "/api/community" && req.method === "GET") {
      json(res, 200, { settings: settings(), answers: answers() });
      return true;
    }
    const download = path.match(
      /^\/api\/receipts\/([a-f0-9]{64})\/(brief\.pdf|mark\.png)$/,
    );
    if (download && req.method === "GET") {
      limit("receipt:" + req.socket.remoteAddress, 30);
      const link = db
        .prepare("SELECT * FROM receipt_links WHERE hash=? AND expires>?")
        .get(hash(download[1]), Date.now());
      if (!link || (link.kind === "brief") !== (download[2] === "brief.pdf"))
        fail(404, "Ce lien privé a expiré.");
      const file = await attachment(link.kind, link.entity_id);
      res.writeHead(200, {
        "Content-Type": file.content_type,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
        "Referrer-Policy": "no-referrer",
      });
      res.end(Buffer.from(file.content, "base64"));
      return true;
    }
    if (path === "/api/feedback" && req.method === "POST") {
      const data = await body(req, 8000);
      if (
        data.website ||
        !["bug", "idea", "experience"].includes(data.kind) ||
        clean(data.message, 3000).length < 10 ||
        !/^[a-f0-9-]{36}$/i.test(data.requestId || "")
      )
        fail(400, "Vérifiez votre message.");
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        fail(400, "Email invalide.");
      const prior = db
        .prepare("SELECT id FROM community_feedback WHERE request_id=?")
        .get(data.requestId);
      if (prior) {
        json(res, 200, { id: prior.id });
        return true;
      }
      limit("feedback:" + req.socket.remoteAddress, 5, 3600000);
      const id = randomUUID(),
        value = {
          name: clean(data.name, 100),
          email: clean(data.email, 254),
          kind: data.kind,
          page: clean(data.page, 500),
          message: clean(data.message, 3000),
        };
      db.prepare(
        "INSERT INTO community_feedback(id,request_id,data,created_at) VALUES(?,?,?,?)",
      ).run(
        id,
        data.requestId,
        JSON.stringify(value),
        new Date().toISOString(),
      );
      queue("feedback-admin/" + id, {
        to: settings().email,
        subject: "[LIMINAL] Un regard sur le site",
        text: `${value.kind} · ${value.page}\n${value.name}\n${value.email}\n\n${value.message}`,
        cta: { label: "Ouvrir les retours", url: base(req) + "/admin" },
      });
      json(res, 201, { id });
      return true;
    }
    return false;
  }
  const dashboard = () => ({
    community: settings(),
    answers: answers(true),
    feedback: db
      .prepare("SELECT * FROM community_feedback ORDER BY created_at DESC")
      .all()
      .map(({ data, request_id, ...r }) => ({ ...r, ...JSON.parse(data) })),
    deliveries: db
      .prepare(
        "SELECT id,status,attempts,last_error,created_at,json_extract(payload,'$.to') recipient,json_extract(payload,'$.subject') subject FROM delivery_jobs ORDER BY created_at DESC LIMIT 60",
      )
      .all(),
  });
  async function adminRoute(req, res, path, url, s) {
    if (path === "/api/admin/audience.csv" && req.method === "GET") {
      const status = url.searchParams.get("status") || "subscribed";
      if (!["all", "subscribed", "unsubscribed", "pending"].includes(status))
        fail(400, "Filtre invalide.");
      const rows = db
        .prepare(
          `SELECT name,email,status,consent_at,verified_at FROM subscribers WHERE deleted_at IS NULL ${status === "all" ? "" : "AND status=?"} ORDER BY created_at DESC`,
        )
        .all(...(status === "all" ? [] : [status]));
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="LIMINAL-audience.csv"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(
        "\uFEFF" +
          [
            ["Name", "Email", "Status", "Consent date", "Verified date"],
            ...rows.map(Object.values),
          ]
            .map((row) => row.map(csvCell).join(","))
            .join("\r\n"),
      );
      audit("audience.export", s.email);
      return true;
    }
    if (
      path === "/api/admin/subscribers" &&
      ["DELETE", "PUT"].includes(req.method)
    ) {
      const { email } = await body(req);
      if (typeof email !== "string") fail(400, "Email invalide.");
      const row = db
        .prepare("SELECT * FROM subscribers WHERE email=?")
        .get(email);
      if (!row) fail(404, "Contact introuvable.");
      if (req.method === "DELETE") {
        db.prepare("UPDATE subscribers SET deleted_at=? WHERE email=?").run(
          new Date().toISOString(),
          email,
        );
        db.prepare("DELETE FROM subscription_tokens WHERE email=?").run(email);
      } else {
        db.prepare("UPDATE subscribers SET deleted_at=NULL WHERE email=?").run(
          email,
        );
      }
      audit(
        "subscriber." + (req.method === "DELETE" ? "trash" : "restore"),
        s.email,
      );
      json(res, 200, { ok: true });
      return true;
    }
    if (path === "/api/admin/community" && req.method === "PUT") {
      const d = await body(req),
        v = {
          email: "itsazizsaidi@gmail.com",
          socialDemo: d.socialDemo === true,
        };
      for (const key of ["instagram", "facebook", "whatsapp"]) {
        const value = clean(d[key], 500);
        if (value) {
          let u;
          try {
            u = new URL(value);
          } catch {
            fail(400, "Lien invalide.");
          }
          const allowed = {
            instagram: ["instagram.com", "www.instagram.com"],
            facebook: ["facebook.com", "www.facebook.com"],
            whatsapp: ["wa.me", "api.whatsapp.com"],
          }[key];
          if (
            u.protocol !== "https:" ||
            !allowed.includes(u.hostname) ||
            u.username ||
            u.password
          )
            fail(400, "Utilisez un lien HTTPS officiel pour " + key);
        }
        v[key] = value;
      }
      db.prepare("UPDATE engagement_settings SET data=? WHERE id=1").run(
        JSON.stringify(v),
      );
      json(res, 200, { ok: true });
      return true;
    }
    const a = path.match(/^\/api\/admin\/answers\/([a-f0-9-]+)$/);
    if (
      (path === "/api/admin/answers" && req.method === "POST") ||
      (a && req.method === "PUT")
    ) {
      const d = await body(req);
      const v = {
        question: clean(d.question, 200),
        answer: clean(d.answer, 1800),
        keywords: clean(d.keywords, 500),
        locale: d.locale,
        published: d.published === true,
        order: Number(d.order) || 0,
        link: clean(d.link, 200),
      };
      if (
        v.question.length < 3 ||
        v.answer.length < 5 ||
        !["fr", "en", "ar"].includes(v.locale) ||
        !Number.isSafeInteger(v.order) ||
        v.order < 0 ||
        (v.link &&
          !/^\/(?:contact|services|projects(?:\/[a-z0-9-]+)?|join-us|our-story)$/.test(
            v.link,
          ))
      )
        fail(400, "Vérifiez la question, la langue et le lien interne.");
      const id = a?.[1] || randomUUID();
      if (
        a &&
        !db.prepare("SELECT id FROM assistant_answers WHERE id=?").get(id)
      )
        fail(404, "Réponse introuvable.");
      db.prepare(
        "INSERT INTO assistant_answers VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      ).run(id, JSON.stringify(v));
      json(res, a ? 200 : 201, { id });
      return true;
    }
    if (a && req.method === "DELETE") {
      db.prepare("DELETE FROM assistant_answers WHERE id=?").run(a[1]);
      json(res, 200, { ok: true });
      return true;
    }
    const f = path.match(/^\/api\/admin\/feedback\/([a-f0-9-]+)$/);
    if (f && req.method === "PATCH") {
      const d = await body(req);
      if (!["new", "reviewing", "closed"].includes(d.status))
        fail(400, "Statut invalide.");
      db.prepare("UPDATE community_feedback SET status=? WHERE id=?").run(
        d.status,
        f[1],
      );
      json(res, 200, { ok: true });
      return true;
    }
    if (path === "/api/admin/deliveries/retry" && req.method === "POST") {
      limit("retry-mail:" + s.email, 3, 60000);
      const d = await body(req);
      db.prepare(
        "UPDATE delivery_jobs SET status='pending',attempts=0,next_attempt=0 WHERE id=? AND status='failed'",
      ).run(clean(d.id, 200));
      json(res, 200, { ok: true });
      return true;
    }
    return false;
  }
  return {
    publicRoute,
    adminRoute,
    dashboard,
    submission,
    welcome,
    queue,
    drain,
    receipt,
    settings,
    close: () => {
      closed = true;
      clearInterval(timer);
    },
    idle: () => active || Promise.resolve(),
  };
}
