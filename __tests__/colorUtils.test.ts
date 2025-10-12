import { describe, it, expect } from "vitest";
import { calculateRelativeChroma } from "../src/colorUtils";

describe("colorUtils", () => {
  describe("calculateRelativeChroma", () => {
    it("should calculate relative chroma correctly for red hue", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.5,
        c: 0.15,
        h: 0, // Red hue
      };

      const result = calculateRelativeChroma(oklch);

      // Should return a value between 0 and 1
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe("number");
    });

    it("should calculate relative chroma correctly for green hue", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.6,
        c: 0.2,
        h: 120, // Green hue
      };

      const result = calculateRelativeChroma(oklch);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe("number");
    });

    it("should calculate relative chroma correctly for blue hue", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.4,
        c: 0.18,
        h: 240, // Blue hue
      };

      const result = calculateRelativeChroma(oklch);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe("number");
    });

    it("should handle low chroma values", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.5,
        c: 0.05,
        h: 180, // Cyan hue
      };

      const result = calculateRelativeChroma(oklch);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it("should handle high chroma values", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.5,
        c: 0.3,
        h: 60, // Yellow hue
      };

      const result = calculateRelativeChroma(oklch);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it("should handle undefined hue", () => {
      const oklch = {
        mode: "oklch" as const,
        l: 0.5,
        c: 0.15,
        h: undefined, // Undefined hue
      };

      const result = calculateRelativeChroma(oklch);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe("number");
    });
  });
});
