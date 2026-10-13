import type { Series } from "../types";
import { intensityLabel } from "../utils";
import { AXIS_TICK, CHART } from "../chartTheme";
import { SeriesLegend } from "./SeriesLegend";

interface IntensityHistogramProps {
  series: Series[];
}

const SCALES = [10, 20, 30, 40, 45, 50] as const;

// viewBox は表示幅（約 326〜392px）に近い値にして、文字が縮小されて小さくならないようにする
const W = 360;
const H = 232;
const PAD_L = 34;
const PAD_R = 8;
const PAD_T = 22;
const PAD_B = 36;

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

  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const groupW = plotW / SCALES.length;
  const barW = groupW / 3;

  const yTicks = [0, Math.ceil(maxCount / 2), maxCount];
  const y = (v: number) => PAD_T + plotH - (v / maxCount) * plotH;

  return (
    <figure className="hist">
      <svg viewBox={`0 0 ${W} ${H}`} className="hist-svg" aria-hidden="true" focusable="false">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke={CHART.grid} strokeDasharray="3 4" />
            <text x={PAD_L - 8} y={y(t) + 4} textAnchor="end" {...AXIS_TICK}>{t}</text>
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
                      rx={2}
                      fill={c.color}
                    >
                      <title>{`${c.label} / 震度${intensityLabel(scale)}: ${val}件`}</title>
                    </rect>
                    {val > 0 && (
                      <text
                        x={bx + (barW - 2) / 2}
                        y={PAD_T + plotH - bh - 5}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={600}
                        fontFamily={AXIS_TICK.fontFamily}
                        fill="#1E2A24"
                      >
                        {val}
                      </text>
                    )}
                  </g>
                );
              })}
              <text
                x={gx + groupW / 2}
                y={H - PAD_B + 20}
                textAnchor="middle"
                {...AXIS_TICK}
                fontSize={13}
                fill="#1E2A24"
              >
                {intensityLabel(scale)}
              </text>
            </g>
          );
        })}

        <text x={PAD_L} y={H - 4} {...AXIS_TICK}>震度</text>
      </svg>

      <SeriesLegend entries={counts.map((c) => ({ label: c.label, color: c.color, shape: "bar" as const }))} />

      <table className="sr-only">
        <caption>震度別の回数</caption>
        <thead>
          <tr>
            <th scope="col">震度</th>
            {counts.map((c) => (
              <th key={c.key} scope="col">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SCALES.map((scale) => (
            <tr key={scale}>
              <th scope="row">{intensityLabel(scale)}</th>
              {counts.map((c) => (
                <td key={c.key}>{c.by.get(scale) ?? 0}件</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
