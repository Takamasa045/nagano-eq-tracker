import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Series } from "../types";
import { rateBins } from "../utils";
import { fitOmori } from "../omori";

type Props = { series: Series[]; horizonHours: number; binHours: number };

export function RateChart({ series, horizonHours, binHours }: Props) {
  const binsA = rateBins(series[0].events, series[0].mainshock, binHours, horizonHours);
  const binsB = rateBins(series[1].events, series[1].mainshock, binHours, horizonHours);
  const fitA = fitOmori(binsA, horizonHours);

  const map: Record<string, { tHours: number; A?: number; B?: number; fit?: number }> = {};
  for (const p of binsA) {
    map[p.tHours.toFixed(3)] = { tHours: p.tHours, A: p.rate };
  }
  for (const p of binsB) {
    const k = p.tHours.toFixed(3);
    if (!map[k]) map[k] = { tHours: p.tHours };
    map[k].B = p.rate;
  }
  if (fitA) {
    for (const c of fitA.curve) {
      const k = c.tHours.toFixed(3);
      if (!map[k]) map[k] = { tHours: c.tHours };
      map[k].fit = c.rate;
    }
  }
  const data = Object.values(map).sort((a, b) => a.tHours - b.tHours);

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,22,18,0.1)" />
          <XAxis
            dataKey="tHours"
            type="number"
            domain={[0, horizonHours]}
            tickFormatter={(v) => (v >= 24 ? `${(v / 24).toFixed(0)}d` : `${v.toFixed(1)}h`)}
            stroke="#3a342c"
            label={{ value: "本震からの経過時間", position: "insideBottom", offset: -2, fill: "#bbb" }}
          />
          <YAxis stroke="#3a342c" label={{ value: "回/時", angle: -90, position: "insideLeft", fill: "#bbb" }} />
          <Tooltip contentStyle={{ background: "#fffaf0", border: "1px solid rgba(26,22,18,0.2)", color: "#1a1612", borderRadius: 6, fontSize: 12 }} />
          <Legend wrapperStyle={{ color: "#1a1612", fontSize: 12 }} />
          <Bar dataKey="A" name={series[0].label} fill={series[0].color} fillOpacity={0.55} />
          <Bar dataKey="B" name={series[1].label} fill={series[1].color} fillOpacity={0.85} />
          {fitA && (
            <Line type="monotone" dataKey="fit" name="大森則 (2025フィット)" stroke="#1a1612" dot={false} strokeWidth={1.5} strokeDasharray="5 3" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {fitA && (
        <p className="fit-info">
          <strong>大森則フィット</strong> ── K = {fitA.K.toFixed(2)} ／ c = {fitA.c.toFixed(3)} 時 ／ <strong>p = {fitA.p.toFixed(2)}</strong>
          <span className="muted">2025系列のビン頻度に対する参考フィット。p が 1 付近なら標準的な減衰、2026系列が同じ曲線に乗るかを目安にしてください。</span>
        </p>
      )}
    </div>
  );
}
