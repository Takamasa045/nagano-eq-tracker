import { describe, expect, it } from "vitest";
import { formatElapsed, timeTicks } from "./chartTicks";

/** 画面の表示期間プリセット（Home.tsx の HORIZON_PRESETS と同じ値） */
const PRESET_HOURS = [6, 24, 72, 168, 720, 8760];

describe("timeTicks", () => {
  it("6時間は 2 時間刻み", () => {
    expect(timeTicks(6)).toEqual([0, 2, 4, 6]);
  });

  it("24時間は 6 時間刻み", () => {
    expect(timeTicks(24)).toEqual([0, 6, 12, 18, 24]);
  });

  it("72時間は 1 日刻み（36h・54h のような半端な目盛りを作らない）", () => {
    expect(timeTicks(72)).toEqual([0, 24, 48, 72]);
  });

  it("7日は終端も目盛りに含む", () => {
    const ticks = timeTicks(168);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBe(168);
  });

  it("30日は 7 日刻み", () => {
    expect(timeTicks(720)).toEqual([0, 168, 336, 504, 672]);
  });

  it("1年でも目盛り数が上限を超えない", () => {
    expect(timeTicks(8760).length).toBeLessThanOrEqual(5);
  });

  it.each(PRESET_HOURS)("%i時間: 昇順・範囲内・上限以下・ラベルが重複しない", (hours) => {
    const ticks = timeTicks(hours);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < ticks.length; i++) expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(hours);

    const labels = ticks.map(formatElapsed);
    expect(new Set(labels).size).toBe(labels.length);
    // 約 326px の描画幅に 5 個並べても重ならない長さ
    for (const label of labels) expect(label.length).toBeLessThanOrEqual(4);
  });

  it("maxTicks を絞ると目盛りも減る", () => {
    expect(timeTicks(168, 3).length).toBeLessThanOrEqual(3);
  });

  it("0 以下・非有限は [0] を返す", () => {
    expect(timeTicks(0)).toEqual([0]);
    expect(timeTicks(-5)).toEqual([0]);
    expect(timeTicks(Number.NaN)).toEqual([0]);
  });
});

describe("formatElapsed", () => {
  it("0 は単位なし", () => {
    expect(formatElapsed(0)).toBe("0");
  });

  it("24 時間未満は h、端数は小数 1〜2 桁", () => {
    expect(formatElapsed(2)).toBe("2h");
    expect(formatElapsed(1.5)).toBe("1.5h");
    expect(formatElapsed(0.25)).toBe("0.25h");
  });

  it("24 時間以上は d", () => {
    expect(formatElapsed(24)).toBe("1d");
    expect(formatElapsed(36)).toBe("1.5d");
    expect(formatElapsed(168)).toBe("7d");
    expect(formatElapsed(8640)).toBe("360d");
  });
});
