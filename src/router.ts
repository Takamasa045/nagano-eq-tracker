import { useEffect, useState } from "react";

export type Route = "home" | "istl" | "geology";

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, "").toLowerCase();
  if (h === "istl") return "istl";
  if (h === "geology") return "geology";
  return "home";
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

export function navigate(route: Route) {
  window.location.hash = route === "home" ? "/" : `/${route}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
