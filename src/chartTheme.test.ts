/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SERIES_COLOR } from "./chartTheme";

/** base.css の :root からカスタムプロパティの色（#RRGGBB）を取り出す */
function cssToken(css: string, name: string): string | null {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match ? match[1].toUpperCase() : null;
}

describe("系列色", () => {
  it("2025年=灰 #8A938C、2026年=青緑 #3F6E70", () => {
    expect(SERIES_COLOR.A).toBe("#8A938C");
    expect(SERIES_COLOR.B).toBe("#3F6E70");
  });

  it("CSS トークン（凡例・地図・ヒーローの印）と chartTheme.ts が一致している", () => {
    const css = readFileSync(new URL("./styles/base.css", import.meta.url), "utf-8");
    expect(cssToken(css, "--series-a")).toBe(SERIES_COLOR.A.toUpperCase());
    expect(cssToken(css, "--series-b")).toBe(SERIES_COLOR.B.toUpperCase());
  });
});
