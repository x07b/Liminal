import { useRef, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { useLocale } from "./locale";
import { request } from "./api";
export default function InquiryForm({ kind = "project" }) {
  const { t, locale } = useLocale(),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const id = useRef(null);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    id.current ||= crypto.randomUUID();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await request("/api/inquiries", {
        method: "POST",
        data: { ...data, kind, locale, requestId: id.current },
      });
      setStatus("sent");
    } catch (err) {
      setError(t(err.message));
      setStatus("");
    }
  }
  if (status === "sent")
    return (
      <div className="inquiry-success" role="status">
        <Check size={32} />
        <h2>{t("Bien reçu.", "Received.", "وصلتنا رسالتك.")}</h2>
        <p>
          {t(
            "Votre demande est arrivée chez LIMINAL. Nous vous répondrons par email.",
            "Your request is with LIMINAL. We’ll get back to you by email.",
            "وصل طلبك إلى ليمينال. سنرد عليك عبر البريد الإلكتروني.",
          )}
        </p>
      </div>
    );
  return (
    <form onSubmit={submit} className="inquiry-form">
      <div className="form-row">
        <label>
          {t("Votre nom", "Your name", "الاسم")} *
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
        </label>
        <label>
          {t("Votre email", "Your email", "البريد الإلكتروني")} *
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            dir="ltr"
          />
        </label>
      </div>
      {kind === "project" ? (
        <>
          <label>
            {t("Votre marque", "Your brand", "علامتك التجارية")}
            <input name="brand" maxLength={200} />
          </label>
          <label>
            {t("Vous avez besoin de…", "What do you need?", "ما الذي تحتاجه؟")}
            <select name="type">
              {[
                "Reels & production",
                "Stratégie & concepts",
                "Montage & motion design",
                "Création augmentée par l’IA",
                "Un accompagnement complet",
              ].map((x) => (
                <option key={x} value={x}>
                  {t(x)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(
              "Une échéance en tête ?",
              "A date in mind?",
              "هل لديك موعد محدد؟",
            )}
            <input name="timing" maxLength={200} />
          </label>
        </>
      ) : (
        <>
          <div className="form-row">
            <label>
              {kind === "sponsorship"
                ? t("Votre organisation", "Your organisation", "مؤسستك")
                : t("Votre spécialité", "Your craft", "تخصصك")}
              <input name="craft" maxLength={200} required />
            </label>
            <label>
              {t(
                "Disponibilité / calendrier",
                "Availability / timing",
                "التوفر / الموعد",
              )}
              <input name="timing" maxLength={200} />
            </label>
          </div>
          <label>
            {kind === "sponsorship"
              ? t("Site de votre marque", "Your brand website", "موقع علامتك")
              : t(
                  "Portfolio, CV ou profil (lien)",
                  "Portfolio, CV or profile (link)",
                  "رابط أعمالك أو سيرتك الذاتية",
                )}
            <input
              name="portfolio"
              type="url"
              placeholder="https://"
              maxLength={1000}
              dir="ltr"
            />
          </label>
        </>
      )}
      <label>
        {kind === "project"
          ? t(
              "Votre projet en quelques mots",
              "Tell us about your project",
              "حدثنا عن مشروعك",
            )
          : t(
              "Présentez-vous et votre proposition",
              "Introduce yourself and your proposal",
              "عرّفنا بنفسك وباقتراحك",
            )}{" "}
        *
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
        />
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="form-note">
        {t(
          "Vos informations restent privées et servent à répondre à votre demande.",
          "Your details stay private and are used to respond to your request.",
          "تبقى معلوماتك خاصة وتُستخدم للرد على طلبك.",
        )}
      </p>
      <label className="consent-check">
        <input type="checkbox" required />
        {t(
          "J’accepte que LIMINAL me contacte au sujet de cette demande.",
          "I agree to be contacted by LIMINAL about this request.",
          "أوافق على تواصل ليمينال معي بخصوص هذا الطلب.",
        )}
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="button" disabled={status === "sending"}>
        {status === "sending"
          ? t("Envoi…", "Sending…", "جارٍ الإرسال…")
          : t("Envoyer ma demande", "Send my request", "إرسال الطلب")}
        <ArrowUpRight size={18} />
      </button>
    </form>
  );
}
