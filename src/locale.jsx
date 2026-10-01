import { createContext, useContext, useState, useEffect } from "react";
import dictionary from "./translations.json";
const Context = createContext(null);
export function translate(text, locale = "fr") {
  if (typeof text !== "string" || locale === "fr") return text;
  const translated = dictionary[text.trim()]?.[locale];
  return translated ? text.replace(text.trim(), translated) : text;
}
export function LocaleProvider({ children }) {
  const [locale, set] = useState(() => {
    try {
      return ["fr", "en", "ar"].includes(
        localStorage.getItem("liminal-language"),
      )
        ? localStorage.getItem("liminal-language")
        : "fr";
    } catch {
      return "fr";
    }
  });
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("liminal-language", locale);
    } catch {}
  }, [locale]);
  const t = (fr, en, ar) =>
    locale === "en" && en
      ? en
      : locale === "ar" && ar
        ? ar
        : translate(fr, locale);
  return (
    <Context.Provider value={{ locale, setLocale: set, t }}>
      {children}
    </Context.Provider>
  );
}
export const useLocale = () => useContext(Context);
export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <label className="language-switch">
      <span className="sr-only">Language / Langue / اللغة</span>
      <select
        aria-label="Language / Langue / اللغة"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
      >
        <option value="fr">FR</option>
        <option value="en">EN</option>
        <option value="ar">عربي</option>
      </select>
    </label>
  );
}
export function localize(value, locale) {
  if (typeof value === "string") return translate(value, locale);
  if (Array.isArray(value)) return value.map((x) => localize(x, locale));
  if (
    value &&
    typeof value === "object" &&
    typeof value.fr === "string" &&
    (typeof value.en === "string" || typeof value.ar === "string")
  )
    return value[locale] || value.fr;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, localize(v, locale)]),
    );
  return value;
}
