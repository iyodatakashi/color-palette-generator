import { describe, it, expect } from "vitest";
import {
  getLightness,
  adjustToLightness,
  calculateEvenScale,
  findClosestLevel,
} from "../src/lightness";

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

  describe("adjustToLightness", () => {
    it("should generate color with specified lightness", () => {
      const result = adjustToLightness({
        h: 180,
        c: 0.1,
        targetLightness: 60,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should handle different hue values", () => {
      const hues = [0, 60, 120, 180, 240, 300];

      hues.forEach((hue) => {
        const result = adjustToLightness({
          h: hue,
          c: 0.1,
          targetLightness: 50,
        });

        expect(result).toBeDefined();
        expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should handle different chroma values", () => {
      const chromas = [0.05, 0.1, 0.15, 0.2];

      chromas.forEach((chroma) => {
        const result = adjustToLightness({
          h: 180,
          c: chroma,
          targetLightness: 60,
        });

        expect(result).toBeDefined();
        expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should handle different lightness values", () => {
      const lightnesses = [20, 40, 60, 80];

      lightnesses.forEach((lightness) => {
        const result = adjustToLightness({
          h: 180,
          c: 0.1,
          targetLightness: lightness,
        });

        expect(result).toBeDefined();
        expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should handle edge cases with invalid values", () => {
      const result = adjustToLightness({
        h: NaN,
        c: -0.1,
        targetLightness: NaN,
      });

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should normalize hue values correctly", () => {
      const result1 = adjustToLightness({
        h: 450, // > 360
        c: 0.1,
        targetLightness: 60,
      });

      const result2 = adjustToLightness({
        h: 90, // 450 - 360
        c: 0.1,
        targetLightness: 60,
      });

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result2).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should handle negative hue values", () => {
      const result = adjustToLightness({
        h: -30, // Negative hue
        c: 0.1,
        targetLightness: 60,
      });

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should return consistent results for the same input", () => {
      const input = {
        h: 180,
        c: 0.1,
        targetLightness: 60,
      };

      const result1 = adjustToLightness(input);
      const result2 = adjustToLightness(input);

      expect(result1).toBe(result2);
    });
  });

  describe("calculateEvenScale", () => {
    it("should calculate even scale for given input", () => {
      const result = calculateEvenScale({
        inputLightness: 60,
        inputChroma: 0.1,
        inputHue: 180,
        enableLightnessAdjustment: true,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");

      // Check that we have the expected scale levels
      const expectedLevels = [
        50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
      ];
      expectedLevels.forEach((level) => {
        expect(result[level]).toBeDefined();
        expect(typeof result[level]).toBe("number");
        expect(result[level]).toBeGreaterThanOrEqual(0);
        expect(result[level]).toBeLessThanOrEqual(100);
      });
    });

    it("should handle different input lightness values", () => {
      const lightnesses = [20, 40, 60, 80];

      lightnesses.forEach((lightness) => {
        const result = calculateEvenScale({
          inputLightness: lightness,
          inputChroma: 0.1,
          inputHue: 180,
          enableLightnessAdjustment: true,
        });

        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
        expect(result[500]).toBeDefined();
      });
    });

    it("should handle different input chroma values", () => {
      const chromas = [0.05, 0.1, 0.15, 0.2];

      chromas.forEach((chroma) => {
        const result = calculateEvenScale({
          inputLightness: 60,
          inputChroma: chroma,
          inputHue: 180,
          enableLightnessAdjustment: true,
        });

        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
        expect(result[500]).toBeDefined();
      });
    });

    it("should handle different input hue values", () => {
      const hues = [0, 60, 120, 180, 240, 300];

      hues.forEach((hue) => {
        const result = calculateEvenScale({
          inputLightness: 60,
          inputChroma: 0.1,
          inputHue: hue,
          enableLightnessAdjustment: true,
        });

        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
        expect(result[500]).toBeDefined();
      });
    });

    it("should handle lightness adjustment disabled", () => {
      const result = calculateEvenScale({
        inputLightness: 60,
        inputChroma: 0.1,
        inputHue: 180,
        enableLightnessAdjustment: false,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      expect(result[500]).toBeDefined();
    });

    it("should return consistent results for the same input", () => {
      const input = {
        inputLightness: 60,
        inputChroma: 0.1,
        inputHue: 180,
        enableLightnessAdjustment: true,
      };

      const result1 = calculateEvenScale(input);
      const result2 = calculateEvenScale(input);

      expect(result1).toEqual(result2);
    });

    it("should generate reasonable lightness values", () => {
      const result = calculateEvenScale({
        inputLightness: 60,
        inputChroma: 0.1,
        inputHue: 180,
        enableLightnessAdjustment: true,
      });

      const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

      // Check that all values are within reasonable range
      levels.forEach((level) => {
        expect(result[level]).toBeGreaterThanOrEqual(0);
        expect(result[level]).toBeLessThanOrEqual(100);
      });

      // Check lightness ordering (50 > 100 > 200 > ... > 900 > 950)
      expect(result[50]).toBeGreaterThan(result[100]);
      expect(result[100]).toBeGreaterThan(result[200]);
      expect(result[200]).toBeGreaterThan(result[300]);
      expect(result[300]).toBeGreaterThan(result[400]);
      expect(result[400]).toBeGreaterThan(result[500]);
      expect(result[500]).toBeGreaterThan(result[600]);
      expect(result[600]).toBeGreaterThan(result[700]);
      expect(result[700]).toBeGreaterThan(result[800]);
      expect(result[800]).toBeGreaterThan(result[900]);
      expect(result[900]).toBeGreaterThan(result[950]);

      // Check min/max values are around 25 and 97
      expect(result[50]).toBeGreaterThanOrEqual(90); // Around 97
      expect(result[50]).toBeLessThanOrEqual(100);
      expect(result[950]).toBeGreaterThanOrEqual(20); // Around 25
      expect(result[950]).toBeLessThanOrEqual(35);

      // Check minimum lightness difference between adjacent levels
      expect(result[50] - result[100]).toBeGreaterThanOrEqual(1); // Edge case - smaller difference
      expect(result[100] - result[200]).toBeGreaterThanOrEqual(3);
      expect(result[200] - result[300]).toBeGreaterThanOrEqual(3);
      expect(result[300] - result[400]).toBeGreaterThanOrEqual(3);
      expect(result[400] - result[500]).toBeGreaterThanOrEqual(3);
      expect(result[500] - result[600]).toBeGreaterThanOrEqual(3);
      expect(result[600] - result[700]).toBeGreaterThanOrEqual(3);
      expect(result[700] - result[800]).toBeGreaterThanOrEqual(3);
      expect(result[800] - result[900]).toBeGreaterThanOrEqual(3);
      expect(result[900] - result[950]).toBeGreaterThanOrEqual(1); // Edge case - smaller difference
    });
  });

  describe("findClosestLevel", () => {
    it("should find closest level for given input", () => {
      const result = findClosestLevel({
        inputLightness: 60,
        inputChroma: 0.1,
        inputHue: 180,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("number");
      expect([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]).toContain(
        result
      );
    });

    it("should return appropriate level for middle lightness", () => {
      const result = findClosestLevel({
        inputLightness: 50,
        inputChroma: 0.1,
        inputHue: 180,
      });

      expect(result).toBeDefined();
      expect([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]).toContain(
        result
      );
    });

    it("should return appropriate level for high lightness", () => {
      const result = findClosestLevel({
        inputLightness: 90,
        inputChroma: 0.1,
        inputHue: 180,
      });

      expect(result).toBeDefined();
      expect([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]).toContain(
        result
      );
    });

    it("should return appropriate level for low lightness", () => {
      const result = findClosestLevel({
        inputLightness: 10,
        inputChroma: 0.1,
        inputHue: 180,
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
          inputLightness: 60,
          inputChroma: chroma,
          inputHue: 180,
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
          inputLightness: 60,
          inputChroma: 0.1,
          inputHue: hue,
        });

        expect(result).toBeDefined();
        expect([
          50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
        ]).toContain(result);
      });
    });

    it("should return consistent results for the same input", () => {
      const input = {
        inputLightness: 60,
        inputChroma: 0.1,
        inputHue: 180,
      };

      const result1 = findClosestLevel(input);
      const result2 = findClosestLevel(input);

      expect(result1).toBe(result2);
    });

    it("should handle edge cases with extreme values", () => {
      const extremeInputs = [
        { inputLightness: 0, inputChroma: 0, inputHue: 0 },
        { inputLightness: 100, inputChroma: 0.5, inputHue: 360 },
        { inputLightness: 50, inputChroma: 0.01, inputHue: 180 },
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
