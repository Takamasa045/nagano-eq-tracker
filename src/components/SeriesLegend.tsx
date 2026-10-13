import type { CSSProperties } from "react";

/** 凡例の印の形。色だけに頼らず、形（中空/塗り・破線/実線）でも系列を区別する */
export type LegendShape = "line-solid" | "line-dash" | "ring" | "dot" | "bar";

export interface LegendEntry {
  label: string;
  color: string;
  shape: LegendShape;
}

interface SeriesLegendProps {
  entries: LegendEntry[];
}

/**
 * グラフ共通の凡例。系列色は chartTheme.ts の SERIES_COLOR をそのまま使い、
 * 文字は ink（灰の系列色は文字として 3:1 しかないため）。
 * Recharts 標準の凡例は中空（fill="none"）の散布図で印が描かれないため使わない。
 */
export function SeriesLegend({ entries }: SeriesLegendProps) {
  return (
    <ul className="series-legend">
      {entries.map((e) => (
        <li key={e.label}>
          <i
            className={`series-legend__mark series-legend__mark--${e.shape}`}
            style={{ "--mark": e.color } as CSSProperties}
            aria-hidden
          />
          {e.label}
        </li>
      ))}
    </ul>
  );
}
