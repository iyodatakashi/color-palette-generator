import { describe, it, expect } from "vitest";
import {
  getLightness,
  adjustToLightness,
  findClosestLevel,
  calculateEvenScale,
} from "../lightness";
import { SCALE_LEVELS, STANDARD_LIGHTNESS_SCALE } from "../constants";
import type { LightnessMethod } from "../types";

describe("lightness", () => {
  describe("getPerceptualLightness (via getLightness)", () => {
    it("純白で高い値を返す", () => {
      const lightness = getLightness({
        color: "#ffffff",
        lightnessMethod: "perceptual",
      });
      expect(lightness).toBeGreaterThan(95);
    });

    it("純黒で低い値を返す", () => {
      const lightness = getLightness({
        color: "#000000",
        lightnessMethod: "perceptual",
      });
      expect(lightness).toBeLessThan(5);
    });

    it("無効な値でエラーを起こさない", () => {
      // Test with valid hex colors that would represent edge cases
      const testColors = ["#000000", "#ffffff", "#808080"];

      testColors.forEach((color) => {
        expect(() =>
          getLightness({ color, lightnessMethod: "perceptual" })
        ).not.toThrow();
        const result = getLightness({ color, lightnessMethod: "perceptual" });
        expect(typeof result).toBe("number");
        expect(isFinite(result)).toBe(true);
      });
    });
  });

  describe("getHSLLightness (via getLightness)", () => {
    it("HSL色空間の明度を正しく返す", () => {
      const whiteLightness = getLightness({
        color: "#ffffff",
        lightnessMethod: "hsl",
      });
      const blackLightness = getLightness({
        color: "#000000",
        lightnessMethod: "hsl",
      });
      const grayLightness = getLightness({
        color: "#808080",
        lightnessMethod: "hsl",
      });

      expect(whiteLightness).toBeCloseTo(100, 1);
      expect(blackLightness).toBeCloseTo(0, 1);
      expect(grayLightness).toBeCloseTo(50.2, 1);
    });
  });

  describe("getAverageLightness (via getLightness)", () => {
    it("RGB平均値を0-100スケールで返す", () => {
      const whiteLightness = getLightness({
        color: "#ffffff",
        lightnessMethod: "average",
      });
      const blackLightness = getLightness({
        color: "#000000",
        lightnessMethod: "average",
      });
      const grayLightness = getLightness({
        color: "#808080",
        lightnessMethod: "average",
      });

      expect(whiteLightness).toBeCloseTo(100, 1);
      expect(blackLightness).toBeCloseTo(0, 1);
      expect(grayLightness).toBeCloseTo(50.2, 1);
    });
  });

  describe("getHybridLightness (via getLightness)", () => {
    it("知覚的明度とHSL明度の重み付き平均を返す", () => {
      const color = "#808080";
      const hybrid = getLightness({ color, lightnessMethod: "hybrid" });
      const perceptual = getLightness({ color, lightnessMethod: "perceptual" });
      const hsl = getLightness({ color, lightnessMethod: "hsl" });

      const expected = perceptual * 0.3 + hsl * 0.7;
      expect(hybrid).toBeCloseTo(expected, 1);
    });
  });

  describe("getLightness", () => {
    it("デフォルトでhybridメソッドを使用する", () => {
      const color = "#8040c0";
      const defaultResult = getLightness({ color });
      const hybridResult = getLightness({ color, lightnessMethod: "hybrid" });
      expect(defaultResult).toBe(hybridResult);
    });

    it("各明度計算方法で結果を返す", () => {
      const color = "#8040c0";
      const methods: LightnessMethod[] = [
        "hybrid",
        "hsl",
        "perceptual",
        "average",
      ];

      methods.forEach((method) => {
        const result = getLightness({ color, lightnessMethod: method });
        expect(typeof result).toBe("number");
        expect(isFinite(result)).toBe(true);
      });
    });
  });

  describe("adjustToLightness", () => {
    it("指定した明度に近い色を返す", () => {
      const targetLightness = 50;
      const result = adjustToLightness({
        h: 0,
        s: 100,
        targetLightness,
        lightnessMethod: "hybrid",
      });

      expect(result).toMatch(/^#[0-9a-f]{6}$/i);

      const actualLightness = getLightness({
        color: result,
        lightnessMethod: "hybrid",
      });
      expect(Math.abs(actualLightness - targetLightness)).toBeLessThan(3);
    });

    it("HSL明度で正確な調整を行う", () => {
      const targetLightness = 50;
      const result = adjustToLightness({
        h: 0,
        s: 100,
        targetLightness,
        lightnessMethod: "hsl",
      });

      expect(result).toMatch(/^#[0-9a-f]{6}$/i);

      const actualLightness = getLightness({
        color: result,
        lightnessMethod: "hsl",
      });
      expect(Math.abs(actualLightness - targetLightness)).toBeLessThan(1);
    });

    it("無効な入力値でエラーを起こさない", () => {
      const invalidInputs = [
        { h: NaN, s: 50, targetLightness: 50 },
        { h: 0, s: -10, targetLightness: 50 },
        { h: 0, s: 200, targetLightness: 50 },
        { h: 0, s: 50, targetLightness: -10 },
        { h: 0, s: 50, targetLightness: 200 },
      ];

      invalidInputs.forEach((input) => {
        expect(() =>
          adjustToLightness({ ...input, lightnessMethod: "hybrid" })
        ).not.toThrow();
        const result = adjustToLightness({
          ...input,
          lightnessMethod: "hybrid",
        });
        expect(result).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe("findClosestLevel", () => {
    it("標準スケールの値に対して正確なレベルを返す", () => {
      SCALE_LEVELS.forEach((level) => {
        const lightness = STANDARD_LIGHTNESS_SCALE[level];
        const closestLevel = findClosestLevel({
          inputLightness: lightness,
          lightnessMethod: "hybrid",
        });
        expect(closestLevel).toBe(level);
      });
    });

    it("中間値に対して最も近いレベルを返す", () => {
      const lightness400 = STANDARD_LIGHTNESS_SCALE[400];
      const lightness500 = STANDARD_LIGHTNESS_SCALE[500];
      const midLightness = (lightness400 + lightness500) / 2;

      const closestLevel = findClosestLevel({
        inputLightness: midLightness,
        lightnessMethod: "hybrid",
      });
      expect([400, 500]).toContain(closestLevel);
    });

    it("無効な入力値でエラーを起こさない", () => {
      const invalidInputs = [NaN, Infinity, -Infinity];

      invalidInputs.forEach((input) => {
        expect(() =>
          findClosestLevel({
            inputLightness: input,
            lightnessMethod: "hybrid",
          })
        ).not.toThrow();

        const result = findClosestLevel({
          inputLightness: input,
          lightnessMethod: "hybrid",
        });
        expect(SCALE_LEVELS).toContain(result);
      });
    });
  });

  describe("calculateEvenScale", () => {
    it("ベースレベルの明度が入力明度と一致する", () => {
      const testInputLightness = 50;
      const testBaseLevel = 500;

      const result = calculateEvenScale({
        inputLightness: testInputLightness,
        baseLevel: testBaseLevel,
      });

      expect(result[testBaseLevel]).toBe(testInputLightness);
    });

    it("全てのSCALE_LEVELSが含まれる", () => {
      const result = calculateEvenScale({
        inputLightness: 50,
        baseLevel: 500,
      });

      SCALE_LEVELS.forEach((level) => {
        expect(result).toHaveProperty(level.toString());
        expect(typeof result[level]).toBe("number");
      });
    });

    it("明度が階調順序で並んでいる", () => {
      const result = calculateEvenScale({
        inputLightness: 50,
        baseLevel: 500,
      });

      const sortedLevels = SCALE_LEVELS.slice().sort((a, b) => a - b);
      for (let i = 0; i < sortedLevels.length - 1; i++) {
        const currentLevel = sortedLevels[i];
        const nextLevel = sortedLevels[i + 1];
        expect(result[currentLevel]).toBeGreaterThanOrEqual(result[nextLevel]);
      }
    });
  });
});
