import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "./locale";
import "./brand-experience.css";
export default function ServiceJourney() {
  const { t } = useLocale(),
    reduced = useReducedMotion();
  const [stage, setStage] = useState(0),
    [model, setModel] = useState(0);
  const steps = [
    [
      t("Brief", "Brief", "الطلب"),
      t("Le bon problème.", "The right problem.", "السؤال الصحيح."),
      t(
        "Objectif, public, contraintes. Nous définissons le travail avant de définir les images.",
        "Objective, audience, constraints. We define the job before defining the images.",
        "الهدف والجمهور والقيود. نحدد المهمة قبل أن نحدد الصور.",
      ),
      t("Un périmètre partagé", "A shared scope", "نطاق واضح"),
    ],
    [
      t("Direction", "Direction", "التوجيه"),
      t("Une idée qui tient.", "An idea that holds.", "فكرة متماسكة."),
      t(
        "Concept, références et traitement. Une direction validée devient le fil de toute la production.",
        "Concept, references and treatment. An agreed direction becomes the thread of the whole production.",
        "مفهوم ومراجع ومعالجة. اتجاه متفق عليه يربط كل الإنتاج.",
      ),
      t("Un concept validé", "An approved concept", "مفهوم متفق عليه"),
    ],
    [
      t("Production", "Production", "الإنتاج"),
      t("La rendre tangible.", "Make it tangible.", "نجعلها ملموسة."),
      t(
        "Les bons talents, le bon plan, le bon plateau. Nous organisons et produisons la matière.",
        "The right talent, plan and set. We organise and produce the material.",
        "المواهب والخطة وموقع التصوير المناسب. ننظم العمل وننتج المادة.",
      ),
      t(
        "Images, prises, matière",
        "Footage, images, material",
        "صور ولقطات ومادة",
      ),
    ],
    [
      t("Post", "Post", "ما بعد الإنتاج"),
      t("Trouver le rythme.", "Find the rhythm.", "نجد الإيقاع."),
      t(
        "Montage, motion, couleur et son. Chaque détail se règle dans la même direction.",
        "Editing, motion, colour and sound. Every detail follows the same direction.",
        "مونتاج وحركة ولون وصوت. كل تفصيل يخدم الاتجاه نفسه.",
      ),
      t("Une version à valider", "A cut to review", "نسخة للمراجعة"),
    ],
    [
      t("Livraison", "Delivery", "التسليم"),
      t(
        "Prêt à rencontrer son public.",
        "Ready for its audience.",
        "جاهز لجمهوره.",
      ),
      t(
        "Masters, déclinaisons et formats convenus. Un ensemble cohérent, prêt à être diffusé.",
        "Masters, versions and agreed formats. One coherent set, ready to go live.",
        "النسخ النهائية والصيغ المتفق عليها. مجموعة متناسقة جاهزة للنشر.",
      ),
      t(
        "Les fichiers finaux organisés",
        "Organised final files",
        "ملفات نهائية منظمة",
      ),
    ],
  ];
  const models = [
    [
      t("Un besoin précis", "A focused brief", "حاجة محددة"),
      t(
        "Une pièce. Toute notre attention.",
        "One piece. Our full attention.",
        "عمل واحد. كل اهتمامنا.",
      ),
      t(
        "Un montage, une identité ou une séance de production. Un périmètre défini, un devis dédié et des livrables convenus.",
        "An edit, an identity or a production session. A defined scope, a dedicated quote and agreed deliverables.",
        "مونتاج أو هوية أو جلسة إنتاج. نطاق محدد وعرض سعر خاص ومخرجات متفق عليها.",
      ),
    ],
    [
      t("Une campagne", "A campaign", "حملة"),
      t(
        "Une idée. Plusieurs points de contact.",
        "One idea. Multiple touchpoints.",
        "فكرة واحدة. نقاط تواصل متعددة.",
      ),
      t(
        "De la direction aux déclinaisons : nous réunissons l’équipe et pilotons le projet. Budget et calendrier sont cadrés ensemble avant la production.",
        "From direction to adaptations: we assemble the team and lead the project. Budget and schedule are agreed together before production.",
        "من التوجيه إلى الصيغ المختلفة: نجمع الفريق وندير المشروع. نحدد الميزانية والجدول معاً قبل الإنتاج.",
      ),
    ],
    [
      t("Dans la durée", "An ongoing partnership", "شراكة مستمرة"),
      t(
        "Moins de recommencements. Plus de continuité.",
        "Less starting over. More continuity.",
        "بدايات أقل. استمرارية أكثر.",
      ),
      t(
        "Une cadence de travail récurrente, un planning partagé et une capacité convenue. Le périmètre évolue avec vos priorités, sans perdre le fil de votre marque.",
        "A recurring rhythm, a shared plan and agreed capacity. The scope evolves with your priorities while keeping your brand consistent.",
        "وتيرة متكررة وخطة مشتركة وقدرة متفق عليها. يتطور النطاق مع أولوياتكم مع الحفاظ على اتساق العلامة.",
      ),
    ],
  ];
  return (
    <>
      <section
        className="service-journey page-width"
        aria-labelledby="journey-title"
      >
        <div className="journey-heading">
          <span className="eyebrow">
            01 — 05 / {t("LE PARCOURS", "THE JOURNEY", "المسار")}
          </span>
          <h2 id="journey-title">
            {t("Un fil.", "One thread.", "خيط واحد.")}{" "}
            <em>{t("Pas de rupture.", "No loose ends.", "بلا انقطاع.")}</em>
          </h2>
        </div>
        <div
          className="journey-track"
          aria-label={t(
            "Étapes de production",
            "Production stages",
            "مراحل الإنتاج",
          )}
        >
          {steps.map((s, i) => (
            <button
              key={i}
              aria-pressed={stage === i}
              aria-controls="journey-detail"
              onClick={() => setStage(i)}
            >
              <span>0{i + 1}</span>
              <strong>{s[0]}</strong>
            </button>
          ))}
        </div>
        <div className="journey-detail" id="journey-detail">
          <div className={"journey-art stage-" + stage} aria-hidden="true">
            <span className="journey-numeral">0{stage + 1}</span>
            <div className="journey-frames">
              <i />
              <i />
              <i />
            </div>
            <small>LIMINAL / {steps[stage][0]}</small>
          </div>
          <motion.div
            key={stage}
            aria-live="polite"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>{steps[stage][1]}</h3>
            <p>{steps[stage][2]}</p>
            <span className="journey-output">↳ {steps[stage][3]}</span>
          </motion.div>
        </div>
      </section>
      <section className="collaboration-models page-width">
        <span className="eyebrow">
          {t(
            "COMMENT TRAVAILLER ENSEMBLE",
            "WAYS TO WORK TOGETHER",
            "كيف نعمل معاً",
          )}
        </span>
        <div className="models-layout">
          <div className="model-options">
            {models.map((m, i) => (
              <button
                key={i}
                aria-pressed={model === i}
                aria-controls="model-detail"
                onClick={() => setModel(i)}
              >
                <small>0{i + 1}</small>
                {m[0]}
                <ArrowUpRight size={22} />
              </button>
            ))}
          </div>
          <div id="model-detail" aria-live="polite">
            <h2>{models[model][1]}</h2>
            <p>{models[model][2]}</p>
            <Link className="text-link" to="/contact">
              {t(
                "Parlons du bon format",
                "Find the right fit",
                "لنختَر الصيغة المناسبة",
              )}
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
