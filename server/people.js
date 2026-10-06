import { randomUUID } from "node:crypto";

export function createPeople(db, { seed = true, mediaURL, fail }) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS people (id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,data TEXT NOT NULL,updated_at TEXT NOT NULL)",
  );
  if (
    seed &&
    !db.prepare("SELECT 1 FROM migrations WHERE name=?").get("people-v1")
  ) {
    const examples = [
      {
        slug: "aziz-saidi",
        name: "Aziz Saidi",
        kind: "founder",
        role: "Cofondateur · Direction créative",
        photo: "/images/aziz-saidi.jpg",
        description:
          "L’identité visuelle, le motion design et les expériences digitales ont façonné mon regard. LIMINAL est la suite de ce parcours : une maison où l’image, le son et les idées se rencontrent.",
        quote: "Tout commence par l’humain.",
        order: 0,
        translations: {
          en: {
            role: "Co-founder · Creative direction",
            description:
              "Visual identity, motion design and digital experiences shaped my perspective. LIMINAL continues that journey: a house where images, sound and ideas meet.",
            quote: "Everything starts with people.",
          },
          ar: {
            role: "شريك مؤسس · التوجيه الإبداعي",
            description:
              "شكّلت الهوية البصرية وتصميم الحركة والتجارب الرقمية رؤيتي. ليمينال امتداد لهذا المسار: دار تلتقي فيها الصورة والصوت والأفكار.",
            quote: "كل شيء يبدأ بالإنسان.",
          },
        },
      },
      {
        slug: "ghassen-marzouk",
        name: "Ghassen Marzouk",
        kind: "founder",
        role: "Cofondateur · Business Development & Management",
        photo: "",
        description:
          "Ghassen accompagne le développement commercial et le management de LIMINAL. Il fait le lien entre les besoins des clients et le studio.",
        quote: "",
        order: 1,
        translations: {
          en: {
            role: "Co-founder · Business Development & Management",
            description:
              "Ghassen leads business development and management at LIMINAL, connecting client needs with the studio.",
          },
          ar: {
            role: "شريك مؤسس · تطوير الأعمال والإدارة",
            description:
              "يتولى غسان تطوير الأعمال والإدارة في ليمينال، ويربط احتياجات العملاء بالاستوديو.",
          },
        },
      },
      {
        slug: "mohamed",
        name: "Mohamed",
        kind: "team",
        role: "Motion designer",
        photo: "/images/testimonial-sami.png",
        description:
          "Profil de démonstration. Mohamed imagine le mouvement, compose les transitions et travaille le rythme des formats courts. Remplacez ce texte et ce portrait par ceux de votre équipe.",
        quote: "",
        order: 0,
        example: true,
        translations: {
          en: {
            role: "Motion designer",
            description:
              "Example profile. Mohamed shapes movement, transitions and the rhythm of short-form content. Replace this text and fictional portrait with your team’s details.",
          },
          ar: {
            role: "مصمم حركة",
            description:
              "ملف تجريبي. يصمم محمد الحركة والانتقالات وإيقاع المحتوى القصير. استبدل هذا النص والصورة الخيالية ببيانات فريقك.",
          },
        },
      },
    ];
    db.exec("BEGIN");
    try {
      for (const item of examples)
        db.prepare("INSERT OR IGNORE INTO people VALUES(?,?,?,?)").run(
          randomUUID(),
          item.slug,
          JSON.stringify({ published: true, example: false, ...item }),
          new Date().toISOString(),
        );
      db.prepare("INSERT INTO migrations VALUES(?)").run("people-v1");
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  const rows = (all = false) =>
    db
      .prepare("SELECT * FROM people ORDER BY rowid")
      .all()
      .map((r) => ({ ...JSON.parse(r.data), id: r.id }))
      .filter((p) => all || p.published)
      .sort((a, b) => a.order - b.order);
  const safe = (v, max) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  function validate(data) {
    const slug = safe(data.slug, 80);
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      /^(admin|api|services|projects|projets|our-story|join-us|subscription|contact|studio|uploads|images|brand|assets)$/.test(
        slug,
      ) ||
      slug.startsWith("admin")
    )
      fail(
        400,
        "Choisissez un slug unique, sans espace, différent des pages du site.",
      );
    const item = {
      slug,
      name: safe(data.name, 120),
      role: safe(data.role, 180),
      description: safe(data.description, 5000),
      quote: safe(data.quote, 250),
      photo: mediaURL(data.photo),
      kind: data.kind,
      published: data.published === true,
      example: data.example === true,
      order: Number(data.order ?? 0),
      translations: {},
    };
    if (
      !item.name ||
      !item.role ||
      !item.description ||
      !["founder", "team"].includes(item.kind) ||
      !Number.isInteger(item.order) ||
      item.order < 0 ||
      item.order > 999
    )
      fail(400, "Nom, poste, description, catégorie et ordre valides requis.");
    if (/\.(mp4|webm)(?:[?#]|$)/i.test(item.photo))
      fail(400, "Choisissez une photo, pas une vidéo.");
    for (const lang of ["en", "ar"]) {
      item.translations[lang] = {};
      for (const key of ["role", "description", "quote"])
        item.translations[lang][key] = safe(
          data.translations?.[lang]?.[key],
          key === "description" ? 5000 : 250,
        );
    }
    return item;
  }
  function save(data, id) {
    const item = validate(data);
    const duplicate = db
      .prepare("SELECT id FROM people WHERE slug=?")
      .get(item.slug);
    if (duplicate && duplicate.id !== id)
      fail(409, "Ce slug est déjà utilisé par un autre profil.");
    const now = new Date().toISOString();
    if (id) {
      if (
        !db
          .prepare("UPDATE people SET slug=?,data=?,updated_at=? WHERE id=?")
          .run(item.slug, JSON.stringify(item), now, id).changes
      )
        fail(404, "Profil introuvable.");
    } else {
      id = randomUUID();
      db.prepare("INSERT INTO people VALUES(?,?,?,?)").run(
        id,
        item.slug,
        JSON.stringify(item),
        now,
      );
    }
    return { ...item, id };
  }
  function remove(id) {
    if (!db.prepare("DELETE FROM people WHERE id=?").run(id).changes)
      fail(404, "Profil introuvable.");
  }
  return { rows, save, remove };
}
