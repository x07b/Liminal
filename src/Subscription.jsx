import { useState } from "react";
import { useLocale } from "./locale";
import { request } from "./api";
export default function Subscription() {
  const { t } = useLocale(),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const query = new URLSearchParams(location.hash.slice(1)),
    action = query.get("action") === "unsubscribe" ? "unsubscribe" : "confirm";
  async function submit() {
    setStatus("busy");
    try {
      const result = await request("/api/subscription", {
        method: "POST",
        data: { token: query.get("token"), action },
      });
      setStatus(result.status);
    } catch (e) {
      setError(t(e.message));
      setStatus("");
    }
  }
  return (
    <section className="page-width section-space subscription-page">
      <span className="eyebrow">LIMINAL / COMMUNITY</span>
      <h1>
        {action === "confirm"
          ? t("Restons en lien.", "Stay in touch.", "لنبقَ على تواصل.")
          : t("À votre rythme.", "On your terms.", "على راحتك.")}
      </h1>
      {["subscribed", "unsubscribed"].includes(status) ? (
        <p role="status">
          {status === "subscribed"
            ? t(
                "Votre abonnement est confirmé. Merci !",
                "Your subscription is confirmed. Thank you!",
                "تم تأكيد اشتراكك. شكراً!",
              )
            : t(
                "Vous êtes désabonné.",
                "You have been unsubscribed.",
                "تم إلغاء اشتراكك.",
              )}
        </p>
      ) : (
        <>
          <p>
            {t(
              "Confirmez votre choix ci-dessous.",
              "Confirm your choice below.",
              "أكد اختيارك أدناه.",
            )}
          </p>
          <button
            className="button"
            disabled={status === "busy"}
            onClick={submit}
          >
            {action === "confirm"
              ? t(
                  "Confirmer mon abonnement",
                  "Confirm subscription",
                  "تأكيد الاشتراك",
                )
              : t("Me désabonner", "Unsubscribe", "إلغاء الاشتراك")}
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
