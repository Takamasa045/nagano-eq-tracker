import type { Series } from "../types";
import { intensityLabel } from "../utils";

interface IntensityHistogramProps {
  series: Series[];
}

const SCALES = [10, 20, 30, 40, 45, 50] as const;

export function IntensityHistogram({ series }: IntensityHistogramProps) {
  const counts = series.map((s) => {
    const by = new Map<number, number>();
    for (const e of s.events) {
      const scale = e.maxScale ?? -1;
      if (scale < 10) continue;
      by.set(scale, (by.get(scale) ?? 0) + 1);
    }
    return { key: s.key, color: s.color, label: s.label, by };
  });

  const maxCount = Math.max(
    1,
    ...counts.flatMap((c) => [...c.by.values()]),
  );

  const W = 560;
  const H = 220;
  const PAD_L = 44;
  const PAD_R = 12;
  const PAD_T = 18;
  const PAD_B = 34;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const groupW = plotW / SCALES.length;
  const barW = groupW / 3;

  const yTicks = [0, Math.ceil(maxCount / 2), maxCount];
  const y = (v: number) => PAD_T + plotH - (v / maxCount) * plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hist-svg" role="img" aria-label="震度別の回数">
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="var(--sumi-soft)" strokeDasharray="2 4" opacity="0.4" />
          <text x={PAD_L - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--sumi-soft)">{t}</text>
        </g>
      ))}

      {SCALES.map((scale, i) => {
        const gx = PAD_L + i * groupW;
        return (
          <g key={scale}>
            {counts.map((c, j) => {
              const val = c.by.get(scale) ?? 0;
              const bx = gx + groupW / 2 - barW + j * barW;
              const bh = (val / maxCount) * plotH;
              return (
                <g key={c.key}>
                  <rect
                    x={bx}
                    y={PAD_T + plotH - bh}
                    width={barW - 2}
                    height={bh}
                    fill={c.color}
                    opacity="0.85"
                  >
                    <title>{`${c.label} / 震度${intensityLabel(scale)}: ${val}件`}</title>
                  </rect>
                  {val > 0 && (
                    <text
                      x={bx + (barW - 2) / 2}
                      y={PAD_T + plotH - bh - 3}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--sumi)"
                    >
                      {val}
                    </text>
                  )}
                </g>
              );
            })}
            <text
              x={gx + groupW / 2}
              y={H - PAD_B + 16}
              textAnchor="middle"
              fontSize="11"
              fill="var(--sumi)"
            >
              {intensityLabel(scale)}
            </text>
          </g>
        );
      })}

      <text x={PAD_L} y={H - 6} fontSize="10" fill="var(--sumi-soft)">震度</text>

      <g transform={`translate(${W - PAD_R - 180}, ${PAD_T})`}>
        {counts.map((c, i) => (
          <g key={c.key} transform={`translate(0, ${i * 14})`}>
            <rect width="10" height="10" fill={c.color} opacity="0.85" />
            <text x="14" y="9" fontSize="10" fill="var(--sumi)">
              {c.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
