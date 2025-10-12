import { describe, it, expect } from "vitest";
import {
  calculateHueIntensityByHue,
  normalizeHue,
  getHueCategory,
  getHueCategoryJapanese,
  getHueShiftExplanation,
} from "../src/hueShift";
import type { ColorConfig } from "../src/types";

describe("hueShift", () => {
  describe("normalizeHue", () => {
    it("should normalize hue to 0-360 range", () => {
      expect(normalizeHue(0)).toBe(0);
      expect(normalizeHue(180)).toBe(180);
      expect(normalizeHue(360)).toBe(0);
    });

    it("should handle negative hue values", () => {
      expect(normalizeHue(-30)).toBe(330);
      expect(normalizeHue(-90)).toBe(270);
      expect(normalizeHue(-360)).toBe(0);
    });

    it("should handle hue values greater than 360", () => {
      expect(normalizeHue(390)).toBe(30);
      expect(normalizeHue(450)).toBe(90);
      expect(normalizeHue(720)).toBe(0);
    });

    it("should handle very large positive values", () => {
      expect(normalizeHue(1080)).toBe(0);
      expect(normalizeHue(1000)).toBeGreaterThanOrEqual(0);
      expect(normalizeHue(1000)).toBeLessThan(360);
    });

    it("should handle very large negative values", () => {
      expect(normalizeHue(-720)).toBe(0);
      expect(normalizeHue(-1000)).toBeGreaterThanOrEqual(0);
      expect(normalizeHue(-1000)).toBeLessThan(360);
    });
  });

  describe("calculateHueIntensityByHue", () => {
    it("should calculate intensity for red hue", () => {
      const result = calculateHueIntensityByHue(0);
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });

    it("should calculate intensity for different hues", () => {
      const hues = [0, 60, 120, 180, 240, 300];
      hues.forEach((hue) => {
        const result = calculateHueIntensityByHue(hue);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(-1);
        expect(result).toBeLessThanOrEqual(1);
      });
    });

    it("should return consistent results for the same hue", () => {
      const hue = 120;
      const result1 = calculateHueIntensityByHue(hue);
      const result2 = calculateHueIntensityByHue(hue);
      expect(result1).toBe(result2);
    });

    it("should handle edge case hues", () => {
      const edgeCases = [0, 90, 180, 270, 360];
      edgeCases.forEach((hue) => {
        const result = calculateHueIntensityByHue(hue);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(-1);
        expect(result).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("getHueCategory", () => {
    it("should return correct category for red hues", () => {
      expect(getHueCategory(0)).toBe("red");
      expect(getHueCategory(15)).toBe("red");
      expect(getHueCategory(350)).toBe("red");
    });

    it("should return correct category for orange hues", () => {
      expect(getHueCategory(30)).toBe("orange");
      expect(getHueCategory(45)).toBe("orange");
    });

    it("should return correct category for yellow hues", () => {
      expect(getHueCategory(60)).toBe("yellow");
      expect(getHueCategory(75)).toBe("yellow");
    });

    it("should return correct category for green hues", () => {
      expect(getHueCategory(90)).toBe("green");
      expect(getHueCategory(120)).toBe("green");
    });

    it("should return correct category for cyan hues", () => {
      expect(getHueCategory(150)).toBe("cyan");
      expect(getHueCategory(180)).toBe("cyan");
    });

    it("should return correct category for blue hues", () => {
      expect(getHueCategory(210)).toBe("blue");
      expect(getHueCategory(240)).toBe("blue");
    });

    it("should return correct category for purple hues", () => {
      expect(getHueCategory(270)).toBe("purple");
      expect(getHueCategory(300)).toBe("purple");
    });

    it("should handle hue normalization", () => {
      expect(getHueCategory(360)).toBe("red");
      expect(getHueCategory(390)).toBe("orange");
      expect(getHueCategory(-30)).toBe("red"); // -30 normalizes to 330, which is red
    });
  });

  describe("getHueCategoryJapanese", () => {
    it("should return Japanese names for all categories", () => {
      expect(getHueCategoryJapanese(0)).toBe("赤系");
      expect(getHueCategoryJapanese(45)).toBe("オレンジ系");
      expect(getHueCategoryJapanese(75)).toBe("黄系");
      expect(getHueCategoryJapanese(120)).toBe("緑系");
      expect(getHueCategoryJapanese(180)).toBe("シアン系");
      expect(getHueCategoryJapanese(240)).toBe("青系");
      expect(getHueCategoryJapanese(300)).toBe("紫系");
    });

    it("should handle edge cases", () => {
      expect(getHueCategoryJapanese(360)).toBe("赤系");
      expect(getHueCategoryJapanese(-30)).toBe("赤系"); // -30 normalizes to 330, which is red
    });
  });

  describe("getHueShiftExplanation", () => {
    it("should return explanation for fixed mode", () => {
      const config: ColorConfig = {
        prefix: "test",
        seedColor: "#ff0000",
        originLevel: 500,
        hueShiftMode: "fixed",
      };

      const result = getHueShiftExplanation({ colorConfig: config });

      expect(result.category).toBeDefined();
      expect(result.lighterDirection).toBe("変化なし");
      expect(result.darkerDirection).toBe("変化なし");
      expect(result.lighterSign).toBe("");
      expect(result.darkerSign).toBe("");
    });

    it("should return explanation for natural mode", () => {
      const config: ColorConfig = {
        prefix: "test",
        seedColor: "#ff0000",
        originLevel: 500,
        hueShiftMode: "natural",
      };

      const result = getHueShiftExplanation({ colorConfig: config });

      expect(result.category).toBeDefined();
      expect(result.lighterDirection).toBeDefined();
      expect(result.darkerDirection).toBeDefined();
      expect(result.lighterSign).toMatch(/^[+-]$/);
      expect(result.darkerSign).toMatch(/^[+-]$/);
    });

    it("should return explanation for unnatural mode", () => {
      const config: ColorConfig = {
        prefix: "test",
        seedColor: "#ff0000",
        originLevel: 500,
        hueShiftMode: "unnatural",
      };

      const result = getHueShiftExplanation({ colorConfig: config });

      expect(result.category).toBeDefined();
      expect(result.lighterDirection).toBeDefined();
      expect(result.darkerDirection).toBeDefined();
      expect(result.lighterSign).toMatch(/^[+-]$/);
      expect(result.darkerSign).toMatch(/^[+-]$/);
    });

    it("should handle different seed colors", () => {
      const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];

      colors.forEach((seedColor) => {
        const config: ColorConfig = {
          prefix: "test",
          seedColor,
          originLevel: 500,
          hueShiftMode: "natural",
        };

        const result = getHueShiftExplanation({ colorConfig: config });

        expect(result.category).toBeDefined();
        expect(result.lighterDirection).toBeDefined();
        expect(result.darkerDirection).toBeDefined();
      });
    });

    it("should have opposite signs for lighter and darker", () => {
      const config: ColorConfig = {
        prefix: "test",
        seedColor: "#ff0000",
        originLevel: 500,
        hueShiftMode: "natural",
      };

      const result = getHueShiftExplanation({ colorConfig: config });

      // Signs should be opposite
      if (result.lighterSign === "+") {
        expect(result.darkerSign).toBe("-");
      } else if (result.lighterSign === "-") {
        expect(result.darkerSign).toBe("+");
      }
    });

    it("should reverse signs and directions in unnatural mode", () => {
      const config: ColorConfig = {
        prefix: "test",
        seedColor: "#ff0000",
        originLevel: 500,
      };

      const naturalResult = getHueShiftExplanation({
        colorConfig: { ...config, hueShiftMode: "natural" },
      });
      const unnaturalResult = getHueShiftExplanation({
        colorConfig: { ...config, hueShiftMode: "unnatural" },
      });

      // Signs should be opposite
      expect(naturalResult.lighterSign).not.toBe(unnaturalResult.lighterSign);
      expect(naturalResult.darkerSign).not.toBe(unnaturalResult.darkerSign);

      // Directions should be swapped
      expect(naturalResult.lighterDirection).toBe(
        unnaturalResult.darkerDirection
      );
      expect(naturalResult.darkerDirection).toBe(
        unnaturalResult.lighterDirection
      );
    });
  });
});
