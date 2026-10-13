import type { MouseEvent, ReactNode } from "react";
import { navigate, routePath, type Route } from "../router";

interface RouteLinkProps {
  to: Route;
  className?: string;
  children: ReactNode;
}

/**
 * アプリ内ページへのリンク。実 URL を href に持つので、
 * 新規タブ・URL コピー・クローラ巡回が効く。通常クリックは SPA 遷移。
 */
export function RouteLink({ to, className, children }: RouteLinkProps) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={routePath(to)} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
