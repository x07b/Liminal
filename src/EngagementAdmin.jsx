import { useState } from "react";
import { Plus, ArrowUpRight, RotateCcw } from "lucide-react";
const empty = {
  question: "",
  answer: "",
  keywords: "",
  locale: "fr",
  link: "/contact",
  published: false,
  order: 0,
};
export default function EngagementAdmin({ data, action, busy, section }) {
  const [draft, setDraft] = useState(null);
  const field = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  if (section === "feedback")
    return (
      <div className="community-admin">
        <p className="admin-help">
          Les retours privés envoyés depuis « Un regard sur le site ? ». Ils ne
          créent aucun abonnement.
        </p>
        {data.feedback?.map((f) => (
          <section key={f.id}>
            <small>
              {f.kind} · {new Date(f.created_at).toLocaleDateString("fr")}
            </small>
            <h3>
              {f.name || "Visiteur"}{" "}
              {f.email && <a href={`mailto:${f.email}`}>↗</a>}
            </h3>
            <p>{f.page}</p>
            <p className="message-text">{f.message}</p>
            <label>
              Suivi
              <select
                aria-label={`Suivi du retour de ${f.name || "visiteur"}`}
                disabled={busy}
                value={f.status}
                onChange={(e) =>
                  action("/api/admin/feedback/" + f.id, "PATCH", {
                    status: e.target.value,
                  })
                }
              >
                <option value="new">Nouveau</option>
                <option value="reviewing">En cours</option>
                <option value="closed">Traité</option>
              </select>
            </label>
          </section>
        ))}
        {!data.feedback?.length && <p>Aucun retour pour le moment.</p>}
      </div>
    );
  if (section === "deliveries")
    return (
      <div className="community-admin">
        {data.senderTesting && (
          <p className="form-error">
            Expéditeur de test Resend : les emails ne peuvent atteindre que
            votre adresse de compte. Vérifiez un domaine dans Resend, puis
            configurez MAIL_FROM avec ce domaine. Le Reply-To reste
            itsazizsaidi@gmail.com.
          </p>
        )}
        <p className="admin-help">
          Confirmations, PDF, empreintes et notifications du studio. Les
          messages en attente sont repris automatiquement (4 tentatives). «
          Envoyé » signifie accepté par le service email, pas nécessairement lu
          ou livré en boîte principale. Les codes de connexion et les campagnes
          ont leur propre envoi.
        </p>
        {data.deliveries?.map((d) => (
          <div className="answer-row" key={d.id}>
            <div>
              <strong>{d.subject}</strong>
              <p>{d.recipient}</p>
              <small>
                {new Date(d.created_at).toLocaleString("fr")} ·{" "}
                {d.status === "sent"
                  ? data.localMail
                    ? "Simulation locale"
                    : "Envoyé"
                  : d.status === "failed"
                    ? "Échec"
                    : d.status === "cancelled"
                      ? "Annulé"
                      : "En attente"}{" "}
                · {d.attempts} tentative(s)
              </small>
              {d.last_error && <p>{d.last_error}</p>}
            </div>
            {d.status === "failed" && (
              <button
                disabled={busy}
                onClick={() =>
                  action("/api/admin/deliveries/retry", "POST", { id: d.id })
                }
              >
                Réessayer <RotateCcw size={14} />
              </button>
            )}
          </div>
        ))}
        {!data.deliveries?.length && (
          <p>Aucun envoi automatique pour le moment.</p>
        )}
      </div>
    );
  return (
    <div className="community-admin">
      <section>
        <h2>Les points de contact.</h2>
        <p className="admin-help">
          Email actuel : itsazizsaidi@gmail.com. Ces liens alimentent le footer
          et les prochains emails de communauté.
        </p>
        <form
          key={JSON.stringify(data.community)}
          onSubmit={async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.currentTarget));
            await action("/api/admin/community", "PUT", {
              ...values,
              socialDemo: values.socialDemo === "on",
            });
          }}
        >
          {["instagram", "facebook", "whatsapp"].map((key) => (
            <label key={key}>
              {key === "whatsapp" ? "WhatsApp — https://wa.me/216…" : key}
              <input
                name={key}
                type="url"
                maxLength={500}
                defaultValue={data.community?.[key] || ""}
                placeholder={
                  key === "whatsapp"
                    ? "https://wa.me/216XXXXXXXX"
                    : "https://www." + key + ".com/votrecompte"
                }
              />
            </label>
          ))}
          <label className="consent-check">
            <input
              name="socialDemo"
              type="checkbox"
              defaultChecked={data.community?.socialDemo}
            />
            Liens de démonstration : les icônes ouvrent Contact, les emails ne
            diffusent pas ces exemples.
          </label>
          <button className="button" disabled={busy}>
            Enregistrer les liens <ArrowUpRight size={16} />
          </button>
        </form>
      </section>
      <section>
        <div className="admin-section-top">
          <h2>Le guide LIMINAL.</h2>
          <button className="button" onClick={() => setDraft({ ...empty })}>
            <Plus size={16} /> Ajouter une réponse
          </button>
        </div>
        <p className="admin-help">
          Le guide affiche uniquement vos réponses publiées dans la langue du
          visiteur. Il ne génère aucune information. Sans correspondance, il
          propose Contact. Les mots-clés aident à retrouver la bonne question.
        </p>
        {draft && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await action(
                  "/api/admin/answers" + (draft.id ? "/" + draft.id : ""),
                  draft.id ? "PUT" : "POST",
                  draft,
                )
              )
                setDraft(null);
            }}
          >
            <label>
              Question
              <input
                required
                minLength={3}
                maxLength={200}
                value={draft.question}
                onChange={(e) => field("question", e.target.value)}
              />
            </label>
            <label>
              Réponse
              <textarea
                required
                minLength={5}
                maxLength={1800}
                rows={5}
                value={draft.answer}
                onChange={(e) => field("answer", e.target.value)}
              />
            </label>
            <label>
              Mots-clés (séparés par des virgules)
              <input
                value={draft.keywords}
                maxLength={500}
                onChange={(e) => field("keywords", e.target.value)}
              />
            </label>
            <div className="form-row">
              <label>
                Langue
                <select
                  value={draft.locale}
                  onChange={(e) => field("locale", e.target.value)}
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </label>
              <label>
                Ordre
                <input
                  type="number"
                  min={0}
                  value={draft.order}
                  onChange={(e) => field("order", Number(e.target.value))}
                />
              </label>
            </div>
            <label>
              Lien interne (facultatif)
              <input
                value={draft.link}
                onChange={(e) => field("link", e.target.value)}
                placeholder="/services"
              />
            </label>
            <label className="consent-check">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => field("published", e.target.checked)}
              />
              Publier cette réponse
            </label>
            <div className="audience-actions">
              <button className="button" disabled={busy}>
                Enregistrer
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => setDraft(null)}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
        {data.answers?.map((a) => (
          <div className="answer-row" key={a.id}>
            <div>
              <strong>{a.question}</strong>
              <small>
                {a.locale.toUpperCase()} · {a.published ? "Publié" : "Masqué"} ·
                Ordre {a.order}
              </small>
            </div>
            <button onClick={() => setDraft({ ...a })}>Modifier</button>
            <button
              disabled={busy}
              onClick={() =>
                action("/api/admin/answers/" + a.id, "PUT", {
                  ...a,
                  published: !a.published,
                })
              }
            >
              {a.published ? "Masquer" : "Publier"}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm("Supprimer cette réponse du guide ?"))
                  action("/api/admin/answers/" + a.id, "DELETE");
              }}
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
