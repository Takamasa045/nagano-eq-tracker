import type { Event, RawEvent } from "./types";

const SCALE_MAP: Record<number, string> = {
  10: "1",
  20: "2",
  30: "3",
  40: "4",
  45: "5弱",
  50: "5強",
  55: "6弱",
  60: "6強",
  70: "7",
};

export function intensityLabel(maxScale: number | null): string {
  if (maxScale == null || maxScale < 0) return "—";
  return SCALE_MAP[maxScale] ?? String(maxScale);
}

export function parseTime(t: string): Date {
  // "2025/04/18 18:26:00" -> Date in JST. Treat as JST (UTC+9).
  const [d, hms] = t.split(" ");
  const [y, m, day] = d.split("/").map(Number);
  const [hh, mm, ss] = hms.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, day, hh - 9, mm, ss));
}

export function enrich(events: RawEvent[]): Event[] {
  return events.map((e) => ({
    ...e,
    date: parseTime(e.time),
    intensity: intensityLabel(e.maxScale),
  }));
}

export const MAINSHOCK_A_TIME = "2025/04/18 20:19:00";
export const MAINSHOCK_B_TIME = "2026/04/18 13:20:00";

export function elapsedHours(eventDate: Date, mainshockDate: Date): number {
  return (eventDate.getTime() - mainshockDate.getTime()) / 3_600_000;
}

export function elapsedDays(eventDate: Date, mainshockDate: Date): number {
  return elapsedHours(eventDate, mainshockDate) / 24;
}

/** Magnitude → marker radius (px) */
export function magToRadius(m: number): number {
  return Math.max(4, Math.pow(2, m - 1));
}

/** Cumulative event count vs elapsed hours since mainshock */
export function cumulativeSeries(
  events: Event[],
  mainshock: Event,
  upToHours: number,
): { tHours: number; count: number; m: number }[] {
  const sorted = events
    .filter((e) => e.date >= mainshock.date)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const out: { tHours: number; count: number; m: number }[] = [];
  let count = 0;
  for (const e of sorted) {
    const t = elapsedHours(e.date, mainshock.date);
    if (t > upToHours) break;
    count += 1;
    out.push({ tHours: t, count, m: e.magnitude });
  }
  return out;
}

/** 等差 hour bins へのヒストグラム (count per bin width) */
export function rateBins(
  events: Event[],
  mainshock: Event,
  binHours: number,
  upToHours: number,
): { tHours: number; rate: number }[] {
  const bins = Math.ceil(upToHours / binHours);
  const counts = new Array(bins).fill(0);
  for (const e of events) {
    if (e.date < mainshock.date) continue;
    const t = elapsedHours(e.date, mainshock.date);
    if (t > upToHours) continue;
    const idx = Math.floor(t / binHours);
    if (idx >= 0 && idx < bins) counts[idx] += 1;
  }
  return counts.map((c, i) => ({
    tHours: i * binHours + binHours / 2,
    rate: c / binHours,
  }));
}
