import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowRight,
  Plus,
  Minus,
  Menu,
  X,
  Copy,
  Check,
  Mail,
} from "lucide-react";
import {
  studio,
  services as baseServices,
  steps as baseSteps,
  faqs as baseFaqs,
} from "./content";
import "./styles.css";
import HandprintWall from "./HandprintWall";
import JoinUs from "./Join";
import InquiryForm from "./InquiryForm";
import Subscription from "./Subscription";
import { LocaleProvider, useLocale, LanguageSwitch, localize } from "./locale";
import { ProjectsProvider, useProjects } from "./ProjectsContext";
import { request } from "./api";
import "./portal.css";
const Admin = lazy(() => import("./Admin"));

function Mark({ className = "" }) {
  return (
    <img
      className={`mark ${className}`}
      src="/brand/pictorial.svg"
      alt=""
      aria-hidden="true"
      width="178"
      height="188"
    />
  );
}

function BrandLogo() {
  const { t } = useLocale();

  return (
    <img
      className="brand-logo"
      src="/brand/full-logo.svg"
      alt={t("LIMINAL")}
      width="687"
      height="172"
    />
  );
}

function Resonance({ className = "" }) {
  return (
    <svg
      className={`resonance-svg ${className}`}
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse
          key={i}
          cx="300"
          cy="300"
          rx={65 + i * 15}
          ry={150 + i * 8}
          transform={`rotate(${i * 13 - 70} 300 300)`}
          stroke="currentColor"
          strokeWidth="1.3"
        />
      ))}
    </svg>
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 28, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -6%" }}
      transition={{ duration: 0.82, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionReveal({ children, className = "", ...props }) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      className={className}
      initial={reduced ? false : { opacity: 0, y: 46, scale: 0.995 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.04, margin: "0px 0px -5%" }}
      transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

function Label({ children, light = false }) {
  return (
    <div className={`eyebrow ${light ? "light" : ""}`}>
      <span className="small-cross">+</span>
      {children}
    </div>
  );
}
function Button({ to, children, light = false, className = "" }) {
  return (
    <Link
      className={`button ${light ? "button-light" : ""} ${className}`}
      to={to}
    >
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}

function Header() {
  const { t } = useLocale();
  const dialog = useRef(null);
  const location = useLocation();
  useEffect(() => {
    dialog.current?.close();
  }, [location]);
  function close() {
    dialog.current?.close();
  }
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Aller au contenu")}
      </a>
      <header className="header">
        <Link to="/" className="logo" aria-label={t("LIMINAL, accueil")}>
          <BrandLogo />
        </Link>
        <nav className="desktop-nav" aria-label={t("Navigation principale")}>
          <NavLink to="/" end>
            {t("Home")}
          </NavLink>
          <NavLink to="/projects">{t("Projects")}</NavLink>
          <NavLink to="/our-story">{t("Our Story")}</NavLink>
          <NavLink to="/join-us">{t("Join Us")}</NavLink>
        </nav>
        <LanguageSwitch />
        <Link to="/contact" className="nav-contact">
          {t("Parlons de votre projet ")}
          <ArrowUpRight size={16} />
        </Link>
        <button
          className="menu-trigger"
          onClick={() => dialog.current.showModal()}
          aria-label={t("Ouvrir le menu")}
        >
          <Menu size={25} />
        </button>
      </header>
      <dialog
        ref={dialog}
        className="mobile-menu"
        aria-label={t("Menu de navigation")}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <div className="menu-head">
          <span className="logo">
            <BrandLogo />
          </span>
          <button aria-label={t("Fermer le menu")} onClick={close}>
            <X />
          </button>
        </div>
        <nav aria-label={t("Navigation mobile")}>
          <Link to="/" onClick={close}>
            {t("Home ")}
            <ArrowUpRight />
          </Link>
          <Link to="/projects" onClick={close}>
            {t("Projects ")}
            <ArrowUpRight />
          </Link>
          <Link to="/our-story" onClick={close}>
            {t("Our Story ")}
            <ArrowUpRight />
          </Link>
          <Link to="/join-us" onClick={close}>
            {t("Join Us ")}
            <ArrowUpRight />
          </Link>
          <Link to="/contact" onClick={close}>
            {t("Parlons-en ")}
            <ArrowUpRight />
          </Link>
        </nav>
        <p>
          {t("CREATIVE PRODUCTION HOUSE")}
          <br />
          {t("TUNISIE · D’UNE IDÉE À L’AUTRE.")}
        </p>
      </dialog>
    </>
  );
}

function RouteEffects() {
  const { locale, t } = useLocale();
  const { projects } = useProjects();
  const location = useLocation();
  const first = useRef(true);
  useEffect(() => {
    const names = {
      "/projects": "Explorations & projets",
      "/our-story": "Our Story",
      "/join-us": "Join Us",
      "/contact": "Parlons de votre projet",
      "/subscription": "Restons en lien.",
    };
    const project = projects.find(
      (p) => location.pathname === `/projects/${p.slug}`,
    );
    const pageTitle =
      location.pathname === "/"
        ? t(
            "Des images qu’on n’oublie pas",
            "Images worth remembering",
            "صور لا تُنسى",
          )
        : t(names[location.pathname] || project?.title || "Page introuvable");
    document.title = `${pageTitle} — LIMINAL`;
    const description =
      project?.description ||
      t(
        "LIMINAL est une maison de production créative en Tunisie. Stratégie, reels, image et IA : de l’intuition à une création qu’on n’oublie pas.",
        "LIMINAL is a creative production house in Tunisia. Strategy, reels, image and AI: from first instinct to work worth remembering.",
        "ليمينال دار إنتاج إبداعي في تونس. استراتيجية وريلز وصورة وذكاء اصطناعي: من الحدس الأول إلى عمل لا يُنسى.",
      );
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", description);
    document
      .querySelector('meta[property="og:title"]')
      .setAttribute("content", document.title);
    document
      .querySelector('meta[property="og:description"]')
      .setAttribute("content", description);
    if (location.hash) {
      requestAnimationFrame(() =>
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: "instant" }),
      );
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    if (!first.current && !location.hash)
      document.getElementById("main")?.focus({ preventScroll: true });
    first.current = false;
  }, [location, locale, projects.map((p) => p.title).join("|")]);
  return null;
}

function EditorialImage({ className = "", eager = false }) {
  const { t } = useLocale();

  return (
    <img
      className={className}
      src="/images/liminal-editorial.webp"
      srcSet="/images/liminal-editorial-small.webp 800w, /images/liminal-editorial.webp 1920w"
      sizes="(max-width: 700px) 100vw, 90vw"
      alt={t(
        "Une silhouette enveloppée de tissu terre cuite, un geste suspendu dans la lumière.",
      )}
      width="1916"
      height="821"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
    />
  );
}

function Hero() {
  const { t } = useLocale();

  return (
    <section className="hero page-width">
      <div className="hero-topline">
        <Label>
          {t(
            "MAISON DE PRODUCTION CRÉATIVE · TUNISIE",
            "CREATIVE PRODUCTION HOUSE · TUNISIA",
            "دار إنتاج إبداعي · تونس",
          )}
        </Label>
        <span className="location">
          <span className="status-dot" />
          {t(
            " DISPONIBLE ICI · PARTOUT EN IMAGE",
            " AVAILABLE HERE · EVERYWHERE ON SCREEN",
            " متاحون هنا · وحيث تصل الصورة",
          )}
        </span>
      </div>
      <div className="hero-heading">
        <Reveal>
          <h1>
            {t("Des images", "Images", "صور")}
            <br />
            <span className="serif-word">
              {t(
                "qu’on n’oublie pas.",
                "worth remembering.",
                "لا تُنسى.",
              )}
            </span>
            <span className="orange-period" aria-hidden="true">
              *
            </span>
          </h1>
        </Reveal>
        <Reveal className="hero-intro" delay={0.12}>
          <p className="intro-tag">
            {t(
              "Moins d’attente. Plus d’élan.",
              "Less waiting. More momentum.",
              "انتظار أقل. زخم أكبر.",
            )}
          </p>
          <p>
            {t(
              "De la première intuition au reel livré, LIMINAL pense, produit et affine chaque détail — pendant que vous gardez le cap sur votre marque.",
              "From the first spark to the final reel, LIMINAL thinks, produces and refines every detail — while you keep your focus on the brand.",
              "من اللمحة الأولى إلى الريل النهائي، تفكّر ليمينال وتنتج وتصقل كل تفصيل — بينما تحافظ أنت على تركيزك على علامتك.",
            )}
          </p>
          <Button to="/contact">
            {t(
              "Mettre l’idée en mouvement",
              "Set the idea in motion",
              "لنحرّك الفكرة",
            )}
          </Button>
        </Reveal>
      </div>
      <Reveal className="hero-film">
        <Link
          to="/projects"
          className="hero-image-link"
          aria-label={t("Découvrir Le geste, exploration visuelle")}
        >
          <EditorialImage eager />
          <div className="film-overlay">
            <span className="film-caption">
              {t("L’IMAGE ATTIRE.", "THE IMAGE DRAWS YOU IN.", "الصورة تجذبك.")}
              <br />
              <em>{t("Le geste reste.", "The gesture stays.", "والحركة تبقى.")}</em>
            </span>
            <span className="round-arrow">
              <ArrowUpRight size={28} />
            </span>
          </div>
          <span className="film-meta">
            {t("01 — LE GESTE / EXPLORATION IA")}
          </span>
          <span className="film-corner">{t("LIMINAL © 2026")}</span>
        </Link>
      </Reveal>
      <div className="hero-baseline">
        <span>
          {t(
            "POUR LES MARQUES QUI ONT QUELQUE CHOSE À FAIRE RESSENTIR.",
            "FOR BRANDS WITH SOMETHING TO MAKE PEOPLE FEEL.",
            "للعلامات التي لديها إحساس يستحق أن يصل.",
          )}
        </span>
        <a href="#regard">
          {t("VOIR LE TRAVAIL ", "SEE THE WORK ", "شاهد الأعمال ")}
          <ArrowDown size={14} />
        </a>
      </div>
    </section>
  );
}

function ProjectVisual({ project, eager = false }) {
  const { t } = useLocale();

  if (project.visual === "video" && project.media)
    return (
      <div className="project-video">
        <video
          src={project.media}
          poster={project.poster || undefined}
          controls={eager}
          playsInline
          preload="metadata"
          aria-label={project.title}
        />
        {!eager && <span className="video-badge">{t("▶ VIDEO")}</span>}
      </div>
    );
  if (project.visual === "image" && project.media)
    return (
      <img
        src={project.media}
        alt={project.title}
        loading={eager ? "eager" : "lazy"}
      />
    );
  if (project.visual === "editorial") return <EditorialImage eager={eager} />;
  return (
    <div className="resonance-art">
      <span className="art-corner">{t("LIMINAL — ÉTUDE N°02")}</span>
      <Resonance />
      <span className="art-title">
        {t("make")}
        <br />
        <i>{t("it felt.")}</i>
      </span>
      <span className="art-foot">{t("THE SPACE BETWEEN.")}</span>
    </div>
  );
}

function ProjectCard({ project, index = 0 }) {
  return (
    <Reveal delay={index * 0.08}>
      <Link
        to={`/projects/${project.slug}`}
        className={`project-card project-${project.visual}`}
      >
        <div className="project-image">
          <ProjectVisual project={project} />
          <span className="project-open" aria-hidden="true">
            <ArrowUpRight size={25} />
          </span>
        </div>
        <div className="project-info">
          <div>
            <h3>{project.title}</h3>
            <span className="project-type">{project.type}</span>
          </div>
          <span className="project-index">/{project.number}</span>
        </div>
      </Link>
    </Reveal>
  );
}

function WorkSection() {
  const { t } = useLocale();

  const { projects, loading, error, refresh } = useProjects();
  return (
    <SectionReveal id="regard" className="work-section page-width section-space">
      <Reveal className="section-heading">
        <div>
          <Label>
            {t(
              "LE TRAVAIL, AVANT LES PROMESSES",
              "THE WORK, BEFORE THE PROMISES",
              "العمل قبل الوعود",
            )}
          </Label>
          <h2>
            {t("Deux études.", "Two studies.", "دراستان.")}
            <br />
            <span className="serif-word">
              {t("Un même regard.", "One point of view.", "ورؤية واحدة.")}
            </span>
          </h2>
        </div>
        <div className="section-aside">
          <p>
            {t(
              "Pas de recette répétée. Chaque projet cherche sa propre tension, son rythme et sa façon de rester en tête.",
              "No repeated formula. Each project finds its own tension, rhythm and way of staying with you.",
              "لا وصفة مكررة. لكل مشروع توتره وإيقاعه وطريقته الخاصة في البقاء في الذاكرة.",
            )}
          </p>
          <Link className="text-link" to="/projects">
            {t("Explorer les projets ", "Explore the projects ", "استكشف المشاريع ")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </Reveal>
      <div className="project-grid">
        {projects.slice(0, 2).map((p, i) => (
          <ProjectCard project={p} index={i} key={p.slug} />
        ))}
      </div>
    </SectionReveal>
  );
}

function ProjectArchive() {
  const { t, locale } = useLocale();

  const { projects, loading, error, refresh } = useProjects();
  const [filter, setFilter] = useState("Tout");
  useEffect(() => setFilter("Tout"), [locale]);
  const categories = ["Tout", ...new Set(projects.map((p) => p.category))];
  const shown = projects.filter(
    (p) => filter === "Tout" || p.category === filter,
  );
  return (
    <section className="project-archive page-width section-space">
      <Reveal className="section-heading">
        <div>
          <Label>{t("PROJECTS / INDEX CRÉATIF")}</Label>
          <h1>
            {t("Des idées.")}
            <br />
            <span className="serif-word">{t("Des empreintes.")}</span>
          </h1>
        </div>
        <div className="section-aside">
          <p>{t("Chaque création a son propre langage.")}</p>
          <p className="small muted">
            {t(
              "Pour commencer : nos explorations de marque. Les collaborations viendront écrire la suite.",
            )}
          </p>
        </div>
      </Reveal>
      <div className="archive-toolbar">
        <div
          className="project-filters"
          role="group"
          aria-label={t("Filtrer les projets")}
        >
          {categories.map((c) => (
            <button
              key={t(c)}
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {t(c)}
              <span>
                {String(
                  c === "Tout"
                    ? projects.length
                    : projects.filter((p) => p.category === c).length,
                ).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
        <span className="archive-count" aria-live="polite">
          {shown.length} {t("créations", "creations", "أعمال")}
        </span>
      </div>
      {loading && <p role="status">{t("Chargement…")}</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={refresh}>{t("Réessayer")}</button>
        </p>
      )}
      <div className="archive-list">
        {shown.map((p, i) => (
          <Reveal key={p.slug}>
            <Link
              to={"/projects/" + p.slug}
              className={"archive-project " + (i % 2 ? "archive-reverse" : "")}
            >
              <div className="archive-visual">
                <ProjectVisual project={p} />
                <span className="archive-view">
                  {t("DÉCOUVRIR ")}
                  <ArrowUpRight size={18} />
                </span>
              </div>
              <div className="archive-info">
                <span className="eyebrow">
                  /{p.number} — {p.category}
                </span>
                <h2>{p.title}</h2>
                <p>{p.description}</p>
                <span className="archive-tags">{p.tags}</span>
                <span className="project-type">{p.type}</span>
                <ArrowUpRight className="archive-arrow" size={36} />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      <div className="archive-end">
        <span>{t("LA PROCHAINE HISTOIRE POURRAIT ÊTRE LA VÔTRE.")}</span>
        <Link className="text-link" to="/contact">
          {t("Ouvrons le brief ")}
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </section>
  );
}

function Services() {
  const { locale, t } = useLocale();
  const services = localize(baseServices, locale);
  const [open, setOpen] = useState(0);
  const reduced = useReducedMotion();
  return (
    <SectionReveal id="expertises" className="services dark-section">
      <div className="page-width section-space">
        <Reveal className="section-heading">
          <div>
            <Label light>
              {t(
                "UN PARTENAIRE · PLUSIEURS SAVOIR-FAIRE",
                "ONE PARTNER · MANY DISCIPLINES",
                "شريك واحد · خبرات متعددة",
              )}
            </Label>
            <h2>
              {t("Tout ce qu’il faut.", "Everything it needs.", "كل ما يحتاجه المشروع.")}
              <br />
              <span className="serif-word">
                {t("Rien de trop.", "Nothing it doesn’t.", "دون أي زيادة.")}
              </span>
            </h2>
          </div>
          <p className="section-aside">
            {t(
              "Stratégie, tournage, montage et IA avancent comme un seul geste. Une direction continue, sans perdre l’intention entre deux étapes.",
              "Strategy, production, editing and AI move as one gesture. One continuous direction, with no lost intent between stages.",
              "تتحرك الاستراتيجية والتصوير والمونتاج والذكاء الاصطناعي كحركة واحدة. اتجاه متصل يحفظ القصد في كل مرحلة.",
            )}
          </p>
        </Reveal>
        <div className="service-list">
          {services.map((s, i) => (
            <motion.div
              className={`service ${open === i ? "is-open" : ""}`}
              key={s.title}
              initial={reduced ? false : { opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3>
                <button
                  aria-expanded={open === i}
                  aria-controls={`service-${i}`}
                  onClick={() => setOpen(open === i ? -1 : i)}
                >
                  <span className="row-number">0{i + 1}</span>
                  <span>{s.title}</span>
                  <span className="service-toggle">
                    {open === i ? <Minus /> : <Plus />}
                  </span>
                </button>
              </h3>
              <div
                id={`service-${i}`}
                className="service-content"
                hidden={open !== i}
              >
                <div className="service-body">
                  <p className="service-subtitle">{s.subtitle}</p>
                  <div>
                    <p>{s.text}</p>
                    <div className="service-tags">
                      {s.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="service-foot">
          <Mark />
          <p>
            {t("La technologie accélère l’exploration.", "Technology speeds up exploration.", "التقنية تسرّع الاستكشاف.")}
            <br />
            <span>{t("Le goût décide.", "Taste makes the call.", "والذوق يحسم القرار.")}</span>
          </p>
          <Link to="/contact" className="text-link">
            {t("Voir ce qu’on peut construire ", "See what we can build ", "لنرَ ما يمكننا بناؤه ")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </SectionReveal>
  );
}

function Approach() {
  const { locale, t } = useLocale();
  const steps = localize(baseSteps, locale);
  return (
    <SectionReveal id="approche" className="approach page-width section-space">
      <Reveal className="section-heading">
        <div>
          <Label>
            {t("VOTRE TEMPS RESTE À VOUS", "YOUR TIME STAYS YOURS", "وقتكم يبقى لكم")}
          </Label>
          <h2>
            {t("Le projet avance.", "The project moves.", "المشروع يتقدم.")}
            <br />
            <span className="serif-word">
              {t("Vous respirez.", "You breathe.", "وأنتم تتنفسون.")}
            </span>
          </h2>
        </div>
        <div className="section-aside">
          <p>
            {t(
              "Vous validez aux moments qui comptent. Entre les deux, nous tenons le fil, anticipons les détails et faisons avancer la production.",
              "You step in when decisions matter. Between those moments, we hold the thread, anticipate the details and keep production moving.",
              "تتدخلون عندما يكون القرار مهماً. وبين تلك اللحظات، نحافظ على الخيط ونتوقع التفاصيل وندفع الإنتاج إلى الأمام.",
            )}
          </p>
          <p className="muted small">
            {t(
              "Des points de repère clairs. Aucune chasse aux nouvelles.",
              "Clear checkpoints. No chasing for updates.",
              "محطات واضحة، دون ملاحقة الأخبار.",
            )}
          </p>
        </div>
      </Reveal>
      <div className="steps">
        {steps.map(([title, text], i) => (
          <Reveal key={title} delay={i * 0.07} className="step">
            <span className="step-number">
              0{i + 1}
              <ArrowUpRight size={19} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </Reveal>
        ))}
      </div>
    </SectionReveal>
  );
}

function StoryTeaser() {
  const { t } = useLocale();

  return (
    <SectionReveal className="story-teaser">
      <div className="page-width">
        <Label>{t("POURQUOI LIMINAL", "WHY LIMINAL", "لماذا ليمينال")}</Label>
        <Link to="/our-story" className="story-teaser-link">
          <h2>
            {t("Avant d’être une agence,", "Before it was an agency,", "قبل أن تصبح وكالة،")}
            <br />
            <span className="serif-word">
              {t("c’était un regard.", "it was a way of seeing.", "كانت طريقة في الرؤية.")}
            </span>
          </h2>
          <div>
            <img src="/brand/pictorial.svg" alt="" aria-hidden="true" />
            <span>
              {t("OUR STORY ")}
              <ArrowUpRight size={18} />
            </span>
          </div>
        </Link>
      </div>
    </SectionReveal>
  );
}

function FAQ() {
  const { locale, t } = useLocale();
  const faqs = localize(baseFaqs, locale);
  return (
    <section className="faq page-width section-space">
      <Reveal className="faq-intro">
        <Label>{t("ON EN PARLE ?")}</Label>
        <h2>
          {t("Quelques")}
          <br />
          <span className="serif-word">{t("réponses.")}</span>
        </h2>
        <p>
          {t("Le début d’un projet,")}
          <br />
          {t("c’est souvent une bonne question.")}
        </p>
      </Reveal>
      <div className="faq-list">
        {faqs.map(([q, a], i) => (
          <details key={q}>
            <summary>
              <span className="faq-index">0{i + 1}</span>
              <span>{q}</span>
              <Plus className="faq-plus" size={18} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ContactBanner() {
  const { t } = useLocale();

  return (
    <SectionReveal className="contact-banner">
      <div className="page-width">
        <Label>{t("VOTRE PROCHAIN CHAPITRE", "YOUR NEXT CHAPTER", "فصلكم القادم")}</Label>
        <Link to="/contact" className="contact-banner-link">
          <h2>
            {t("Il manque encore", "Still missing:", "ما زال ينقصنا")}
            <br />
            <span className="serif-word">
              {t("votre image.", "your image.", "صورتكم.")}
            </span>
          </h2>
          <span className="big-arrow">
            <ArrowUpRight />
          </span>
        </Link>
        <div className="contact-banner-bottom">
          <p>
            {t(
              "Une intuition suffit pour ouvrir la conversation.",
              "One instinct is enough to start the conversation.",
              "يكفي حدس واحد لبدء الحديث.",
            )}
          </p>
          <span>{t("COMMENÇONS ICI", "START HERE", "لنبدأ من هنا")}</span>
        </div>
      </div>
    </SectionReveal>
  );
}

function Footer() {
  const { t } = useLocale();

  return (
    <footer className="footer page-width">
      <div className="footer-top">
        <div>
          <Link to="/" className="footer-brand">
            <BrandLogo />
          </Link>
          <p>
            {t("Creative Production House")}
            <br />
            {t("Tunisie · De l’idée à la livraison.")}
          </p>
        </div>
        <nav aria-label={t("Navigation de pied de page")}>
          <Link to="/">{t("Home")}</Link>
          <Link to="/projects">{t("Projects")}</Link>
          <Link to="/our-story">{t("Our Story")}</Link>
          <Link to="/join-us">{t("Join Us")}</Link>
          <Link to="/contact">
            {t("Contact ")}
            <ArrowUpRight size={13} />
          </Link>
        </nav>
        <div className="footer-email">
          <span>{t("UNE CONVERSATION SUFFIT.")}</span>
          <a href={`mailto:${studio.email}`}>
            {studio.email}
            <ArrowUpRight size={14} />
          </a>
          <small>{t("Contact du fondateur")}</small>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()}
          {t(" LIMINAL")}
        </span>
        <span>{t("HUMAN FIRST. ALWAYS.")}</span>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({
              top: 0,
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
            });
            document
              .querySelector(".header .logo")
              ?.focus({ preventScroll: true });
          }}
        >
          {t("REVENIR EN HAUT ")}
          <ArrowUpRight size={13} />
        </a>
      </div>
    </footer>
  );
}

function TestimonialsSection() {
  const { t } = useLocale();
  const [items, setItems] = useState([]);
  useEffect(() => {
    let live = true;
    request("/api/testimonials")
      .then((result) => live && setItems(result.testimonials || []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!items.length) return null;
  return (
    <SectionReveal
      className="testimonials page-width section-space"
      aria-labelledby="testimonials-title"
    >
      <div className="testimonials-heading">
        <Label>
          {t(
            "APRÈS LA LIVRAISON",
            "AFTER DELIVERY",
            "بعد التسليم",
          )}
        </Label>
        <h2 id="testimonials-title">
          {t(
            "Leur expérience. Avec leurs mots.",
            "Their experience. In their words.",
            "تجربتهم. بكلماتهم.",
          )}
        </h2>
      </div>
      <div className="testimonials-grid">
        {items.map((item, index) => (
          <Reveal key={item.id} delay={index * 0.08}>
            <article className="testimonial-card">
              <span className="testimonial-quote" aria-hidden="true">
                “
              </span>
              <blockquote>{item.quote}</blockquote>
              <footer>
                {item.avatar ? (
                  <img
                    className="testimonial-avatar"
                    src={item.avatar}
                    alt=""
                  />
                ) : (
                  <span className="testimonial-initials" aria-hidden="true">
                    {item.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {[item.role, item.company].filter(Boolean).join(" · ")}
                  </span>
                </div>
                {item.logo && (
                  <img
                    className="testimonial-logo"
                    src={item.logo}
                    alt={item.company || ""}
                  />
                )}
              </footer>
              {item.signature && (
                <div className="testimonial-signature">{item.signature}</div>
              )}
            </article>
          </Reveal>
        ))}
      </div>
    </SectionReveal>
  );
}

function Home() {
  return (
    <>
      <Hero />
      <WorkSection />
      <Services />
      <Approach />
      <TestimonialsSection />
      <StoryTeaser />
      <ContactBanner />
    </>
  );
}

function OurStory() {
  const { t } = useLocale();

  return (
    <>
      <section className="studio-hero page-width section-space">
        <Label>{t("OUR STORY / L’ESPACE ENTRE")}</Label>
        <Reveal>
          <h1>
            {t("D’une trace.")}
            <br />
            {t("À un ")}
            <span className="serif-word">{t("mouvement.")}</span>
            <span className="orange-period" aria-hidden="true">
              *
            </span>
          </h1>
        </Reveal>
        <div className="studio-intro">
          <p className="lead">
            {t("Avant les écrans,")}
            <br />
            {t("il y avait un geste.")}
            <br />
            <em>{t("Une envie de dire : j’existe.")}</em>
          </p>
          <div>
            <p>
              {t(
                "Une main sur une paroi. Une voix. Une image. Les moyens changent ; le besoin de s’exprimer reste.",
              )}
            </p>
            <p>
              {t(
                "LIMINAL est né de cette idée, en Tunisie : créer dans cet espace entre ce que l’on ressent et ce que l’on partage.",
              )}
            </p>
          </div>
        </div>
      </section>
      <div className="story-origin-art page-width">
        <img src="/brand/hand-outline.svg" alt="" aria-hidden="true" />
        <span className="origin-caption">
          {t("THE FIRST MEDIUM")}
          <br />
          {t("WAS HUMAN.")}
        </span>
        <span className="origin-word">
          {t("I was ")}
          <em>{t("here.")}</em>
        </span>
        <small>{t("UNE CONVICTION QUI NOUS ANIME.")}</small>
      </div>
      <section className="studio-values page-width section-space">
        <Label>{t("CE QUI NOUS MET EN MOUVEMENT")}</Label>
        <div className="values-grid">
          {[
            [
              "01",
              "Ressentir.",
              "Écouter avant de créer. Chercher l’émotion avant de choisir la forme.",
            ],
            [
              "02",
              "Exprimer.",
              "Donner à chaque marque un langage qui lui appartient. Avec une raison derrière chaque choix.",
            ],
            [
              "03",
              "Relier.",
              "Faire passer une idée d’une personne à une autre. L’image et la technologie au service de ce lien.",
            ],
          ].map(([n, title, d]) => (
            <Reveal key={n}>
              <span className="row-number">{n}</span>
              <h2>{t(title)}</h2>
              <p>{t(d)}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="founder page-width story-founder">
        <div className="founder-art" aria-hidden="true">
          <span>{t("AS.")}</span>
          <Mark />
          <small>{t("UNE ENVIE DE CRÉER AUTREMENT.")}</small>
        </div>
        <Reveal className="founder-copy">
          <Label>{t("LE PREMIER REGARD")}</Label>
          <h2>{t("Aziz Saidi.")}</h2>
          <span className="founder-role">
            {t("FONDATEUR · DESIGNER & CRÉATIF")}
          </span>
          <p>
            {t(
              "L’identité visuelle, le motion design et les expériences digitales ont façonné mon regard. LIMINAL est la suite de ce parcours : une maison où l’image, le son et les idées se rencontrent.",
            )}
          </p>
          <p className="founder-quote">
            {t("« Tout commence par l’humain. »")}
          </p>
          <Link className="text-link" to="/join-us">
            {t("Apportez votre regard ")}
            <ArrowUpRight size={17} />
          </Link>
        </Reveal>
      </section>
      <HandprintWall />
    </>
  );
}

function ProjectDetail() {
  const { t } = useLocale();

  const { projects, loading, error, refresh } = useProjects();
  const { slug } = useParams();
  const p = projects.find((p) => p.slug === slug);
  if (loading)
    return <div className="page-width section-space">{t("Chargement…")}</div>;
  if (error)
    return (
      <div className="page-width section-space">
        <p>{error}</p>
        <button onClick={refresh}>{t("Réessayer")}</button>
      </div>
    );
  if (!p) return <NotFound />;
  const next = projects[(projects.indexOf(p) + 1) % projects.length];
  return (
    <>
      <section className="project-detail page-width section-space">
        <Link className="back-link" to="/projects">
          <ArrowRight size={16} />
          {t(" Toutes les explorations")}
        </Link>
        <div className="project-detail-heading">
          <div>
            <Label>{p.type}</Label>
            <h1>{p.title}</h1>
          </div>
          <p>{p.description}</p>
        </div>
        <div className={`detail-visual detail-${p.visual}`}>
          <ProjectVisual project={p} eager />
        </div>
        <div className="project-story">
          <aside>
            <span className="eyebrow">
              {t("EXPLORATION / ")}
              {p.number}
            </span>
            <h3>{t("Ce qui prend forme.")}</h3>
            <ul>
              {p.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="small muted">{p.credit}</p>
          </aside>
          <div>
            {[
              ["Le point de départ.", p.context],
              ["L’intention.", p.intention],
              ["La réalisation.", p.execution],
            ].map(([title, d]) => (
              <Reveal key={title}>
                <h2>{t(title)}</h2>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <Link className="next-project" to={`/projects/${next.slug}`}>
          <span>
            <span className="eyebrow">{t("EXPLORATION SUIVANTE")}</span>
            <strong>{next.title}</strong>
          </span>
          <ArrowUpRight size={48} />
        </Link>
      </section>
    </>
  );
}

function Contact() {
  const { t } = useLocale();

  return (
    <section className="contact-page page-width section-space">
      <div className="contact-grid">
        <Reveal className="contact-intro">
          <Label>{t("FAISONS LE PREMIER PAS")}</Label>
          <h1>
            {t("Une idée ?")}
            <br />
            <span className="serif-word">{t("Parlons-en.")}</span>
          </h1>
          <p>
            {t("Une marque à faire grandir.")}
            <br />
            {t("Un contenu à imaginer.")}
            <br />
            {t("Ou simplement une intuition.")}
          </p>
          <a className="contact-direct" href={`mailto:${studio.email}`}>
            <Mail size={19} />
            {studio.email}
            <ArrowUpRight size={16} />
          </a>
          <small className="muted">
            {t("Contact direct d’Aziz, fondateur de LIMINAL.")}
          </small>
          <div className="contact-art" aria-hidden="true">
            <Resonance />
            <span>
              {t("LET’S")}
              <br />
              <em>{t("make it felt.")}</em>
            </span>
          </div>
        </Reveal>
        <div className="contact-form-wrap">
          <h2>{t("Racontez-nous votre projet.")}</h2>
          <p className="form-intro">
            {t("Quelques mots suffisent pour commencer.")}
          </p>
          <InquiryForm />
        </div>
      </div>
    </section>
  );
}

function NotFound() {
  const { t } = useLocale();

  return (
    <section className="not-found page-width section-space">
      <Label>{t("404 · ENTRE DEUX PAGES")}</Label>
      <h1>
        {t("Un peu trop")}
        <br />
        <span className="serif-word">{t("liminal.")}</span>
      </h1>
      <p>
        {t("Cette page n’existe pas. Revenons là où les idées prennent forme.")}
      </p>
      <Button to="/">{t("Retour à l’accueil")}</Button>
    </section>
  );
}

function LegacyProject() {
  const { slug } = useParams();
  return <Navigate to={"/projects/" + slug} replace />;
}
function Site() {
  const { t } = useLocale();

  const location = useLocation();
  const { refresh } = useProjects();
  useEffect(() => {
    refresh();
  }, [location.pathname, refresh]);
  if (location.pathname.startsWith("/admin"))
    return (
      <Suspense
        fallback={
          <div className="page-width section-space">
            {t("Ouverture du studio…")}
          </div>
        }
      >
        <Admin />
      </Suspense>
    );
  return (
    <MotionConfig reducedMotion="user">
      <>
        <RouteEffects />
        <Header />
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<ProjectArchive />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/our-story" element={<OurStory />} />
            <Route path="/join-us" element={<JoinUs />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route
              path="/contact"
              element={
                <>
                  <Contact />
                  <FAQ />
                </>
              }
            />
            <Route
              path="/projets"
              element={<Navigate to="/projects" replace />}
            />
            <Route path="/projets/:slug" element={<LegacyProject />} />
            <Route
              path="/studio"
              element={<Navigate to="/our-story" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </>
    </MotionConfig>
  );
}
function App() {
  return (
    <LocaleProvider>
      <ProjectsProvider>
        <BrowserRouter>
          <Site />
        </BrowserRouter>
      </ProjectsProvider>
    </LocaleProvider>
  );
}
const root =
  import.meta.hot?.data.root || createRoot(document.getElementById("root"));
if (import.meta.hot)
  import.meta.hot.dispose((data) => {
    data.root = root;
  });
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
