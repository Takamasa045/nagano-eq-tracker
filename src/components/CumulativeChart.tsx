import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Series } from "../types";
import { cumulativeSeries } from "../utils";
import { AXIS_TICK, CHART, NO_ANIMATION } from "../chartTheme";
import { SeriesLegend } from "./SeriesLegend";
import { formatElapsed, timeTicks } from "../chartTicks";

type Props = { series: Series[]; horizonHours: number };

export function CumulativeChart({ series, horizonHours }: Props) {
  // join two series on tHours grid
  const sa = cumulativeSeries(series[0].events, series[0].mainshock, horizonHours);
  const sb = cumulativeSeries(series[1].events, series[1].mainshock, horizonHours);
  const map: Record<string, { tHours: number; A?: number; B?: number }> = {};
  for (const p of sa) {
    const k = p.tHours.toFixed(3);
    map[k] = { tHours: p.tHours, A: p.count };
  }
  for (const p of sb) {
    const k = p.tHours.toFixed(3);
    if (!map[k]) map[k] = { tHours: p.tHours };
    map[k].B = p.count;
  }
  const data = Object.values(map).sort((a, b) => a.tHours - b.tHours);

  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 14, bottom: 4, left: 0 }}>
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
          <YAxis tick={AXIS_TICK} stroke={CHART.axis} width={40} />
          <Tooltip
            contentStyle={CHART.tooltipStyle}
            labelFormatter={(v) => {
              const n = typeof v === "number" ? v : Number(v);
              return n >= 24 ? `+${(n / 24).toFixed(2)}日` : `+${n.toFixed(2)}時間`;
            }}
          />
          <Line
            type="stepAfter"
            dataKey="A"
            name={series[0].label}
            stroke={series[0].color}
            dot={false}
            strokeWidth={2.4}
            strokeDasharray="6 4"
            connectNulls
            {...NO_ANIMATION}
          />
          <Line
            type="stepAfter"
            dataKey="B"
            name={series[1].label}
            stroke={series[1].color}
            dot={false}
            strokeWidth={2.4}
            connectNulls
            {...NO_ANIMATION}
          />
        </LineChart>
      </ResponsiveContainer>
      <SeriesLegend
        entries={[
          { label: series[0].label, color: series[0].color, shape: "line-dash" },
          { label: series[1].label, color: series[1].color, shape: "line-solid" },
        ]}
      />
    </>
  );
}
