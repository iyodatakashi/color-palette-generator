import { describe, it, expect } from "vitest";
import { fitOklchToRgb, type Rgb } from "../src/colorUtils";

describe("colorUtils", () => {
  describe("fitOklchToRgb", () => {
    it("should convert valid OKLCH color to RGB", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.5,
        c: 0.1,
        h: 180,
      };

      const result = fitOklchToRgb(oklch);

      expect(result).toHaveProperty("r");
      expect(result).toHaveProperty("g");
      expect(result).toHaveProperty("b");
      expect(typeof result.r).toBe("number");
      expect(typeof result.g).toBe("number");
      expect(typeof result.b).toBe("number");
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it("should handle colors within RGB gamut", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.6,
        c: 0.05,
        h: 0,
      };

      const result = fitOklchToRgb(oklch);

      // Should return valid RGB values
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it("should handle colors outside RGB gamut by adjusting lightness", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.3,
        c: 0.3, // High chroma that might be outside gamut
        h: 120,
      };

      const result = fitOklchToRgb(oklch);

      // Should still return valid RGB values
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it("should handle edge cases with invalid values", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0,
        c: 0,
        h: undefined,
      };

      const result = fitOklchToRgb(oklch);

      // Should return valid RGB values even with edge cases
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it("should handle very high chroma values", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.5,
        c: 0.5, // Very high chroma
        h: 60,
      };

      const result = fitOklchToRgb(oklch);

      // Should return valid RGB values
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it("should handle negative lightness values", () => {
      const oklch = {
        mode: "oklch" as const,
        l: -0.1, // Negative lightness
        c: 0.1,
        h: 270,
      };

      const result = fitOklchToRgb(oklch);

      // Should clamp to valid range and return valid RGB
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it("should handle lightness values greater than 1", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 1.2, // Lightness > 1
        c: 0.1,
        h: 45,
      };

      const result = fitOklchToRgb(oklch);

      // Should clamp to valid range and return valid RGB
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it("should handle negative chroma values", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.5,
        c: -0.1, // Negative chroma
        h: 180,
      };

      const result = fitOklchToRgb(oklch);

      // Should clamp chroma to 0 and return valid RGB
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });

    it("should return consistent results for the same input", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.7,
        c: 0.15,
        h: 200,
      };

      const result1 = fitOklchToRgb(oklch);
      const result2 = fitOklchToRgb(oklch);

      expect(result1).toEqual(result2);
    });

    it("should handle different hue values correctly", () => {
      const hues = [0, 60, 120, 180, 240, 300];

      hues.forEach((hue) => {
        const oklch = {
          mode: "oklch" as const,
          l: 0.5,
          c: 0.1,
          h: hue,
        };

        const result = fitOklchToRgb(oklch);

        expect(result.r).toBeGreaterThanOrEqual(0);
        expect(result.r).toBeLessThanOrEqual(255);
        expect(result.g).toBeGreaterThanOrEqual(0);
        expect(result.g).toBeLessThanOrEqual(255);
        expect(result.b).toBeGreaterThanOrEqual(0);
        expect(result.b).toBeLessThanOrEqual(255);
      });
    });
  });
});
