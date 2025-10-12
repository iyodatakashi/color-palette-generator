import { describe, it, expect } from "vitest";
import { generateSwatch, getSwatchSeeds } from "../src/swatch";
import { generateColorPalette } from "../src/palette";
import type { SwatchConfig } from "../src/types";

describe("swatch", () => {
  describe("generateSwatch", () => {
    it("should generate color configs for all swatch names", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
        originLevel: 500,
      };

      const result = generateSwatch(config);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(24); // 24 color divisions
    });

    it("should generate configs with correct properties", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
        originLevel: 500,
        hueShiftMode: "natural",
        includeTransparent: true,
        includeTextColors: true,
      };

      const result = generateSwatch(config);

      result.forEach((colorConfig) => {
        expect(colorConfig.id).toBeDefined();
        expect(colorConfig.prefix).toBeDefined();
        expect(colorConfig.seedColor).toBeDefined();
        expect(colorConfig.seedOklch).toBeDefined();
        expect(colorConfig.originLevel).toBe(500);
        expect(colorConfig.hueShiftMode).toBe("natural");
        expect(colorConfig.includeTransparent).toBe(true);
        expect(colorConfig.includeTextColors).toBe(true);
      });
    });

    it("should use default values when not specified", () => {
      const config: SwatchConfig = {
        seedChroma: 0.15,
      };

      const result = generateSwatch(config);

      expect(result).toBeDefined();
      expect(result.length).toBe(24);

      // Check first config has default values
      const firstConfig = result[0];
      expect(firstConfig.originLevel).toBeDefined();
      expect(firstConfig.hueShiftMode).toBeDefined();
    });

    it("should respect custom chroma values", () => {
      const lowChroma: SwatchConfig = {
        seedChroma: 0.05,
      };

      const highChroma: SwatchConfig = {
        seedChroma: 0.3,
      };

      const lowResult = generateSwatch(lowChroma);
      const highResult = generateSwatch(highChroma);

      expect(lowResult[0].seedOklch?.c).toBeLessThan(
        highResult[0].seedOklch?.c || 0
      );
    });

    it("should respect enableChromaAdjustment option", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
        enableChromaAdjustment: false,
      };

      const result = generateSwatch(config);

      result.forEach((colorConfig) => {
        expect(colorConfig.enableChromaAdjustment).toBe(false);
      });
    });

    it("should respect enableLightnessAdjustment option", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
        enableLightnessAdjustment: false,
      };

      const result = generateSwatch(config);

      result.forEach((colorConfig) => {
        expect(colorConfig.enableLightnessAdjustment).toBe(false);
      });
    });

    it("should respect enableChromaLimit option", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
        enableChromaLimit: true,
        maxChroma: 0.18,
      };

      const result = generateSwatch(config);

      result.forEach((colorConfig) => {
        expect(colorConfig.enableChromaLimit).toBe(true);
        expect(colorConfig.maxChroma).toBe(0.18);
      });
    });

    it("should generate valid palettes from swatch configs", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
        originLevel: 500,
      };

      const colorConfigs = generateSwatch(config);
      const palette = generateColorPalette(colorConfigs);

      expect(palette).toBeDefined();
      expect(typeof palette).toBe("object");

      // Check some expected color keys
      expect(palette["--ruby-500"]).toBeDefined();
      expect(palette["--red-500"]).toBeDefined();
      expect(palette["--blue-500"]).toBeDefined();
      expect(palette["--green-500"]).toBeDefined();

      // Verify hex format
      Object.values(palette).forEach((color) => {
        if (typeof color === "string" && color.startsWith("#")) {
          expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
      });
    });
  });

  describe("getSwatchSeeds", () => {
    it("should generate seeds for all color names", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
      };

      const result = getSwatchSeeds(config);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(24);
    });

    it("should generate seeds with correct structure", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
      };

      const result = getSwatchSeeds(config);

      result.forEach((seed) => {
        expect(seed.prefix).toBeDefined();
        expect(typeof seed.prefix).toBe("string");
        expect(seed.oklch).toBeDefined();
        expect(seed.oklch.mode).toBe("oklch");
        expect(seed.oklch.l).toBeDefined();
        expect(seed.oklch.c).toBeDefined();
        expect(seed.oklch.h).toBeDefined();
      });
    });

    it("should use correct chroma value from config", () => {
      const config: SwatchConfig = {
        seedChroma: 0.15,
      };

      const result = getSwatchSeeds(config);

      result.forEach((seed) => {
        expect(seed.oklch.c).toBe(0.15);
      });
    });

    it("should generate evenly distributed hues", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
      };

      const result = getSwatchSeeds(config);

      // Check that hues are distributed across 360 degrees
      const hues = result.map((seed) => seed.oklch.h);
      const minHue = Math.min(...hues);
      const maxHue = Math.max(...hues);

      expect(minHue).toBeGreaterThanOrEqual(0);
      expect(maxHue).toBeLessThan(360);

      // Check for reasonable distribution (at least 300 degrees covered)
      expect(maxHue - minHue).toBeGreaterThan(300);
    });

    it("should include all expected color names", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
      };

      const result = getSwatchSeeds(config);
      const prefixes = result.map((seed) => seed.prefix);

      // Check some expected names
      expect(prefixes).toContain("ruby");
      expect(prefixes).toContain("red");
      expect(prefixes).toContain("orange");
      expect(prefixes).toContain("yellow");
      expect(prefixes).toContain("green");
      expect(prefixes).toContain("blue");
      expect(prefixes).toContain("purple");
    });

    it("should use consistent lightness for all seeds", () => {
      const config: SwatchConfig = {
        seedChroma: 0.2,
      };

      const result = getSwatchSeeds(config);

      const lightnesses = result.map((seed) => seed.oklch.l);
      const uniqueLightnesses = new Set(lightnesses);

      // All seeds should have the same lightness
      expect(uniqueLightnesses.size).toBe(1);
    });

    it("should generate different results for different chroma values", () => {
      const config1: SwatchConfig = {
        seedChroma: 0.1,
      };

      const config2: SwatchConfig = {
        seedChroma: 0.3,
      };

      const result1 = getSwatchSeeds(config1);
      const result2 = getSwatchSeeds(config2);

      // Prefixes should be the same
      expect(result1.map((s) => s.prefix)).toEqual(
        result2.map((s) => s.prefix)
      );

      // But chroma values should be different
      expect(result1[0].oklch.c).not.toBe(result2[0].oklch.c);
    });
  });
});
