import type { Series } from "./types";

const DAY = 86_400_000;

export interface FieldNote {
  /** 今年の本震からの経過日数 */
  days: number;
  /** 直近7日間の有感余震数（今年の系列） */
  recentB: number;
  /** 去年の系列の「同じ経過日数」時点の直近7日間の件数 */
  refA: number;
  /** 活動の様子をやさしい言葉で */
  mood: string;
}

export function moodLabel(recentCount: number): string {
  if (recentCount === 0) return "山はとてもしずかです。";
  if (recentCount <= 3) return "だいぶ落ち着いてきました。";
  if (recentCount <= 10) return "まだ地面がときどき、そわそわしています。";
  return "活発な状態がつづいています。";
}

/** 観測メモ：直近の活動を比較つきで要約（しきい値は決め打ち） */
export function buildFieldNote(series: Series[], fetchedAt: string): FieldNote | null {
  const now = new Date(fetchedAt);
  if (Number.isNaN(now.getTime())) return null;
  const [a, b] = series;
  if (!a || !b) return null;

  const days = Math.max(0, Math.floor((now.getTime() - b.mainshock.date.getTime()) / DAY));
  const recentB = b.events.filter((e) => now.getTime() - e.date.getTime() <= 7 * DAY).length;

  const refEnd = a.mainshock.date.getTime() + days * DAY;
  const refA = a.events.filter((e) => {
    const t = e.date.getTime();
    return t <= refEnd && refEnd - t <= 7 * DAY;
  }).length;

  return { days, recentB, refA, mood: moodLabel(recentB) };
}

/** データ取得時刻からの経過時間（時間）。パース不能なら null */
export function hoursSince(fetchedAt: string, nowMs: number = Date.now()): number | null {
  const t = new Date(fetchedAt).getTime();
  if (Number.isNaN(t)) return null;
  return (nowMs - t) / 3_600_000;
}

/** 毎時更新がこの時間を超えて止まっていたら警告を出す */
export const STALE_THRESHOLD_HOURS = 26;
