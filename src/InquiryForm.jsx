import { useRef, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { useLocale } from "./locale";


import { request } from "./api";
export default function InquiryForm({ kind = "project" }) {
  const { t, locale } = useLocale(),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const id = useRef(null);
  const [download, setDownload] = useState(null);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    id.current ||= crypto.randomUUID();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const result = await request("/api/inquiries", {
        method: "POST",
        data: { ...data, kind, locale, requestId: id.current },
      });
      setDownload(result.download);
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
        {download && (
          <a className="receipt-download" href={download} download>
            {t(
              "Télécharger mon brief PDF",
              "Download my brief PDF",
              "تحميل ملخص المشروع PDF",
            )}{" "}
            <ArrowUpRight size={16} />
          </a>
        )}
        <p className="form-note">
          {t(
            "Une confirmation vous est envoyée par email. Si elle tarde, vérifiez les indésirables.",
            "A confirmation is being sent by email. If it takes a while, check your spam folder.",
            "ستصلك رسالة تأكيد بالبريد الإلكتروني. تحقق من الرسائل غير المرغوب فيها إذا تأخرت.",
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
              <option value="">
                {t(
                  "À définir ensemble",
                  "Let’s define it together",
                  "نحدده معاً",
                )}
              </option>
              {[
                ["launch", "Un lancement", "A launch", "إطلاق"],
                ["identity", "Une identité / un univers", "An identity / a world", "هوية / عالم"],
                ["film", "Un film", "A film", "فيلم"],
                ["digital", "Une expérience numérique", "A digital experience", "تجربة رقمية"],
                ["object", "Un objet / un produit", "An object / a product", "شيء / منتج"],
                ["experiment", "Une expérience", "An experiment", "تجربة"],
                ["other", "Autre chose", "Something else", "شيء آخر"],
              ].map(([value, fr, en, ar]) => <option key={value} value={value}>{t(fr, en, ar)}</option>)}
            </select>
          </label>
          <label>
            {t(
              "Quels formats imaginez-vous ?",
              "What formats do you have in mind?",
              "ما الصيغ التي تفكرون فيها؟",
            )}
            <input
              name="scope"
              maxLength={1000}
              placeholder={t(
                "Film, reels, photos… ou à définir ensemble",
                "Film, reels, stills… or let’s work it out",
                "فيلم، ريلز، صور… أو نحددها معاً",
              )}
            />
          </label>
          <label>
            {t(
              "Une enveloppe prévue ? (TND)",
              "A budget in mind? (TND)",
              "ميزانية تقريبية؟ (دينار تونسي)",
            )}
            <select name="budget">
              {[
                t("À définir ensemble", "To discuss", "نحددها معاً"),
                "< 2 000 TND",
                "2 000–5 000 TND",
                "5 000–10 000 TND",
                "10 000–25 000 TND",
                "25 000+ TND",
              ].map((x) => (
                <option key={x}>{x}</option>
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
              "Que cherchez-vous à faire changer ?",
              "What are you trying to make happen?",
              "ما الذي تسعون إلى تحقيقه؟",
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
      {kind === "project" && (
        <label>
          {t(
            "Autre chose à savoir ?",
            "Anything else we should know?",
            "هل هناك شيء آخر نحتاج معرفته؟",
          )}
          <textarea name="notes" maxLength={1000} rows={2} />
        </label>
      )}
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
