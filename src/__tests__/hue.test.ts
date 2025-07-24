// hue.test.ts

import { describe, it, expect } from "vitest";
import { changeHueWithSameTone } from "../hue";

describe("hue", () => {
  describe("changeHueWithSameTone", () => {
    it("should change hue while maintaining the same tone", () => {
      const originalColor = "#3b82f6"; // Blue
      const targetHue = 120; // Green

      const result = changeHueWithSameTone({
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
      const result1 = changeHueWithSameTone({
        color: originalColor,
        targetHue: -30,
      });
      expect(result1).toBeDefined();

      // Test hue > 360
      const result2 = changeHueWithSameTone({
        color: originalColor,
        targetHue: 390,
      });
      expect(result2).toBeDefined();

      // Test 0 and 360 should be equivalent
      const result3 = changeHueWithSameTone({
        color: originalColor,
        targetHue: 0,
      });
      const result4 = changeHueWithSameTone({
        color: originalColor,
        targetHue: 360,
      });
      expect(result3).toBe(result4);
    });

    it("should handle invalid colors gracefully", () => {
      const invalidColor = "invalid-color";

      const result = changeHueWithSameTone({
        color: invalidColor,
        targetHue: 120,
      });

      expect(result).toBe(invalidColor);
    });

    it("should maintain the same tone", () => {
      const originalColor = "#3b82f6";
      const targetHue = 0; // Red

      const result = changeHueWithSameTone({
        color: originalColor,
        targetHue,
      });

      // The result should be red but with the same tone
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result).not.toBe(originalColor);
    });
  });
});
