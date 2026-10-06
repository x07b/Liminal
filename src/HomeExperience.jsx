import { ScrollCopy } from "./ScrollStory";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, localize } from "./locale";
import { useProjects } from "./ProjectsContext";
import { steps } from "./content";
import { request } from "./api";
import "./home-experience.css";

export function WorkRunway({ Visual }) {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  const { projects, loading, error, refresh } = useProjects();
  if (!loading && !error && !projects.some((p) => p.featured)) return null;
  return (
    <section id="regard" className="work-runway page-width">
      <div className="runway-heading">
        <span className="eyebrow">
          +{" "}
          {t("SÉLECTION / STUDIO", "SELECTED / STUDIO", "مختارات / الاستوديو")}
        </span>
        <Link to="/projects" className="text-link">
          {t("Tout explorer", "Explore all", "استكشف الكل")}
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <h2>
        <ScrollCopy>
          {t("Place aux images.", "Let the work speak.", "نترك الحديث للصورة.")}
        </ScrollCopy>
      </h2>
      {loading && <p role="status">{t("Chargement…")}</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={refresh}>{t("Réessayer")}</button>
        </p>
      )}
      <div className="runway-grid">
        {projects
          .filter((p) => p.featured)
          .slice(0, 4)
          .map((p, i) => (
            <motion.div
              className="runway-card"
              key={p.id || p.slug}
              initial={reduced ? false : { opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.8, delay: i * 0.12 }}
            >
              <Link to={"/projects/" + p.slug}>
                <div className="runway-visual">
                  <Visual project={p} />
                  <span className="runway-number">0{i + 1}</span>
                  <span className="runway-open">
                    <ArrowUpRight />
                  </span>
                </div>
                <div className="runway-caption">
                  <h3>
                    {p.title}
                    {p.example && (
                      <small className="work-demo">
                        {t("Étude fictive", "Demo study", "دراسة تجريبية")}
                      </small>
                    )}
                  </h3>
                  <span>{p.category}</span>
                </div>
              </Link>
            </motion.div>
          ))}
      </div>
    </section>
  );
}

export function PartnersBand() {
  const { projects } = useProjects();
  const { t } = useLocale();
  const [items, setItems] = useState([]),
    [paused, setPaused] = useState(false);
  useEffect(() => {
    let live = true;
    request("/api/partners")
      .then(
        (r) =>
          live &&
          setItems((r.partners || []).filter((p) => p.featured !== false)),
      )
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!items.length) return null;
  const copies = Math.max(1, Math.ceil(6 / items.length));
  const group = Array.from({ length: copies }, () => items).flat();
  return (
    <section
      className="partner-band"
      aria-label={t("Partenaires", "Partners", "شركاء")}
    >
      <div className="page-width partner-band-top">
        <span className="eyebrow">
          + {t("EN BONNE COMPAGNIE", "IN GOOD COMPANY", "برفقة ملهمة")}
        </span>
        <div>
          {items.some((x) => x.example) && (
            <small>
              {t(
                "Marques fictives · aperçu",
                "Fictional brands · preview",
                "علامات خيالية · معاينة",
              )}
            </small>
          )}
          <button
            onClick={() => setPaused(!paused)}
            aria-label={
              paused
                ? t("Animer les logos", "Play logos", "تشغيل الشعارات")
                : t("Pause des logos", "Pause logos", "إيقاف الشعارات")
            }
            aria-pressed={paused}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
      </div>
      <div className={"partner-window " + (paused ? "is-paused" : "")}>
        <div className="partner-belt">
          {[0, 1].map((copy) => (
            <div className="partner-group" key={copy} aria-hidden={copy === 1}>
              {group.map((p, i) => (
                <div className="partner-cell" key={p.id + "-" + i}>
                  {p.projectSlug &&
                  projects.some((x) => x.slug === p.projectSlug) ? (
                    <Link
                      tabIndex={copy === 1 ? -1 : 0}
                      to={"/projects/" + p.projectSlug}
                    >
                      <img src={p.logo} alt={p.name} />
                    </Link>
                  ) : p.website ? (
                    <a
                      tabIndex={copy === 1 ? -1 : 0}
                      href={p.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={p.logo} alt={p.name} />
                    </a>
                  ) : (
                    <img src={p.logo} alt={p.name} />
                  )}{" "}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProcessDeck() {
  const { locale, t } = useLocale();
  const content = localize(steps, locale);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  return (
    <section className="process-deck page-width" id="approche">
      <div className="process-intro">
        <span className="eyebrow">
          +{" "}
          {t(
            "DU PREMIER MOT AU DERNIER EXPORT",
            "FROM FIRST WORD TO FINAL EXPORT",
            "من أول كلمة إلى آخر نسخة",
          )}
        </span>
        <h2>
          <ScrollCopy>
            {t("Un fil continu.", "One continuous thread.", "خيط متصل.")}
            <br />
            <em className="serif-word">
              {t(
                "De l’idée à la livraison.",
                "From idea to delivery.",
                "من الفكرة إلى التسليم.",
              )}
            </em>
          </ScrollCopy>
        </h2>
      </div>
      <div className="process-console">
        <div
          className="process-selector"
          role="tablist"
          aria-label={t("Étapes du projet", "Project stages", "مراحل المشروع")}
        >
          {content.map(([title], i) => (
            <button
              role="tab"
              id={"stage-tab-" + i}
              aria-controls="stage-panel"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              key={i}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                let next;
                if (e.key === "ArrowRight") next = (i + 1) % content.length;
                if (e.key === "ArrowLeft")
                  next = (i + content.length - 1) % content.length;
                if (e.key === "Home") next = 0;
                if (e.key === "End") next = content.length - 1;
                if (next !== undefined) {
                  e.preventDefault();
                  setActive(next);
                  document.getElementById("stage-tab-" + next)?.focus();
                }
              }}
            >
              <span>0{i + 1}</span>
              {title}
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
        <div
          className="process-panel"
          id="stage-panel"
          role="tabpanel"
          aria-labelledby={"stage-tab-" + active}
          tabIndex={0}
        >
          <div className={"process-art stage-" + active} aria-hidden="true">
            <span className="process-orbit" />
            <span className="process-orbit" />
            <span className="process-orbit" />
            <img src="/brand/pictorial.svg" alt="" />
            <b>0{active + 1}</b>
          </div>
          <motion.div
            key={active}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="process-copy"
          >
            <span className="eyebrow">
              0{active + 1} / 0{content.length}
            </span>
            <h3>{content[active][0]}</h3>
            <p>{content[active][1]}</p>
            <button
              className="text-link"
              onClick={() => setActive((active + 1) % content.length)}
            >
              {t("Étape suivante", "Next moment", "المرحلة التالية")}
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
