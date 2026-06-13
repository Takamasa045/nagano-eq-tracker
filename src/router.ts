import { useEffect, useState } from "react";

export type Route = "home" | "istl" | "geology";

const SITE = "https://nagano-eq-tracker.pages.dev";

interface RouteMeta {
  path: string;
  title: string;
  description: string;
  ogTitle: string;
}

const ROUTES: Record<Route, RouteMeta> = {
  home: {
    path: "/",
    title: "長野県北部・余震観測室｜2025・2026 余震トラッカー",
    ogTitle: "また同じ日に、揺れた。｜長野県北部・余震観測室",
    description:
      "長野県北部の地震活動を可視化。2025年4月18日と2026年4月18日、同震源域・1年違いの本震の余震を経過時間軸で比較するトラッカー。",
  },
  istl: {
    path: "/istl",
    title: "糸魚川-静岡構造線｜長野県北部・余震観測室",
    ogTitle: "糸魚川-静岡構造線｜長野県北部・余震観測室",
    description:
      "日本を東西に分ける全長158kmの大断層・糸魚川-静岡構造線（ISTL）。4つの区間の長期評価と、神城断層地震など過去の地震を解説。",
  },
  geology: {
    path: "/geology",
    title: "北アルプスと縫い目｜長野県北部・余震観測室",
    ogTitle: "北アルプスと縫い目｜長野県北部・余震観測室",
    description:
      "震源の西にそびえる北アルプス後立山連峰と、フォッサマグナ西縁という地質の継ぎ目。いまも山を持ち上げ続けるISTLの逆断層運動を解説。",
  },
};

const ROUTE_CHANGE = "route-change";

function routeFromPath(pathname: string): Route {
  // base path "/" 前提。末尾スラッシュを正規化して判定
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/istl") return "istl";
  if (p === "/geology") return "geology";
  return "home";
}

function setAttr(selector: string, attr: string, value: string): void {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/** ルートごとに title / description / canonical / og:* を更新（SEO・SNS共有用） */
function applyMeta(route: Route): void {
  const meta = ROUTES[route];
  const url = SITE + meta.path;
  document.title = meta.title;
  setAttr('meta[name="description"]', "content", meta.description);
  setAttr('meta[property="og:title"]', "content", meta.ogTitle);
  setAttr('meta[property="og:description"]', "content", meta.description);
  setAttr('meta[property="og:url"]', "content", url);
  setAttr('link[rel="canonical"]', "href", url);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));

  useEffect(() => {
    const onChange = () => setRoute(routeFromPath(window.location.pathname));
    // popstate: ブラウザの戻る/進む、route-change: navigate() からの遷移
    window.addEventListener("popstate", onChange);
    window.addEventListener(ROUTE_CHANGE, onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener(ROUTE_CHANGE, onChange);
    };
  }, []);

  useEffect(() => {
    applyMeta(route);
  }, [route]);

  return route;
}

export function navigate(route: Route): void {
  const meta = ROUTES[route];
  if (window.location.pathname !== meta.path) {
    window.history.pushState({ route }, "", meta.path);
  }
  window.dispatchEvent(new Event(ROUTE_CHANGE));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
