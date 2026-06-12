import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Series } from "../types";
import { elapsedHours } from "../utils";
import { CHART } from "../chartTheme";

type Props = { series: Series[]; horizonHours: number };

export function MTChart({ series, horizonHours }: Props) {
  const seriesData = series.map((s) => ({
    name: s.label,
    color: s.color,
    points: s.events
      .filter((e) => e.date >= s.mainshock.date)
      .map((e) => ({
        tHours: elapsedHours(e.date, s.mainshock.date),
        m: e.magnitude,
        time: e.time,
        intensity: e.intensity,
      }))
      .filter((p) => p.tHours <= horizonHours),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
        <XAxis
          dataKey="tHours"
          type="number"
          domain={[0, horizonHours]}
          tickFormatter={(v) => (v >= 24 ? `${(v / 24).toFixed(0)}d` : `${v.toFixed(1)}h`)}
          stroke={CHART.axis}
        />
        <YAxis dataKey="m" type="number" domain={[1.5, 6]} stroke={CHART.axis} />
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
        <Legend wrapperStyle={{ color: CHART.legend, fontSize: 11 }} />
        {seriesData.map((s) => (
          <Scatter key={s.name} name={s.name} data={s.points} fill={s.color} fillOpacity={0.65} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
