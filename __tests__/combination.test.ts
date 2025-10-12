import { describe, it, expect } from "vitest";
import { generateCombination } from "../src/combination";
import { generateColorPalette } from "../src/palette";
import { normalizeOklch, oklchToHexPerceptual } from "../src/colorUtils";
import type {
  CombinationConfig,
  CombinationType,
  BaseColorStrategy,
} from "../src/types";

describe("combination", () => {
  describe("generateCombination", () => {
    const baseConfig: CombinationConfig = {
      seedColor: "#7c3bff", // Purple color for testing
      includeTransparent: false,
      includeTextColors: false,
    };

    it("should generate complementary color combination", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "complementary",
      };

      const colorConfigs = generateCombination(config);

      expect(colorConfigs).toBeDefined();
      expect(Array.isArray(colorConfigs)).toBe(true);
      expect(colorConfigs.length).toBeGreaterThanOrEqual(2); // base + primary + at least one secondary

      // Check that we have base, primary, and secondary colors
      const baseColor = colorConfigs.find((color) => color.id === "base");
      const primaryColor = colorConfigs.find((color) => color.id === "primary");
      const secondaryColor = colorConfigs.find(
        (color) => color.id === "secondary"
      );

      expect(baseColor).toBeDefined();
      expect(primaryColor).toBeDefined();
      expect(secondaryColor).toBeDefined();

      // Generate palettes from configs
      const palette = generateColorPalette(colorConfigs);

      // Check that palettes have expected scale levels
      const expectedLevels = [
        50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
      ];
      expectedLevels.forEach((level) => {
        expect(palette[`--base-${level}`]).toBeDefined();
        expect(palette[`--primary-${level}`]).toBeDefined();
        expect(palette[`--secondary-${level}`]).toBeDefined();
      });
    });

    it("should generate triadic color combination", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "triadic",
      };

      const colorConfigs = generateCombination(config);

      expect(colorConfigs).toBeDefined();
      expect(Array.isArray(colorConfigs)).toBe(true);
      expect(colorConfigs.length).toBeGreaterThanOrEqual(4); // base + primary + secondary + secondary2

      // Check for secondary2 color
      const secondary2Color = colorConfigs.find(
        (color) => color.id === "secondary2"
      );
      expect(secondary2Color).toBeDefined();

      // Generate palette and verify
      const palette = generateColorPalette(colorConfigs);
      expect(palette["--secondary2-500"]).toBeDefined();
    });

    it("should generate tetradic color combination", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "tetradic",
      };

      const colorConfigs = generateCombination(config);

      expect(colorConfigs).toBeDefined();
      expect(Array.isArray(colorConfigs)).toBe(true);
      expect(colorConfigs.length).toBeGreaterThanOrEqual(5); // base + primary + secondary + secondary2 + secondary3

      // Check for all secondary colors
      const secondaryColor = colorConfigs.find(
        (color) => color.id === "secondary"
      );
      const secondary2Color = colorConfigs.find(
        (color) => color.id === "secondary2"
      );
      const secondary3Color = colorConfigs.find(
        (color) => color.id === "secondary3"
      );

      expect(secondaryColor).toBeDefined();
      expect(secondary2Color).toBeDefined();
      expect(secondary3Color).toBeDefined();
    });

    it("should generate analogous color combination", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "analogous",
      };

      const colorConfigs = generateCombination(config);

      expect(colorConfigs).toBeDefined();
      expect(Array.isArray(colorConfigs)).toBe(true);
      expect(colorConfigs.length).toBeGreaterThanOrEqual(4); // base + primary + secondary + secondary2

      const secondaryColor = colorConfigs.find(
        (color) => color.id === "secondary"
      );
      const secondary2Color = colorConfigs.find(
        (color) => color.id === "secondary2"
      );

      expect(secondaryColor).toBeDefined();
      expect(secondary2Color).toBeDefined();
    });

    it("should generate split complementary color combination", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "splitComplementary",
      };

      const colorConfigs = generateCombination(config);

      expect(colorConfigs).toBeDefined();
      expect(Array.isArray(colorConfigs)).toBe(true);
      expect(colorConfigs.length).toBeGreaterThanOrEqual(4); // base + primary + secondary + secondary2

      const secondaryColor = colorConfigs.find(
        (color) => color.id === "secondary"
      );
      const secondary2Color = colorConfigs.find(
        (color) => color.id === "secondary2"
      );

      expect(secondaryColor).toBeDefined();
      expect(secondary2Color).toBeDefined();
    });

    it("should generate monochromatic color combination", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "monochromatic",
      };

      const colorConfigs = generateCombination(config);

      expect(colorConfigs).toBeDefined();
      expect(Array.isArray(colorConfigs)).toBe(true);
      expect(colorConfigs.length).toBeGreaterThanOrEqual(2); // base + primary (no secondary colors for monochromatic)

      const baseColor = colorConfigs.find((color) => color.id === "base");
      const primaryColor = colorConfigs.find((color) => color.id === "primary");

      expect(baseColor).toBeDefined();
      expect(primaryColor).toBeDefined();
    });

    it("should handle different base color strategies", () => {
      const strategies: BaseColorStrategy[] = [
        "harmonic",
        "contrasting",
        "neutral",
      ];

      strategies.forEach((strategy) => {
        const config: CombinationConfig = {
          ...baseConfig,
          combinationType: "complementary",
          baseColorStrategy: strategy,
        };

        const colorConfigs = generateCombination(config);

        expect(colorConfigs).toBeDefined();
        expect(Array.isArray(colorConfigs)).toBe(true);

        const baseColor = colorConfigs.find((color) => color.id === "base");
        expect(baseColor).toBeDefined();

        // Generate palette and verify
        const palette = generateColorPalette(colorConfigs);
        expect(palette["--base-500"]).toBeDefined();
      });
    });

    it("should include transparent colors when requested", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "complementary",
        includeTransparent: true,
      };

      const colorConfigs = generateCombination(config);

      expect(colorConfigs).toBeDefined();

      const primaryColor = colorConfigs.find((color) => color.id === "primary");
      expect(primaryColor).toBeDefined();
      expect(primaryColor?.includeTransparent).toBe(true);

      // Generate palette and check for transparent colors
      const palette = generateColorPalette(colorConfigs);
      const transparentKeys = Object.keys(palette).filter(
        (key) =>
          key.startsWith("--primary-") &&
          (key.includes("-10") || key.includes("-20") || key.includes("-30"))
      );

      // If transparent colors are generated, they should be valid
      if (transparentKeys.length > 0) {
        transparentKeys.forEach((key) => {
          expect(palette[key]).toBeDefined();
          // Transparent colors might be in hex format, so check for valid color format
          expect(palette[key]).toMatch(/^(#[0-9a-fA-F]{6}|rgba?\([^)]+\))$/);
        });
      }
    });

    it("should include text colors when requested", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "complementary",
        includeTextColors: true,
      };

      const colorConfigs = generateCombination(config);

      expect(colorConfigs).toBeDefined();

      const primaryColor = colorConfigs.find((color) => color.id === "primary");
      expect(primaryColor).toBeDefined();
      expect(primaryColor?.includeTextColors).toBe(true);

      // Generate palette and check for text colors
      const palette = generateColorPalette(colorConfigs);
      expect(palette["--primary-text-color-on-light"]).toBeDefined();
      expect(palette["--primary-text-color-on-dark"]).toBeDefined();
    });

    it("should throw error for invalid seed color", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        seedColor: "invalid-color",
        combinationType: "complementary",
      };

      expect(() => generateCombination(config)).toThrow();
    });

    it("should handle different seed colors", () => {
      const colors = [
        "#3b82f6", // Blue
        "#ef4444", // Red
        "#10b981", // Green
        "#f59e0b", // Yellow
        "#8b5cf6", // Purple
      ];

      colors.forEach((color) => {
        const config: CombinationConfig = {
          ...baseConfig,
          seedColor: color,
          combinationType: "complementary",
        };

        const colorConfigs = generateCombination(config);

        expect(colorConfigs).toBeDefined();
        expect(Array.isArray(colorConfigs)).toBe(true);
        expect(colorConfigs.length).toBeGreaterThanOrEqual(2);

        const primaryColor = colorConfigs.find((c) => c.id === "primary");
        expect(primaryColor).toBeDefined();
      });
    });

    it("should generate consistent results for the same input", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "complementary",
      };

      const colorConfigs1 = generateCombination(config);
      const colorConfigs2 = generateCombination(config);

      expect(colorConfigs1).toEqual(colorConfigs2);
    });

    it("should handle all combination types", () => {
      const combinationTypes: CombinationType[] = [
        "monochromatic",
        "analogous",
        "complementary",
        "splitComplementary",
        "doubleComplementary",
        "doubleComplementaryReverse",
        "triadic",
        "tetradic",
      ];

      combinationTypes.forEach((combinationType) => {
        const config: CombinationConfig = {
          ...baseConfig,
          combinationType,
        };

        const colorConfigs = generateCombination(config);

        expect(colorConfigs).toBeDefined();
        expect(Array.isArray(colorConfigs)).toBe(true);
        expect(colorConfigs.length).toBeGreaterThanOrEqual(2);

        // Check that we have at least base and primary colors
        const baseColor = colorConfigs.find((color) => color.id === "base");
        const primaryColor = colorConfigs.find(
          (color) => color.id === "primary"
        );

        expect(baseColor).toBeDefined();
        expect(primaryColor).toBeDefined();
      });
    });

    it("should respect enableChromaAdjustment option", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "complementary",
        enableChromaAdjustment: false,
      };

      const colorConfigs = generateCombination(config);
      const primaryColor = colorConfigs.find((c) => c.id === "primary");

      expect(primaryColor?.enableChromaAdjustment).toBe(false);
    });

    it("should respect enableLightnessAdjustment option", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "complementary",
        enableLightnessAdjustment: false,
      };

      const colorConfigs = generateCombination(config);
      const primaryColor = colorConfigs.find((c) => c.id === "primary");

      expect(primaryColor?.enableLightnessAdjustment).toBe(false);
    });

    it("should respect enableChromaLimit option", () => {
      const config: CombinationConfig = {
        ...baseConfig,
        combinationType: "complementary",
        enableChromaLimit: true,
        maxChroma: 0.15,
      };

      const colorConfigs = generateCombination(config);
      const primaryColor = colorConfigs.find((c) => c.id === "primary");

      expect(primaryColor?.enableChromaLimit).toBe(true);
      expect(primaryColor?.maxChroma).toBe(0.15);
    });
  });

  describe("generateSameToneColor equivalent", () => {
    it("should generate a color with the same tone", () => {
      const result = oklchToHexPerceptual(
        normalizeOklch({
          mode: "oklch" as const,
          l: 60,
          c: 0.15,
          h: 180,
        })
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should handle different hue values", () => {
      const hues = [0, 60, 120, 180, 240, 300];

      hues.forEach((hue) => {
        const result = oklchToHexPerceptual(
          normalizeOklch({
            mode: "oklch" as const,
            l: 50,
            c: 0.1,
            h: hue,
          })
        );

        expect(result).toBeDefined();
        expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should handle different chroma values", () => {
      const chromas = [0.05, 0.1, 0.15, 0.2, 0.25];

      chromas.forEach((chroma) => {
        const result = oklchToHexPerceptual(
          normalizeOklch({
            mode: "oklch" as const,
            l: 60,
            c: chroma,
            h: 180,
          })
        );

        expect(result).toBeDefined();
        expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should handle different lightness values", () => {
      const lightnesses = [20, 40, 60, 80];

      lightnesses.forEach((lightness) => {
        const result = oklchToHexPerceptual(
          normalizeOklch({
            mode: "oklch" as const,
            l: lightness,
            c: 0.1,
            h: 180,
          })
        );

        expect(result).toBeDefined();
        expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should handle edge cases with invalid values", () => {
      const result = oklchToHexPerceptual(
        normalizeOklch({
          mode: "oklch" as const,
          l: NaN,
          c: -0.1,
          h: NaN,
        })
      );

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should normalize hue values correctly", () => {
      const result1 = oklchToHexPerceptual(
        normalizeOklch({
          mode: "oklch" as const,
          l: 60,
          c: 0.1,
          h: 450, // > 360
        })
      );

      const result2 = oklchToHexPerceptual(
        normalizeOklch({
          mode: "oklch" as const,
          l: 60,
          c: 0.1,
          h: 90, // 450 - 360
        })
      );

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result2).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should handle negative hue values", () => {
      const result = oklchToHexPerceptual(
        normalizeOklch({
          mode: "oklch" as const,
          l: 60,
          c: 0.1,
          h: -30, // Negative hue
        })
      );

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should return consistent results for the same input", () => {
      const input = {
        mode: "oklch" as const,
        l: 60,
        c: 0.15,
        h: 180,
      };

      const result1 = oklchToHexPerceptual(normalizeOklch(input));
      const result2 = oklchToHexPerceptual(normalizeOklch(input));

      expect(result1).toBe(result2);
    });

    it("should handle very high chroma values", () => {
      const result = oklchToHexPerceptual(
        normalizeOklch({
          mode: "oklch" as const,
          l: 60,
          c: 0.5, // Very high chroma
          h: 180,
        })
      );

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should handle very low chroma values", () => {
      const result = oklchToHexPerceptual(
        normalizeOklch({
          mode: "oklch" as const,
          l: 60,
          c: 0.01, // Very low chroma
          h: 180,
        })
      );

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
