// paletteGenerator.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateColorPalette } from "../palette";
import { applyColorPaletteToDom } from "../applyToDom";
import type {
  ColorConfig,
  Palette,
  LightnessMethod,
  HueShiftMode,
} from "../types";
import { SCALE_LEVELS } from "../constants";

// DOM操作のモック
const mockSetProperty = vi.fn();
const mockDocumentElement = {
  style: {
    setProperty: mockSetProperty,
  },
};

// グローバルオブジェクトのモック
Object.defineProperty(globalThis, "document", {
  value: {
    documentElement: mockDocumentElement,
  },
  writable: true,
});

describe("paletteGenerator", () => {
  beforeEach(() => {
    mockSetProperty.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generateColorPalette", () => {
    const baseColorConfig: ColorConfig = {
      id: "blue",
      prefix: "blue",
      color: "#3b82f6",
      hueShiftMode: "natural",
      includeTransparent: false,
    };

    it("基本的なカラーパレットを生成する", () => {
      const result = generateColorPalette(baseColorConfig);

      expect(result).toBeTypeOf("object");
      expect(Object.keys(result).length).toBeGreaterThan(0);

      // スケールレベルの色が生成されることを確認
      SCALE_LEVELS.forEach((level) => {
        const key = `--${baseColorConfig.prefix}-${level}`;
        expect(result).toHaveProperty(key);
        expect(result[key]).toMatch(/^#[0-9a-f]{6}$/i);
      });

      // カラー変数が生成されることを確認
      const colorKey = `--${baseColorConfig.prefix}-color`;
      expect(result).toHaveProperty(colorKey);
      expect(result[colorKey]).toMatch(/^var\(--blue-\d+\)$/);
    });

    it("variation colorsが正しく設定される", () => {
      const result = generateColorPalette(baseColorConfig);

      const variations = ["lighter", "light", "dark", "darker"];
      variations.forEach((variation) => {
        const key = `--${baseColorConfig.prefix}-${variation}`;
        expect(result).toHaveProperty(key);
        // variation colorsはCSS変数参照になる
        expect(result[key]).toMatch(/^var\(--blue-\d+\)$/);
      });

      // 実際のスケール値を確認
      const scaleValues = SCALE_LEVELS.map(
        (level) => result[`--${baseColorConfig.prefix}-${level}`]
      );
      scaleValues.forEach((value) => {
        expect(value).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it("text colorが明度に基づいて適切に設定される", () => {
      const testCases = [
        { id: "light", color: "#f8fafc", prefix: "light" },
        { id: "dark", color: "#1e293b", prefix: "dark" },
      ];

      testCases.forEach(({ id, color, prefix }) => {
        const config: ColorConfig = {
          id,
          prefix,
          color,
          hueShiftMode: "natural",
          includeTextColors: true, // 明示的に有効化
        };

        const result = generateColorPalette(config);

        // text-color-on-light と text-color-on-dark が生成されることを確認
        expect(result).toHaveProperty(`--${prefix}-text-color-on-light`);
        expect(result).toHaveProperty(`--${prefix}-text-color-on-dark`);

        // 両方ともCSS変数参照であることを確認
        expect(result[`--${prefix}-text-color-on-light`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );
        expect(result[`--${prefix}-text-color-on-dark`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );
      });
    });

    it("includeTextColors: falseの場合、テキスト色が出力されない", () => {
      const config: ColorConfig = {
        id: "test",
        prefix: "test",
        color: "#3b82f6",
        hueShiftMode: "natural",
        includeTextColors: false, // 明示的に無効化
      };

      const result = generateColorPalette(config);

      // テキスト色が出力されないことを確認
      expect(result).not.toHaveProperty("--test-text-color-on-light");
      expect(result).not.toHaveProperty("--test-text-color-on-dark");
    });

    it("includeTextColors: trueの場合、すべてのテキスト色が出力される", () => {
      const config: ColorConfig = {
        id: "test",
        prefix: "test",
        color: "#3b82f6",
        hueShiftMode: "natural",
        includeTextColors: true, // 明示的に有効化
      };

      const result = generateColorPalette(config);

      // text-color-on-light と text-color-on-dark が出力されることを確認
      expect(result).toHaveProperty("--test-text-color-on-light");
      expect(result).toHaveProperty("--test-text-color-on-dark");

      // 両方ともCSS変数参照であることを確認
      expect(result["--test-text-color-on-light"]).toMatch(
        /^var\(--test-\d+\)$/
      );
      expect(result["--test-text-color-on-dark"]).toMatch(
        /^var\(--test-\d+\)$/
      );

      // 実際の出力順序をログ出力（デバッグ用）
      console.log("Text color definitions:");
      console.log(
        "--test-text-color-on-light:",
        result["--test-text-color-on-light"]
      );
      console.log(
        "--test-text-color-on-dark:",
        result["--test-text-color-on-dark"]
      );
    });

    it("透明色が有効な場合、透過色パレットが追加される", () => {
      const configWithTransparent: ColorConfig = {
        ...baseColorConfig,
        includeTransparent: true,
        transparentOriginLevel: 500,
        bgColorLight: "#ffffff",
        bgColorDark: "#000000",
      };

      const result = generateColorPalette(configWithTransparent);

      const transparentKeys = Object.keys(result).filter((key) =>
        key.endsWith("-transparent")
      );
      expect(transparentKeys.length).toBeGreaterThan(0);

      transparentKeys.forEach((key) => {
        expect(result[key]).toMatch(
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
        );
      });

      SCALE_LEVELS.forEach((level) => {
        const transparentKey = `--${baseColorConfig.prefix}-${level}-transparent`;
        expect(result).toHaveProperty(transparentKey);
      });
    });

    it("異なる明度計算方法で動作する", () => {
      const methods: Array<LightnessMethod> = [
        "hybrid",
        "hsl",
        "perceptual",
        "average",
      ];
      const results: Record<string, Palette> = {};

      methods.forEach((method) => {
        const config: ColorConfig = {
          ...baseColorConfig,
          lightnessMethod: method,
        };
        results[method] = generateColorPalette(config);
      });

      methods.forEach((method) => {
        expect(results[method]).toBeTypeOf("object");
        expect(Object.keys(results[method]).length).toBeGreaterThan(0);
        // color keyはCSS変数参照
        expect(results[method]["--blue-color"]).toMatch(/^var\(--blue-\d+\)$/);
      });

      // 異なる明度計算方法で実際の色が違うことを確認
      const levelsToCheck = [50, 100, 500, 800, 950];
      let hasDifference = false;

      levelsToCheck.forEach((level) => {
        const colors = methods.map(
          (method) => results[method][`--blue-${level}`]
        );
        const uniqueColors = new Set(colors);
        if (uniqueColors.size > 1) {
          hasDifference = true;
        }
      });

      expect(hasDifference).toBe(true);
    });

    it("異なる色相シフトモードで動作する", () => {
      const modes: Array<HueShiftMode> = ["natural", "unnatural", "fixed"];
      const results: Record<string, Palette> = {};

      modes.forEach((mode) => {
        const config: ColorConfig = {
          ...baseColorConfig,
          hueShiftMode: mode,
        };
        results[mode] = generateColorPalette(config);
      });

      modes.forEach((mode) => {
        expect(results[mode]).toBeTypeOf("object");
        // color keyはCSS変数参照
        expect(results[mode]["--blue-color"]).toMatch(/^var\(--blue-\d+\)$/);
      });

      // 異なる色相シフトモードで実際の色が違うことを確認
      const levelsToCheck = [50, 100, 800, 900];
      let hasNaturalVsFixedDifference = false;
      let hasNaturalVsUnnaturalDifference = false;

      levelsToCheck.forEach((level) => {
        if (
          results.natural[`--blue-${level}`] !==
          results.fixed[`--blue-${level}`]
        ) {
          hasNaturalVsFixedDifference = true;
        }
        if (
          results.natural[`--blue-${level}`] !==
          results.unnatural[`--blue-${level}`]
        ) {
          hasNaturalVsUnnaturalDifference = true;
        }
      });

      expect(hasNaturalVsFixedDifference).toBe(true);
      expect(hasNaturalVsUnnaturalDifference).toBe(true);
    });

    it("無効な色でフォールバック処理が動作する", () => {
      const invalidColorConfigs = [
        { ...baseColorConfig, color: "" },
        { ...baseColorConfig, color: "#ff" },
        { ...baseColorConfig, color: "invalid" },
      ];

      invalidColorConfigs.forEach((config) => {
        expect(() => generateColorPalette(config)).not.toThrow();

        const result = generateColorPalette(config);
        expect(result).toBeTypeOf("object");
        expect(Object.keys(result).length).toBeGreaterThan(0);
        // color keyはCSS変数参照
        expect(result[`--${config.prefix}-color`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );
      });
    });
  });

  describe("generateColorPalette (multiple configurations)", () => {
    const colorConfigs: ColorConfig[] = [
      {
        id: "blue",
        prefix: "blue",
        color: "#3b82f6",
        hueShiftMode: "natural",
        includeTransparent: false,
      },
      {
        id: "red",
        prefix: "red",
        color: "#ef4444",
        hueShiftMode: "natural",
        includeTransparent: false,
      },
      {
        id: "green",
        prefix: "green",
        color: "#10b981",
        hueShiftMode: "fixed",
        includeTransparent: true,
        transparentOriginLevel: 500,
        bgColorLight: "#ffffff",
        bgColorDark: "#000000",
      },
    ];

    it("複数のカラーパレットを一度に生成する", () => {
      const result = generateColorPalette(colorConfigs);

      colorConfigs.forEach((config) => {
        // color keyはCSS変数参照
        expect(result[`--${config.prefix}-color`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );

        // スケールレベルは実際のHEX色
        SCALE_LEVELS.forEach((level) => {
          expect(result[`--${config.prefix}-${level}`]).toMatch(
            /^#[0-9a-f]{6}$/i
          );
        });
      });

      const greenTransparentKeys = Object.keys(result).filter(
        (key) => key.includes("green") && key.endsWith("-transparent")
      );
      expect(greenTransparentKeys.length).toBeGreaterThan(0);
    });

    it("空の配列で空のパレットを返す", () => {
      const result = generateColorPalette([]);
      expect(result).toEqual({});
    });

    it("単一設定で個別生成と同じ結果を返す", () => {
      const singleConfig = colorConfigs[0];
      const multipleResult = generateColorPalette([singleConfig]);
      const singleResult = generateColorPalette(singleConfig);

      expect(multipleResult).toEqual(singleResult);
    });
  });

  describe("統合テスト", () => {
    it("生成からDOM適用まで一連の流れが正常に動作する", () => {
      const config: ColorConfig = {
        id: "purple",
        prefix: "purple",
        color: "#8b5cf6",
        hueShiftMode: "natural",
        includeTransparent: true,
        transparentOriginLevel: 500,
        bgColorLight: "#ffffff",
        bgColorDark: "#000000",
      };

      const palette = generateColorPalette(config);

      expect(Object.keys(palette).length).toBeGreaterThan(0);
      // color keyはCSS変数参照
      expect(palette["--purple-color"]).toMatch(/^var\(--purple-\d+\)$/);

      applyColorPaletteToDom(palette);

      expect(mockSetProperty).toHaveBeenCalledTimes(
        Object.keys(palette).length
      );
    });

    it("全ての機能を組み合わせた総合テスト", () => {
      const complexConfigs: ColorConfig[] = [
        {
          id: "danger",
          prefix: "danger",
          color: "#ff6b6b",
          hueShiftMode: "natural",
          lightnessMethod: "hybrid",
          includeTransparent: true,
          includeTextColors: true, // 明示的に有効化
          transparentOriginLevel: 400,
          bgColorLight: "#ffffff",
          bgColorDark: "#1a1a1a",
        },
        {
          id: "success",
          prefix: "success",
          color: "#4ecdc4",
          hueShiftMode: "unnatural",
          lightnessMethod: "perceptual",
          includeTransparent: false,
          includeTextColors: true, // 明示的に有効化
        },
      ];

      const palette = generateColorPalette(complexConfigs);

      complexConfigs.forEach((config) => {
        // color keyはCSS変数参照
        expect(palette[`--${config.prefix}-color`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );

        // スケールレベルは実際のHEX色
        SCALE_LEVELS.forEach((level) => {
          expect(palette[`--${config.prefix}-${level}`]).toMatch(
            /^#[0-9a-f]{6}$/i
          );
        });

        // variation colorsはCSS変数参照
        ["lighter", "light", "dark", "darker"].forEach((variation) => {
          expect(palette[`--${config.prefix}-${variation}`]).toMatch(
            /^var\(--[^-]+-\d+\)$/
          );
        });

        // text colorsはCSS変数参照
        expect(palette[`--${config.prefix}-text-color-on-light`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );
        expect(palette[`--${config.prefix}-text-color-on-dark`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );

        if (config.includeTransparent) {
          const transparentKeys = Object.keys(palette).filter(
            (key) => key.includes(config.prefix) && key.endsWith("-transparent")
          );
          expect(transparentKeys.length).toBeGreaterThan(0);
        }
      });

      applyColorPaletteToDom(palette);

      expect(mockSetProperty).toHaveBeenCalledTimes(
        Object.keys(palette).length
      );
      expect(Object.keys(palette).length).toBeGreaterThan(
        complexConfigs.length * 15
      );
    });

    it("スケールカラーとCSS変数参照の整合性を確認", () => {
      const config: ColorConfig = {
        id: "test",
        prefix: "test",
        color: "#3b82f6",
        hueShiftMode: "natural",
        includeTextColors: true, // 明示的に有効化
      };

      const palette = generateColorPalette(config);

      // すべてのスケールカラーが実際のHEX色であることを確認
      SCALE_LEVELS.forEach((level) => {
        const scaleKey = `--test-${level}`;
        expect(palette[scaleKey]).toMatch(/^#[0-9a-f]{6}$/i);
      });

      // variation colorsがスケールカラーを参照していることを確認
      ["lighter", "light", "dark", "darker"].forEach((variation) => {
        const variationKey = `--test-${variation}`;
        expect(palette[variationKey]).toMatch(/^var\(--test-\d+\)$/);
      });

      // color keyがスケールカラーを参照していることを確認
      expect(palette["--test-color"]).toMatch(/^var\(--test-\d+\)$/);

      // text colorsがスケールカラーを参照していることを確認
      expect(palette["--test-text-color-on-light"]).toMatch(
        /^var\(--test-\d+\)$/
      );
      expect(palette["--test-text-color-on-dark"]).toMatch(
        /^var\(--test-\d+\)$/
      );
    });
  });
});
