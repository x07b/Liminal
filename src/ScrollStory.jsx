import TypedReveal from "./TypedReveal";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
} from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useLocation } from "react-router-dom";
import "./scroll-story.css";

// One continuous reveal keeps complete sentences readable, including RTL text.
export function ScrollCopy({ children }) { return <TypedReveal>{children}</TypedReveal>; }
export function ScrollAtmosphere() {
  const { pathname } = useLocation();
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const animations = new Set();
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          const animation = entry.target.animate(
            entry.target.matches('.story-origin-art, .person-photo, .contact-art, .join-poster')
              ? [{opacity: .35, clipPath:'inset(9% 0 9% 0)'}, {opacity:1, clipPath:'inset(0% 0 0% 0)'}]
              : [{ opacity: 0, translate: "0 22px" }, { opacity: 1, translate: "0 0" }],
            {
              duration: 850,
              easing: "cubic-bezier(.22,1,.36,1)",
              delay: Number(entry.target.dataset.revealOrder || 0) * 65,
            },
          );
          animations.add(animation);
          animation.finished
            .then(() => animations.delete(animation))
            .catch(() => {});
        }),
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );
    const scanned = new WeakSet();
    const scan = () =>
      document
        .querySelectorAll(
          "main .eyebrow, main .chapter-delivery, main .values-grid > div, main .archive-tile, main .model-options, main .service-tags, main .studio-intro > div, main .story-model p, main .story-origin-art, main .person-photo, main .contact-art, main .join-poster, main .ex-hero-description, main .ex-hero-thought, main .ex-actions, main .ex-tag, main .ex-section-intro, main .ex-story-copy, main .ex-lab-fates, main .ex-final-bottom, main .engine-card, main .engine-cycle, main .engagement-row, main .case-chapter",
        )
        .forEach((e, i) => {
          if (!scanned.has(e)) {
            scanned.add(e);
            e.dataset.revealOrder = i % 3;
            observer.observe(e);
          }
        });
    scan();
    const mutations = new MutationObserver(scan);
    const main = document.querySelector("main");
    if (main) mutations.observe(main, { childList: true, subtree: true });
    const stop = () => {
      if (media.matches) {
        observer.disconnect();
        animations.forEach((a) => a.cancel());
      }
    };
    media.addEventListener("change", stop);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      animations.forEach((a) => a.cancel());
      media.removeEventListener("change", stop);
    };
  }, [pathname]);
  return null;
}

// Keep touch, keyboard, dialogs and independently scrolling controls native.
export function SmoothScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let lenis;
    const setup = () => {
      lenis?.destroy();
      lenis = undefined;
      if (preference.matches || pathname.startsWith("/admin")) return;
      lenis = new Lenis({
        autoRaf: true, lerp: 0.075, wheelMultiplier: 0.82,
        syncTouch: false, anchors: { offset: -100 },
        prevent: node => !!node.closest?.('dialog, [role="dialog"], textarea, select, [data-lenis-prevent]'),
        virtualScroll: () => !document.querySelector('dialog[open]') && getComputedStyle(document.body).overflow !== 'hidden',
      });
    };
    setup();
    preference.addEventListener("change", setup);
    return () => { lenis?.destroy(); preference.removeEventListener("change", setup); };
  }, [pathname]);
  return null;
}
