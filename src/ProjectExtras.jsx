import { useState } from "react";
import { request } from "./api";
export default function ProjectExtras({ value, setValue, csrf, onBusy }) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const field = (k, v) => setValue((p) => ({ ...p, [k]: v }));
  const media = value.gallery || [];
  const change = (i, k, v) =>
    field(
      "gallery",
      media.map((m, j) => (j === i ? { ...m, [k]: v } : m)),
    );
  async function upload(e, i) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onBusy(true);
    setError("");
    try {
      const result = await request("/api/admin/upload", {
        method: "POST",
        csrf,
        body: file,
        headers: { "Content-Type": "application/octet-stream" },
      });
      setValue((p) => ({
        ...p,
        gallery: p.gallery.map((m, j) =>
          j === i ? { ...m, url: result.url, kind: result.visual } : m,
        ),
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      onBusy(false);
    }
  }
  function move(i, delta) {
    const next = [...media];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    field("gallery", next);
  }
  return (
    <section className="project-extras">
      <h3>Présentation & diffusion</h3>
      <div className="form-row">
        <label>
          Client / marque
          <input
            maxLength={160}
            value={value.client || ""}
            onChange={(e) => field("client", e.target.value)}
          />
        </label>
        <label>
          Année
          <input
            maxLength={20}
            value={value.year || ""}
            onChange={(e) => field("year", e.target.value)}
          />
        </label>
        <label>
          Ordre d’affichage
          <input
            type="number"
            min="0"
            max="999"
            value={value.order ?? 0}
            onChange={(e) => field("order", Number(e.target.value))}
          />
        </label>
      </div>
      <label className="consent-check">
        <input
          type="checkbox"
          checked={!!value.featured}
          onChange={(e) => field("featured", e.target.checked)}
        />
        Sélection sur l’accueil (4 premiers selon l’ordre)
      </label>
      <label className="consent-check">
        <input
          type="checkbox"
          checked={!!value.example}
          onChange={(e) => field("example", e.target.checked)}
        />
        Étude fictive / démonstration — afficher la mention publique
      </label>
      <h3>Galerie & coulisses</h3>
      <label>
        Présentation de la galerie
        <select
          value={value.galleryMode || "editorial"}
          onChange={(e) => field("galleryMode", e.target.value)}
        >
          <option value="editorial">Éditoriale — images espacées</option>
          <option value="sequence">
            Carousel continu — slides côte à côte
          </option>
        </select>
        <small>
          Pour un carousel Instagram, gardez l’ordre d’origine. Pour une version
          desktop, choisissez Éditoriale et remplacez les médias.
        </small>
      </label>
      <p className="admin-help">
        Images et vidéos, dans l’ordre affiché. « Pleine largeur » donne un
        temps fort ; « Demi-largeur » permet un diptyque. Les champs vides du
        récit restent invisibles sur le site.
      </p>
      {error && <p role="alert">{error}</p>}
      {media.map((m, i) => (
        <fieldset key={i} className="gallery-editor" disabled={uploading}>
          <legend>Média {i + 1}</legend>
          <div className="admin-row-actions">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              ↑ Monter
            </button>
            <button
              type="button"
              disabled={i === media.length - 1}
              onClick={() => move(i, 1)}
            >
              ↓ Descendre
            </button>
            <button
              type="button"
              onClick={() =>
                field(
                  "gallery",
                  media.filter((_, j) => i !== j),
                )
              }
            >
              Retirer
            </button>
          </div>
          {m.url &&
            (m.kind === "video" ? (
              <video src={m.url} controls preload="metadata" />
            ) : (
              <img src={m.url} alt={m.alt || "Aperçu"} />
            ))}
          <label>
            Importer
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
              onChange={(e) => upload(e, i)}
            />
          </label>
          <label>
            URL du média
            <input
              required
              value={m.url}
              onChange={(e) => change(i, "url", e.target.value)}
            />
          </label>
          <div className="form-row">
            <label>
              Type
              <select
                value={m.kind}
                onChange={(e) => change(i, "kind", e.target.value)}
              >
                <option value="image">Image</option>
                <option value="video">Vidéo</option>
              </select>
            </label>
            <label>
              Section
              <select
                value={m.section}
                onChange={(e) => change(i, "section", e.target.value)}
              >
                <option value="work">Travail final</option>
                <option value="bts">Coulisses / BTS</option>
              </select>
            </label>
            <label>
              Composition
              <select
                value={m.layout}
                onChange={(e) => change(i, "layout", e.target.value)}
              >
                <option value="wide">Pleine largeur</option>
                <option value="half">Demi-largeur</option>
              </select>
            </label>
          </div>
          {m.kind === "video" && (
            <label>
              URL de l’affiche (optionnelle)
              <input
                value={m.poster || ""}
                onChange={(e) => change(i, "poster", e.target.value)}
              />
            </label>
          )}
          <label>
            Description accessible
            <input
              required
              maxLength={300}
              value={m.alt}
              onChange={(e) => change(i, "alt", e.target.value)}
            />
          </label>
          <label>
            Légende
            <input
              maxLength={600}
              value={m.caption || ""}
              onChange={(e) => change(i, "caption", e.target.value)}
            />
          </label>
        </fieldset>
      ))}
      <button
        type="button"
        className="text-link"
        disabled={uploading || media.length >= 24}
        onClick={() =>
          field("gallery", [
            ...media,
            {
              url: "",
              poster: "",
              kind: "image",
              section: "work",
              layout: "wide",
              alt: "",
              caption: "",
            },
          ])
        }
      >
        + Ajouter un média
      </button>
      <h3>Indicateurs / résultats</h3>
      <p className="admin-help">
        Ajoutez uniquement des chiffres vérifiables. Pour tester, conservez la
        mention « démonstration ».
      </p>
      {(value.metrics || []).map((m, i) => (
        <div className="form-row" key={i}>
          <label>
            Valeur
            <input
              required
              maxLength={80}
              value={m.value}
              onChange={(e) =>
                field(
                  "metrics",
                  value.metrics.map((x, j) =>
                    j === i ? { ...x, value: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <label>
            Libellé
            <input
              required
              maxLength={100}
              value={m.label}
              onChange={(e) =>
                field(
                  "metrics",
                  value.metrics.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            onClick={() =>
              field(
                "metrics",
                value.metrics.filter((_, j) => j !== i),
              )
            }
          >
            Retirer
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-link"
        disabled={(value.metrics || []).length >= 8}
        onClick={() =>
          field("metrics", [...(value.metrics || []), { label: "", value: "" }])
        }
      >
        + Ajouter un indicateur
      </button>
    </section>
  );
}
