import PDFDocument from "pdfkit";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { create as createFont } from "fontkit";
import bidiFactory from "bidi-js";

const asset = (p) => fileURLToPath(new URL(p, import.meta.url));
const logo = readFileSync(asset("../public/brand/full-logo.svg"));
const hand = readFileSync(asset("../public/brand/pictorial.svg"), "utf8");
const latinFont = createFont(
  readFileSync(
    asset(
      "../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff",
    ),
  ),
);
const arabicFont = createFont(
  readFileSync(
    asset(
      "../node_modules/@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff",
    ),
  ),
);
const isArabic = (s) => /[\u0600-\u06ff]/.test(s);
const bidi = bidiFactory();
function shape(text, size) {
  const embedding = bidi.getEmbeddingLevels(text);
  const order = Array.from({ length: text.length }, (_, i) => i);
  for (const [start, end] of bidi.getReorderSegments(text, embedding)) {
    const part = order.slice(start, end + 1).reverse();
    order.splice(start, part.length, ...part);
  }
  const visual = new Map(order.map((logical, index) => [logical, index]));
  const runs = [];
  for (let i = 0; i < text.length; i++) {
    const font = isArabic(text[i]) ? arabicFont : latinFont,
      level = embedding.levels[i];
    let run = runs.at(-1);
    if (!run || run.font !== font || run.level !== level) {
      run = { font, level, text: "", start: i };
      runs.push(run);
    }
    run.text += text[i];
  }
  runs.sort(
    (a, b) =>
      Math.min(
        ...Array.from({ length: a.text.length }, (_, i) =>
          visual.get(a.start + i),
        ),
      ) -
      Math.min(
        ...Array.from({ length: b.text.length }, (_, i) =>
          visual.get(b.start + i),
        ),
      ),
  );
  let width = 0;
  const glyphs = [];
  for (const run of runs) {
    const shaped = run.font.layout(
        run.text,
        undefined,
        undefined,
        undefined,
        run.level % 2 ? "rtl" : "ltr",
      ),
      scale = size / run.font.unitsPerEm;
    for (let i = 0; i < shaped.glyphs.length; i++) {
      const p = shaped.positions[i];
      glyphs.push({
        glyph: shaped.glyphs[i],
        x: width + p.xOffset * scale,
        y: p.yOffset * scale,
        scale,
      });
      width += p.xAdvance * scale;
    }
  }
  return { glyphs, width };
}
function textPath(text, size, x, y, color, center = false) {
  const run = shape(text, size),
    offset = center ? -run.width / 2 : 0;
  return (
    `<g transform="translate(${x + offset},${y})" fill="${color}">` +
    run.glyphs
      .map(
        (g) =>
          `<path transform="translate(${g.x},${-g.y}) scale(${g.scale},${-g.scale})" d="${g.glyph.path.toSVG()}"/>`,
      )
      .join("") +
    "</g>"
  );
}
function arabicParagraph(doc, value) {
  // Shape each complete line, rather than PDFKit's separate word fragments.
  const size = 12,
    scale = size / arabicFont.unitsPerEm;
  const lines = [];
  for (const paragraph of value.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (line && shape(next, size).width > 491) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  for (const line of lines) {
    if (doc.y > 725) doc.addPage();
    const run = shape(line, size);
    let pen = 543 - run.width;
    const baseline = doc.y + 16;
    for (let i = 0; i < run.glyphs.length; i++) {
      const g = run.glyphs[i];
      doc
        .save()
        .translate(pen + g.x, baseline - g.y)
        .scale(g.scale, -g.scale)
        .path(g.glyph.path.toSVG())
        .fill("#1d1e1b")
        .restore();
    }
    doc.y += 24;
  }
  doc.x = 52;
  doc.y += 12;
}
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export async function briefPDF(inquiry) {
  const logoPNG = await sharp(logo).resize(440).png().toBuffer();
  const doc = new PDFDocument({
    size: "A4",
    margin: 52,
    bufferPages: true,
    info: { Title: "LIMINAL — Project brief", Author: "LIMINAL" },
  });
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.registerFont(
    "Latin",
    asset(
      "../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff",
    ),
  );
  doc.registerFont(
    "Arabic",
    asset(
      "../node_modules/@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff",
    ),
  );
  const paint = () => {
    doc.save().rect(0, 0, 595.28, 841.89).fill("#f5f3ed").restore();
    doc.image(logoPNG, 52, 38, { width: 145 });
    doc.moveTo(52, 92).lineTo(543, 92).strokeColor("#d9d8d0").stroke();
    doc.y = 118;
  };
  paint();
  doc.on("pageAdded", paint);
  doc
    .font("Latin")
    .fillColor("#d94e30")
    .fontSize(10)
    .text("THE START OF SOMETHING.", 52, 118);
  doc.fillColor("#1d1e1b").fontSize(32).text("Your project brief.", 52, 140);
  doc
    .fontSize(10)
    .fillColor("#696963")
    .text("Received by LIMINAL • " + inquiry.created_at.slice(0, 10), 52, 186)
    .moveDown(1.5);
  const fields = [
    ["REFERENCE", inquiry.id],
    ["NAME", inquiry.name],
    ["EMAIL", inquiry.email],
    ["COMPANY / BRAND", inquiry.brand],
    ["PROJECT TYPE", inquiry.type],
    ["OBJECTIVE", inquiry.message],
    ["SCOPE / FORMATS", inquiry.scope],
    ["TIMING", inquiry.timing],
    ["BUDGET RANGE", inquiry.budget],
    ["ADDITIONAL NOTES", inquiry.notes],
  ];
  for (const [label, value] of fields) {
    if (!value) continue;
    if (doc.y > 680) doc.addPage();
    doc.x = 52;
    doc
      .font("Latin")
      .fontSize(8)
      .fillColor("#d94e30")
      .text(label, { characterSpacing: 1 });
    doc.moveDown(0.5);
    if (isArabic(value)) {
      arabicParagraph(doc, String(value));
    } else {
      doc
        .font("Latin")
        .fontSize(12)
        .fillColor("#1d1e1b")
        .text(String(value), { width: 491, lineGap: 4, characterSpacing: 0 })
        .moveDown(1.3);
    }
  }
  if (doc.y > 655) doc.addPage();
  doc
    .font("Latin")
    .fontSize(11)
    .fillColor("#696963")
    .text(
      "What happens next?\nWe review your brief, clarify the scope together, then propose a direction and a production plan. This receipt is not a quote or a booking.",
      { width: 491, lineGap: 4 },
    );
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.save();
    doc
      .font("Latin")
      .fontSize(8)
      .fillColor("#696963")
      .text("LIMINAL • itsazizsaidi@gmail.com", 52, 790, { lineBreak: false });
    doc.text(`${i + 1} / ${range.count}`, 500, 790, { lineBreak: false });
    doc.restore();
  }
  doc.end();
  return done;
}
export async function boardPNG(marks, own) {
  const colors = {
    olive: "#71754e",
    terracotta: "#d94e30",
    charcoal: "#292b25",
  };
  const entries = [...marks.filter((m) => m.id !== own.id).slice(0, 23), own];
  const drawings = entries
    .map((m) => {
      const fill = colors[m.ink] || colors.olive;
      const icon = hand
        .replace(/fill:\s*[^;}]+/g, `fill:${fill}`)
        .replace(/fill="[^"]*"/g, `fill="${fill}"`);
      return `<g transform="translate(${Number(m.x) * 10.4 + 40},${Number(m.y) * 6.2 + 120}) rotate(${Number(m.rotation) || 0})"><image x="-38" y="-50" width="76" height="80" href="data:image/svg+xml;base64,${Buffer.from(icon).toString("base64")}"/>${textPath(m.name.slice(0, 40), 14, 0, 53, "#24251f", true)}</g>`;
    })
    .join("");
  return sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#f5f3ed"/>${textPath("LIMINAL / LEAVE YOUR MARK.", 32, 60, 78, "#24251f")}<path d="M60 110H1140" stroke="#d9d8d0"/>${drawings}${textPath(own.status === "approved" ? "A place in our creative community." : "Your personal preview. Publication follows moderation.", 16, 60, 844, "#696963")}</svg>`,
    ),
  )
    .png()
    .toBuffer();
}
