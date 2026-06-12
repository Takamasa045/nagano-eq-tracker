import { describe, expect, it } from "vitest";
import { fitOmori } from "./omori";

/** 既知パラメータの大森則 n(t) = K/(t+c)^p からビンを合成 */
function syntheticBins(K: number, c: number, p: number, n = 24) {
  return Array.from({ length: n }, (_, i) => {
    const tHours = i + 0.5;
    return { tHours, rate: K / Math.pow(tHours + c, p) };
  });
}

describe("fitOmori", () => {
  it("合成データからパラメータを概ね復元する", () => {
    const fit = fitOmori(syntheticBins(10, 0.5, 1.1), 24);
    expect(fit).not.toBeNull();
    expect(fit!.p).toBeGreaterThan(0.8);
    expect(fit!.p).toBeLessThan(1.4);
    expect(fit!.K).toBeGreaterThan(0);
  });

  it("フィット曲線は単調減少する", () => {
    const fit = fitOmori(syntheticBins(10, 0.5, 1.1), 24);
    const rates = fit!.curve.map((c) => c.rate);
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeLessThanOrEqual(rates[i - 1]);
    }
  });

  it("有効ビンが4未満なら null", () => {
    expect(fitOmori(syntheticBins(10, 0.5, 1.1, 3), 24)).toBeNull();
    expect(fitOmori([], 24)).toBeNull();
  });

  it("rate=0 のビンはフィット対象から除外される", () => {
    const bins = [...syntheticBins(10, 0.5, 1.1, 6), { tHours: 7, rate: 0 }];
    const fit = fitOmori(bins, 24);
    expect(fit).not.toBeNull();
  });
});
