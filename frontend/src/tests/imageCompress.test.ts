import { describe, it, expect } from "vitest";
import { validateImageFile, compressImage, MAX_UPLOAD_BYTES } from "../lib/imageCompress";

describe("validateImageFile", () => {
  it("validates correct JPEG file", () => {
    const file = new File([new Uint8Array(100)], "leaf.jpg", { type: "image/jpeg" });
    const res = validateImageFile(file);
    expect(res.valid).toBe(true);
  });

  it("validates correct PNG file", () => {
    const file = new File([new Uint8Array(100)], "leaf.png", { type: "image/png" });
    const res = validateImageFile(file);
    expect(res.valid).toBe(true);
  });

  it("rejects non-image mime types", () => {
    const file = new File([new Uint8Array(100)], "document.pdf", { type: "application/pdf" });
    const res = validateImageFile(file);
    expect(res.valid).toBe(false);
    expect(res.errorKey).toBe("errors.unsupportedFile");
  });

  it("rejects files exceeding size limit", () => {
    // Mock oversized file
    const oversizedFile = {
      name: "huge.jpg",
      type: "image/jpeg",
      size: MAX_UPLOAD_BYTES + 1024,
    } as File;

    const res = validateImageFile(oversizedFile);
    expect(res.valid).toBe(false);
    expect(res.errorKey).toBe("errors.fileTooLarge");
  });

  it("safely handles compressImage in test/non-DOM environment", async () => {
    const file = new File([new Uint8Array(500)], "sample.jpg", { type: "image/jpeg" });
    const result = await compressImage(file, 1280);
    expect(result).toBeDefined();
  });
});

