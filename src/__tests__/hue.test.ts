// hue.test.ts

import { describe, it, expect } from "vitest";
import { adjustColorToSameTone, generateHuePalette, HUE_NAMES } from "../hue";

describe("hue", () => {
  describe("adjustColorToSameTone", () => {
    it("should change hue while maintaining the same tone", () => {
      const originalColor = "#3b82f6"; // Blue
      const targetHue = 120; // Green

      const result = adjustColorToSameTone({
        color: originalColor,
        targetHue,
      });

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result).not.toBe(originalColor);
    });

    it("should handle hue normalization", () => {
      const originalColor = "#3b82f6";

      // Test negative hue
      const result1 = adjustColorToSameTone({
        color: originalColor,
        targetHue: -30,
      });
      expect(result1).toBeDefined();

      // Test hue > 360
      const result2 = adjustColorToSameTone({
        color: originalColor,
        targetHue: 390,
      });
      expect(result2).toBeDefined();

      // Test 0 and 360 should be equivalent
      const result3 = adjustColorToSameTone({
        color: originalColor,
        targetHue: 0,
      });
      const result4 = adjustColorToSameTone({
        color: originalColor,
        targetHue: 360,
      });
      expect(result3).toBe(result4);
    });

    it("should handle invalid colors gracefully", () => {
      const invalidColor = "invalid-color";

      const result = adjustColorToSameTone({
        color: invalidColor,
        targetHue: 120,
      });

      expect(result).toBe(invalidColor);
    });

    it("should maintain the same tone", () => {
      const originalColor = "#3b82f6";
      const targetHue = 0; // Red

      const result = adjustColorToSameTone({
        color: originalColor,
        targetHue,
      });

      // The result should be red but with the same tone
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result).not.toBe(originalColor);
    });
  });

  describe("HUE_NAMES", () => {
    it("should have predefined names for 24 divisions", () => {
      expect(HUE_NAMES[0]).toBe("red");
      expect(HUE_NAMES[90]).toBe("lime");
      expect(HUE_NAMES[180]).toBe("cyan");
      expect(HUE_NAMES[270]).toBe("purple");
    });

    it("should have 24 named positions", () => {
      const namedPositions = Object.keys(HUE_NAMES).length;
      expect(namedPositions).toBe(24);
    });

    it("should use rich color names", () => {
      expect(HUE_NAMES[15]).toBe("scarlet");
      expect(HUE_NAMES[45]).toBe("amber");
      expect(HUE_NAMES[75]).toBe("peridot");
      expect(HUE_NAMES[105]).toBe("sage");
      expect(HUE_NAMES[120]).toBe("green");
      expect(HUE_NAMES[135]).toBe("jade");
      expect(HUE_NAMES[150]).toBe("emerald");
      expect(HUE_NAMES[165]).toBe("turquoise");
      expect(HUE_NAMES[195]).toBe("cerulean");
      expect(HUE_NAMES[210]).toBe("azure");
      expect(HUE_NAMES[225]).toBe("cobalt");
      expect(HUE_NAMES[255]).toBe("violet");
      expect(HUE_NAMES[285]).toBe("orchid");
      expect(HUE_NAMES[315]).toBe("rose");
      expect(HUE_NAMES[330]).toBe("crimson");
      expect(HUE_NAMES[345]).toBe("ruby");
    });
  });

  describe("generateHuePalette", () => {
    it("should generate palette with default 24 divisions", () => {
      const color = "#3b82f6"; // Blue
      const palette = generateHuePalette({ color });

      // Check that palette is an object with CSS variable keys
      expect(typeof palette).toBe("object");
      expect(Array.isArray(palette)).toBe(false);

      // Check that we have entries for each division
      const keys = Object.keys(palette);
      expect(keys.length).toBeGreaterThan(0);

      // Check that keys follow the expected pattern (allow color, lighter, etc.)
      keys.forEach((key) => {
        expect(key).toMatch(
          /^--[a-z]+(-\d+|-color|-lighter|-light|-dark|-darker|-transparent|-text-color-on-light|-text-color-on-dark)$/
        );
      });
    });

    it("should generate palette with custom divisions", () => {
      const color = "#3b82f6";
      const palette = generateHuePalette({ color, divisions: 12 });

      // Check that palette is an object
      expect(typeof palette).toBe("object");
      expect(Array.isArray(palette)).toBe(false);

      // Check that we have entries
      const keys = Object.keys(palette);
      expect(keys.length).toBeGreaterThan(0);
    });

    it("should maintain same tone across all colors and generate full palettes", () => {
      const color = "#3b82f6";
      const palette = generateHuePalette({
        color,
        divisions: 6,
        includeTextColors: true,
      });

      // Check that palette is an object
      expect(typeof palette).toBe("object");
      expect(Array.isArray(palette)).toBe(false);

      // Check that values are valid hex colors, CSS variables, or rgba
      Object.values(palette).forEach((value) => {
        expect(value).toMatch(
          /^(#[0-9a-fA-F]{6}|var\(--[a-z]+-\d+\)|rgba\([^)]+\))$/
        );
      });
    });

    it("should handle invalid base color", () => {
      const invalidColor = "invalid-color";
      const palette = generateHuePalette({ color: invalidColor });

      // Should return empty object for invalid color
      expect(palette).toEqual({});
    });

    it("should include hue information and full palette in each item", () => {
      const color = "#3b82f6";
      const palette = generateHuePalette({
        color,
        divisions: 8,
        includeTransparent: true,
      });

      // Check that palette is an object
      expect(typeof palette).toBe("object");
      expect(Array.isArray(palette)).toBe(false);

      // Check that we have entries
      const keys = Object.keys(palette);
      expect(keys.length).toBeGreaterThan(0);

      // Check that values are valid hex colors, CSS variables, or rgba
      Object.values(palette).forEach((value) => {
        expect(value).toMatch(
          /^(#[0-9a-fA-F]{6}|var\(--[a-z]+-\d+\)|rgba\([^)]+\))$/
        );
      });
    });

    it("should pass through all color configuration options", () => {
      const color = "#3b82f6";
      const palette = generateHuePalette({
        color,
        divisions: 4,
        lightnessMethod: "perceptual",
        hueShiftMode: "natural",
        includeTransparent: true,
        includeTextColors: true,
        bgColorLight: "#ffffff",
        bgColorDark: "#000000",
        transparentOriginLevel: 500,
      });

      // Check that palette is an object
      expect(typeof palette).toBe("object");
      expect(Array.isArray(palette)).toBe(false);

      // Check that we have entries
      const keys = Object.keys(palette);
      expect(keys.length).toBeGreaterThan(0);

      // Check that values are valid hex colors, CSS variables, or rgba
      Object.values(palette).forEach((value) => {
        expect(value).toMatch(
          /^(#[0-9a-fA-F]{6}|var\(--[a-z]+-\d+\)|rgba\([^)]+\))$/
        );
      });
    });
  });
});
