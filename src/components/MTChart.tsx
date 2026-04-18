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
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,22,18,0.1)" />
        <XAxis
          dataKey="tHours"
          type="number"
          domain={[0, horizonHours]}
          tickFormatter={(v) => (v >= 24 ? `${(v / 24).toFixed(0)}d` : `${v.toFixed(1)}h`)}
          stroke="#3a342c"
          label={{ value: "本震からの経過時間", position: "insideBottom", offset: -2, fill: "#bbb" }}
        />
        <YAxis dataKey="m" type="number" domain={[1.5, 6]} stroke="#3a342c" label={{ value: "M", angle: -90, position: "insideLeft", fill: "#bbb" }} />
        <ZAxis dataKey="m" range={[40, 400]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload;
            return (
              <div style={{ background: "#fffaf0", border: "1px solid rgba(26,22,18,0.2)", color: "#1a1612", padding: "6px 10px", fontSize: 12, borderRadius: 6, fontFeatureSettings: "'tnum'" }}>
                <div>{p.time}</div>
                <div>M{p.m} / 震度{p.intensity}</div>
                <div>+{p.tHours >= 24 ? `${(p.tHours / 24).toFixed(2)}d` : `${p.tHours.toFixed(2)}h`}</div>
              </div>
            );
          }}
        />
        <Legend wrapperStyle={{ color: "#1a1612", fontSize: 12 }} />
        {seriesData.map((s) => (
          <Scatter key={s.name} name={s.name} data={s.points} fill={s.color} fillOpacity={0.6} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
