// combinationUtils.test.ts

import { describe, it, expect } from "vitest";
import { generateCombination } from "../combination";
import type {
  CombinationType,
  BaseColorStrategy,
  Combination,
  LightnessMethod,
  ColorConfig,
} from "../types";
import { hexToHSL } from "../colorUtils";

describe("combinationUtils", () => {
  const testPrimaryColor = "#3b82f6"; // 青色
  const testPrimaryHSL = hexToHSL(testPrimaryColor);

  // ヘルパー関数
  const findConfigByPrefix = (
    combination: Combination,
    prefix: string
  ): ColorConfig | undefined => {
    return combination.find((config) => config.prefix === prefix);
  };

  const hasPrefix = (combination: Combination, prefix: string): boolean => {
    return combination.some((config) => config.prefix === prefix);
  };

  describe("generateCombination", () => {
    it("基本的な設定で有効なColorConfig配列を生成する", () => {
      const result = generateCombination({
        primaryColor: testPrimaryColor,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // base, primary, secondary が含まれることを確認
      expect(hasPrefix(result, "base")).toBe(true);
      expect(hasPrefix(result, "primary")).toBe(true);
      expect(hasPrefix(result, "secondary")).toBe(true); // デフォルトはcomplementary

      // 各ColorConfigが有効であることを確認
      result.forEach((config) => {
        expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(typeof config.prefix).toBe("string");
        expect(config.lightnessMethod).toBeDefined();
      });

      // プライマリカラーが正しく設定されることを確認
      const primaryConfig = findConfigByPrefix(result, "primary");
      expect(primaryConfig?.color).toBe(testPrimaryColor);
    });

    it("すべての組み合わせタイプで動作する", () => {
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
        const result = generateCombination({
          primaryColor: testPrimaryColor,
          combinationType,
        });

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        // 各ColorConfigが有効であることを確認
        result.forEach((config) => {
          expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
          expect(typeof config.prefix).toBe("string");
          expect(config.lightnessMethod).toBeDefined();
        });

        // プライマリカラーが含まれることを確認
        const primaryConfig = findConfigByPrefix(result, "primary");
        expect(primaryConfig?.color).toBe(testPrimaryColor);

        // 単色調和以外では追加色があることを確認
        if (combinationType !== "monochromatic") {
          expect(hasPrefix(result, "secondary")).toBe(true);
        }
      });
    });

    it("単色調和以外では追加色が生成される", () => {
      const combinationTypesWithSecondary2: CombinationType[] = [
        "analogous",
        "splitComplementary",
        "triadic",
      ];

      combinationTypesWithSecondary2.forEach((combinationType) => {
        const result = generateCombination({
          primaryColor: testPrimaryColor,
          combinationType,
        });

        expect(hasPrefix(result, "secondary2")).toBe(true);
        const secondary2Config = findConfigByPrefix(result, "secondary2");
        expect(secondary2Config?.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it("4色調和では3つの追加色が生成される", () => {
      const combinationTypesWithSecondary3: CombinationType[] = [
        "doubleComplementary",
        "doubleComplementaryReverse",
        "tetradic",
      ];

      combinationTypesWithSecondary3.forEach((combinationType) => {
        const result = generateCombination({
          primaryColor: testPrimaryColor,
          combinationType,
        });

        expect(hasPrefix(result, "secondary2")).toBe(true);
        expect(hasPrefix(result, "secondary3")).toBe(true);

        const secondary2Config = findConfigByPrefix(result, "secondary2");
        const secondary3Config = findConfigByPrefix(result, "secondary3");

        expect(secondary2Config?.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(secondary3Config?.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it("単色調和では追加色が生成されない", () => {
      const result = generateCombination({
        primaryColor: testPrimaryColor,
        combinationType: "monochromatic",
      });

      expect(hasPrefix(result, "secondary2")).toBe(false);
      expect(hasPrefix(result, "secondary3")).toBe(false);
      expect(hasPrefix(result, "secondary")).toBe(false);
    });

    it("すべての明度計算方法で動作する", () => {
      const methods: LightnessMethod[] = [
        "hybrid",
        "hsl",
        "perceptual",
        "average",
      ];

      methods.forEach((method) => {
        const result = generateCombination({
          primaryColor: testPrimaryColor,
          lightnessMethod: method,
        });

        result.forEach((config) => {
          expect(config.lightnessMethod).toBe(method);
        });
      });
    });

    it("すべてのベースカラー戦略で動作する", () => {
      const strategies: BaseColorStrategy[] = [
        "harmonic",
        "contrasting",
        "neutral",
      ];

      strategies.forEach((strategy) => {
        const result = generateCombination({
          primaryColor: testPrimaryColor,
          baseColorStrategy: strategy,
        });

        const baseConfig = findConfigByPrefix(result, "base");
        expect(baseConfig?.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(baseConfig?.color).not.toBe(testPrimaryColor);
      });
    });

    it("補色調和で正確な補色が生成される", () => {
      const result = generateCombination({
        primaryColor: testPrimaryColor,
        combinationType: "complementary",
      });

      const primaryConfig = findConfigByPrefix(result, "primary");
      const secondaryConfig = findConfigByPrefix(result, "secondary");

      expect(primaryConfig?.color).toBe(testPrimaryColor);
      expect(secondaryConfig).toBeDefined();

      const primaryHue = testPrimaryHSL.h;
      const secondaryHSL = hexToHSL(secondaryConfig!.color);
      const expectedComplementaryHue = (primaryHue + 180) % 360;

      const hueDifference = Math.abs(secondaryHSL.h - expectedComplementaryHue);
      const adjustedDifference = Math.min(hueDifference, 360 - hueDifference);
      expect(adjustedDifference).toBeLessThan(5);
    });

    it("三角調和で正確な角度が生成される", () => {
      const result = generateCombination({
        primaryColor: testPrimaryColor,
        combinationType: "triadic",
      });

      const primaryHue = testPrimaryHSL.h;
      const secondaryConfig = findConfigByPrefix(result, "secondary");
      const secondary2Config = findConfigByPrefix(result, "secondary2");

      expect(secondaryConfig).toBeDefined();
      expect(secondary2Config).toBeDefined();

      const secondaryHSL = hexToHSL(secondaryConfig!.color);
      const secondary2HSL = hexToHSL(secondary2Config!.color);

      const expectedHue1 = (primaryHue + 120) % 360;
      const expectedHue2 = (primaryHue + 240) % 360;

      const diff1 = Math.abs(secondaryHSL.h - expectedHue1);
      const diff2 = Math.abs(secondary2HSL.h - expectedHue2);

      expect(Math.min(diff1, 360 - diff1)).toBeLessThan(5);
      expect(Math.min(diff2, 360 - diff2)).toBeLessThan(5);
    });

    it("分散補色で正しい角度が生成される", () => {
      const result = generateCombination({
        primaryColor: testPrimaryColor,
        combinationType: "splitComplementary",
      });

      // 2つの追加色があることを確認
      expect(hasPrefix(result, "secondary")).toBe(true);
      expect(hasPrefix(result, "secondary2")).toBe(true);

      const primaryHue = testPrimaryHSL.h;
      const secondaryConfig = findConfigByPrefix(result, "secondary");
      const secondary2Config = findConfigByPrefix(result, "secondary2");

      const secondaryHSL = hexToHSL(secondaryConfig!.color);
      const secondary2HSL = hexToHSL(secondary2Config!.color);

      // splitComplementaryは150度と210度の角度
      const expectedHue1 = (primaryHue + 150) % 360;
      const expectedHue2 = (primaryHue + 210) % 360;

      const diff1 = Math.abs(secondaryHSL.h - expectedHue1);
      const diff2 = Math.abs(secondary2HSL.h - expectedHue2);

      expect(Math.min(diff1, 360 - diff1)).toBeLessThan(5);
      expect(Math.min(diff2, 360 - diff2)).toBeLessThan(5);
    });

    it("異なる色でも一貫した結果を返す", () => {
      const testColors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

      testColors.forEach((color) => {
        const result = generateCombination({
          primaryColor: color,
          combinationType: "complementary",
        });

        const primaryConfig = findConfigByPrefix(result, "primary");
        expect(primaryConfig?.color).toBe(color);

        result.forEach((config) => {
          expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
        });
      });
    });
  });

  describe("ColorConfig配列としての整合性", () => {
    it("生成された結果がColorConfig[]型に適合する", () => {
      const result: Combination = generateCombination({
        primaryColor: testPrimaryColor,
        combinationType: "triadic",
        lightnessMethod: "hybrid",
        baseColorStrategy: "harmonic",
      });

      expect(Array.isArray(result)).toBe(true);

      result.forEach((config: ColorConfig) => {
        expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(typeof config.prefix).toBe("string");
        expect(config.lightnessMethod).toBeDefined();
      });
    });

    it("各ColorConfigが必要なプロパティを持つ", () => {
      const result = generateCombination({
        primaryColor: testPrimaryColor,
        combinationType: "tetradic",
        lightnessMethod: "hybrid",
      });

      result.forEach((config) => {
        // 必須プロパティ
        expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(typeof config.prefix).toBe("string");

        // オプショナルプロパティ（設定された場合）
        expect(config.lightnessMethod).toBe("hybrid");
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("無効な色コードでもエラーを起こさない", () => {
      const invalidColors = ["invalid", "#gggggg", "", "#12345"];

      invalidColors.forEach((color) => {
        expect(() => {
          generateCombination({ primaryColor: color });
        }).not.toThrow();

        const result = generateCombination({ primaryColor: color });
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it("無効な組み合わせタイプでデフォルトを使用する", () => {
      const result = generateCombination({
        primaryColor: testPrimaryColor,
        combinationType: "invalid" as any,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach((config) => {
        expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it("極端な色でも動作する", () => {
      const extremeColors = ["#000000", "#ffffff", "#800000", "#008080"];

      extremeColors.forEach((color) => {
        const result = generateCombination({
          primaryColor: color,
          combinationType: "tetradic",
        });

        expect(Array.isArray(result)).toBe(true);
        const primaryConfig = findConfigByPrefix(result, "primary");
        expect(primaryConfig?.color).toBe(color);

        expect(hasPrefix(result, "secondary2")).toBe(true);
        expect(hasPrefix(result, "secondary3")).toBe(true);
      });
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量の生成でも適切な時間で完了する", () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        generateCombination({
          primaryColor: testPrimaryColor,
          combinationType: "tetradic",
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
    });
  });
});
