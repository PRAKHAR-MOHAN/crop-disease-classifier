import { describe, it, expect } from "vitest";
import { getConfidenceTier } from "../lib/confidenceColor";

describe("getConfidenceTier", () => {
  it("assigns high tier for confidence >= 0.80", () => {
    const res95 = getConfidenceTier(0.95);
    expect(res95.tier).toBe("high");
    expect(res95.percent).toBe(95);
    expect(res95.dotColor).toBe("bg-emerald-500");

    const res80 = getConfidenceTier(0.8);
    expect(res80.tier).toBe("high");
    expect(res80.percent).toBe(80);
  });

  it("assigns moderate tier for 0.50 <= confidence < 0.80", () => {
    const res76 = getConfidenceTier(0.76);
    expect(res76.tier).toBe("moderate");
    expect(res76.percent).toBe(76);
    expect(res76.dotColor).toBe("bg-amber-500");

    const res50 = getConfidenceTier(0.5);
    expect(res50.tier).toBe("moderate");
    expect(res50.percent).toBe(50);
  });

  it("assigns low tier for confidence < 0.50", () => {
    const res35 = getConfidenceTier(0.35);
    expect(res35.tier).toBe("low");
    expect(res35.percent).toBe(35);
    expect(res35.dotColor).toBe("bg-rose-500");
  });

  it("clamps out of bounds confidence gracefully", () => {
    const resNeg = getConfidenceTier(-0.5);
    expect(resNeg.percent).toBe(0);
    expect(resNeg.tier).toBe("low");

    const resOver = getConfidenceTier(1.5);
    expect(resOver.percent).toBe(100);
    expect(resOver.tier).toBe("high");
  });
});

