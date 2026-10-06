import { ScrollCopy } from "./ScrollStory";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, localize } from "./locale";
import { servicePillars } from "./business-content";
import "./business.css";
import ServiceJourney from "./ServiceJourney";
export default function ServicesPage() {
  const { locale, t } = useLocale(),
    reduced = useReducedMotion();
  return (
    <>
      <section className="page-width section-space services-opening">
        <span className="eyebrow">
          LIMINAL / {t("SERVICES", "SERVICES", "خدماتنا")}
        </span>
        <h1>
          {t("De l’idée", "From idea", "من الفكرة")}
          <br />
          <em className="serif-word">
            {t("à la livraison.", "to delivery.", "إلى التسليم.")}
          </em>
        </h1>
        <p>
          {t(
            "Nous construisons le système créatif autour d’une idée. Puis nous dirigeons, produisons et finalisons les contenus dont elle a besoin.",
            "We build the creative system around an idea. Then we direct, produce and finish the work it needs.",
            "نبني النظام الإبداعي حول الفكرة. ثم نوجه العمل وننتجه وننهي المحتوى الذي تحتاجه.",
          )}
        </p>
        <a className="text-link" href="#service-01">
          {t(
            "Trouver votre point de départ",
            "Find your starting point",
            "اعثر على نقطة البداية",
          )}{" "}
          ↓
        </a>
      </section>
      <nav className="page-width service-jump-links" aria-label={t("Nos services", "Our services", "خدماتنا")}>
        {localize(servicePillars, locale).map((s,i) => <a key={i} href={"#service-0"+(i+1)}><span>0{i+1}</span>{s.title}<ArrowUpRight size={16}/></a>)}
      </nav>
      <div className="page-width service-chapters">
        {localize(servicePillars, locale).map((s, i) => (
          <motion.section
            id={"service-0" + (i + 1)}
            className="service-chapter"
            key={i}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
          >
            <span className="eyebrow">0{i + 1}</span>
            <div className="service-chapter-content">
              <div className="service-chapter-title">
                <h2>
                  <ScrollCopy>{s.title}</ScrollCopy>
                </h2>
                
              </div>
              <p className="chapter-lead">{s.subtitle}</p>
              <p>{s.text}</p>
              <details className="service-deliverables">
                <summary>{t("Voir les livrables", "See the deliverables", "شاهد المخرجات")} <span aria-hidden="true">+</span></summary>
              <div className="chapter-delivery">
                <span className="eyebrow">
                  {t(
                    "CE QUE VOUS RECEVEZ",
                    "WHAT YOU RECEIVE",
                    "ما تحصلون عليه",
                  )}
                </span>
                <p>{s.result}</p>
              </div>
              <ul>
                {s.tags.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="chapter-example">{s.example}</p>
              </details>
            </div>
          </motion.section>
        ))}
      </div>
      <ServiceJourney />
      <section className="page-width service-scope">
        <span className="eyebrow">
          {t("UN BESOIN PRÉCIS ?", "A SPECIFIC NEED?", "تحتاجون شيئاً محدداً؟")}
        </span>
        <h2>
          <ScrollCopy>
            {t(
              "On peut aussi entrer en cours de route.",
              "We can also join along the way.",
              "يمكننا الانضمام أثناء المسار أيضاً.",
            )}
          </ScrollCopy>
        </h2>
        <p>
          {t(
            "Dites-nous où vous en êtes. Nous cadrerons ensemble la suite.",
            "Tell us where you are. We will shape the next step together.",
            "أخبرونا أين وصلتم. نحدد الخطوة التالية معاً.",
          )}
        </p>
        <small>
          {t(
            "L’IA peut accélérer l’exploration et la production. La direction et les décisions restent humaines.",
            "AI can accelerate exploration and production. Direction and decisions remain human.",
            "يمكن للذكاء الاصطناعي تسريع الاستكشاف والإنتاج. التوجيه والقرار يبقيان بشريين.",
          )}
        </small>
        <Link className="button" to="/contact">
          {t("Démarrer un projet", "Start a project", "ابدأ مشروعاً")}
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
