import { ScrollCopy } from "./ScrollStory";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  RotateCw,
  X,
} from "lucide-react";
import "./community.css";
import { useLocale } from "./locale";

const inks = [
  { id: "terracotta", name: "Terre cuite" },
  { id: "charcoal", name: "Charbon" },
  { id: "olive", name: "Olive" },
];
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

export default function HandprintWall() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [download, setDownload] = useState(null);
  const [subscribe, setSubscribe] = useState(false);
  const reduced = useReducedMotion();
  const [wall, setWall] = useState({ marks: [], total: 0, page: 0, pages: 1 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [ink, setInk] = useState("terracotta");
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [rotation, setRotation] = useState(-10);
  const [phase, setPhase] = useState("idle");
  const [message, setMessage] = useState("");
  const [freshId, setFreshId] = useState(null);
  const board = useRef(null);
  const requestId = useRef(null);
  const activeFetch = useRef(null);
  const load = useCallback(async (targetPage, silent = false) => {
    activeFetch.current?.abort();
    const controller = new AbortController();
    activeFetch.current = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/marks?page=${targetPage}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data.marks)) throw new Error();
      setWall(data);
      setLoadError("");
    } catch {
      if (activeFetch.current === controller)
        setLoadError(
          "Le mur ne répond pas pour le moment. Vos traces restent conservées.",
        );
    } finally {
      clearTimeout(timeout);
      if (activeFetch.current === controller) setLoading(false);
    }
  }, []);
  useEffect(() => {
    load(page);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load(page, true);
    }, 20000);
    return () => {
      clearInterval(timer);
      activeFetch.current?.abort();
    };
  }, [page, load]);

  const placing = phase === "placing";
  const hasPreview = placing || phase === "confirming" || phase === "saving";
  function begin(event) {
    event.preventDefault();
    if (!name.trim() || loadError || loading) return;
    requestId.current = crypto.randomUUID();
    setMessage("Déplacez votre empreinte, puis cliquez pour choisir sa place.");
    setPhase("placing");
    board.current?.focus();
    board.current?.scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "center",
    });
  }
  function point(event) {
    const box = board.current.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - box.left) / box.width) * 100, 12, 88),
      y: clamp(((event.clientY - box.top) / box.height) * 100, 16, 85),
    };
  }
  function choose(event) {
    if (!placing) return;
    setPosition(point(event));
    setPhase("confirming");
    setMessage(
      "Cette place vous plaît ? Confirmez pour laisser votre empreinte.",
    );
  }
  function moveKeys(event) {
    if (!placing) return;
    const directions = {
      ArrowLeft: [-3, 0],
      ArrowRight: [3, 0],
      ArrowUp: [0, -3],
      ArrowDown: [0, 3],
    };
    if (directions[event.key]) {
      event.preventDefault();
      const [x, y] = directions[event.key];
      setPosition((p) => ({
        x: clamp(p.x + x, 12, 88),
        y: clamp(p.y + y, 16, 85),
      }));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setPhase("confirming");
      setMessage("Place choisie. Confirmez votre empreinte.");
    } else if (event.key === "Escape") {
      setPhase("idle");
      setMessage("");
    }
  }
  function findSpace() {
    let candidate = { x: 50, y: 50 },
      distance = -1;
    for (let x = 15; x <= 85; x += 14)
      for (let y = 22; y <= 78; y += 14) {
        const nearest = wall.marks.length
          ? Math.min(
              ...wall.marks.map((m) => Math.hypot((m.x - x) * 0.8, m.y - y)),
            )
          : Math.random() * 100;
        if (nearest > distance) {
          distance = nearest;
          candidate = { x, y };
        }
      }
    setPosition(candidate);
    setPhase("confirming");
    setMessage("Une place pour vous. Confirmez votre empreinte.");
  }
  async function save() {
    if (phase !== "confirming") return;
    setPhase("saving");
    setMessage("Votre empreinte se pose…");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: name.trim(),
          email,
          subscribe,
          ink,
          ...position,
          rotation,
          requestId: requestId.current,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Impossible de poser votre empreinte. Réessayez.",
        );
      setFreshId(null);
      setDownload(data.download);
      setPhase("done");
      setMessage(
        data.subscription === "unavailable"
          ? "Empreinte reçue. La confirmation d’abonnement est indisponible pour le moment."
          : "Votre empreinte attend notre validation. Merci !",
      );
      setPage(0);
      await load(0, true);
    } catch (error) {
      setPhase("confirming");
      setMessage(
        error.name === "AbortError"
          ? "La connexion est lente. Réessayez : votre empreinte ne sera pas publiée deux fois."
          : error.message,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  return (
    <section className="handprint-section" id="leave-your-mark">
      <div className="page-width section-space">
        <div className="wall-heading">
          <div>
            <div className="eyebrow">
              <span className="small-cross">+</span>
              {t(" L’HISTOIRE CONTINUE AVEC VOUS")}
            </div>
            <h2>
              <ScrollCopy>
                {t("Leave your")}
                <br />
                <span className="serif-word">{t("mark.")}</span>
              </ScrollCopy>
            </h2>
          </div>
          <p>
            {t("Un nom. Un geste. Une trace.")}
            <br />
            {t("Vous êtes passé par ici.")}
          </p>
        </div>
        <div className="wall-layout">
          <div className="wall-panel">
            <img
              src="/brand/hand-outline.svg"
              className="wall-outline"
              alt=""
              aria-hidden="true"
            />
            {phase === "done" ? (
              <div className="wall-thanks">
                <Check size={23} />
                <h3>{t("Vous en faites partie.")}</h3>
                <p>
                  {t(
                    "Elle apparaîtra sur le mur après validation. Votre email reste privé.",
                  )}
                </p>
                {download && (
                  <a className="receipt-download" href={download} download>
                    {t(
                      "Mon empreinte en PNG",
                      "My mark as PNG",
                      "تحميل بصمتي PNG",
                    )}{" "}
                    ↗
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={begin}>
                <label htmlFor="wall-name">{t("Votre prénom ou pseudo")}</label>
                <input
                  id="wall-name"
                  required
                  maxLength={24}
                  pattern="[\p{L}\p{M}\p{N} .’'_\-]+"
                  title={t(
                    "24 caractères maximum : lettres, chiffres, espaces, tirets ou apostrophes.",
                  )}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={hasPreview}
                  placeholder={t("Comment vous appelez-vous ?")}
                  autoComplete="off"
                />
                <label htmlFor="wall-email">{t("Votre email (privé)")}</label>
                <input
                  id="wall-email"
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={hasPreview}
                  autoComplete="email"
                  dir="ltr"
                />
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={subscribe}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    disabled={hasPreview}
                  />
                  <span>
                    {t(
                      "Je souhaite recevoir les nouvelles et offres de LIMINAL. Un email me permettra de confirmer mon abonnement.",
                    )}
                  </span>
                </label>
                <fieldset disabled={phase === "saving"}>
                  <legend>{t("Votre encre")}</legend>
                  <div className="ink-options">
                    {inks.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`ink-option ink-${c.id}`}
                        aria-label={t(c.name)}
                        aria-pressed={ink === c.id}
                        onClick={() => setInk(c.id)}
                      >
                        {ink === c.id && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <p className="wall-consent">
                  {t(
                    "Votre nom et votre empreinte seront publics après validation. Votre email ne sera jamais affiché.",
                  )}
                </p>
                {!hasPreview && (
                  <button
                    className="button"
                    disabled={loading || !!loadError}
                    type="submit"
                  >
                    {t("Laisser ma trace ")}
                    <ArrowUpRight size={17} />
                  </button>
                )}
              </form>
            )}
            {hasPreview && (
              <div className="placement-actions">
                {placing ? (
                  <>
                    <p>
                      {t("Avec la souris : choisissez une place.")}
                      <br />
                      {t("Au clavier : flèches, puis Entrée.")}
                      <br />
                      {t("Sur mobile : touchez le mur.")}
                    </p>
                    <button
                      type="button"
                      className="text-link"
                      onClick={findSpace}
                    >
                      {t("Me trouver une place ")}
                      <ArrowUpRight size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="button"
                      disabled={phase === "saving"}
                      onClick={save}
                    >
                      {t(
                        phase === "saving"
                          ? "Enregistrement…"
                          : "Confirmer mon empreinte",
                      )}
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="text-link"
                      disabled={phase === "saving"}
                      onClick={() => {
                        setPhase("placing");
                        board.current?.focus();
                      }}
                    >
                      {t("Changer de place")}
                    </button>
                  </>
                )}
                <div className="placement-tools">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r >= 20 ? -20 : r + 10))}
                    disabled={phase === "saving"}
                  >
                    <RotateCw size={14} />
                    {t("Tourner")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("idle");
                      setMessage("");
                    }}
                    disabled={phase === "saving"}
                  >
                    <X size={14} />
                    {t("Annuler")}
                  </button>
                </div>
              </div>
            )}
            <p
              className={`wall-status ${phase === "done" ? "success" : ""}`}
              role="status"
            >
              {t(message)}
            </p>
          </div>
          <div className="wall-canvas-wrap">
            <div className="wall-board-meta">
              <span>{t("LE MUR DES PASSAGES")}</span>
              <span>
                {loading
                  ? "…"
                  : `${wall.total} ${t(wall.total === 1 ? "EMPREINTE" : "EMPREINTES")}`}
              </span>
            </div>
            <div
              ref={board}
              className={`handprint-board ${placing ? "is-placing" : ""}`}
              role={placing ? "button" : "region"}
              tabIndex={placing ? 0 : -1}
              aria-label={t(
                placing
                  ? "Choisir la place de votre empreinte. Utilisez les flèches puis Entrée."
                  : "Mur partagé des empreintes",
              )}
              onPointerMove={(e) => {
                if (placing && e.pointerType !== "touch") setPosition(point(e));
              }}
              onClick={choose}
              onKeyDown={moveKeys}
            >
              <div className="board-watermark" aria-hidden="true">
                {t("I was")}
                <br />
                <em>{t("here.")}</em>
              </div>
              <span className="board-corner corner-tl" aria-hidden="true">
                +
              </span>
              <span className="board-corner corner-tr" aria-hidden="true">
                +
              </span>
              <span className="board-corner corner-bl" aria-hidden="true">
                +
              </span>
              <span className="board-corner corner-br" aria-hidden="true">
                +
              </span>
              {wall.marks.map((mark) => (
                <motion.div
                  key={mark.id}
                  className={`visitor-mark ink-${mark.ink}`}
                  style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
                  initial={
                    mark.id === freshId && !reduced
                      ? { opacity: 0, scale: 1.6 }
                      : false
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="visitor-name">{mark.name}</span>
                  <span
                    className="hand-stamp"
                    style={{ transform: `rotate(${mark.rotation}deg)` }}
                    aria-hidden="true"
                  />
                </motion.div>
              ))}
              {hasPreview && (
                <div
                  className={`visitor-mark preview-mark ink-${ink}`}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  aria-hidden="true"
                >
                  <span className="visitor-name">{name.trim()}</span>
                  <span
                    className="hand-stamp"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                </div>
              )}
              {!wall.total && !hasPreview && !loading && !loadError && (
                <p className="empty-wall">
                  {t("La première trace pourrait être la vôtre.")}
                </p>
              )}
              {loading && (
                <p className="empty-wall">{t("Les empreintes arrivent…")}</p>
              )}
            </div>
            {loadError && (
              <div className="wall-error" role="alert">
                <p>{t(loadError)}</p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => load(page)}
                >
                  {t("Réessayer ")}
                  <RotateCw size={14} />
                </button>
              </div>
            )}
            <div className="wall-board-footer">
              <span>{t("FROM HUMAN TO HUMAN.")}</span>
              <div className="wall-pagination">
                <button
                  aria-label={t("Empreintes plus récentes")}
                  disabled={page === 0 || loading || hasPreview}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ArrowLeft size={16} />
                </button>
                <span>
                  {t("PAGE ")}
                  {wall.page + 1} / {wall.pages}
                </span>
                <button
                  aria-label={t("Empreintes précédentes")}
                  disabled={page >= wall.pages - 1 || loading || hasPreview}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
