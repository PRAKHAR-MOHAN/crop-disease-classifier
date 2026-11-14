import { describe, it, expect } from "vitest";
import { parseClassName } from "../lib/parseClassName";

describe("parseClassName", () => {
  it("parses valid Crop___Disease label correctly", () => {
    const res = parseClassName("Tomato___Early_blight");
    expect(res.crop).toBe("Tomato");
    expect(res.disease).toBe("Early blight");
    expect(res.displayName).toBe("Tomato · Early blight");
    expect(res.cropEmoji).toBe("🍅");
    expect(res.cropHindi).toBe("टमाटर");
    expect(res.category).toBe("diseased");
    expect(res.isHealthy).toBe(false);
    expect(res.scientificName).toBe("Alternaria solani");
  });

  it("identifies healthy plants correctly", () => {
    const res = parseClassName("Apple___healthy");
    expect(res.crop).toBe("Apple");
    expect(res.disease).toBe("healthy");
    expect(res.displayName).toBe("Apple · healthy");
    expect(res.cropEmoji).toBe("🍎");
    expect(res.category).toBe("healthy");
    expect(res.isHealthy).toBe(true);
  });

  it("identifies pest categories correctly", () => {
    const res = parseClassName("Tomato___Spider_mites");
    expect(res.crop).toBe("Tomato");
    expect(res.disease).toBe("Spider mites");
    expect(res.category).toBe("pest");
    expect(res.isHealthy).toBe(false);
  });

  it("handles Unknown and empty strings gracefully", () => {
    const resUnknown = parseClassName("Unknown");
    expect(resUnknown.crop).toBe("Plant");
    expect(resUnknown.disease).toBe("Unidentified");
    expect(resUnknown.isHealthy).toBe(false);

    const resNull = parseClassName(null);
    expect(resNull.displayName).toBe("Unidentified Sample");
  });
});

