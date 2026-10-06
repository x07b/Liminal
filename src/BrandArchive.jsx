import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, X, Maximize2 } from "lucide-react";
import { useLocale } from "./locale";
import { ScrollCopy } from "./ScrollStory";
import "./brand-experience.css";

export default function BrandArchive() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false),
    [index, setIndex] = useState(0);
  const stamp = useRef(null),
    close = useRef(null),
    lightbox = useRef(null),
    returnFocus = useRef(false);
  const reduced = useReducedMotion();
  const pages = [
    {
      image: "/brand/archive/stone-hand.png",
      title: t("Une présence.", "A presence.", "حضور."),
      label: t("01 / LA TRACE", "01 / THE TRACE", "01 / الأثر"),
      text: t(
        "Une main, une surface, une trace. Ce geste simple est le point de départ de notre réflexion : comment rendre une présence visible ?",
        "A hand, a surface, a trace. This simple gesture starts our thinking: how do you make a presence visible?",
        "يد وسطح وأثر. من هذه الحركة البسيطة يبدأ تفكيرنا: كيف نجعل الحضور مرئياً؟",
      ),
      credit: t(
        "Référence visuelle du studio · lieu et date non documentés.",
        "Studio visual reference · location and date undocumented.",
        "مرجع بصري للاستوديو · المكان والتاريخ غير موثقين.",
      ),
    },
    {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/f/f4/SantaCruz-CuevaManos-P2210651b.jpg",
      title: t(
        "Dire : nous étions là.",
        "To say: we were here.",
        "لنقول: كنا هنا.",
      ),
      label: t("02 / LA MÉMOIRE", "02 / THE MEMORY", "02 / الذاكرة"),
      text: t(
        "À la Cueva de las Manos, en Argentine, les mains se répondent sur la roche. Ce n’est pas la première empreinte du monde : c’est une référence à ce besoin humain de laisser une trace.",
        "At Cueva de las Manos in Argentina, hands echo across the rock. Not the world’s first handprint, but a reference to the human need to leave a trace.",
        "في كهف الأيدي بالأرجنتين تتجاور آثار الأيدي على الصخر. ليست أول بصمة في العالم، بل مرجع لرغبة الإنسان في ترك أثر.",
      ),
      credit: "Mariano · Cueva de las Manos · CC BY-SA 3.0",
      source:
        "https://commons.wikimedia.org/wiki/File:SantaCruz-CuevaManos-P2210651b.jpg",
    },
    {
      image: "/brand/pictorial.svg",
      title: t(
        "Le geste devient signe.",
        "The gesture becomes a sign.",
        "الحركة تصبح علامة.",
      ),
      label: t("03 / LIMINAL", "03 / LIMINAL", "03 / LIMINAL"),
      text: t(
        "Notre main garde ce qui compte : la présence humaine derrière chaque image. Une forme singulière, ouverte, imparfaite. Notre signature, du premier geste au dernier détail.",
        "Our hand keeps what matters: the human presence behind every image. A singular, open, imperfect shape. Our signature, from the first gesture to the final detail.",
        "تحتفظ يدنا بما يهم: الحضور الإنساني وراء كل صورة. شكل متفرد ومنفتح وغير مثالي. توقيعنا من أول حركة إلى آخر تفصيل.",
      ),
      credit: "LIMINAL · Human first. Always.",
    },
  ];
  pages.push({
    image: "/brand/archive/gold-hand.png",
    title: t("Notre empreinte.", "Our mark.", "بصمتنا."),
    label: "04 / THE SIGNATURE",
    text: pages[2].text,
    credit: "LIMINAL",
  });
  const page = pages[index];
  function dismiss() {
    returnFocus.current = true;
    setOpen(false);
  }
  function enlarge(i) {
    setIndex(i);
    lightbox.current.showModal();
  }
  return (
    <section
      className="brand-archive page-width"
      aria-label={t("Le signe LIMINAL", "The LIMINAL mark", "علامة LIMINAL")}
    >
      <div className="archive-topline">
        <span className="eyebrow">
          LIMINAL / {t("LE SIGNE", "THE MARK", "العلامة")}
        </span>
        <span>HUMAN FIRST. ALWAYS.</span>
      </div>
      <div className={"archive-stage " + (open ? "is-gallery" : "")}>
        <AnimatePresence mode="wait" initial={false}>
          {!open ? (
            <motion.div
              key="stamp"
              className="stamp-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.4 }}
              onAnimationComplete={() => {
                if (returnFocus.current) {
                  stamp.current?.focus({ preventScroll: true });
                  returnFocus.current = false;
                }
              }}
            >
              <button
                ref={stamp}
                className="stamp-button"
                aria-label={t(
                  "Ouvrir les origines du signe",
                  "Open the origins of the mark",
                  "افتح أصل العلامة",
                )}
                onClick={() => setOpen(true)}
              >
                <span className="gold-hand-frame">
                  <img src="/brand/archive/gold-hand.png" alt="" />
                </span>
                <span>
                  {t(
                    "Chaque signe a une histoire.",
                    "Every mark has a story.",
                    "لكل علامة حكاية.",
                  )}
                  <ArrowRight size={16} />
                </span>
              </button>
              <p>
                {t(
                  "Touchez notre empreinte.",
                  "Touch our mark.",
                  "المس بصمتنا.",
                )}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="gallery"
              className="archive-gallery"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.5 }}
              onAnimationComplete={() =>
                close.current?.focus({ preventScroll: true })
              }
            >
              <button
                ref={close}
                className="archive-close"
                onClick={dismiss}
                aria-label={t(
                  "Revenir au sceau",
                  "Return to the stamp",
                  "العودة إلى الختم",
                )}
              >
                <X size={20} />
              </button>
              <div className="archive-gallery-heading">
                <span className="eyebrow">
                  {t(
                    "LES ORIGINES DU SIGNE",
                    "ORIGINS OF THE MARK",
                    "أصل العلامة",
                  )}
                </span>
                <h2>
                  <ScrollCopy>
                    {t("D’un geste,", "From a gesture,", "من حركة،")}{" "}
                    <em>{t("une signature.", "a signature.", "إلى توقيع.")}</em>
                  </ScrollCopy>
                </h2>
                <p>
                  {t(
                    "La pierre garde la trace. L’image la transmet. Notre main en prolonge l’idée.",
                    "Stone holds the trace. Images carry it forward. Our hand continues the idea.",
                    "يحفظ الحجر الأثر. وتنقله الصورة. وتواصل يدنا الفكرة.",
                  )}
                </p>
              </div>
              <div className="archive-gallery-grid">
                {pages.map((p, i) => (
                  <figure key={p.image} className={"archive-tile tile-" + i}>
                    <button
                      onClick={() => enlarge(i)}
                      aria-label={
                        t("Agrandir : ", "Enlarge: ", "تكبير: ") + p.title
                      }
                    >
                      <img src={p.image} alt={p.title} loading="lazy" />
                      <span className="image-expand">
                        <Maximize2 size={17} />
                      </span>
                    </button>
                    <figcaption>
                      <small>0{i + 1}</small>
                      {p.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="archive-gallery-hint">
                {t(
                  "Une image vous appelle ? Ouvrez-la.",
                  "An image catches your eye? Open it.",
                  "شدّت صورة انتباهك؟ افتحها.",
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <dialog
        ref={lightbox}
        className="archive-lightbox"
        aria-label={t("Image agrandie", "Enlarged image", "صورة مكبرة")}
        onClick={(e) => {
          if (e.target === lightbox.current) lightbox.current.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setIndex((v) => (v + 1) % pages.length);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            setIndex((v) => (v + pages.length - 1) % pages.length);
          }
        }}
      >
        <button
          autoFocus
          className="archive-close"
          onClick={() => lightbox.current.close()}
          aria-label={t("Fermer l’image", "Close image", "إغلاق الصورة")}
        >
          <X />
        </button>
        <img className="lightbox-image" src={page.image} alt={page.title} />
        <div className="lightbox-caption" aria-live="polite">
          <h3>{page.title}</h3>
          <p>{page.text}</p>
          <small>
            {page.source ? (
              <>
                <a href={page.source} target="_blank" rel="noreferrer">
                  {page.credit}
                </a>{" "}
                ·{" "}
                <a
                  href="https://creativecommons.org/licenses/by-sa/3.0/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Licence
                </a>
              </>
            ) : (
              page.credit
            )}
          </small>
        </div>
        <div className="lightbox-nav">
          <button
            aria-label={t(
              "Image précédente",
              "Previous image",
              "الصورة السابقة",
            )}
            onClick={() => setIndex((index + pages.length - 1) % pages.length)}
          >
            <ArrowLeft />
          </button>
          <span>
            {index + 1} / {pages.length}
          </span>
          <button
            aria-label={t("Image suivante", "Next image", "الصورة التالية")}
            onClick={() => setIndex((index + 1) % pages.length)}
          >
            <ArrowRight />
          </button>
        </div>
      </dialog>
    </section>
  );
}
