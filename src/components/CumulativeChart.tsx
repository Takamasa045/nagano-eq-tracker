import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Series } from "../types";
import { cumulativeSeries } from "../utils";

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
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,22,18,0.1)" />
        <XAxis
          dataKey="tHours"
          type="number"
          domain={[0, horizonHours]}
          tickFormatter={(v) => (v >= 24 ? `${(v / 24).toFixed(0)}d` : `${v.toFixed(1)}h`)}
          stroke="#3a342c"
          label={{ value: "本震からの経過時間", position: "insideBottom", offset: -2, fill: "#bbb" }}
        />
        <YAxis stroke="#3a342c" label={{ value: "地震の合計回数", angle: -90, position: "insideLeft", fill: "#bbb" }} />
        <Tooltip
          contentStyle={{ background: "#fffaf0", border: "1px solid rgba(26,22,18,0.2)", color: "#1a1612", borderRadius: 6, fontSize: 12 }}
          labelFormatter={(v) => {
            const n = typeof v === "number" ? v : Number(v);
            return n >= 24 ? `+${(n / 24).toFixed(2)}日` : `+${n.toFixed(2)}時間`;
          }}
        />
        <Legend wrapperStyle={{ color: "#1a1612", fontSize: 12 }} />
        <Line
          type="stepAfter"
          dataKey="A"
          name={series[0].label}
          stroke={series[0].color}
          dot={false}
          strokeWidth={2}
          connectNulls
        />
        <Line
          type="stepAfter"
          dataKey="B"
          name={series[1].label}
          stroke={series[1].color}
          dot={false}
          strokeWidth={2}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
