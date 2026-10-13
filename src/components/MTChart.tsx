import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Series } from "../types";
import { elapsedHours } from "../utils";
import { AXIS_TICK, CHART, NO_ANIMATION } from "../chartTheme";
import { SeriesLegend } from "./SeriesLegend";
import { formatElapsed, timeTicks } from "../chartTicks";

type Props = {
  series: Series[];
  horizonHours: number;
  onFocus?: (id: string | null) => void;
};

function payloadId(d: unknown): string | null {
  const p = (d as { payload?: { id?: string } } | undefined)?.payload;
  return p?.id ?? null;
}

export function MTChart({ series, horizonHours, onFocus }: Props) {
  const seriesData = series.map((s) => ({
    name: s.label,
    color: s.color,
    hollow: s.key === "A", // 2025=中空, 2026=塗り（色覚多様性対応）
    points: s.events
      .filter((e) => e.date >= s.mainshock.date)
      .map((e) => ({
        id: e.id,
        tHours: elapsedHours(e.date, s.mainshock.date),
        m: e.magnitude,
        time: e.time,
        intensity: e.intensity,
      }))
      .filter((p) => p.tHours <= horizonHours),
  }));

  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 8, right: 14, bottom: 4, left: 0 }}>
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
          <YAxis dataKey="m" type="number" domain={[1.5, 6]} tick={AXIS_TICK} stroke={CHART.axis} width={40} />
          <ZAxis dataKey="m" range={[30, 300]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div style={{ ...CHART.tooltipStyle, padding: "6px 10px", fontFeatureSettings: "'tnum'" }}>
                  <div>{p.time}</div>
                  <div>M{p.m} / 震度{p.intensity}</div>
                  <div>+{p.tHours >= 24 ? `${(p.tHours / 24).toFixed(2)}d` : `${p.tHours.toFixed(2)}h`}</div>
                </div>
              );
            }}
          />
          {seriesData.map((s) => (
            <Scatter
              key={s.name}
              name={s.name}
              data={s.points}
              fill={s.hollow ? "none" : s.color}
              fillOpacity={s.hollow ? 1 : 0.6}
              stroke={s.color}
              strokeWidth={s.hollow ? 1.6 : 1.2}
              onMouseEnter={(d: unknown) => {
                const id = payloadId(d);
                if (id) onFocus?.(id);
              }}
              onMouseLeave={() => onFocus?.(null)}
              {...NO_ANIMATION}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <SeriesLegend
        entries={series.map((s) => ({
          label: s.label,
          color: s.color,
          shape: s.key === "A" ? "ring" : "dot",
        }))}
      />
    </>
  );
}
