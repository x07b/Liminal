import { randomUUID } from "node:crypto";
export function caseFields(data, { safe, mediaURL, fail }) {
  const order = Number(data.order ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 999)
    fail(400, "Ordre de projet invalide (0–999).");
  if (
    data.galleryMode !== undefined &&
    !["editorial", "sequence"].includes(data.galleryMode)
  )
    fail(400, "Mode de galerie invalide.");
  const p = {
    galleryMode: data.galleryMode || "editorial",
    client: safe(data.client, 160),
    year: safe(data.year, 20),
    direction: safe(data.direction, 4000),
    outcome: safe(data.outcome, 4000),
    featured: data.featured === true,
    example: data.example === true,
    order,
  };
  if (data.gallery !== undefined && !Array.isArray(data.gallery))
    fail(400, "Galerie invalide.");
  if ((data.gallery?.length || 0) > 24)
    fail(400, "La galerie accepte 24 médias au maximum.");
  p.gallery = (data.gallery || []).map((m) => {
    if (
      !m ||
      !["image", "video"].includes(m.kind) ||
      !["work", "bts"].includes(m.section) ||
      !["wide", "half"].includes(m.layout)
    )
      fail(400, "Média de galerie invalide.");
    const url = mediaURL(m.url);
    if (!url || !safe(m.alt, 300))
      fail(
        400,
        "Chaque média doit avoir une URL et une description accessible.",
      );
    return {
      url,
      poster: mediaURL(m.poster),
      kind: m.kind,
      section: m.section,
      layout: m.layout,
      alt: safe(m.alt, 300),
      caption: safe(m.caption, 600),
    };
  });
  if (data.metrics !== undefined && !Array.isArray(data.metrics))
    fail(400, "Résultats invalides.");
  p.metrics = (data.metrics || []).slice(0, 8).map((m) => {
    if (!m || !safe(m.label, 100) || !safe(m.value, 80))
      fail(400, "Chaque indicateur nécessite une valeur et un libellé.");
    return { label: safe(m.label, 100), value: safe(m.value, 80) };
  });
  return p;
}
export const projectMedia = (p) => [
  p.media,
  p.poster,
  ...(p.gallery || []).flatMap((m) => [m.url, m.poster]),
];
export function seedCaseStudies(db, enabled) {
  if (
    !enabled ||
    db
      .prepare("SELECT 1 FROM migrations WHERE name=?")
      .get("business-case-demo-v1")
  )
    return;
  db.exec("BEGIN");
  try {
    // Existing work is preserved; only missing display preferences are initialized.
    for (const row of db.prepare("SELECT id,data FROM projects").all()) {
      const p = JSON.parse(row.data);
      if (p.featured === undefined) {
        p.featured = true;
        p.order = Number(p.number) || 0;
        db.prepare("UPDATE projects SET data=? WHERE id=?").run(
          JSON.stringify(p),
          row.id,
        );
      }
    }
    const p = {
      slug: "forma-launch-study",
      title: "FORMA. En mouvement.",
      client: "FORMA — marque fictive",
      year: "2026",
      category: "Campagne",
      type: "Étude de campagne · Démonstration",
      tags: "DIRECTION / MOTION / DÉCLINAISONS",
      number: "03",
      visual: "image",
      media: "/images/forma-campaign-demo.svg",
      poster: "",
      published: true,
      featured: true,
      order: 3,
      example: true,
      description: "Une idée de lancement. Un système pour la faire circuler.",
      context:
        "Brief fictif : donner à une nouvelle marque de design une présence reconnaissable, du premier film aux formats sociaux.",
      intention:
        "Faire du cercle un langage : il rassemble, cadre et met les éléments en mouvement.",
      direction:
        "Une palette limitée, des contours souples et une typographie franche. Une même règle visuelle pour chaque format.",
      execution:
        "Scénario de production proposé : valider le traitement, construire les compositions, animer les séquences puis finaliser le son et les versions. Les visuels présentés sont des études graphiques, pas les traces d’un tournage client.",
      deliverables: [
        "Film motion 20 s — périmètre exemple",
        "3 déclinaisons sociales — périmètre exemple",
        "6 visuels fixes — périmètre exemple",
      ],
      outcome:
        "Cet exemple montre un périmètre de livraison possible. Aucune campagne n’a été diffusée et aucune performance commerciale n’est revendiquée.",
      credit:
        "Démonstration éditoriale LIMINAL · marque fictive · composition originale du site.",
      metrics: [
        { value: "1", label: "Idée directrice — exemple" },
        { value: "3", label: "Formats prévus — exemple" },
      ],
      gallery: [
        {
          url: "/images/forma-rollout-demo.svg",
          poster: "",
          kind: "image",
          section: "work",
          layout: "half",
          alt: "FORMA, marque fictive de démonstration",
          caption: "Un repère typographique commun.",
        },
        {
          url: "/images/forma-storyboard-demo.svg",
          poster: "",
          kind: "image",
          section: "bts",
          layout: "half",
          alt: "Storyboard graphique de démonstration FORMA",
          caption:
            "Carnet de direction — référence graphique, pas une photographie de tournage.",
        },
      ],
      translations: {
        en: {
          title: "FORMA. In motion.",
          category: "Campaign",
          type: "Campaign study · Demo",
          description: "One launch idea. A system to carry it.",
          context:
            "Fictional brief: give a new design brand a recognisable presence, from the first film to social formats.",
          intention:
            "Make the circle a language: it gathers, frames and sets elements in motion.",
          direction:
            "A limited palette, soft contours and direct typography. One visual rule across every format.",
          execution:
            "Proposed workflow: approve the treatment, build compositions, animate sequences, then finish sound and versions. These visuals are graphic studies, not evidence of a client shoot.",
          deliverables: [
            "20-second motion film — example scope",
            "3 social versions — example scope",
            "6 stills — example scope",
          ],
          outcome:
            "This example illustrates a possible delivery scope. No campaign was released and no business performance is claimed.",
          credit:
            "LIMINAL editorial demo · fictional brand · original site composition.",
        },
        ar: {
          title: "فورما. في حركة.",
          category: "حملة",
          type: "دراسة حملة · مثال",
          description: "فكرة إطلاق واحدة. ونظام ينقلها.",
          context:
            "ملخص خيالي لمنح علامة تصميم جديدة حضوراً واضحاً من الفيلم إلى صيغ التواصل.",
          intention: "تحويل الدائرة إلى لغة تجمع العناصر وتؤطرها وتحركها.",
          direction:
            "ألوان محدودة وحدود مرنة وخط واضح. قاعدة بصرية مشتركة لكل صيغة.",
          execution:
            "مسار إنتاج مقترح: الموافقة على المعالجة وبناء التكوينات وتحريكها ثم إنهاء الصوت والنسخ. هذه دراسات رسومية وليست توثيقاً لتصوير عميل.",
          outcome:
            "يوضح المثال نطاق تسليم محتملاً. لم تنشر حملة ولا ندعي أي نتائج تجارية.",
          credit: "مثال تحريري لليمينال · علامة خيالية.",
        },
      },
    };
    db.prepare(
      "INSERT OR IGNORE INTO projects(id,slug,data,updated_at) VALUES(?,?,?,?)",
    ).run(randomUUID(), p.slug, JSON.stringify(p), new Date().toISOString());
    db.prepare("INSERT INTO migrations VALUES(?)").run("business-case-demo-v1");
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function upgradeDemoArtwork(db, enabled) {
  if (
    !enabled ||
    db
      .prepare("SELECT 1 FROM migrations WHERE name=?")
      .get("business-demo-art-v2")
  )
    return;
  db.exec("BEGIN");
  try {
    const row = db
      .prepare("SELECT id,data FROM projects WHERE slug=?")
      .get("forma-launch-study");
    if (row) {
      const p = JSON.parse(row.data);
      if (p.example && p.visual === "resonance" && !p.media) {
        p.visual = "image";
        p.media = "/images/forma-campaign-demo.svg";
        p.gallery = [
          {
            url: "/images/forma-rollout-demo.svg",
            poster: "",
            kind: "image",
            section: "work",
            layout: "wide",
            alt: "FORMA fictional campaign key visual",
            caption: "Concept visual — fictional campaign.",
          },
          {
            url: "/images/forma-storyboard-demo.svg",
            poster: "",
            kind: "image",
            section: "bts",
            layout: "wide",
            alt: "Three-frame graphic storyboard for FORMA",
            caption: "Demo storyboard — not client production footage.",
          },
        ];
        db.prepare("UPDATE projects SET data=? WHERE id=?").run(
          JSON.stringify(p),
          row.id,
        );
      }
    }
    const artwork = db
      .prepare("SELECT id,data FROM projects WHERE slug='forma-launch-study'")
      .get();
    if (artwork) {
      const p = JSON.parse(artwork.data);
      if (
        p.example &&
        p.gallery?.some((m) => m.url === "/images/forma-campaign-demo.svg")
      ) {
        p.gallery = p.gallery.map((m) =>
          m.url === "/images/forma-campaign-demo.svg"
            ? {
                ...m,
                url: "/images/forma-rollout-demo.svg",
                alt: "FORMA visual system across different formats",
                caption: "Format explorations — fictional campaign.",
              }
            : m,
        );
        db.prepare("UPDATE projects SET data=? WHERE id=?").run(
          JSON.stringify(p),
          artwork.id,
        );
      }
    }
    db.prepare("INSERT INTO migrations VALUES(?)").run("business-demo-art-v2");
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
