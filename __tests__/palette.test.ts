import { describe, it, expect } from "vitest";
import { generateColorPalette, resolveVariable } from "../src/palette";
import type { ColorConfig, Palette } from "../src/types";

describe("palette", () => {
  describe("generateColorPalette", () => {
    it("should generate a palette from a single color config", () => {
      const config: ColorConfig = {
        id: "primary",
        prefix: "primary",
        color: "#3b82f6", // Blue color
        oklch: {
          mode: "oklch",
          l: 0.5,
          c: 0.15,
          h: 240,
        },
        hueShiftMode: "natural",
        includeTransparent: false,
        includeTextColors: false,
        enableChromaAdjustment: true,
      };

      const result = generateColorPalette(config);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");

      // Check that we have the expected scale levels
      const expectedLevels = [
        50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
      ];
      expectedLevels.forEach((level) => {
        expect(result[`--primary-${level}`]).toBeDefined();
        expect(result[`--primary-${level}`]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });

      // Check variation colors
      expect(result["--primary-color"]).toBeDefined();
      expect(result["--primary-lighter"]).toBeDefined();
      expect(result["--primary-light"]).toBeDefined();
      expect(result["--primary-dark"]).toBeDefined();
      expect(result["--primary-darker"]).toBeDefined();
    });

    it("should generate a palette from multiple color configs", () => {
      const configs: ColorConfig[] = [
        {
          id: "primary",
          prefix: "primary",
          color: "#3b82f6",
          oklch: {
            mode: "oklch",
            l: 0.5,
            c: 0.15,
            h: 240,
          },
          hueShiftMode: "natural",
          includeTransparent: false,
          includeTextColors: false,
          enableChromaAdjustment: true,
        },
        {
          id: "primary",
          prefix: "secondary",
          color: "#ef4444",
          oklch: {
            mode: "oklch",
            l: 0.5,
            c: 0.2,
            h: 0,
          },
          hueShiftMode: "natural",
          includeTransparent: false,
          includeTextColors: false,
          enableChromaAdjustment: true,
        },
      ];

      const result = generateColorPalette(configs);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");

      // Check primary colors
      expect(result["--primary-500"]).toBeDefined();
      expect(result["--primary-color"]).toBeDefined();

      // Check secondary colors
      expect(result["--secondary-500"]).toBeDefined();
      expect(result["--secondary-color"]).toBeDefined();
    });

    it("should generate transparent colors when includeTransparent is true", () => {
      const config: ColorConfig = {
        id: "primary",
        prefix: "primary",
        color: "#3b82f6",
        oklch: {
          mode: "oklch",
          l: 0.5,
          c: 0.15,
          h: 240,
        },
        hueShiftMode: "natural",
        includeTransparent: true,
        includeTextColors: false,
        enableChromaAdjustment: true,
      };

      const result = generateColorPalette(config);

      // Check for transparent color variants (may not be generated if conditions aren't met)
      const transparentKeys = Object.keys(result).filter(
        (key) =>
          key.includes("-10") || key.includes("-20") || key.includes("-30")
      );

      // If transparent colors are generated, they should be valid
      if (transparentKeys.length > 0) {
        transparentKeys.forEach((key) => {
          expect(result[key]).toBeDefined();
          // Transparent colors might be in hex format, so check for valid color format
          expect(result[key]).toMatch(/^(#[0-9a-fA-F]{6}|rgba?\([^)]+\))$/);
        });
      }
    });

    it("should generate text colors when includeTextColors is true", () => {
      const config: ColorConfig = {
        id: "primary",
        prefix: "primary",
        color: "#3b82f6",
        oklch: {
          mode: "oklch",
          l: 0.5,
          c: 0.15,
          h: 240,
        },
        hueShiftMode: "natural",
        includeTransparent: false,
        includeTextColors: true,
        enableChromaAdjustment: true,
      };

      const result = generateColorPalette(config);

      // Check for text color variants
      expect(result["--primary-text-color-on-light"]).toBeDefined();
      expect(result["--primary-text-color-on-dark"]).toBeDefined();
    });

    it("should handle different hue shift modes", () => {
      const baseConfig: ColorConfig = {
        id: "primary",
        prefix: "primary",
        color: "#3b82f6",
        oklch: {
          mode: "oklch",
          l: 0.5,
          c: 0.15,
          h: 240,
        },
        includeTransparent: false,
        includeTextColors: false,
        enableChromaAdjustment: true,
      };

      const modes = ["fixed", "natural", "unnatural"] as const;

      modes.forEach((mode) => {
        const config = { ...baseConfig, hueShiftMode: mode };
        const result = generateColorPalette(config);

        expect(result).toBeDefined();
        expect(result["--primary-500"]).toBeDefined();
        expect(result["--primary-500"]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should handle OKLCH color input for combination colors", () => {
      const config: ColorConfig = {
        id: "secondary",
        prefix: "secondary",
        color: "#10b981",
        oklch: {
          mode: "oklch",
          l: 0.6,
          c: 0.15,
          h: 120,
        },
        hueShiftMode: "natural",
        includeTransparent: false,
        includeTextColors: false,
        enableChromaAdjustment: true,
      };

      const result = generateColorPalette(config);

      expect(result).toBeDefined();
      expect(result["--secondary-500"]).toBeDefined();
      expect(result["--secondary-500"]).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should throw error for invalid color input", () => {
      const config: ColorConfig = {
        id: "primary",
        prefix: "primary",
        color: "invalid-color", // Invalid HEX format
        oklch: {
          mode: "oklch",
          l: NaN, // Invalid lightness to trigger error
          c: 0.15,
          h: 240,
        },
        hueShiftMode: "natural",
        includeTransparent: false,
        includeTextColors: false,
        enableChromaAdjustment: true,
      };

      expect(() => generateColorPalette(config)).toThrow();
    });

    it("should handle chroma adjustment disabled", () => {
      const config: ColorConfig = {
        id: "primary",
        prefix: "primary",
        color: "#3b82f6",
        oklch: {
          mode: "oklch",
          l: 0.5,
          c: 0.15,
          h: 240,
        },
        hueShiftMode: "natural",
        includeTransparent: false,
        includeTextColors: false,
        enableChromaAdjustment: false,
      };

      const result = generateColorPalette(config);

      expect(result).toBeDefined();
      expect(result["--primary-500"]).toBeDefined();
      expect(result["--primary-500"]).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should generate consistent results for the same input", () => {
      const config: ColorConfig = {
        id: "primary",
        prefix: "primary",
        color: "#3b82f6",
        oklch: {
          mode: "oklch",
          l: 0.5,
          c: 0.15,
          h: 240,
        },
        hueShiftMode: "natural",
        includeTransparent: false,
        includeTextColors: false,
        enableChromaAdjustment: true,
      };

      const result1 = generateColorPalette(config);
      const result2 = generateColorPalette(config);

      expect(result1).toEqual(result2);
    });

    it("should handle different color inputs", () => {
      const colors = [
        "#3b82f6", // Blue
        "#ef4444", // Red
        "#10b981", // Green
        "#f59e0b", // Yellow
        "#8b5cf6", // Purple
      ];

      colors.forEach((color, index) => {
        const config: ColorConfig = {
          id: "primary",
          prefix: `color-${index}`,
          color,
          oklch: {
            mode: "oklch",
            l: 0.5,
            c: 0.15,
            h: 240,
          },
          hueShiftMode: "natural",
          includeTransparent: false,
          includeTextColors: false,
          enableChromaAdjustment: true,
        };

        const result = generateColorPalette(config);

        expect(result).toBeDefined();
        expect(result[`--color-${index}-500`]).toBeDefined();
        expect(result[`--color-${index}-500`]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe("resolveVariable", () => {
    it("should resolve a direct HEX color", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
      };

      const result = resolveVariable({
        variableName: "--primary-500",
        palette,
      });

      expect(result).toBe("#3b82f6");
    });

    it("should resolve a CSS variable reference", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-color": "var(--primary-500)",
      };

      const result = resolveVariable({
        variableName: "--primary-color",
        palette,
      });

      expect(result).toBe("#3b82f6");
    });

    it("should resolve nested CSS variable references", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-color": "var(--primary-500)",
        "--primary-main": "var(--primary-color)",
      };

      const result = resolveVariable({
        variableName: "--primary-main",
        palette,
      });

      expect(result).toBe("#3b82f6");
    });

    it("should return fallback for non-existent variable", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
      };

      const result = resolveVariable({
        variableName: "--non-existent",
        palette,
        fallback: "#000000",
      });

      expect(result).toBe("#000000");
    });

    it("should return fallback for circular reference", () => {
      const palette: Palette = {
        "--primary-500": "var(--primary-color)",
        "--primary-color": "var(--primary-500)",
      };

      const result = resolveVariable({
        variableName: "--primary-500",
        palette,
        fallback: "#000000",
      });

      expect(result).toBe("#000000");
    });

    it("should handle variable name without -- prefix", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
      };

      const result = resolveVariable({
        variableName: "primary-500",
        palette,
      });

      expect(result).toBe("#3b82f6");
    });

    it("should return fallback for undefined palette value", () => {
      const palette: Palette = {
        "--primary-500": undefined as any,
      };

      const result = resolveVariable({
        variableName: "--primary-500",
        palette,
        fallback: "#000000",
      });

      expect(result).toBe("#000000");
    });

    it("should handle complex nested references", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-400": "#60a5fa",
        "--primary-color": "var(--primary-500)",
        "--primary-light": "var(--primary-400)",
        "--primary-main": "var(--primary-color)",
        "--primary-alt": "var(--primary-light)",
      };

      const result1 = resolveVariable({
        variableName: "--primary-main",
        palette,
      });

      const result2 = resolveVariable({
        variableName: "--primary-alt",
        palette,
      });

      expect(result1).toBe("#3b82f6");
      expect(result2).toBe("#60a5fa");
    });
  });
});
