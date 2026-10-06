import { useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import { request } from "./api";

const empty = {
  name: "",
  logo: "",
  order: 0,
  published: false,
  example: false,
};
export default function PartnersAdmin({ items, csrf, refresh }) {
  const [value, setValue] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remove, setRemove] = useState(null);
  const field = (key, next) => setValue((v) => ({ ...v, [key]: next }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/partners" + (value.id ? "/" + value.id : ""), {
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
      const result = await request("/api/admin/upload", {
        method: "POST",
        csrf,
        body: file,
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (result.visual !== "image")
        throw Error("Choisissez une image PNG, JPEG ou WebP.");
      field("logo", result.url);
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
      await request("/api/admin/partners/" + id, { method: "DELETE", csrf });
      await refresh();
      setRemove(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
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
            <h2>
              {value.id ? "Modifier le partenaire" : "Nouveau partenaire"}
            </h2>
            <button
              className="admin-icon"
              onClick={() => setValue(null)}
              aria-label="Fermer"
            >
              <X />
            </button>
          </div>
          <form onSubmit={save}>
            <div className="testimonial-editor-grid">
              <div>
                <label>
                  Nom
                  <input
                    required
                    maxLength={100}
                    value={value.name}
                    onChange={(e) => field("name", e.target.value)}
                  />
                </label>
                <label>
                  Projet associé (slug)
                  <input
                    maxLength={80}
                    value={value.projectSlug || ""}
                    onChange={(e) => field("projectSlug", e.target.value)}
                  />
                </label>
                <label>
                  Site du client (HTTPS)
                  <input
                    type="url"
                    value={value.website || ""}
                    onChange={(e) => field("website", e.target.value)}
                  />
                </label>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={value.featured !== false}
                    onChange={(e) => field("featured", e.target.checked)}
                  />
                  Sélection sur l’accueil
                </label>
                <label>
                  Ordre d’affichage
                  <input
                    type="number"
                    min="0"
                    max="999"
                    required
                    value={value.order}
                    onChange={(e) => field("order", Number(e.target.value))}
                  />
                </label>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={value.published}
                    onChange={(e) => field("published", e.target.checked)}
                  />
                  Publié sur le site
                </label>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={value.example}
                    onChange={(e) => field("example", e.target.checked)}
                  />
                  Exemple de présentation (marque fictive)
                </label>
              </div>
              <div className="testimonial-media-field">
                {value.logo && <img src={value.logo} alt={value.name} />}
                <label className="admin-upload">
                  <Upload size={16} /> Importer un logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={upload}
                  />
                </label>
                <label>
                  URL du logo
                  <input
                    required
                    value={value.logo}
                    onChange={(e) => field("logo", e.target.value)}
                    placeholder="https://…"
                  />
                </label>
              </div>
            </div>
            <div className="editor-save">
              <button
                type="button"
                className="text-link"
                onClick={() => setValue(null)}
              >
                Annuler
              </button>
              <button className="button" disabled={busy}>
                {busy ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <div className="admin-section-top">
            <p>{items.length} logos · ordre croissant</p>
            <button
              className="button"
              onClick={() => setValue({ ...empty, order: items.length })}
            >
              <Plus size={17} />
              Ajouter un partenaire
            </button>
          </div>
          <p className="admin-help">
            Les marques fictives servent à visualiser le bandeau. Remplacez-les
            par vos collaborations, puis désactivez « Exemple ».
          </p>
          <div className="admin-partner-grid">
            {items.map((item) => (
              <article key={item.id}>
                <div className="admin-partner-logo">
                  <img src={item.logo} alt={item.name} />
                </div>
                <h3>{item.name}</h3>
                <p>
                  {item.example ? "Exemple · " : ""}
                  {item.published ? "Publié" : "Brouillon"} · {item.order}
                </p>
                <div className="admin-row-actions">
                  <button onClick={() => setValue(item)}>Modifier</button>
                  <button
                    className="admin-danger"
                    disabled={busy}
                    onClick={() => setRemove(item.id)}
                  >
                    Supprimer
                  </button>
                </div>
                {remove === item.id && (
                  <div className="admin-notice">
                    <p>Supprimer définitivement ce logo ?</p>
                    <button disabled={busy} onClick={() => destroy(item.id)}>
                      Confirmer
                    </button>{" "}
                    <button onClick={() => setRemove(null)}>Annuler</button>
                  </div>
                )}
              </article>
            ))}
          </div>
          {!items.length && (
            <p className="admin-empty">Ajoutez votre premier partenaire.</p>
          )}
        </>
      )}
    </>
  );
}
