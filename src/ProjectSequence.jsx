import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useLocale } from "./locale";
export default function ProjectSequence({ items }) {
  const { t } = useLocale();
  const track = useRef(null),
    reduced = useReducedMotion();
  const [index, setIndex] = useState(0),
    [end, setEnd] = useState(false), [visible,setVisible]=useState(1);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const width = el.firstElementChild?.getBoundingClientRect().width || 1;
      setIndex(Math.round(el.scrollLeft / width));
      setVisible(Math.max(1,Math.floor((el.clientWidth+1)/width)));
      setEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [items.length]);
  function move(step) {
    const el = track.current,
      w = el.firstElementChild?.getBoundingClientRect().width || 0;
    el.scrollTo({
      left: Math.round(el.scrollLeft / w) * w + step * w,
      behavior: reduced ? "instant" : "smooth",
    });
  }
  if (!items.length) return null;
  return (
    <section
      className="project-sequence"
      aria-label={t(
        "La séquence visuelle",
        "The visual sequence",
        "التسلسل البصري",
      )}
    >
      <div className="sequence-heading">
        <div>
          <span className="eyebrow">
            {t("LE SYSTÈME EN IMAGES", "THE VISUAL SYSTEM", "النظام البصري")}
          </span>
          <h2>
            {t(
              "Un univers. Sans interruption.",
              "One world. Uninterrupted.",
              "عالم واحد. دون انقطاع.",
            )}
          </h2>
        </div>
        <p>
          {t(
            "Faites défiler pour suivre le fil.",
            "Scroll to follow the sequence.",
            "مرّر لمتابعة التسلسل.",
          )}
        </p>
      </div>
      <div
        className="sequence-track"
        ref={track}
        dir="ltr"
        tabIndex={0}
        aria-label={t(
          "Galerie défilante, flèches gauche et droite",
          "Scrolling gallery, left and right arrow keys",
          "معرض قابل للتمرير بأسهم اليمين واليسار",
        )}
        onKeyDown={(e) => {
          if (
            e.target === e.currentTarget &&
            ["ArrowLeft", "ArrowRight"].includes(e.key)
          ) {
            e.preventDefault();
            move(e.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        {items.map((m, i) => (
          <figure className="sequence-slide" key={m.url + "-" + i}>
            {m.kind === "video" ? (
              <video
                src={m.url}
                poster={m.poster || undefined}
                controls
                playsInline
                preload="metadata"
                aria-label={m.alt}
              />
            ) : (
              <img
                src={m.url}
                alt={m.alt}
                loading={i < 2 ? "eager" : "lazy"}
                draggable="false"
              />
            )}
          </figure>
        ))}
      </div>
      <div className="sequence-footer">
        <span aria-live="polite">
          {String(index + 1).padStart(2, "0")}{visible>1?"–"+String(Math.min(items.length,index+visible)).padStart(2,"0"):""}{" "}
          <span className="muted">
            / {String(items.length).padStart(2, "0")}
          </span>
        </span>
        <div className="sequence-progress" aria-hidden="true">
          {items.map((_, i) => (
            <i key={i} className={i >= index && i < index+visible ? "active" : ""} />
          ))}
        </div>
        <div className="sequence-buttons" dir="ltr">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => move(-1)}
            aria-label={t(
              "Image précédente",
              "Previous image",
              "الصورة السابقة",
            )}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            disabled={end}
            onClick={() => move(1)}
            aria-label={t("Image suivante", "Next image", "الصورة التالية")}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      {items[index]?.caption && (
        <p className="sequence-caption">{items[index].caption}</p>
      )}
    </section>
  );
}
