import { describe, it, expect } from "vitest";
import { getLightness, findClosestLevel } from "../src/lightness";

describe("lightness", () => {
  describe("getLightness", () => {
    it("should return lightness value for valid color", () => {
      const result = getLightness("#3b82f6");

      expect(result).toBeDefined();
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it("should return 0 for invalid color", () => {
      const result = getLightness("invalid-color");

      expect(result).toBe(0);
    });

    it("should return 0 for empty string", () => {
      const result = getLightness("");

      expect(result).toBe(0);
    });

    it("should handle different color formats", () => {
      const colors = [
        "#3b82f6",
        "rgb(59, 130, 246)",
        "hsl(217, 91%, 60%)",
        "#ef4444",
        "#10b981",
      ];

      colors.forEach((color) => {
        const result = getLightness(color);

        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      });
    });

    it("should return consistent results for the same color", () => {
      const color = "#3b82f6";
      const result1 = getLightness(color);
      const result2 = getLightness(color);

      expect(result1).toBe(result2);
    });

    it("should return different lightness values for different colors", () => {
      const lightColor = "#ffffff";
      const darkColor = "#000000";

      const lightResult = getLightness(lightColor);
      const darkResult = getLightness(darkColor);

      expect(lightResult).toBeGreaterThan(darkResult);
    });
  });

  describe("findClosestLevel", () => {
    it("should find closest level for given input", () => {
      const result = findClosestLevel({
        seedLightness: 0.6, // 0-1 range
        seedChroma: 0.1,
        seedHue: 180,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("number");
      expect([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]).toContain(
        result
      );
    });

    it("should return appropriate level for middle lightness", () => {
      const result = findClosestLevel({
        seedLightness: 0.5, // 0-1 range (50% lightness)
        seedChroma: 0.1,
        seedHue: 180,
      });

      expect(result).toBeDefined();
      expect([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]).toContain(
        result
      );
    });

    it("should return appropriate level for high lightness", () => {
      const result = findClosestLevel({
        seedLightness: 0.9, // 0-1 range
        seedChroma: 0.1,
        seedHue: 180,
      });

      expect(result).toBeDefined();
      expect([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]).toContain(
        result
      );
    });

    it("should return appropriate level for low lightness", () => {
      const result = findClosestLevel({
        seedLightness: 0.1, // 0-1 range
        seedChroma: 0.1,
        seedHue: 180,
      });

      expect(result).toBeDefined();
      expect([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]).toContain(
        result
      );
    });

    it("should handle different chroma values", () => {
      const chromas = [0.05, 0.1, 0.15, 0.2];

      chromas.forEach((chroma) => {
        const result = findClosestLevel({
          seedLightness: 0.6, // 0-1 range
          seedChroma: chroma,
          seedHue: 180,
        });

        expect(result).toBeDefined();
        expect([
          50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
        ]).toContain(result);
      });
    });

    it("should handle different hue values", () => {
      const hues = [0, 60, 120, 180, 240, 300];

      hues.forEach((hue) => {
        const result = findClosestLevel({
          seedLightness: 0.6, // 0-1 range
          seedChroma: 0.1,
          seedHue: hue,
        });

        expect(result).toBeDefined();
        expect([
          50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
        ]).toContain(result);
      });
    });

    it("should return consistent results for the same input", () => {
      const input = {
        seedLightness: 0.6, // 0-1 range
        seedChroma: 0.1,
        seedHue: 180,
      };

      const result1 = findClosestLevel(input);
      const result2 = findClosestLevel(input);

      expect(result1).toBe(result2);
    });

    it("should handle edge cases with extreme values", () => {
      const extremeInputs = [
        { seedLightness: 0, seedChroma: 0, seedHue: 0 },
        { seedLightness: 1.0, seedChroma: 0.5, seedHue: 360 }, // 0-1 range
        { seedLightness: 0.5, seedChroma: 0.01, seedHue: 180 }, // 0-1 range
      ];

      extremeInputs.forEach((input) => {
        const result = findClosestLevel(input);

        expect(result).toBeDefined();
        expect([
          50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
        ]).toContain(result);
      });
    });
  });
});
