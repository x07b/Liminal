import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { useLocale } from "./locale";
import InquiryForm from "./InquiryForm";
export default function JoinUs() {
  const { t } = useLocale(),
    [kind, setKind] = useState("freelance");
  const choices = [
    [
      "career",
      t("Rencontrer le collectif", "Meet the collective", "تعرّف على الفريق"),
      t(
        "Présentez-nous votre regard et votre pratique.",
        "Introduce your perspective and your practice.",
        "عرّفنا برؤيتك وممارستك.",
      ),
    ],
    [
      "freelance",
      t("Créer avec nous", "Create with us", "أبدع معنا"),
      t(
        "Freelance, créateur, talent indépendant.",
        "Freelancers, creators, independent talent.",
        "مستقلون، صناع محتوى، ومواهب إبداعية.",
      ),
    ],
    [
      "sponsorship",
      t("Devenir partenaire", "Become a partner", "كن شريكاً"),
      t(
        "Sponsoring, marques et projets communs.",
        "Sponsorships, brands and shared projects.",
        "رعاية، علامات تجارية، ومشاريع مشتركة.",
      ),
    ],
  ];
  return (
    <section className="join-new page-width section-space">
      <div className="join-poster">
        <div className="eyebrow">
          LIMINAL / {t("LE COLLECTIF", "THE COLLECTIVE", "المجتمع الإبداعي")}
        </div>
        <h1>
          {t("Une place pour", "A place for", "مساحة لـ")}
          <br />
          <em>{t("votre talent.", "your talent.", "موهبتك.")}</em>
        </h1>
        <img src="/brand/pictorial.svg" alt="" />
        <div className="join-poster-foot">
          <span>
            {t(
              "DES REGARDS DIFFÉRENTS. UNE ENVIE COMMUNE.",
              "DIFFERENT PERSPECTIVES. SHARED AMBITION.",
              "رؤى مختلفة. وطموح مشترك.",
            )}
          </span>
          <Plus size={32} />
        </div>
      </div>
      <div
        className="join-selector"
        role="group"
        aria-label={t(
          "Votre façon de nous rejoindre",
          "How you want to join",
          "كيف تريد الانضمام",
        )}
      >
        {choices.map(([id, title, desc], i) => (
          <button
            key={id}
            className={kind === id ? "selected" : ""}
            aria-pressed={kind === id}
            onClick={() => setKind(id)}
          >
            <span>
              0{i + 1}
              <ArrowUpRight />
            </span>
            <h2>{title}</h2>
            <p>{desc}</p>
          </button>
        ))}
      </div>
      <div className="join-application">
        <aside>
          <span className="eyebrow">
            02 / {t("FAISONS CONNAISSANCE", "LET’S MEET", "لنتعارف")}
          </span>
          <h2>{choices.find((x) => x[0] === kind)[1]}</h2>
          <p>
            {kind === "sponsorship"
              ? t(
                  "Une marque, un public, une idée à faire grandir ensemble.",
                  "A brand, an audience, an idea to grow together.",
                  "علامة، جمهور، وفكرة نطورها معاً.",
                )
              : t(
                  "Réalisation, image, photographie, motion, 3D, design, son, montage, écriture ou production : dites-nous où votre regard peut rencontrer le nôtre.",
                  "Directing, cinematography, photography, motion, 3D, design, sound, editing, writing or production: tell us where your perspective meets ours.",
                  "مسارك، طاقتك، وفكرتك. نود التعرف عليك.",
                )}
          </p>
          <small>
            {kind === "sponsorship"
              ? t(
                  "Présentez votre objectif et le partenariat que vous imaginez.",
                  "Tell us your goal and the partnership you have in mind.",
                  "عرّفنا بهدفك والشراكة التي تتخيلها.",
                )
              : kind === "freelance"
                ? t(
                    "Des collaborations selon les projets et vos disponibilités.",
                    "Collaborations shaped by projects and your availability.",
                    "تعاون حسب المشاريع وتوفرك.",
                  )
                : t(
                    "Candidatures spontanées bienvenues. Aucun poste spécifique n’est annoncé ici.",
                    "Speculative applications welcome. No specific vacancy is advertised here.",
                    "نرحب بالترشحات التلقائية. لا نعلن هنا عن وظيفة محددة.",
                  )}
          </small>
        </aside>
        <InquiryForm kind={kind} key={kind} />
      </div>
    </section>
  );
}
