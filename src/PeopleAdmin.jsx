import { useState } from "react";
import { Upload, Plus, X } from "lucide-react";
import { request } from "./api";
const blank = {
  name: "",
  slug: "",
  role: "",
  description: "",
  quote: "",
  photo: "",
  kind: "team",
  order: 0,
  published: false,
  example: false,
  translations: { en: {}, ar: {} },
};
export default function PeopleAdmin({ items, csrf, refresh }) {
  const [value, setValue] = useState(null),
    [lang, setLang] = useState("fr"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [remove, setRemove] = useState("");
  const field = (key, val) => setValue((v) => ({ ...v, [key]: val }));
  const localized = (key, val) =>
    lang === "fr"
      ? field(key, val)
      : setValue((v) => ({
          ...v,
          translations: {
            ...v.translations,
            [lang]: { ...v.translations?.[lang], [key]: val },
          },
        }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/people" + (value.id ? "/" + value.id : ""), {
        method: value.id ? "PUT" : "POST",
        csrf,
        data: value,
      });
      await refresh();
      setValue(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const r = await request("/api/admin/upload", {
        method: "POST",
        csrf,
        body: file,
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (r.visual !== "image") throw Error("Choisissez une photo.");
      field("photo", r.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function destroy(id) {
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/people/" + id, { method: "DELETE", csrf });
      await refresh();
      setRemove("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const current = lang === "fr" ? value : value?.translations?.[lang] || {};
  return (
    <>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      {value ? (
        <section className="admin-editor">
          <div className="admin-section-top">
            <h2>{value.id ? "Modifier le profil" : "Ajouter une personne"}</h2>
            <button
              className="admin-icon"
              aria-label="Fermer"
              onClick={() => setValue(null)}
            >
              <X />
            </button>
          </div>
          <form onSubmit={save}>
            <div className="testimonial-editor-grid">
              <div>
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
                  Adresse de la page (slug)
                  <input
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    value={value.slug}
                    onChange={(e) => field("slug", e.target.value)}
                  />
                  <small>
                    /{value.slug || "mohamed"} — lettres minuscules et tirets
                  </small>
                </label>
                <label>
                  Section
                  <select
                    value={value.kind}
                    onChange={(e) => field("kind", e.target.value)}
                  >
                    <option value="founder">Fondateurs</option>
                    <option value="team">Notre équipe</option>
                  </select>
                </label>
                <label>
                  Ordre
                  <input
                    type="number"
                    min="0"
                    max="999"
                    required
                    value={value.order}
                    onChange={(e) => field("order", Number(e.target.value))}
                  />
                </label>
                <div className="editor-languages">
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
                {["role", "description", "quote"].map((key) => (
                  <label key={key}>
                    {
                      {
                        role: "Poste / spécialité",
                        description: "Biographie",
                        quote: "Citation (facultative)",
                      }[key]
                    }
                    {key === "description" ? (
                      <textarea
                        dir={lang === "ar" ? "rtl" : "ltr"}
                        rows={7}
                        required={lang === "fr"}
                        maxLength={5000}
                        value={current[key] || ""}
                        onChange={(e) => localized(key, e.target.value)}
                      />
                    ) : (
                      <input
                        dir={lang === "ar" ? "rtl" : "ltr"}
                        required={lang === "fr" && key === "role"}
                        maxLength={key === "role" ? 180 : 250}
                        value={current[key] || ""}
                        onChange={(e) => localized(key, e.target.value)}
                      />
                    )}
                  </label>
                ))}
                <small>Les traductions vides reprennent le français.</small>
              </div>
              <div className="testimonial-media-field">
                {value.photo ? (
                  <img
                    className="people-admin-photo"
                    src={value.photo}
                    alt={value.name}
                  />
                ) : (
                  <div className="testimonial-media-empty">
                    Portrait à ajouter
                  </div>
                )}
                <label className="admin-upload">
                  <Upload size={16} />
                  Importer une photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={upload}
                  />
                </label>
                <label>
                  Photo (URL HTTPS ou image importée)
                  <input
                    value={value.photo}
                    onChange={(e) => field("photo", e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => field("photo", "")}
                >
                  Retirer la photo
                </button>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={value.published}
                    onChange={(e) => field("published", e.target.checked)}
                  />
                  Publié
                </label>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={value.example}
                    onChange={(e) => field("example", e.target.checked)}
                  />
                  Profil fictif de démonstration
                </label>
              </div>
            </div>
            <div className="editor-save">
              <button
                type="button"
                onClick={() => setValue(null)}
                className="text-link"
              >
                Annuler
              </button>
              <button className="button" disabled={busy}>
                {busy ? "Enregistrement…" : "Enregistrer le profil"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <div className="admin-section-top">
            <p>{items.length} profils · fondateurs et équipe</p>
            <button
              className="button"
              onClick={() => {
                setValue({ ...blank, order: items.length });
                setLang("fr");
              }}
            >
              <Plus size={17} />
              Ajouter une personne
            </button>
          </div>
          <div className="admin-partner-grid">
            {items.map((p) => (
              <article key={p.id}>
                {p.photo ? (
                  <img
                    className="people-admin-photo"
                    src={p.photo}
                    alt={p.name}
                  />
                ) : (
                  <div className="people-initials">
                    {p.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
                <h3>{p.name}</h3>
                <p>{p.role}</p>
                <small>
                  {p.kind === "founder" ? "Fondateur" : "Équipe"} ·{" "}
                  {p.published ? "Publié" : "Brouillon"}
                  {p.example ? " · Exemple" : ""}
                </small>
                <div className="admin-row-actions">
                  <button
                    onClick={() => {
                      setValue({ ...blank, ...p });
                      setLang("fr");
                    }}
                  >
                    Modifier
                  </button>
                  {p.published && (
                    <a href={"/" + p.slug} target="_blank" rel="noreferrer">
                      Voir la page
                    </a>
                  )}
                  <button
                    className="admin-danger"
                    disabled={busy}
                    onClick={() => setRemove(p.id)}
                  >
                    Supprimer
                  </button>
                </div>
                {remove === p.id && (
                  <div className="admin-notice">
                    <p>
                      Supprimer définitivement ce profil ? Vous pouvez aussi le
                      passer en brouillon.
                    </p>
                    <button disabled={busy} onClick={() => destroy(p.id)}>
                      Confirmer
                    </button>{" "}
                    <button onClick={() => setRemove("")}>Annuler</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
