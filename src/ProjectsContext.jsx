import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { request } from "./api";
import { useLocale, localize } from "./locale";
const Context = createContext(null);
export function ProjectsProvider({ children }) {
  const [data, setData] = useState({ projects: [], loading: true, error: "" });
  const refresh = useCallback(
    () =>
      request("/api/projects")
        .then(({ projects }) =>
          setData({ projects, loading: false, error: "" }),
        )
        .catch(() =>
          setData((d) => ({
            ...d,
            loading: false,
            error: "Les projets sont indisponibles. Réessayez.",
          })),
        ),
    [],
  );
  useEffect(() => {
    refresh();
    const update = () => refresh();
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, [refresh]);
  return (
    <Context.Provider value={{ ...data, refresh }}>{children}</Context.Provider>
  );
}
export function useProjects() {
  const data = useContext(Context),
    { locale } = useLocale();
  return {
    ...data,
    projects: data.projects.map((p) => {
      const result = localize(p, locale);
      for (const [key, value] of Object.entries(p.translations?.[locale] || {}))
        if (value?.length) result[key] = value;
      result.slug = p.slug;
      result.id = p.id;
      result.visual = p.visual;
      result.media = p.media;
      result.poster = p.poster;
      return result;
    }),
  };
}
