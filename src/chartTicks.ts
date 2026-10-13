/**
 * 経過時間軸（本震からの時間）の目盛り。
 *
 * Recharts の自動目盛りは 72 時間軸で 36h・54h を作り、四捨五入で「2d」が重複していた。
 * 表示期間ごとに「切りのよい刻み」を選び、目盛り数を上限で抑えることで、
 * 約 326px のスマホ幅でもラベルが重ならないようにする。
 */

/** 切りのよい刻み（時間）。小さい順に試し、最初に上限へ収まったものを使う */
const NICE_STEPS_HOURS = [0.25, 0.5, 1, 2, 3, 6, 12, 24, 48, 72, 168, 336, 720, 1440, 2160, 4320, 8760];

/** 既定の最大目盛り数（0 を含む） */
export const DEFAULT_MAX_TICKS = 5;

/** 終端を足すのは、直前の目盛りから刻みの半分以上離れているとき */
const END_TICK_MIN_GAP_RATIO = 0.5;

function ticksForStep(horizonHours: number, step: number): number[] {
  const ticks: number[] = [];
  for (let t = 0; t <= horizonHours + 1e-9; t += step) ticks.push(t);
  const last = ticks[ticks.length - 1];
  if (horizonHours - last >= step * END_TICK_MIN_GAP_RATIO) ticks.push(horizonHours);
  return ticks;
}

/** 0 〜 horizonHours の目盛り位置（時間）。昇順、最大 maxTicks 個 */
export function timeTicks(horizonHours: number, maxTicks: number = DEFAULT_MAX_TICKS): number[] {
  if (!Number.isFinite(horizonHours) || horizonHours <= 0) return [0];
  const limit = Math.max(2, Math.floor(maxTicks));
  for (const step of NICE_STEPS_HOURS) {
    const ticks = ticksForStep(horizonHours, step);
    if (ticks.length <= limit) return ticks;
  }
  // 最大刻みでも収まらない極端な期間：両端だけ
  return [0, horizonHours];
}

function trimNumber(value: number): string {
  return String(Number(value.toFixed(2)));
}

/** 目盛りラベル。0 は単位なし、24 時間未満は h、それ以上は d（4 文字以内に収まる） */
export function formatElapsed(hours: number): string {
  if (hours === 0) return "0";
  if (hours < 24) return `${trimNumber(hours)}h`;
  return `${trimNumber(hours / 24)}d`;
}
