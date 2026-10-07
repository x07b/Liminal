import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Instagram,
  Facebook,
  MessageCircle,
  X,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Send,
  Check,
} from "lucide-react";
import { useLocale } from "./locale";
import { request } from "./api";
import "./engagement.css";
const Community = createContext({ settings: {}, answers: [] });
export function CommunityProvider({ children }) {
  const [data, setData] = useState({ settings: {}, answers: [] });
  const location = useLocation();
  useEffect(() => {
    let alive = true;
    request("/api/community")
      .then((v) => {
        if (alive) setData(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [location.pathname]);
  return <Community.Provider value={data}>{import.meta.env.VITE_LIMINAL_PREVIEW === "true" && <aside role="status" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, padding: "8px 16px", background: "#fff2b8", color: "#171717", fontSize: 12 }}>PREVIEW — Data stays in this browser only. Forms are demos; no emails are sent. <a href="/admin" style={{ color: "#171717", textDecoration: "underline" }}>Local dashboard</a></aside>}{children}</Community.Provider>;
}
export function SocialLinks({ only } = {}) {
  const { settings: s } = useContext(Community);
  const { t } = useLocale();
  return (
    <div
      className="social-links"
      aria-label={t("Retrouvez LIMINAL", "Find LIMINAL", "تابع ليمينال")}
    >
      {[
        ["instagram", "Instagram", Instagram],
        ["facebook", "Facebook", Facebook],
        ["whatsapp", "WhatsApp", MessageCircle],
      ]
        .filter(([key]) => (!only || only.includes(key)) && (s[key] || s.socialDemo))
        .map(([key, name, Icon]) =>
          s.socialDemo ? (
            <Link
              key={key}
              to="/contact"
              aria-label={`${name} — ${t("lien à venir", "coming soon", "قريباً")}`}
              title={`${name} — ${t("lien à venir", "coming soon", "قريباً")}`}
            >
              <Icon size={19} />
            </Link>
          ) : (
            <a
              key={key}
              href={s[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
            >
              <Icon size={19} />
            </a>
          ),
        )}
    </div>
  );
}
export function ThemeSwitch() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("liminal-theme") || "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        mode === "system" ? (media.matches ? "dark" : "light") : mode;
    };
    apply();
    media.addEventListener("change", apply);
    try {
      localStorage.setItem("liminal-theme", mode);
    } catch {}
    return () => media.removeEventListener("change", apply);
  }, [mode]);
  const options = [
    ["light", Sun, t("Clair", "Light", "فاتح")],
    ["dark", Moon, t("Sombre", "Dark", "داكن")],
    ["system", Monitor, t("Automatique", "Automatic", "تلقائي")],
  ];
  const ActiveIcon = options.find((o) => o[0] === mode)?.[1] || Sun;
  return (
    <div
      className="theme-switch theme-dropdown"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="theme-trigger"
        aria-label={t("Choisir le thème", "Choose theme", "اختر المظهر")}
        aria-expanded={open}
        aria-controls="theme-options"
        onClick={() => setOpen(!open)}
      >
        <ActiveIcon size={17} />
        <ChevronDown size={12} />
      </button>
      {open && (
        <div
          id="theme-options"
          className="theme-options"
          role="group"
          aria-label={t("Apparence", "Appearance", "المظهر")}
        >
          {options.map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                setOpen(false);
                trigger.current?.focus({ preventScroll: true });
              }}
            >
              <Icon size={17} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
const normalize = (s) =>
  s
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
export function Newsletter() {
  const { t } = useLocale();
  const [status, setStatus] = useState(""),
    [error, setError] = useState("");
  return (
    <form
      className="footer-newsletter"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("busy");
        setError("");
        try {
          await request("/api/subscribe", {
            method: "POST",
            data: {
              ...Object.fromEntries(new FormData(e.currentTarget)),
              consent: true,
            },
          });
          setStatus("sent");
        } catch (e) {
          setError(e.message);
          setStatus("");
        }
      }}
    >
      <label htmlFor="newsletter-email">
        {t(
          "Des nouvelles du studio.",
          "Notes from the studio.",
          "أخبار الاستوديو.",
        )}
      </label>
      {status === "sent" ? (
        <p role="status">
          {t(
            "Vérifiez votre email pour confirmer votre abonnement.",
            "Check your email to confirm your subscription.",
            "تحقق من بريدك الإلكتروني لتأكيد الاشتراك.",
          )}
        </p>
      ) : (
        <>
          <div>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              maxLength={254}
              placeholder={t("Votre email", "Your email", "بريدك الإلكتروني")}
            />
            <button
              disabled={status === "busy"}
              aria-label={t("M’abonner", "Subscribe", "اشتراك")}
            >
              <ArrowUpRight size={20} />
            </button>
          </div>
          <label className="consent-check">
            <input type="checkbox" required />
            {t(
              "Je souhaite recevoir les nouvelles de LIMINAL.",
              "I’d like to receive LIMINAL news.",
              "أرغب في تلقي أخبار ليمينال.",
            )}
          </label>
          <div className="honeypot" aria-hidden="true">
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-label="Website"
            />
          </div>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
export function StudioAssistant() {
  const { t, locale } = useLocale(),
    { answers } = useContext(Community);
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [answer, setAnswer] = useState(null);
  const trigger = useRef(null),
    search = useRef(null);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    setAnswer(null);
    setQuery("");
  }, [location.pathname, locale]);
  useEffect(() => {
    if (open) search.current?.focus({ preventScroll: true });
  }, [open]);
  const items = answers.filter((a) => a.locale === locale);
  const results = items.filter(
    (a) =>
      !query.trim() ||
      normalize(a.question + " " + a.keywords).includes(
        normalize(query.trim()),
      ) ||
      normalize(query.trim())
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .some((w) => normalize(a.keywords).includes(w)),
  );
  const close = () => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  return (
    <aside className="studio-assistant">
      {open && (
        <section
          className="assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-label={t(
            "Le guide LIMINAL",
            "The LIMINAL guide",
            "دليل ليمينال",
          )}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <header>
            <div>
              <span className="eyebrow">LIMINAL / GUIDE</span>
              <h3>
                {t("On vous oriente ?", "Where to begin?", "من أين نبدأ؟")}
              </h3>
            </div>
            <button onClick={close} aria-label={t("Fermer", "Close", "إغلاق")}>
              <X size={20} />
            </button>
          </header>
          <p className="assistant-note">
            {t(
              "Des réponses écrites par le studio. Pour le reste, parlons-en.",
              "Answers written by the studio. For anything else, let’s talk.",
              "إجابات كتبها الاستوديو. لأي سؤال آخر، تواصل معنا.",
            )}
          </p>
          <label className="sr-only" htmlFor="studio-question">
            {t("Votre question", "Your question", "سؤالك")}
          </label>
          <input
            ref={search}
            id="studio-question"
            maxLength={200}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAnswer(null);
            }}
            placeholder={t(
              "Un budget, un projet, une idée…",
              "A budget, a project, an idea…",
              "ميزانية، مشروع، فكرة…",
            )}
          />
          <div className="assistant-results">
            {results.slice(0, 8).map((a) => (
              <button
                key={a.id}
                onClick={() => setAnswer(a)}
                aria-expanded={answer?.id === a.id}
              >
                {a.question}
                <ArrowUpRight size={15} />
              </button>
            ))}
            {answer && (
              <div className="assistant-answer" aria-live="polite">
                <p>{answer.answer}</p>
                {answer.link && (
                  <Link to={answer.link}>
                    {t("En savoir plus", "Find out more", "معرفة المزيد")} ↗
                  </Link>
                )}
              </div>
            )}
            {!results.length && (
              <p role="status">
                {t(
                  "Je n’ai pas de réponse validée pour cette question. Le studio peut vous répondre directement.",
                  "I don’t have an approved answer to that question. Ask the studio directly.",
                  "لا توجد إجابة معتمدة لهذا السؤال. يمكنك التواصل مباشرة مع الاستوديو.",
                )}
              </p>
            )}
          </div>
          <Link className="assistant-contact" to="/contact">
            {t(
              "Parler de votre projet",
              "Talk about your project",
              "لنناقش مشروعك",
            )}{" "}
            <ArrowUpRight size={16} />
          </Link>
        </section>
      )}
      <button
        ref={trigger}
        className="assistant-trigger"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={t(
          "Ouvrir le guide LIMINAL",
          "Open the LIMINAL guide",
          "فتح دليل ليمينال",
        )}
      >
        <MessageCircle size={20} />
        <span>{t("Une question ?", "A question?", "لديك سؤال؟")}</span>
      </button>
    </aside>
  );
}
export function FeedbackPage() {
  const { t } = useLocale();
  const [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const id = useRef(crypto.randomUUID());
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/api/feedback", {
        method: "POST",
        data: {
          ...Object.fromEntries(new FormData(e.currentTarget)),
          requestId: id.current,
        },
      });
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page-width feedback-page section-space">
      <div className="eyebrow">LIMINAL / OPEN STUDIO</div>
      <h1>
        {t(
          "Votre regard compte.",
          "Your perspective matters.",
          "رأيك يصنع فرقاً.",
        )}
      </h1>
      <p className="feedback-intro">
        {t(
          "Un détail qui bloque. Une idée qui change tout. Aidez-nous à rendre ce lieu plus juste.",
          "A detail that gets in the way. An idea that changes things. Help us make this place work better.",
          "تفصيل يعيق التجربة أو فكرة تحسّنها. ساعدنا في تطوير هذا المكان.",
        )}
      </p>
      {sent ? (
        <div className="inquiry-success" role="status">
          <Check />
          <h2>
            {t(
              "Merci pour ce regard.",
              "Thank you for looking closer.",
              "شكراً لملاحظتك.",
            )}
          </h2>
          <p>
            {t(
              "Votre retour est arrivé au studio.",
              "Your feedback has reached the studio.",
              "وصل رأيك إلى الاستوديو.",
            )}
          </p>
          <Link to="/projects" className="text-link">
            {t("Explorer nos projets", "Explore our work", "اكتشف أعمالنا")} ↗
          </Link>
        </div>
      ) : (
        <form className="inquiry-form" onSubmit={submit}>
          <div className="form-row">
            <label>
              {t("Nom (facultatif)", "Name (optional)", "الاسم (اختياري)")}
              <input name="name" maxLength={100} />
            </label>
            <label>
              {t(
                "Email (pour vous répondre)",
                "Email (for a reply)",
                "البريد الإلكتروني (للرد)",
              )}
              <input name="email" type="email" maxLength={254} />
            </label>
          </div>
          <label>
            {t("Votre regard porte sur…", "You noticed…", "ملاحظتك حول…")}
            <select name="kind">
              <option value="bug">{t("Un problème", "A bug", "مشكلة")}</option>
              <option value="experience">
                {t(
                  "L’expérience du site",
                  "The site experience",
                  "تجربة الموقع",
                )}
              </option>
              <option value="idea">{t("Une idée", "An idea", "فكرة")}</option>
            </select>
          </label>
          <label>
            {t(
              "Page concernée (facultatif)",
              "Page (optional)",
              "الصفحة (اختياري)",
            )}
            <input name="page" maxLength={500} placeholder="/projects" />
          </label>
          <label>
            {t("Ce que vous avez remarqué", "What you noticed", "ماذا لاحظت")} *
            <textarea
              name="message"
              minLength={10}
              maxLength={3000}
              required
              rows={6}
            />
          </label>
          <div className="honeypot" aria-hidden="true">
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-label="Website"
            />
          </div>
          <p className="form-note">
            {t(
              "Ce retour reste privé. Aucun abonnement automatique.",
              "Your feedback stays private. No automatic subscription.",
              "تبقى ملاحظتك خاصة ولا تؤدي إلى اشتراك تلقائي.",
            )}
          </p>
          {error && <p role="alert">{error}</p>}
          <button className="button" disabled={busy}>
            {busy
              ? t("Envoi…", "Sending…", "جارٍ الإرسال…")
              : t("Partager mon regard", "Share my perspective", "مشاركة رأيي")}
            <Send size={16} />
          </button>
        </form>
      )}
    </section>
  );
}
