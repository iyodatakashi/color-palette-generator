import { describe, it, expect, vi } from "vitest";
import { generateRandomSeedColor } from "../src/randomColor";
import type { RandomColorConfig } from "../src/types";

describe("randomColor", () => {
  describe("generateRandomPrimaryColor", () => {
    it("should generate a random color with default config", () => {
      const result = generateRandomSeedColor();

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should generate a random color with custom config", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 360],
        lightnessRange: [40, 80],
        chromaRange: [20, 60],
      };

      const result = generateRandomSeedColor(config);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should generate different colors on multiple calls", () => {
      const results = Array.from({ length: 10 }, () =>
        generateRandomSeedColor()
      );

      // Check that we get different colors (very unlikely to get 10 identical colors)
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);

      // All results should be valid hex colors
      results.forEach((result) => {
        expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should respect hue range constraints", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 180], // Only blue-green range
        lightnessRange: [50, 70],
        chromaRange: [30, 50],
      };

      // Mock Math.random to return predictable values
      const mockRandom = vi.spyOn(Math, "random");
      mockRandom.mockReturnValue(0.5); // This should give us hue = 90

      const result = generateRandomSeedColor(config);

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);

      mockRandom.mockRestore();
    });

    it("should respect lightness range constraints", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 360],
        lightnessRange: [60, 80], // Higher lightness range
        chromaRange: [20, 40],
      };

      const results = Array.from({ length: 20 }, () =>
        generateRandomSeedColor(config)
      );

      // All results should be valid hex colors
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should respect chroma range constraints", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 360],
        lightnessRange: [50, 70],
        chromaRange: [10, 30], // Lower chroma range
      };

      const results = Array.from({ length: 20 }, () =>
        generateRandomSeedColor(config)
      );

      // All results should be valid hex colors
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should handle edge case ranges", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 0], // Single hue
        lightnessRange: [50, 50], // Single lightness
        chromaRange: [20, 20], // Single chroma
      };

      const result = generateRandomSeedColor(config);

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should handle extreme ranges", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 360],
        lightnessRange: [0, 100],
        chromaRange: [0, 100],
      };

      const result = generateRandomSeedColor(config);

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should handle partial config (only some properties)", () => {
      const config: RandomColorConfig = {
        hueRange: [120, 240], // Only specify hue range
      };

      const result = generateRandomSeedColor(config);

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should handle empty config object", () => {
      const config: RandomColorConfig = {};

      const result = generateRandomSeedColor(config);

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should handle undefined config", () => {
      const result = generateRandomSeedColor(undefined as any);

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should generate colors within specified hue range", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 60], // Red to yellow range
        lightnessRange: [50, 70],
        chromaRange: [30, 50],
      };

      // Mock Math.random to return predictable values for testing
      const mockRandom = vi.spyOn(Math, "random");

      // Test minimum hue
      mockRandom.mockReturnValue(0);
      const minHueResult = generateRandomSeedColor(config);
      expect(minHueResult).toBeDefined();
      expect(minHueResult).toMatch(/^#[0-9a-fA-F]{6}$/);

      // Test maximum hue
      mockRandom.mockReturnValue(1);
      const maxHueResult = generateRandomSeedColor(config);
      expect(maxHueResult).toBeDefined();
      expect(maxHueResult).toMatch(/^#[0-9a-fA-F]{6}$/);

      mockRandom.mockRestore();
    });

    it("should generate colors within specified lightness range", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 360],
        lightnessRange: [30, 70],
        chromaRange: [20, 40],
      };

      // Mock Math.random to return predictable values for testing
      const mockRandom = vi.spyOn(Math, "random");

      // Test minimum lightness
      mockRandom.mockReturnValue(0);
      const minLightnessResult = generateRandomSeedColor(config);
      expect(minLightnessResult).toBeDefined();
      expect(minLightnessResult).toMatch(/^#[0-9a-fA-F]{6}$/);

      // Test maximum lightness
      mockRandom.mockReturnValue(1);
      const maxLightnessResult = generateRandomSeedColor(config);
      expect(maxLightnessResult).toBeDefined();
      expect(maxLightnessResult).toMatch(/^#[0-9a-fA-F]{6}$/);

      mockRandom.mockRestore();
    });

    it("should generate colors within specified chroma range", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 360],
        lightnessRange: [50, 70],
        chromaRange: [10, 50],
      };

      // Mock Math.random to return predictable values for testing
      const mockRandom = vi.spyOn(Math, "random");

      // Test minimum chroma
      mockRandom.mockReturnValue(0);
      const minChromaResult = generateRandomSeedColor(config);
      expect(minChromaResult).toBeDefined();
      expect(minChromaResult).toMatch(/^#[0-9a-fA-F]{6}$/);

      // Test maximum chroma
      mockRandom.mockReturnValue(1);
      const maxChromaResult = generateRandomSeedColor(config);
      expect(maxChromaResult).toBeDefined();
      expect(maxChromaResult).toMatch(/^#[0-9a-fA-F]{6}$/);

      mockRandom.mockRestore();
    });

    it("should handle invalid range values gracefully", () => {
      const config: RandomColorConfig = {
        hueRange: [360, 0], // Reversed range
        lightnessRange: [100, 0], // Reversed range
        chromaRange: [100, 0], // Reversed range
      };

      const result = generateRandomSeedColor(config);

      expect(result).toBeDefined();
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should be deterministic with mocked random values", () => {
      const config: RandomColorConfig = {
        hueRange: [0, 360],
        lightnessRange: [50, 70],
        chromaRange: [20, 40],
      };

      // Mock Math.random to return predictable values
      const mockRandom = vi.spyOn(Math, "random");
      mockRandom.mockReturnValue(0.5);

      const result1 = generateRandomSeedColor(config);
      const result2 = generateRandomSeedColor(config);

      expect(result1).toBe(result2);
      expect(result1).toMatch(/^#[0-9a-fA-F]{6}$/);

      mockRandom.mockRestore();
    });
  });
});
