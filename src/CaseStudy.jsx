import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Maximize2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { ScrollCopy } from "./ScrollStory";
import ProjectSequence from "./ProjectSequence";
import { useLocale } from "./locale";
export default function CaseStudy({ project: p }) {
  const { t } = useLocale();
  const sections = [
    [t("Le point de départ.", "The brief.", "نقطة البداية."), p.context],
    [t("La réponse créative.", "The creative response.", "الاستجابة الإبداعية."), p.intention],
    [t("Le système visuel.", "The visual system.", "النظام البصري."), p.direction],
    [t("La fabrication.", "The build.", "الصناعة."), p.execution],
  ];
  const chapters = sections.filter(([, value]) => value);
  return (
    <>
      {chapters.length > 0 && <nav className="case-index" aria-label={t("Dans cette étude", "In this case study", "في هذه الدراسة")}>
        <span className="eyebrow">{t("L’ÉTUDE DE CAS", "THE CASE STUDY", "دراسة المشروع")}</span>
        {chapters.map(([title], i) => <a key={title} href={"#case-chapter-"+i}><span>0{i+1}</span>{title}</a>)}
        {p.gallery?.length > 0 && <a href="#case-work">{t("Voir les applications", "See the applications", "شاهد التطبيقات")}</a>}
      </nav>}
      <div className="case-facts">
        {[
          [
            t("CLIENT / MARQUE", "CLIENT / BRAND", "العميل / العلامة"),
            p.client,
          ],
          [t("ANNÉE", "YEAR", "السنة"), p.year],
          [t("DISCIPLINE", "DISCIPLINE", "التخصص"), p.category],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <span className="eyebrow">{k}</span>
              <p>{v}</p>
            </div>
          ))}
      </div>
      {(sections.some(([, v]) => v) ||
        p.deliverables?.length > 0 ||
        p.credit) && (
        <div className="project-story">
          <aside>
            {p.deliverables?.length > 0 && (
              <>
                <span className="eyebrow">
                  {t("LIVRABLES", "DELIVERABLES", "التسليمات")}
                </span>
                <h3>
                  {t(
                    "Ce qui prend forme.",
                    "What takes shape.",
                    "ما يأخذ شكله.",
                  )}
                </h3>
                <ul>
                  {p.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </>
            )}
            {p.credit && <p className="small muted">{p.credit}</p>}
          </aside>
          <div>
            {chapters.map(([title, text], i) => (
                <section className="case-chapter" id={"case-chapter-"+i} key={title}>
                  <span className="eyebrow">0{i+1} / {p.title}</span>
                  <h2><ScrollCopy>{title}</ScrollCopy></h2>
                  <p className="case-text">{text}</p>
                </section>
              ))}
          </div>
        </div>
      )}
      <div id="case-work" className="case-work-opening">{p.galleryMode !== "sequence" && <><span className="eyebrow">{t("DE L’IDÉE AUX APPLICATIONS", "FROM IDEA TO APPLICATION", "من الفكرة إلى التطبيق")}</span><h2><ScrollCopy>{t("Le travail, en contexte.", "The work, in context.", "العمل في سياقه.")}</ScrollCopy></h2></>}</div>
      {p.galleryMode === "sequence" ? (
        <ProjectSequence
          items={(p.gallery || []).filter((m) => m.section === "work")}
        />
      ) : (
        <Media items={(p.gallery || []).filter((m) => m.section === "work")} />
      )}
      {(p.outcome || p.metrics?.length > 0) && (
        <section className="case-outcome">
          <span className="eyebrow">
            {p.example
              ? t("LE LANCEMENT / EXEMPLE", "THE LAUNCH / EXAMPLE", "الإطلاق / مثال")
              : t("LE LANCEMENT", "THE LAUNCH", "الإطلاق")}
          </span>
          {p.outcome && <h2>{p.outcome}</h2>}
          {p.metrics?.length > 0 && (
            <dl>
              {p.metrics.map((m, i) => (
                <div key={i}>
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}
      {p.gallery?.some((m) => m.section === "bts") && (
        <section className="case-bts">
          <span className="eyebrow">
            {t("DANS LES COULISSES", "BEHIND THE WORK", "خلف العمل")}
          </span>
          <Media items={p.gallery.filter((m) => m.section === "bts")} />
        </section>
      )}
    </>
  );
}
function Media({ items }) {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(null);
  const dialog = useRef(null);
  const photos = items.filter(m => m.kind === "image");
  const selected = photos[active];
  useEffect(() => {
    if (active !== null && !dialog.current?.open) dialog.current?.showModal();
  }, [active]);
  const close = () => { dialog.current?.close(); setActive(null); };
  if (!items.length) return null;
  return (<>
    <div className="case-gallery">
      {items.map((m, i) => (
        <motion.figure className={"case-media " + m.layout} key={m.url + i}
          initial={reduced ? false : { opacity: 0, y: 38 }}
          whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }}
          transition={{ duration: 1.1, ease: [.22, 1, .36, 1] }}>
          {m.kind === "video" ? (
            <video src={m.url} poster={m.poster || undefined} controls playsInline preload="metadata" aria-label={m.alt} />
          ) : (
            <button className="case-image-open" onClick={() => setActive(photos.indexOf(m))}
              aria-label={t("Agrandir : ", "Enlarge: ", "تكبير: ") + m.alt}>
              <img src={m.url} alt={m.alt} loading="lazy" />
              <span className="case-zoom" aria-hidden="true"><Maximize2 size={17} /></span>
            </button>
          )}
          {m.caption && <figcaption>{m.caption}</figcaption>}
        </motion.figure>
      ))}
    </div>
    <dialog className="project-lightbox" ref={dialog} onClose={() => setActive(null)}
      aria-label={t("Galerie du projet", "Project gallery", "معرض المشروع")}
      onClick={e => { if(e.target === e.currentTarget) close(); }}
      onKeyDown={e => {
        if(e.key === "ArrowRight") { e.preventDefault(); setActive(a => (a + 1) % photos.length); }
        if(e.key === "ArrowLeft") { e.preventDefault(); setActive(a => (a - 1 + photos.length) % photos.length); }
      }}>
      <button className="project-lightbox-close" onClick={close} aria-label={t("Fermer", "Close", "إغلاق")}><X /></button>
      {selected && <img src={selected.url} alt={selected.alt} />}
      <div className="project-lightbox-controls">
        <button onClick={() => setActive(a => (a - 1 + photos.length) % photos.length)} aria-label={t("Image précédente", "Previous image", "الصورة السابقة")}><ArrowLeft /></button>
        <span aria-live="polite">{active === null ? 0 : active + 1} / {photos.length}</span>
        <button onClick={() => setActive(a => (a + 1) % photos.length)} aria-label={t("Image suivante", "Next image", "الصورة التالية")}><ArrowRight /></button>
      </div>
    </dialog>
  </>);
}
