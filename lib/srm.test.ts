import { describe, expect, it } from "vitest";
import { srmToHex } from "./srm";

const NEUTRAL_AMBER = "#F8A600";

describe("srmToHex", () => {
  it("returns the exact anchor colors from the SRM chart", () => {
    expect(srmToHex(1)).toBe("#FDEA8E");
    expect(srmToHex(2)).toBe("#F7F779");
    expect(srmToHex(4)).toBe("#FFCA5A");
    expect(srmToHex(6)).toBe("#F8A600");
    expect(srmToHex(8)).toBe("#EA8F00");
    expect(srmToHex(10)).toBe("#DE7C00");
    expect(srmToHex(13)).toBe("#CB6200");
    expect(srmToHex(16)).toBe("#B44A00");
    expect(srmToHex(20)).toBe("#963300");
    expect(srmToHex(24)).toBe("#722100");
    expect(srmToHex(28)).toBe("#4A1200");
    expect(srmToHex(30)).toBe("#551704");
    expect(srmToHex(34)).toBe("#241419");
    expect(srmToHex(40)).toBe("#2B090A");
  });

  it("interpolates linearly between anchors", () => {
    expect(srmToHex(3)).toBe("#FBE16A"); // halfway 2 -> 4
    expect(srmToHex(7)).toBe("#F19B00"); // halfway 6 -> 8
    expect(srmToHex(12)).toBe("#D16B00"); // between 10 and 13
    expect(srmToHex(25)).toBe("#681D00"); // between 24 and 28
    expect(srmToHex(39)).toBe("#2A0B0D"); // between 34 and 40
  });

  it("clamps out-of-range values to the 1-40 scale", () => {
    expect(srmToHex(0)).toBe(srmToHex(1));
    expect(srmToHex(-10)).toBe(srmToHex(1));
    expect(srmToHex(41)).toBe(srmToHex(40));
    expect(srmToHex(100)).toBe(srmToHex(40));
  });

  it("falls back to a neutral amber when SRM is missing or invalid", () => {
    expect(srmToHex(null)).toBe(NEUTRAL_AMBER);
    expect(srmToHex(undefined)).toBe(NEUTRAL_AMBER);
    expect(srmToHex(NaN)).toBe(NEUTRAL_AMBER);
  });

  it("darkens overall as SRM rises", () => {
    const luminance = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    // End to end the scale goes from pale straw to near-black.
    expect(luminance(srmToHex(40))).toBeLessThan(luminance(srmToHex(1)));
    // Spot checks across the range.
    expect(luminance(srmToHex(10))).toBeLessThan(luminance(srmToHex(2)));
    expect(luminance(srmToHex(20))).toBeLessThan(luminance(srmToHex(10)));
    expect(luminance(srmToHex(34))).toBeLessThan(luminance(srmToHex(20)));
  });

  it("always returns an uppercase 6-digit hex color", () => {
    for (const v of [null, undefined, 1, 5.5, 12, 40, 100]) {
      expect(srmToHex(v)).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
