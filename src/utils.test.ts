import { describe, expect, it } from "vitest";
import type { Event, RawEvent } from "./types";
import {
  cumulativeSeries,
  elapsedDays,
  elapsedHours,
  enrich,
  intensityLabel,
  magToRadius,
  parseTime,
  rateBins,
} from "./utils";

function makeEvent(time: string, overrides: Partial<RawEvent> = {}): Event {
  const raw: RawEvent = {
    time,
    magnitude: 3.0,
    depth: 10,
    lat: 36.5,
    lon: 137.9,
    maxScale: 20,
    type: "DetailScale",
    id: `id-${time}`,
    ...overrides,
  };
  return enrich([raw])[0];
}

describe("parseTime", () => {
  it("JST文字列をUTCのDateに変換する", () => {
    const d = parseTime("2025/04/18 20:19:00");
    expect(d.toISOString()).toBe("2025-04-18T11:19:00.000Z");
  });
});

describe("intensityLabel", () => {
  it("震度階級コードをラベルにする", () => {
    expect(intensityLabel(10)).toBe("1");
    expect(intensityLabel(45)).toBe("5弱");
    expect(intensityLabel(50)).toBe("5強");
    expect(intensityLabel(70)).toBe("7");
  });

  it("null や負値は — を返す", () => {
    expect(intensityLabel(null)).toBe("—");
    expect(intensityLabel(-1)).toBe("—");
  });
});

describe("elapsedHours / elapsedDays", () => {
  it("本震からの経過を計算する", () => {
    const main = makeEvent("2026/04/18 13:20:00");
    const after = makeEvent("2026/04/19 13:20:00");
    expect(elapsedHours(after.date, main.date)).toBe(24);
    expect(elapsedDays(after.date, main.date)).toBe(1);
  });
});

describe("magToRadius", () => {
  it("規模に対して単調増加し、下限4pxを持つ", () => {
    expect(magToRadius(2)).toBe(4);
    expect(magToRadius(5)).toBeGreaterThan(magToRadius(4));
  });
});

describe("cumulativeSeries", () => {
  const main = makeEvent("2026/04/18 13:20:00");
  const events = [
    main,
    makeEvent("2026/04/18 14:20:00"),
    makeEvent("2026/04/18 16:20:00"),
    makeEvent("2026/04/20 13:20:00"),
  ];

  it("経過時間順に累積カウントする", () => {
    const out = cumulativeSeries(events, main, 8760);
    expect(out.map((p) => p.count)).toEqual([1, 2, 3, 4]);
    expect(out[1].tHours).toBe(1);
    expect(out[3].tHours).toBe(48);
  });

  it("horizonを超えるイベントは含めない", () => {
    const out = cumulativeSeries(events, main, 24);
    expect(out).toHaveLength(3);
  });

  it("本震より前のイベントは無視する", () => {
    const before = makeEvent("2026/04/18 10:00:00");
    const out = cumulativeSeries([before, ...events], main, 8760);
    expect(out).toHaveLength(4);
  });
});

describe("rateBins", () => {
  it("ビン幅あたりの頻度に正規化する", () => {
    const main = makeEvent("2026/04/18 13:20:00");
    const events = [
      main,
      makeEvent("2026/04/18 13:50:00"),
      makeEvent("2026/04/18 15:20:00"),
    ];
    const bins = rateBins(events, main, 1, 3);
    expect(bins).toHaveLength(3);
    expect(bins[0].rate).toBe(2); // 0-1h に2件 / 1h
    expect(bins[1].rate).toBe(0);
    expect(bins[2].rate).toBe(1);
  });
});
