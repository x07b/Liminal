import { ScrollCopy } from "./ScrollStory";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useLocale } from "./locale";
import { request } from "./api";
import "./people.css";
const initials = (p) =>
  p.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
const localized = (p, key, locale) => p.translations?.[locale]?.[key] || p[key];
function usePeople() {
  const [state, set] = useState({ loading: true, people: [], error: false });
  const [version, retry] = useState(0);
  useEffect(() => {
    let active = true;
    set((s) => ({ ...s, loading: true, error: false }));
    request("/api/people")
      .then((r) => {
        if (active) set({ loading: false, people: r.people, error: false });
      })
      .catch(() => {
        if (active) set({ loading: false, people: [], error: true });
      });
    return () => {
      active = false;
    };
  }, [version]);
  return { ...state, retry: () => retry((n) => n + 1) };
}
function Portrait({ person, eager = false }) {
  return person.photo ? (
    <img
      src={person.photo}
      alt={person.name}
      loading={eager ? "eager" : "lazy"}
      onError={(e) => {
        e.currentTarget.style.display = "none";
        e.currentTarget.nextElementSibling.hidden = false;
      }}
    />
  ) : null;
}
function Photo({ person, eager = false }) {
  return (
    <div className="person-photo">
      <Portrait person={person} eager={eager} />
      <span
        className="people-initials"
        hidden={!!person.photo}
        aria-label={person.name}
      >
        {initials(person)}
      </span>
    </div>
  );
}
function Status({ state }) {
  const { t } = useLocale();
  return (
    <div className="page-width people-status" role="status">
      {state.loading ? (
        t("Chargement des profils…", "Loading profiles…", "جار تحميل الملفات…")
      ) : (
        <>
          <p>
            {t(
              "Les profils sont momentanément indisponibles.",
              "Profiles are temporarily unavailable.",
              "الملفات غير متاحة مؤقتاً.",
            )}
          </p>
          <button className="text-link" onClick={state.retry}>
            {t("Réessayer", "Try again", "إعادة المحاولة")}
          </button>
        </>
      )}
    </div>
  );
}
export function StoryPeople() {
  const state = usePeople();
  const { t, locale } = useLocale();
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  if (state.loading || state.error) return <Status state={state} />;
  const founders = state.people.filter((p) => p.kind === "founder"),
    team = state.people.filter((p) => p.kind === "team");
  const activeIndex = index % Math.max(1, founders.length),
    p = founders[activeIndex];
  return (
    <>
      {p && (
        <section
          className="page-width people-founders"
          aria-label={t("Les fondateurs", "The founders", "المؤسسون")}
        >
          <div className="people-section-head">
            <span className="people-eyebrow">
              {t(
                "01 / LES VISAGES À L’ORIGINE",
                "01 / THE PEOPLE BEHIND IT",
                "01 / وراء البداية",
              )}
            </span>
            <p>
              {t(
                "Des regards. Une même envie.",
                "Different perspectives. Shared ambition.",
                "رؤى مختلفة. طموح مشترك.",
              )}
            </p>
          </div>
          <motion.div
            key={p.id}
            className="people-founder-slide"
            initial={{ opacity: 0, y: reduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.45 }}
          >
            <Photo person={p} />
            <div className="people-bio">
              <span className="people-eyebrow">
                {localized(p, "role", locale)}
              </span>
              <h2>
                <ScrollCopy>
                  {p.name}
                  <span>.</span>
                </ScrollCopy>
              </h2>
              <p className="people-description">
                {localized(p, "description", locale)}
              </p>
              {localized(p, "quote", locale) && (
                <blockquote>“{localized(p, "quote", locale)}”</blockquote>
              )}
              <Link className="text-link" to={"/" + p.slug}>
                {t("Rencontrer", "Meet", "تعرّف على")} {p.name.split(" ")[0]}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </motion.div>
          {founders.length > 1 && (
            <div className="people-controls">
              <span aria-live="polite" aria-atomic="true">
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(founders.length).padStart(2, "0")}
                <span className="people-current"> — {p.name}</span>
              </span>
              <div>
                <button
                  aria-label={t(
                    "Fondateur précédent",
                    "Previous founder",
                    "المؤسس السابق",
                  )}
                  onClick={() =>
                    setIndex(
                      (activeIndex - 1 + founders.length) % founders.length,
                    )
                  }
                >
                  <ArrowLeft />
                </button>
                <button
                  aria-label={t(
                    "Fondateur suivant",
                    "Next founder",
                    "المؤسس التالي",
                  )}
                  onClick={() => setIndex((activeIndex + 1) % founders.length)}
                >
                  <ArrowRight />
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {team.length > 0 && (
        <section className="page-width people-team">
          <div className="people-section-head">
            <div>
              <span className="people-eyebrow">
                {t("02 / NOTRE ÉQUIPE", "02 / OUR TEAM", "02 / فريقنا")}
              </span>
              <h2>
                <ScrollCopy>
                  {t(
                    "À chacun son regard.",
                    "Every eye brings something.",
                    "لكلّ عين رؤيتها.",
                  )}
                </ScrollCopy>
              </h2>
            </div>
            <Link className="text-link" to="/join-us">
              {t(
                "Et pourquoi pas vous ?",
                "Could you be next?",
                "هل تكون معنا؟",
              )}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="people-team-grid">
            {team.map((person) => (
              <Link
                key={person.id}
                to={"/" + person.slug}
                className="person-card"
              >
                <Photo person={person} />
                <div className="person-card-name">
                  <h3>{person.name}</h3>
                  <ArrowUpRight size={22} />
                </div>
                <p>{localized(person, "role", locale)}</p>
                {person.example && (
                  <small>
                    {t("Profil exemple", "Example profile", "ملف تجريبي")}
                  </small>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
export function PersonProfile({ fallback }) {
  const state = usePeople(),
    { personSlug } = useParams(),
    { locale, t } = useLocale();
  const p = state.people.find((p) => p.slug === personSlug);
  useEffect(() => {
    if (state.loading) return;
    const title = p
      ? `${p.name} — LIMINAL`
      : t(
          "Profil introuvable — LIMINAL",
          "Profile not found — LIMINAL",
          "الملف غير موجود — LIMINAL",
        );
    document.title = title;
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", title);
    if (p) {
      const desc = localized(p, "description", locale);
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", desc);
      document
        .querySelector('meta[property="og:description"]')
        ?.setAttribute("content", desc);
    }
  }, [p, locale, state.loading]);
  if (state.loading || state.error) return <Status state={state} />;
  if (!p) return fallback;
  return (
    <article className="page-width person-profile">
      <Link className="text-link" to="/our-story">
        <ArrowLeft size={18} />
        {t("Retour à notre histoire", "Back to our story", "العودة إلى قصتنا")}
      </Link>
      <div className="people-founder-slide">
        <Photo person={p} eager />
        <div className="people-bio">
          <span className="people-eyebrow">{localized(p, "role", locale)}</span>
          <h1>
            {p.name}
            <span>.</span>
          </h1>
          {p.example && (
            <small>
              {t(
                "Profil fictif de démonstration",
                "Fictional example profile",
                "ملف تجريبي خيالي",
              )}
            </small>
          )}
          <p className="people-description">
            {localized(p, "description", locale)}
          </p>
          {localized(p, "quote", locale) && (
            <blockquote>“{localized(p, "quote", locale)}”</blockquote>
          )}
        </div>
      </div>
    </article>
  );
}
