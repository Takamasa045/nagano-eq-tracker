import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { Series } from "../types";

type Props = { series: Series[] };

/**
 * E-W 縦断面: 経度を横軸、深さ(km)を縦軸に。
 * 震源域はフォッサマグナ西縁・糸魚川-静岡構造線(ISTL)の近傍にあり、
 * 浅部に集中するのが特徴。
 */
export function DepthChart({ series }: Props) {
  // P2P APIの震源は0.1°精度なので、ほぼ同一座標に集中する。
  // 同位置の重なりを可視化するため、deterministicな擬似ジッタを加える。
  const jitter = (seed: string) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    const lonJ = ((h & 0xff) / 255 - 0.5) * 0.04; // ±0.02度
    const depJ = (((h >> 8) & 0xff) / 255 - 0.5) * 4; // ±2km
    return { lonJ, depJ };
  };

  const data = series.map((s) => ({
    name: s.label,
    color: s.color,
    points: s.events
      .filter((e) => e.depth != null)
      .map((e) => {
        const { lonJ, depJ } = jitter(e.id);
        return {
          lon: e.lon + lonJ,
          depth: Math.max(0, (e.depth ?? 10) + depJ),
          m: e.magnitude,
          time: e.time,
          intensity: e.intensity,
        };
      }),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,22,18,0.1)" />
        <XAxis
          dataKey="lon"
          type="number"
          domain={[137.7, 138.1]}
          tickFormatter={(v) => `${v.toFixed(2)}°E`}
          stroke="#3a342c"
          label={{ value: "経度（西 ←→ 東）", position: "insideBottom", offset: -2, fill: "#3a342c" }}
        />
        <YAxis
          dataKey="depth"
          type="number"
          domain={[0, 30]}
          reversed
          tickFormatter={(v) => `${v}km`}
          stroke="#3a342c"
          label={{ value: "深さ", angle: -90, position: "insideLeft", fill: "#3a342c" }}
        />
        <ZAxis dataKey="m" range={[60, 600]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload;
            return (
              <div style={{ background: "#fffaf0", border: "1px solid rgba(26,22,18,0.2)", color: "#1a1612", padding: "6px 10px", fontSize: 12, borderRadius: 6 }}>
                <div>{p.time}</div>
                <div>M{p.m} / 震度{p.intensity}</div>
                <div>深さ {p.depth}km / {p.lon.toFixed(3)}°E</div>
              </div>
            );
          }}
        />
        <Legend wrapperStyle={{ color: "#1a1612", fontSize: 12 }} />
        {/* ISTL推定通過位置（北部で東経137.85°前後） */}
        <ReferenceLine x={137.85} stroke="#3b6a8a" strokeDasharray="6 3" label={{ value: "ISTL付近", position: "top", fill: "#3b6a8a", fontSize: 11 }} />
        {data.map((s) => (
          <Scatter key={s.name} name={s.name} data={s.points} fill={s.color} fillOpacity={0.65} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
