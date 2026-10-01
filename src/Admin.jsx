import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Images,
  Hand,
  Inbox,
  Users,
  Send,
  ShieldCheck,
  LogOut,
  Plus,
  ArrowUpRight,
  Check,
  X,
  Upload,
  Search,
  Trash2,
  RotateCcw,
  Clock3,
  Quote,
} from "lucide-react";
import { request } from "./api";
import "./admin.css";

const emptyProject = {
  slug: "",
  title: "",
  category: "",
  description: "",
  type: "",
  tags: "",
  context: "",
  intention: "",
  execution: "",
  credit: "",
  number: "",
  deliverables: [],
  visual: "image",
  media: "",
  poster: "",
  published: false,
  translations: { en: {}, ar: {} },
};
const emptyTestimonial = {
  quote: "",
  name: "",
  role: "",
  company: "",
  signature: "",
  avatar: "",
  logo: "",
  published: false,
};
const tabs = [
  ["overview", "Vue d’ensemble", LayoutDashboard],
  ["projects", "Projets", Images],
  ["testimonials", "Témoignages", Quote],
  ["marks", "Empreintes", Hand],
  ["inquiries", "Demandes", Inbox],
  ["audience", "Audience", Users],
  ["campaigns", "Campagnes", Send],
  ["trash", "Corbeille", Trash2],
  ["security", "Sécurité", ShieldCheck],
];
const labels = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
  new: "Nouveau",
  reviewing: "En cours",
  replied: "Répondu",
  closed: "Clôturé",
  subscribed: "Abonné confirmé",
  unsubscribed: "Désabonné",
  project: "Brief projet",
  career: "Recrutement",
  freelance: "Collaboration",
  sponsorship: "Sponsoring",
};
const date = (v) =>
  new Intl.DateTimeFormat("fr", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));
const daysLeft = (v) =>
  Math.max(
    0,
    Math.ceil((new Date(v).getTime() + 30 * 86400000 - Date.now()) / 86400000),
  );
const Badge = ({ value }) => (
  <span className={"admin-badge badge-" + value}>{labels[value] || value}</span>
);

function Auth({ onLogin, initial }) {
  const [mode, setMode] = useState(initial.setup ? "setup" : "login"),
    [challenge, setChallenge] = useState(""),
    [resetToken, setResetToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (resetToken) {
        if (data.password !== data.confirmPassword)
          throw new Error("Les deux mots de passe ne correspondent pas.");
        onLogin(
          await request("/api/auth/reset", {
            method: "POST",
            data: { resetToken, password: data.password },
          }),
        );
      } else if (challenge) {
        const result = await request("/api/auth/verify", {
          method: "POST",
          data: { challenge, code: data.code },
        });
        if (result.resetRequired) {
          setResetToken(result.resetToken);
          setChallenge("");
        } else onLogin(result);
      } else {
        const result = await request("/api/auth/" + mode, {
          method: "POST",
          data,
        });
        setChallenge(result.challenge);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const passwordHelp = (
    <small className="password-note">
      14 caractères minimum, avec une majuscule, une minuscule, un chiffre et un
      symbole.
    </small>
  );
  return (
    <div className="admin-auth" dir="ltr">
      <Link to="/" className="admin-auth-brand">
        <img src="/brand/full-logo.svg" alt="LIMINAL" />
      </Link>
      <div className="auth-orbit">
        <img src="/brand/hand-outline.svg" alt="" />
      </div>
      <div className="admin-auth-card">
        <span className="eyebrow">
          <ShieldCheck size={16} /> ESPACE PRIVÉ
        </span>
        <h1>
          {challenge
            ? "Vérifiez votre email."
            : resetToken
              ? "Créez votre nouveau mot de passe."
              : mode === "setup"
                ? "Activez l’espace propriétaire."
                : mode === "recover"
                  ? "Retrouvez votre accès."
                  : "Content de vous revoir."}
        </h1>
        <p>
          {challenge
            ? "Saisissez le code à six chiffres reçu par email. Il expire après 10 minutes."
            : resetToken
              ? "Votre email est confirmé. Choisissez maintenant votre nouveau mot de passe."
              : mode === "setup"
                ? "Cette activation unique crée le compte administrateur de LIMINAL."
                : mode === "recover"
                  ? "Entrez l’adresse administrateur. Nous enverrons un code uniquement si elle correspond au compte propriétaire."
                  : "Entrez votre email et votre mot de passe. Un code de vérification vous sera ensuite envoyé."}
        </p>
        <form
          onSubmit={submit}
          key={mode + Boolean(challenge) + Boolean(resetToken)}
        >
          {challenge ? (
            <label>
              Code de vérification
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
              />
            </label>
          ) : resetToken ? (
            <>
              <label>
                Nouveau mot de passe
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={14}
                  maxLength={128}
                />
                {passwordHelp}
              </label>
              <label>
                Confirmer le mot de passe
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={14}
                  maxLength={128}
                />
              </label>
            </>
          ) : (
            <>
              <label>
                Email administrateur
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  defaultValue="itsazizsaidi@gmail.com"
                />
              </label>
              {mode !== "recover" && (
                <label>
                  {mode === "login" ? "Mot de passe" : "Mot de passe admin"}
                  <input
                    name="password"
                    type="password"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={mode === "login" ? 1 : 14}
                    maxLength={128}
                  />
                  {mode === "setup" && passwordHelp}
                </label>
              )}
              {mode === "setup" && (
                <label>
                  Clé de configuration privée
                  <input
                    name="setupToken"
                    type="password"
                    required
                    autoComplete="off"
                  />
                  <small>
                    Copiez la clé depuis <code>data/ADMIN-SETUP.txt</code>, dans
                    votre dossier Liminal. Elle ne permet plus de créer un
                    compte après activation.
                  </small>
                </label>
              )}
            </>
          )}
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy} className="button">
            {busy
              ? "Vérification…"
              : challenge
                ? mode === "recover"
                  ? "Vérifier le code"
                  : "Entrer dans le studio"
                : resetToken
                  ? "Enregistrer et entrer"
                  : mode === "login"
                    ? "Recevoir mon code"
                    : mode === "recover"
                      ? "Envoyer le code"
                      : "Activer le compte"}
            <ArrowUpRight size={17} />
          </button>
        </form>
        {!initial.setup && (
          <button
            className="text-link"
            onClick={() => {
              setMode(mode === "recover" ? "login" : "recover");
              setChallenge("");
              setResetToken("");
              setError("");
            }}
          >
            {mode === "recover"
              ? "Retour à la connexion"
              : "Mot de passe oublié ?"}
          </button>
        )}
        {(challenge || resetToken) && (
          <button
            className="text-link"
            onClick={() => {
              setChallenge("");
              setResetToken("");
              setError("");
            }}
          >
            Recommencer
          </button>
        )}
      </div>
      <span className="admin-auth-foot">LIMINAL / HUMAN FIRST. ALWAYS.</span>
    </div>
  );
}

function ProjectEditor({ project, csrf, onClose, onSaved }) {
  const [value, setValue] = useState(() => structuredClone(project)),
    [lang, setLang] = useState("fr"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false);
  const current = lang === "fr" ? value : value.translations?.[lang] || {};
  function field(key, next) {
    setValue((v) =>
      lang === "fr"
        ? { ...v, [key]: next }
        : {
            ...v,
            translations: {
              ...v.translations,
              [lang]: { ...v.translations?.[lang], [key]: next },
            },
          },
    );
  }
  async function upload(e, target = "media") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await request("/api/admin/upload", {
        method: "POST",
        csrf,
        body: file,
        headers: { "Content-Type": "application/octet-stream" },
      });
      setValue((v) => ({
        ...v,
        [target]: result.url,
        ...(target === "media" ? { visual: result.visual } : {}),
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/projects" + (value.id ? "/" + value.id : ""), {
        method: value.id ? "PUT" : "POST",
        csrf,
        data: value,
      });
      await onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-editor">
      <div className="admin-section-top">
        <div>
          <span className="eyebrow">PROJECT EDITOR</span>
          <h2>{value.id ? "Affiner le projet." : "Une nouvelle histoire."}</h2>
        </div>
        <button
          className="admin-icon"
          onClick={onClose}
          aria-label="Fermer l’éditeur"
        >
          <X />
        </button>
      </div>
      <form onSubmit={save}>
        <div className="editor-columns">
          <div>
            <div className="editor-media">
              {value.media ? (
                value.visual === "video" ? (
                  <video
                    src={value.media}
                    poster={value.poster || undefined}
                    controls
                  />
                ) : (
                  <img src={value.media} alt="Aperçu du projet" />
                )
              ) : (
                <div className="editor-media-empty">
                  <Images size={36} />
                  <p>
                    {value.visual === "editorial"
                      ? "Visuel éditorial original conservé"
                      : value.visual === "resonance"
                        ? "Composition Résonance conservée"
                        : "Votre prochain visuel"}
                  </p>
                </div>
              )}
            </div>
            <label className="admin-upload">
              <Upload size={17} />
              {uploading
                ? "Import en cours…"
                : "Importer une image ou une vidéo"}
              <input
                aria-label="Importer un média"
                type="file"
                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                disabled={uploading}
                onChange={upload}
              />
            </label>
            <small>Images ≤ 15 Mo · Vidéos MP4 / WebM ≤ 100 Mo</small>
            <label>
              Type de visuel
              <select
                value={value.visual}
                onChange={(e) =>
                  setValue((v) => ({ ...v, visual: e.target.value }))
                }
              >
                <option value="image">Image</option>
                <option value="video">Vidéo</option>
                <option value="editorial">Visuel original — Le geste</option>
                <option value="resonance">Visuel original — Résonance</option>
              </select>
            </label>
            <label>
              URL du média (ou import ci-dessus)
              <input
                type="text"
                value={value.media || ""}
                onChange={(e) =>
                  setValue((v) => ({ ...v, media: e.target.value }))
                }
                placeholder="https://…"
              />
            </label>
            {value.visual === "video" && (
              <>
                <label>
                  Affiche de la vidéo
                  <input
                    value={value.poster || ""}
                    onChange={(e) =>
                      setValue((v) => ({ ...v, poster: e.target.value }))
                    }
                  />
                </label>
                <label className="admin-upload">
                  Importer l’affiche
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => upload(e, "poster")}
                  />
                </label>
              </>
            )}
            <label>
              Adresse du projet /projects/
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={80}
                value={value.slug}
                onChange={(e) =>
                  setValue((v) => ({ ...v, slug: e.target.value }))
                }
              />
            </label>
            <label>
              Numéro dans la galerie
              <input
                value={value.number}
                onChange={(e) =>
                  setValue((v) => ({ ...v, number: e.target.value }))
                }
              />
            </label>
            <label className="consent-check">
              <input
                type="checkbox"
                checked={value.published}
                onChange={(e) =>
                  setValue((v) => ({ ...v, published: e.target.checked }))
                }
              />
              Publié sur le site
            </label>
            <p className="small muted">
              Décochez pour conserver un brouillon privé. Les projets de test
              restent modifiables.
            </p>
          </div>
          <div>
            <div
              className="editor-languages"
              role="group"
              aria-label="Langue du contenu"
            >
              {["fr", "en", "ar"].map((l) => (
                <button
                  type="button"
                  key={l}
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            {lang !== "fr" && (
              <p className="small muted">
                Traduction optionnelle. Les champs vides utilisent le français.
              </p>
            )}
            <div dir={lang === "ar" ? "rtl" : "ltr"}>
              {[
                ["title", "Titre"],
                ["category", "Catégorie"],
                ["type", "Type / sous-titre"],
                ["tags", "Mots-clés"],
                ["description", "Description courte"],
                ["context", "Le point de départ"],
                ["intention", "L’intention"],
                ["execution", "La réalisation"],
                ["credit", "Crédits"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  {[
                    "description",
                    "context",
                    "intention",
                    "execution",
                  ].includes(key) ? (
                    <textarea
                      rows={key === "description" ? 3 : 4}
                      required={lang === "fr" && key === "description"}
                      maxLength={key === "description" ? 600 : 4000}
                      value={current[key] || ""}
                      onChange={(e) => field(key, e.target.value)}
                    />
                  ) : (
                    <input
                      required={
                        lang === "fr" && ["title", "category"].includes(key)
                      }
                      maxLength={600}
                      value={current[key] || ""}
                      onChange={(e) => field(key, e.target.value)}
                    />
                  )}
                </label>
              ))}
              <label>
                Livrables (un par ligne)
                <textarea
                  rows={3}
                  value={(current.deliverables || []).join("\n")}
                  onChange={(e) =>
                    field("deliverables", e.target.value.split("\n"))
                  }
                />
              </label>
            </div>
          </div>
        </div>
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        <div className="editor-save">
          <button type="button" className="text-link" onClick={onClose}>
            Annuler
          </button>
          <button className="button" disabled={busy || uploading}>
            {busy ? "Enregistrement…" : "Enregistrer le projet"}
            <Check size={17} />
          </button>
        </div>
      </form>
    </section>
  );
}

function TestimonialEditor({ testimonial, csrf, onClose, onSaved }) {
  const [value, setValue] = useState(() => ({
      ...emptyTestimonial,
      ...testimonial,
    })),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(""),
    [error, setError] = useState("");
  const field = (key, next) => setValue((item) => ({ ...item, [key]: next }));
  async function upload(e, target) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(target);
    setError("");
    try {
      const result = await request("/api/admin/upload", {
        method: "POST",
        csrf,
        body: file,
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (result.visual !== "image")
        throw new Error("Utilisez une image pour ce champ.");
      field(target, result.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading("");
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(
        "/api/admin/testimonials" + (value.id ? "/" + value.id : ""),
        {
          method: value.id ? "PUT" : "POST",
          csrf,
          data: value,
        },
      );
      await onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-editor testimonial-editor">
      <div className="admin-section-top">
        <div>
          <span className="eyebrow">TESTIMONIAL EDITOR</span>
          <h2>{value.id ? "Affiner ce témoignage." : "Ajouter une voix."}</h2>
        </div>
        <button className="admin-icon" onClick={onClose} aria-label="Fermer">
          <X />
        </button>
      </div>
      <form onSubmit={save}>
        <div className="testimonial-editor-grid">
          <div>
            <label>
              Témoignage
              <textarea
                rows={7}
                required
                minLength={10}
                maxLength={1200}
                value={value.quote}
                onChange={(e) => field("quote", e.target.value)}
              />
            </label>
            <label>
              Nom complet
              <input
                required
                maxLength={120}
                value={value.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label>
              Poste
              <input
                maxLength={140}
                value={value.role}
                onChange={(e) => field("role", e.target.value)}
              />
            </label>
            <label>
              Entreprise
              <input
                maxLength={140}
                value={value.company}
                onChange={(e) => field("company", e.target.value)}
              />
            </label>
            <label>
              Signature digitale
              <input
                maxLength={120}
                placeholder="Ex. Aziz"
                value={value.signature}
                onChange={(e) => field("signature", e.target.value)}
              />
            </label>
          </div>
          <div>
            {["avatar", "logo"].map((target) => (
              <div className="testimonial-media-field" key={target}>
                <span>{target === "avatar" ? "Photo" : "Logo entreprise"}</span>
                {value[target] ? (
                  <img src={value[target]} alt="" />
                ) : (
                  <div className="testimonial-media-empty">
                    {target === "avatar" ? <Users /> : <Images />}
                  </div>
                )}
                <label className="admin-upload">
                  <Upload size={16} />
                  {uploading === target ? "Import…" : "Importer une image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={Boolean(uploading)}
                    onChange={(e) => upload(e, target)}
                  />
                </label>
                <input
                  aria-label={`URL ${target}`}
                  placeholder="ou URL HTTPS"
                  value={value[target]}
                  onChange={(e) => field(target, e.target.value)}
                />
              </div>
            ))}
            <label className="consent-check">
              <input
                type="checkbox"
                checked={value.published}
                onChange={(e) => field("published", e.target.checked)}
              />
              Publié sur la page d’accueil
            </label>
          </div>
        </div>
        {error && <p className="admin-error">{error}</p>}
        <div className="editor-save">
          <button type="button" className="text-link" onClick={onClose}>
            Annuler
          </button>
          <button className="button" disabled={busy || Boolean(uploading)}>
            {busy ? "Enregistrement…" : "Enregistrer le témoignage"}
            <Check size={17} />
          </button>
        </div>
      </form>
    </section>
  );
}

export default function Admin() {
  const [auth, setAuth] = useState(null),
    [data, setData] = useState(null),
    [tab, setTab] = useState("overview"),
    [editor, setEditor] = useState(null),
    [testimonialEditor, setTestimonialEditor] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [campaign, setCampaign] = useState(null),
    [emptyReady, setEmptyReady] = useState(false);
  useEffect(() => {
    request("/api/auth/status")
      .then(setAuth)
      .catch((e) => setError(e.message));
  }, []);
  async function refresh() {
    try {
      setData(await request("/api/admin/dashboard"));
    } catch (e) {
      if (e.status === 401) {
        setAuth((a) => ({ ...a, authenticated: false }));
        setData(null);
      }
      setError(e.message);
    }
  }
  useEffect(() => {
    if (auth?.authenticated) refresh();
  }, [auth?.authenticated]);
  useEffect(() => {
    document.title = "LIMINAL — Studio admin";
  }, []);
  async function action(path, method, payload) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request(path, {
        method,
        csrf: auth.csrf,
        data: payload,
      });
      await refresh();
      setNotice("Modification enregistrée.");
      return result;
    } catch (e) {
      setError(e.message);
      if (e.status === 401) setAuth((a) => ({ ...a, authenticated: false }));
      return null;
    } finally {
      setBusy(false);
    }
  }
  function choose(next) {
    setTab(next);
    setEditor(null);
    setTestimonialEditor(null);
    setEmptyReady(false);
    setQuery("");
    setFilter("all");
    setError("");
    setNotice("");
  }
  if (!auth)
    return (
      <div className="admin-loading" dir="ltr">
        <img src="/brand/full-logo.svg" alt="LIMINAL" />
        <p>{error || "Ouverture du studio…"}</p>
        {error && (
          <button className="button" onClick={() => location.reload()}>
            Réessayer
          </button>
        )}
      </div>
    );
  if (!auth.authenticated)
    return (
      <Auth
        initial={auth}
        onLogin={(value) =>
          setAuth((previous) => ({ ...previous, ...value, setup: false }))
        }
      />
    );
  const visible = (items) =>
    items.filter(
      (i) =>
        (filter === "all" || i.status === filter || i.kind === filter) &&
        JSON.stringify(i).toLowerCase().includes(query.toLowerCase()),
    );
  const pending = data?.marks.filter((m) => m.status === "pending").length || 0,
    newRequests = data?.inquiries.filter((i) => i.status === "new").length || 0,
    subscribers =
      data?.subscribers.filter((s) => s.status === "subscribed").length || 0,
    trashCount =
      (data?.trash?.projects?.length || 0) + (data?.trash?.marks?.length || 0);
  return (
    <div className="admin-shell" dir="ltr">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <img src="/brand/full-logo.svg" alt="LIMINAL" />
        </Link>
        <span className="admin-sidebar-label">STUDIO CONTROL</span>
        <nav aria-label="Administration">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => choose(id)}
            >
              <Icon size={19} />
              {label}
              {id === "marks" && pending > 0 && <b>{pending}</b>}
              {id === "inquiries" && newRequests > 0 && <b>{newRequests}</b>}
              {id === "trash" && trashCount > 0 && <b>{trashCount}</b>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-avatar">AS</span>
          <div>
            <strong>Aziz / LIMINAL</strong>
            <small>Propriétaire</small>
          </div>
          <button
            aria-label="Se déconnecter"
            onClick={async () => {
              const r = await action("/api/auth/logout", "POST", {});
              if (r) {
                setAuth((a) => ({ ...a, authenticated: false }));
                setData(null);
              }
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="admin-mobile-logout"
            aria-label="Se déconnecter"
            onClick={async () => {
              try {
                await request("/api/auth/logout", {
                  method: "POST",
                  csrf: auth.csrf,
                  data: {},
                });
                setAuth((a) => ({ ...a, authenticated: false }));
                setData(null);
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            <LogOut size={18} />
          </button>
          <span>
            <span className="status-dot" /> L’espace de création
          </span>
          <Link to="/" target="_blank">
            Voir le site <ArrowUpRight size={16} />
          </Link>
        </header>
        <main className="admin-main">
          <div className="admin-title">
            <div>
              <span className="eyebrow">
                LIMINAL /{" "}
                {String(tabs.findIndex((x) => x[0] === tab) + 1).padStart(
                  2,
                  "0",
                )}
              </span>
              <h1>
                {tabs.find((x) => x[0] === tab)[1]}
                <span>.</span>
              </h1>
            </div>
            <button className="text-link" onClick={refresh}>
              Actualiser
            </button>
          </div>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="admin-notice">
              {notice}
            </p>
          )}
          {!data ? (
            <p>Chargement…</p>
          ) : editor ? (
            <ProjectEditor
              key={editor.id || "new"}
              project={editor}
              csrf={auth.csrf}
              onSaved={refresh}
              onClose={() => setEditor(null)}
            />
          ) : testimonialEditor ? (
            <TestimonialEditor
              key={testimonialEditor.id || "new-testimonial"}
              testimonial={testimonialEditor}
              csrf={auth.csrf}
              onSaved={refresh}
              onClose={() => setTestimonialEditor(null)}
            />
          ) : (
            <>
              {tab === "overview" && (
                <>
                  <div className="admin-welcome">
                    <div>
                      <span className="eyebrow">BONJOUR AZIZ</span>
                      <h2>
                        Les idées avancent.
                        <br />
                        <em>Gardez le regard.</em>
                      </h2>
                      <p>
                        {pending} empreinte(s) à modérer. {newRequests}{" "}
                        nouvelle(s) demande(s).
                      </p>
                    </div>
                    <img src="/brand/hand-outline.svg" alt="" />
                  </div>
                  <div className="admin-stats">
                    {[
                      ["Projets", data.projects.length, "projects"],
                      ["À approuver", pending, "marks"],
                      ["Nouvelles demandes", newRequests, "inquiries"],
                      ["Abonnés confirmés", subscribers, "audience"],
                    ].map(([label, count, id]) => (
                      <button key={id} onClick={() => choose(id)}>
                        <span>
                          {label}
                          <ArrowUpRight size={18} />
                        </span>
                        <strong>{String(count).padStart(2, "0")}</strong>
                      </button>
                    ))}
                  </div>
                  <div className="admin-section-top">
                    <h2>Les derniers échanges</h2>
                    <button
                      className="text-link"
                      onClick={() => choose("inquiries")}
                    >
                      Tout voir <ArrowUpRight size={16} />
                    </button>
                  </div>
                  {data.inquiries.length ? (
                    data.inquiries.slice(0, 4).map((i) => (
                      <div className="admin-brief-row" key={i.id}>
                        <span className="admin-avatar">
                          {i.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong>{i.name}</strong>
                          <p>{i.message.slice(0, 100)}</p>
                        </div>
                        <Badge value={i.kind} />
                        <Badge value={i.status} />
                      </div>
                    ))
                  ) : (
                    <div className="admin-empty">
                      <Inbox />
                      <h3>La prochaine conversation commence ici.</h3>
                      <p>
                        Les formulaires du site arrivent automatiquement dans
                        cet espace.
                      </p>
                    </div>
                  )}
                </>
              )}
              {tab === "projects" && (
                <>
                  <div className="admin-section-top">
                    <p>
                      {data.projects.length} projets · brouillons et
                      publications
                    </p>
                    <button
                      className="button"
                      onClick={() =>
                        setEditor({
                          ...emptyProject,
                          number: String(data.projects.length + 1).padStart(
                            2,
                            "0",
                          ),
                        })
                      }
                    >
                      <Plus size={17} />
                      Nouveau projet
                    </button>
                  </div>
                  <div className="admin-project-grid">
                    {data.projects.map((p) => (
                      <article key={p.id}>
                        <div
                          className={"admin-project-thumb thumb-" + p.visual}
                        >
                          {p.media ? (
                            p.visual === "video" ? (
                              <video
                                src={p.media}
                                poster={p.poster || undefined}
                                muted
                                preload="metadata"
                              />
                            ) : (
                              <img src={p.media} alt="" />
                            )
                          ) : p.visual === "editorial" ? (
                            <img
                              src="/images/liminal-editorial-small.webp"
                              alt=""
                            />
                          ) : (
                            <span>
                              make
                              <br />
                              <em>it felt.</em>
                            </span>
                          )}
                          <Badge value={p.published ? "Publié" : "Brouillon"} />
                        </div>
                        <div>
                          <small>
                            {p.category} / {p.visual}
                          </small>
                          <h2>{p.title}</h2>
                          <p>{p.description}</p>
                          <div className="admin-project-actions">
                            <button
                              className="text-link"
                              onClick={() => setEditor(p)}
                            >
                              Modifier <ArrowUpRight size={17} />
                            </button>
                            {p.published && (
                              <a
                                className="text-link"
                                href={"/projects/" + p.slug}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Aperçu
                              </a>
                            )}
                            <button
                              className="text-link admin-danger"
                              disabled={busy}
                              onClick={() =>
                                action("/api/admin/projects/" + p.id, "DELETE")
                              }
                            >
                              <Trash2 size={15} /> Corbeille
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
              {tab === "testimonials" && (
                <>
                  <div className="admin-section-top">
                    <p>
                      {data.testimonials.length} témoignage(s) · publiés et
                      brouillons
                    </p>
                    <button
                      className="button"
                      onClick={() => setTestimonialEditor(emptyTestimonial)}
                    >
                      <Plus size={17} /> Nouveau témoignage
                    </button>
                  </div>
                  <p className="admin-help">
                    Les contenus marqués « aperçu » sont des exemples de mise en
                    page. Remplacez-les par de vrais retours avant publication.
                  </p>
                  <div className="admin-testimonials-grid">
                    {data.testimonials.map((item) => (
                      <article key={item.id}>
                        <Quote size={28} />
                        <blockquote>{item.quote}</blockquote>
                        <div className="testimonial-admin-person">
                          {item.avatar ? (
                            <img src={item.avatar} alt="" />
                          ) : (
                            <span className="admin-avatar">
                              {item.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div>
                            <strong>{item.name}</strong>
                            <small>
                              {[item.role, item.company]
                                .filter(Boolean)
                                .join(" · ")}
                            </small>
                          </div>
                          <Badge
                            value={item.published ? "Publié" : "Brouillon"}
                          />
                        </div>
                        {item.signature && (
                          <div className="admin-signature">
                            {item.signature}
                          </div>
                        )}
                        <div className="admin-row-actions">
                          <button onClick={() => setTestimonialEditor(item)}>
                            Modifier
                          </button>
                          <button
                            className="admin-danger"
                            disabled={busy}
                            onClick={() =>
                              action(
                                "/api/admin/testimonials/" + item.id,
                                "DELETE",
                              )
                            }
                          >
                            <Trash2 size={15} /> Supprimer
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
              {["marks", "inquiries", "audience"].includes(tab) && (
                <div className="admin-toolbar">
                  <label className="admin-search">
                    <Search size={17} />
                    <input
                      aria-label="Rechercher"
                      placeholder="Rechercher un nom, un email…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filtrer"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Tout afficher</option>
                    {(tab === "marks"
                      ? ["pending", "approved", "rejected"]
                      : tab === "inquiries"
                        ? [
                            "project",
                            "career",
                            "freelance",
                            "sponsorship",
                            "new",
                            "reviewing",
                            "replied",
                            "closed",
                          ]
                        : ["pending", "subscribed", "unsubscribed"]
                    ).map((s) => (
                      <option value={s} key={s}>
                        {labels[s]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {tab === "marks" && (
                <>
                  <p className="admin-help">
                    Seules les empreintes approuvées sont publiques. Les emails
                    restent privés. Une décision peut être modifiée.
                  </p>
                  <div className="admin-marks-grid">
                    {visible(data.marks).map((m) => (
                      <article key={m.id}>
                        <div className={"admin-stamp ink-" + m.ink}>
                          <span>{m.name}</span>
                          <i
                            className="hand-stamp"
                            style={{ transform: `rotate(${m.rotation}deg)` }}
                          />
                        </div>
                        <div className="admin-mark-info">
                          <Badge value={m.status} />
                          <p>
                            {m.email ||
                              "Ancienne empreinte · aucun email collecté"}
                          </p>
                          <small>{date(m.created_at)}</small>
                          <div className="admin-row-actions">
                            <button
                              disabled={busy || m.status === "approved"}
                              onClick={() =>
                                action("/api/admin/marks/" + m.id, "PATCH", {
                                  status: "approved",
                                })
                              }
                            >
                              <Check size={16} />
                              Approuver
                            </button>
                            <button
                              className="admin-danger"
                              disabled={busy}
                              onClick={() =>
                                action("/api/admin/marks/" + m.id, "DELETE")
                              }
                            >
                              <Trash2 size={16} />
                              Supprimer
                            </button>
                            <button
                              disabled={busy || m.status === "rejected"}
                              onClick={() =>
                                action("/api/admin/marks/" + m.id, "PATCH", {
                                  status: "rejected",
                                })
                              }
                            >
                              <X size={16} />
                              Refuser
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  {!visible(data.marks).length && (
                    <div className="admin-empty">
                      Aucune empreinte dans cette sélection.
                    </div>
                  )}
                </>
              )}
              {tab === "trash" && (
                <>
                  <div className="trash-intro">
                    <p className="admin-help trash-help">
                      <Clock3 size={17} /> Les éléments restent récupérables
                      pendant 30 jours, puis sont supprimés automatiquement avec
                      leurs médias devenus inutilisés.
                    </p>
                    {trashCount > 0 && (
                      <button
                        className={
                          emptyReady
                            ? "button trash-confirm"
                            : "text-link admin-danger"
                        }
                        disabled={busy}
                        onClick={async () => {
                          if (!emptyReady) return setEmptyReady(true);
                          await action("/api/admin/trash", "DELETE");
                          setEmptyReady(false);
                        }}
                      >
                        <Trash2 size={16} />
                        {emptyReady
                          ? "Confirmer la suppression définitive"
                          : "Vider la corbeille"}
                      </button>
                    )}
                  </div>
                  <div className="admin-section-top">
                    <h2>Projets</h2>
                    <p>{data.trash?.projects?.length || 0} élément(s)</p>
                  </div>
                  <div className="admin-trash-list">
                    {(data.trash?.projects || []).map((p) => (
                      <article key={p.id}>
                        <div>
                          <small>Supprimé le {date(p.deleted_at)}</small>
                          <h3>{p.title}</h3>
                          <p>
                            {p.category} · suppression définitive dans{" "}
                            {daysLeft(p.deleted_at)} jour(s)
                          </p>
                        </div>
                        <button
                          disabled={busy}
                          onClick={() =>
                            action(
                              "/api/admin/projects/" + p.id + "/restore",
                              "POST",
                              {},
                            )
                          }
                        >
                          <RotateCcw size={16} /> Restaurer
                        </button>
                      </article>
                    ))}
                    {!data.trash?.projects?.length && (
                      <div className="admin-empty">Aucun projet supprimé.</div>
                    )}
                  </div>
                  <div className="admin-section-top trash-section-top">
                    <h2>Empreintes</h2>
                    <p>{data.trash?.marks?.length || 0} élément(s)</p>
                  </div>
                  <div className="admin-trash-list">
                    {(data.trash?.marks || []).map((m) => (
                      <article key={m.id}>
                        <div>
                          <small>Supprimée le {date(m.deleted_at)}</small>
                          <h3>{m.name}</h3>
                          <p>
                            {m.email || "Email non disponible"} · suppression
                            définitive dans {daysLeft(m.deleted_at)} jour(s)
                          </p>
                        </div>
                        <button
                          disabled={busy}
                          onClick={() =>
                            action(
                              "/api/admin/marks/" + m.id + "/restore",
                              "POST",
                              {},
                            )
                          }
                        >
                          <RotateCcw size={16} /> Restaurer
                        </button>
                      </article>
                    ))}
                    {!data.trash?.marks?.length && (
                      <div className="admin-empty">
                        Aucune empreinte supprimée.
                      </div>
                    )}
                  </div>
                </>
              )}
              {tab === "inquiries" && (
                <div className="admin-inquiries">
                  {visible(data.inquiries).map((i) => (
                    <details key={i.id}>
                      <summary>
                        <span className="admin-avatar">
                          {i.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong>{i.name}</strong>
                          <small>{date(i.created_at)}</small>
                        </div>
                        <Badge value={i.kind} />
                        <Badge value={i.status} />
                        <Plus size={18} />
                      </summary>
                      <div className="inquiry-detail">
                        <a href={"mailto:" + i.email}>
                          {i.email}
                          <ArrowUpRight size={15} />
                        </a>
                        <p className="message-text">{i.message}</p>
                        <dl>
                          {["brand", "type", "timing", "craft"]
                            .filter((k) => i[k])
                            .map((k) => (
                              <div key={k}>
                                <dt>
                                  {
                                    {
                                      brand: "Marque",
                                      type: "Besoin",
                                      timing: "Calendrier",
                                      craft: "Spécialité / organisation",
                                    }[k]
                                  }
                                </dt>
                                <dd>{i[k]}</dd>
                              </div>
                            ))}
                        </dl>
                        {i.portfolio && (
                          <a
                            className="text-link"
                            href={i.portfolio}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Portfolio / site <ArrowUpRight size={16} />
                          </a>
                        )}
                        <div className="admin-row-actions">
                          <label>
                            Suivi
                            <select
                              aria-label={"Statut de " + i.name}
                              disabled={busy}
                              value={i.status}
                              onChange={(e) =>
                                action(
                                  "/api/admin/inquiries/" + i.id,
                                  "PATCH",
                                  { status: e.target.value },
                                )
                              }
                            >
                              {["new", "reviewing", "replied", "closed"].map(
                                (s) => (
                                  <option key={s} value={s}>
                                    {labels[s]}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                          <a
                            className="button"
                            href={`mailto:${i.email}?subject=${encodeURIComponent("LIMINAL — Votre demande")}`}
                          >
                            Répondre par email
                            <ArrowUpRight size={16} />
                          </a>
                        </div>
                      </div>
                    </details>
                  ))}
                  {!visible(data.inquiries).length && (
                    <div className="admin-empty">
                      <Inbox />
                      <h3>Aucune demande ici pour le moment.</h3>
                    </div>
                  )}
                </div>
              )}
              {tab === "audience" && (
                <>
                  <p className="admin-help">
                    Seuls les visiteurs qui choisissent l’abonnement et
                    confirment leur email reçoivent vos campagnes. Approuver une
                    empreinte ne crée pas un abonnement.
                  </p>
                  <div className="admin-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Contact</th>
                          <th>Statut</th>
                          <th>Consentement</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible(data.subscribers).map((s) => (
                          <tr key={s.email}>
                            <td>
                              <strong>{s.name}</strong>
                              <span>{s.email}</span>
                            </td>
                            <td>
                              <Badge value={s.status} />
                            </td>
                            <td>{date(s.consent_at)}</td>
                            <td>
                              <button
                                className="text-link"
                                disabled={busy || s.status === "unsubscribed"}
                                onClick={() =>
                                  action("/api/admin/subscribers", "PATCH", {
                                    email: s.email,
                                  })
                                }
                              >
                                Désabonner
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!visible(data.subscribers).length && (
                      <div className="admin-empty">
                        Aucun contact dans cette sélection.
                      </div>
                    )}
                  </div>
                </>
              )}
              {tab === "campaigns" && (
                <div className="campaign-layout">
                  <div>
                    <h2>Un mot de LIMINAL.</h2>
                    <p>
                      {subscribers} destinataire(s) confirmé(s). Un lien de
                      désabonnement est ajouté à chaque message.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setCampaign({
                          ...Object.fromEntries(new FormData(e.currentTarget)),
                          requestId: crypto.randomUUID(),
                        });
                      }}
                    >
                      <label>
                        Objet
                        <input
                          name="subject"
                          required
                          minLength={3}
                          maxLength={150}
                        />
                      </label>
                      <label>
                        Votre message
                        <textarea
                          name="message"
                          required
                          minLength={10}
                          maxLength={10000}
                          rows={10}
                        />
                      </label>
                      <button className="button" disabled={!subscribers}>
                        Relire avant envoi
                        <ArrowUpRight size={17} />
                      </button>
                    </form>
                    {campaign && (
                      <div className="campaign-preview">
                        <span className="eyebrow">
                          APERÇU · {subscribers} CONTACT(S)
                        </span>
                        <h3>{campaign.subject}</h3>
                        <p className="message-text">{campaign.message}</p>
                        <small>
                          + signature LIMINAL et lien de désabonnement personnel
                        </small>
                        <button
                          className="button"
                          disabled={busy}
                          onClick={async () => {
                            const result = await action(
                              "/api/admin/campaigns",
                              "POST",
                              { ...campaign, confirm: true },
                            );
                            if (result) {
                              setCampaign(null);
                              setNotice(
                                `${result.local ? "Simulation locale" : "Envoi"} : ${result.sent} réussi(s), ${result.failed} échec(s).`,
                              );
                            }
                          }}
                        >
                          {busy
                            ? "Traitement…"
                            : data.localMail
                              ? "Confirmer la simulation locale"
                              : "Confirmer l’envoi"}
                          <Send size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <aside>
                    <span className="eyebrow">HISTORIQUE</span>
                    {data.campaigns.map((c) => (
                      <article className="campaign-record" key={c.id}>
                        <h3>{c.subject}</h3>
                        <small>{date(c.created_at)}</small>
                        <p>{c.status}</p>
                      </article>
                    ))}
                    {!data.campaigns.length && (
                      <p>Aucune campagne pour le moment.</p>
                    )}
                  </aside>
                </div>
              )}
              {tab === "security" && (
                <>
                  <div className="security-summary">
                    <ShieldCheck size={36} />
                    <h2>Votre accès, protégé.</h2>
                    <p>{auth.email}</p>
                    <ul>
                      <li>Mot de passe haché avec scrypt.</li>
                      <li>
                        Code email à chaque connexion, valable 10 minutes.
                      </li>
                      <li>
                        Session privée : expiration après 30 minutes
                        d’inactivité ou 8 heures maximum.
                      </li>
                      <li>Protection CSRF et limitation des tentatives.</li>
                    </ul>
                    <p>Vérification email active.</p>
                  </div>
                  <div className="admin-section-top">
                    <h2>Journal d’activité</h2>
                  </div>
                  <div className="admin-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Compte</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.audit.map((a) => (
                          <tr key={a.id}>
                            <td>{a.action}</td>
                            <td>{a.actor}</td>
                            <td>{date(a.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </main>
        <footer className="admin-bottom">
          LIMINAL STUDIO <span>HUMAN FIRST. ALWAYS.</span>
        </footer>
      </div>
    </div>
  );
}
