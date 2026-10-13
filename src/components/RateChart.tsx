import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Series } from "../types";
import { rateBins } from "../utils";
import { fitOmori } from "../omori";
import { AXIS_TICK, CHART, NO_ANIMATION } from "../chartTheme";
import { SeriesLegend, type LegendEntry } from "./SeriesLegend";
import { formatElapsed, timeTicks } from "../chartTicks";

type Props = { series: Series[]; horizonHours: number; binHours: number };

/** 大森曲線専用の X 軸 ID（ビン用の既定軸とは別） */
const FIT_AXIS_ID = "fit";

export function RateChart({ series, horizonHours, binHours }: Props) {
  const binsA = rateBins(series[0].events, series[0].mainshock, binHours, horizonHours);
  const binsB = rateBins(series[1].events, series[1].mainshock, binHours, horizonHours);
  const fitA = fitOmori(binsA, horizonHours);

  const map: Record<string, { tHours: number; A?: number; B?: number }> = {};
  for (const p of binsA) {
    map[p.tHours.toFixed(3)] = { tHours: p.tHours, A: p.rate };
  }
  for (const p of binsB) {
    const k = p.tHours.toFixed(3);
    if (!map[k]) map[k] = { tHours: p.tHours };
    map[k].B = p.rate;
  }
  // 大森曲線は専用の data と専用の（非表示）X 軸に載せる。Recharts は棒の帯幅を
  // 「その軸のデータ点の最小間隔」で決めるため、200 点の密な曲線を同じ軸に載せると
  // 棒が 0.1px になり見えなくなる。軸の範囲はビン用の X 軸と同じ [0, horizon]。
  const fitData = fitA ? fitA.curve.map((c) => ({ tHours: c.tHours, fit: c.rate })) : [];
  const data = Object.values(map).sort((a, b) => a.tHours - b.tHours);

  const legend: LegendEntry[] = [
    { label: series[0].label, color: series[0].color, shape: "bar" },
    { label: series[1].label, color: series[1].color, shape: "bar" },
  ];
  if (fitA) legend.push({ label: "大森則 (2025フィット)", color: CHART.fitLine, shape: "line-dash" });

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 8, right: 14, bottom: 4, left: 0 }} barGap={1} barCategoryGap={1}>
          <CartesianGrid strokeDasharray="3 4" stroke={CHART.grid} />
          <XAxis
            dataKey="tHours"
            type="number"
            domain={[0, horizonHours]}
            ticks={timeTicks(horizonHours)}
            tickFormatter={formatElapsed}
            tick={AXIS_TICK}
            stroke={CHART.axis}
            minTickGap={12}
          />
          {fitA && <XAxis xAxisId={FIT_AXIS_ID} dataKey="tHours" type="number" domain={[0, horizonHours]} hide />}
          <YAxis tick={AXIS_TICK} stroke={CHART.axis} width={40} />
          <Tooltip contentStyle={CHART.tooltipStyle} />
          <Bar dataKey="A" name={series[0].label} fill={series[0].color} {...NO_ANIMATION} />
          <Bar dataKey="B" name={series[1].label} fill={series[1].color} {...NO_ANIMATION} />
          {fitA && (
            <Line xAxisId={FIT_AXIS_ID} type="monotone" data={fitData} dataKey="fit" name="大森則 (2025フィット)" tooltipType="none" stroke={CHART.fitLine} dot={false} strokeWidth={2} strokeDasharray="5 3" {...NO_ANIMATION} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <SeriesLegend entries={legend} />
      {fitA && (
        <p className="fit-info caveat">
          <strong>大森則フィット</strong> ── K = {fitA.K.toFixed(2)} ／ c = {fitA.c.toFixed(3)} 時 ／ <strong>p = {fitA.p.toFixed(2)}</strong>
          <span className="fit-info__note">2025系列のビン頻度に対する参考フィット。p が 1 付近なら標準的な減衰、2026系列が同じ曲線に乗るかを目安にしてください。</span>
        </p>
      )}
    </div>
  );
}
