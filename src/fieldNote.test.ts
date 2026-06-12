import { describe, expect, it } from "vitest";
import type { Event, RawEvent, Series } from "./types";
import { buildFieldNote, hoursSince, moodLabel, STALE_THRESHOLD_HOURS } from "./fieldNote";
import { enrich } from "./utils";

function makeEvent(time: string): Event {
  const raw: RawEvent = {
    time,
    magnitude: 3.0,
    depth: 10,
    lat: 36.5,
    lon: 137.9,
    maxScale: 20,
    type: "DetailScale",
    id: `id-${time}`,
  };
  return enrich([raw])[0];
}

function makeSeries(key: "A" | "B", mainshockTime: string, eventTimes: string[]): Series {
  const mainshock = makeEvent(mainshockTime);
  return {
    key,
    label: `${key} 系列`,
    color: "#000",
    mainshock,
    events: [mainshock, ...eventTimes.map(makeEvent)],
  };
}

describe("moodLabel", () => {
  it("件数のしきい値で文言が変わる", () => {
    expect(moodLabel(0)).toContain("しずか");
    expect(moodLabel(1)).toContain("落ち着いて");
    expect(moodLabel(3)).toContain("落ち着いて");
    expect(moodLabel(4)).toContain("そわそわ");
    expect(moodLabel(10)).toContain("そわそわ");
    expect(moodLabel(11)).toContain("活発");
  });
});

describe("buildFieldNote", () => {
  const A = makeSeries("A", "2025/04/18 20:19:00", [
    "2025/04/19 00:00:00",
    "2025/04/28 12:00:00", // 10日目ごろ
  ]);
  const B = makeSeries("B", "2026/04/18 13:20:00", [
    "2026/04/19 00:00:00",
    "2026/04/27 09:00:00",
  ]);

  // B本震 2026/04/18 13:20 JST = 04:20Z。+10日と40分後を「現在」とする
  const FETCHED = "2026-04-28T05:00:00+0000";

  it("経過日数と直近7日件数を計算する", () => {
    const note = buildFieldNote([A, B], FETCHED);
    expect(note).not.toBeNull();
    expect(note!.days).toBe(10);
    // 直近7日 (2026/04/21 05:00Z 以降): 04/27 09:00 JST の1件のみ
    expect(note!.recentB).toBe(1);
    expect(note!.mood).toContain("落ち着いて");
  });

  it("去年の同経過日数時点の7日間件数を参照する", () => {
    const note = buildFieldNote([A, B], FETCHED);
    // 参照窓の終端 = A本震 + 10日 = 2025/04/28 11:19Z。
    // 04/28 12:00 JST (03:00Z) は窓内、04/19 00:00 JST は7日より前で窓外
    expect(note!.refA).toBe(1);
  });

  it("不正な日時では null を返す", () => {
    expect(buildFieldNote([A, B], "not-a-date")).toBeNull();
  });
});

describe("hoursSince / STALE_THRESHOLD_HOURS", () => {
  it("経過時間を時間単位で返す", () => {
    const now = Date.parse("2026-06-12T12:00:00Z");
    expect(hoursSince("2026-06-12T00:00:00+0000", now)).toBe(12);
  });

  it("パース不能なら null", () => {
    expect(hoursSince("oops", Date.now())).toBeNull();
  });

  it("しきい値は毎時更新の遅延を許容する", () => {
    expect(STALE_THRESHOLD_HOURS).toBeGreaterThan(24);
  });
});
