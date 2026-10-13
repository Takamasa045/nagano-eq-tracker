/**
 * グラフ共通のテーマ。安曇むすひ本体と同じ配色（霧の朝の山麓）。
 * 値は src/styles/base.css の CSS 変数と同じ。Recharts / SVG の props には
 * var() を渡せない箇所があるため、ここに定数として集約する。
 */

/** 系列色。2025年=灰、2026年=青緑。凡例・マップ・集計表すべてこの値を使う */
export const SERIES_COLOR = {
  A: "#8A938C",
  B: "#3F6E70",
} as const;

const INK = "#1E2A24";
const MUTED = "#5A665F";
const PAPER = "#FAFAF6";
const LINE = "#E2E5DE";
const FONT_LAT = '"Outfit", "Zen Kaku Gothic New", system-ui, sans-serif';

/** 軸の目盛り文字（12px・paper 上で 5.7:1） */
export const AXIS_TICK = {
  fill: MUTED,
  fontSize: 12,
  fontFamily: FONT_LAT,
} as const;

export const CHART = {
  /** 軸線 */
  axis: "#C6CCC2",
  grid: "#E4E7E1",
  /** ISTL の参考線（弁柄。地図の ISTL と同色） */
  refLine: "#8E4A2F",
  /** 大森-宇津則の参考フィット線 */
  fitLine: "#2F4A3A",
  tooltipStyle: {
    background: PAPER,
    border: `1px solid ${LINE}`,
    color: INK,
    borderRadius: 14,
    fontSize: 13,
    lineHeight: 1.6,
    boxShadow: "0 14px 36px rgba(30, 42, 36, 0.12)",
  },
} as const;

/**
 * 系列の描画アニメーションは止める。
 * Recharts の既定（約1.5秒）は prefers-reduced-motion を見ず、期間を切り替えるたびに動くため。
 */
export const NO_ANIMATION = { isAnimationActive: false } as const;
