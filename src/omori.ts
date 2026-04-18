import { levenbergMarquardt as LM } from "ml-levenberg-marquardt";

/**
 * 大森-宇津則: n(t) = K / (t + c)^p   [t in hours]
 * 累積形:    N(t) = K * ((c)^(1-p) - (t+c)^(1-p)) / (p - 1)   (p != 1)
 * ここではビン頻度 n(t) [回/時間] にフィットさせる。
 */

type Point = { tHours: number; rate: number };

export type OmoriFit = {
  K: number;
  c: number;
  p: number;
  curve: { tHours: number; rate: number }[];
};

export function fitOmori(points: Point[], horizonHours: number): OmoriFit | null {
  const usable = points.filter((p) => p.rate > 0);
  if (usable.length < 4) return null;

  const x = usable.map((p) => p.tHours);
  const y = usable.map((p) => p.rate);

  const fn = ([K, c, p]: number[]) => (t: number) => K / Math.pow(t + c, p);

  try {
    const { parameterValues } = LM(
      { x, y },
      fn,
      {
        damping: 0.01,
        initialValues: [Math.max(...y) * 0.5, 0.5, 1.1],
        maxIterations: 200,
        gradientDifference: 1e-3,
        errorTolerance: 1e-4,
      },
    );
    const [K, c, p] = parameterValues;
    if (!isFinite(K) || !isFinite(c) || !isFinite(p)) return null;
    const curve: { tHours: number; rate: number }[] = [];
    const steps = 200;
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * horizonHours;
      curve.push({ tHours: t, rate: K / Math.pow(t + c, p) });
    }
    return { K, c, p, curve };
  } catch {
    return null;
  }
}
