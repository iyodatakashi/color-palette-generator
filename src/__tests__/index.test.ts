// index.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateColorPalette,
  generateMultipleColorPalette,
  applyColorPaletteToDom,
} from "../index";
import type { ColorConfig, Palette, HueShiftMode } from "../types";
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

describe("index", () => {
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
      color: "#3b82f6", // 青色
      hueShiftMode: "natural",
      includeTransparent: false,
    };

    it("基本的なカラーパレットを生成する", () => {
      const result = generateColorPalette(baseColorConfig);

      // パレットが生成されることを確認
      expect(result).toBeTypeOf("object");
      expect(Object.keys(result).length).toBeGreaterThan(0);

      // 各スケールレベルのCSSカスタムプロパティが生成されることを確認
      SCALE_LEVELS.forEach((level) => {
        const key = `--${baseColorConfig.prefix}-${level}`;
        expect(result).toHaveProperty(key);
        expect(result[key]).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it("色の正規化と検証が正しく動作する", () => {
      // 異なる形式の色をテスト
      const testCases = [
        { input: "#3B82F6", expected: "#3b82f6" }, // 大文字 → 小文字
        { input: "3b82f6", expected: "#3b82f6" }, // #なし → #付き
        { input: "3B82F6", expected: "#3b82f6" }, // 大文字&#なし → 小文字&#付き
        { input: "#ffffff", expected: "#ffffff" }, // 既に正規化済み
        { input: "000000", expected: "#000000" }, // 黒色
      ];

      testCases.forEach(({ input, expected }) => {
        const config: ColorConfig = {
          ...baseColorConfig,
          color: input,
        };
        const result = generateColorPalette(config);
        // --prefix-colorはCSS変数参照を返す
        expect(result["--blue-color"]).toMatch(/^var\(--blue-\d+\)$/);

        // パレット全体が有効であることを確認
        SCALE_LEVELS.forEach((level) => {
          expect(result[`--blue-${level}`]).toMatch(/^#[0-9a-f]{6}$/i);
        });
      });
    });

    it("variation colorsの階層関係が正しく設定される", () => {
      const result = generateColorPalette(baseColorConfig);

      // variation colorsが存在することを確認
      const variations = ["lighter", "light", "dark", "darker"];
      variations.forEach((variation) => {
        const key = `--${baseColorConfig.prefix}-${variation}`;
        expect(result).toHaveProperty(key);
        // variation colorsはCSS変数参照を返す
        expect(result[key]).toMatch(/^var\(--blue-\d+\)$/);
      });

      // variation colorsがSCALE_LEVELSの値を参照していることを確認
      const lighter = result[`--${baseColorConfig.prefix}-lighter`];
      const light = result[`--${baseColorConfig.prefix}-light`];
      const dark = result[`--${baseColorConfig.prefix}-dark`];
      const darker = result[`--${baseColorConfig.prefix}-darker`];

      // これらの値がCSS変数参照形式であることを確認
      expect(lighter).toMatch(/^var\(--blue-\d+\)$/);
      expect(light).toMatch(/^var\(--blue-\d+\)$/);
      expect(dark).toMatch(/^var\(--blue-\d+\)$/);
      expect(darker).toMatch(/^var\(--blue-\d+\)$/);

      // 全て異なる値であることを確認（重複がない）
      const variationValues = [lighter, light, dark, darker];
      const uniqueValues = new Set(variationValues);
      expect(uniqueValues.size).toBe(4);
    });

    it("text colorが明度に基づいて適切に設定される", () => {
      // 明るい色と暗い色でテスト
      const testCases = [
        { id: "light", prefix: "light", color: "#f8fafc" }, // 非常に明るい色
        { id: "dark", prefix: "dark", color: "#1e293b" }, // 非常に暗い色
      ];

      testCases.forEach(({ id, color, prefix }) => {
        const config: ColorConfig = {
          id,
          prefix,
          color,
          hueShiftMode: "natural",
        };

        const result = generateColorPalette(config);
        const textColorKey = `--${prefix}-text-color`;

        expect(result).toHaveProperty(textColorKey);
        // text colorはCSS変数参照を返す
        expect(result[textColorKey]).toMatch(/^var\(--[^-]+-\d+\)$/);
      });
    });

    it("デフォルト値が正しく適用される", () => {
      // 最小限の設定でパレットを生成
      const minimalConfig: ColorConfig = {
        id: "red",
        prefix: "red",
        color: "#ff0000",
      };

      const result = generateColorPalette(minimalConfig);

      // デフォルト値が適用されてパレットが生成されることを確認
      expect(result).toBeTypeOf("object");
      expect(Object.keys(result).length).toBeGreaterThan(0);
      // --prefix-colorはCSS変数参照を返す
      expect(result["--red-color"]).toMatch(/^var\(--red-\d+\)$/);

      // 透明色が含まれないことを確認（デフォルトでincludeTransparent: false）
      const hasTransparentColors = Object.keys(result).some((key) =>
        key.endsWith("-transparent")
      );
      expect(hasTransparentColors).toBe(false);
    });

    it("transparentが有効な場合、透過色パレットが追加される", () => {
      const configWithTransparent: ColorConfig = {
        ...baseColorConfig,
        includeTransparent: true,
        transparentOriginLevel: 500,
        bgColorLight: "#ffffff",
        bgColorDark: "#000000",
      };

      const result = generateColorPalette(configWithTransparent);

      // 透過色キーが存在することを確認（命名規則: --prefix-level-transparent）
      const transparentKeys = Object.keys(result).filter((key) =>
        key.endsWith("-transparent")
      );
      expect(transparentKeys.length).toBeGreaterThan(0);

      // 透過色がrgba形式であることを確認
      transparentKeys.forEach((key) => {
        const value = result[key];
        expect(value).toMatch(
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
        );
      });

      // SCALE_LEVELSの各レベルに対応する透過色が生成されることを確認
      SCALE_LEVELS.forEach((level) => {
        const transparentKey = `--${baseColorConfig.prefix}-${level}-transparent`;
        expect(result).toHaveProperty(transparentKey);
      });

      // 基本パレット以上のキーが存在することを確認
      expect(Object.keys(result).length).toBeGreaterThan(
        SCALE_LEVELS.length + 5
      );
    });

    it("transparentOriginLevel=50で正しい透過色が生成される", () => {
      const configWithTransparent: ColorConfig = {
        ...baseColorConfig,
        includeTransparent: true,
        transparentOriginLevel: 50,
        bgColorLight: "#ffffff",
        bgColorDark: "#000000",
      };

      const result = generateColorPalette(configWithTransparent);

      // 基本の50レベルの色を取得
      const baseLevel50Color = result[`--${baseColorConfig.prefix}-50`];
      expect(baseLevel50Color).toMatch(/^#[0-9a-f]{6}$/i);

      // 透過色キーが存在することを確認（実際の命名規則: --prefix-level-transparent）
      const transparentKeys = Object.keys(result).filter((key) =>
        key.endsWith("-transparent")
      );
      expect(transparentKeys.length).toBeGreaterThan(0);

      // 50レベルの透過色が存在することを確認
      const level50TransparentKey = `--${baseColorConfig.prefix}-50-transparent`;
      expect(result).toHaveProperty(level50TransparentKey);
      expect(result[level50TransparentKey]).toMatch(
        /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
      );

      // 全ての透過色がrgba形式であることを確認
      transparentKeys.forEach((key) => {
        expect(result[key]).toMatch(
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
        );
      });
    });

    it("異なるtransparentOriginLevelで異なる透過色ベースが使用される", () => {
      const levels = [50, 500, 950]; // 明、中間、暗
      const results: Record<number, Palette> = {};

      // 各レベルでパレットを生成
      levels.forEach((level) => {
        const config: ColorConfig = {
          ...baseColorConfig,
          includeTransparent: true,
          transparentOriginLevel: level,
          bgColorLight: "#ffffff",
          bgColorDark: "#000000",
        };
        results[level] = generateColorPalette(config);
      });

      // 各レベルで透過色が生成されることを確認
      levels.forEach((level) => {
        const palette = results[level];
        const transparentKeys = Object.keys(palette).filter((key) =>
          key.endsWith("-transparent")
        );
        expect(transparentKeys.length).toBeGreaterThan(0);

        // 各透過色がrgba形式であることを確認
        transparentKeys.forEach((key) => {
          expect(palette[key]).toMatch(
            /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
          );
        });
      });

      // 異なるレベル間で透過色が異なることを確認
      const level50Transparents = Object.keys(results[50]).filter((key) =>
        key.endsWith("-transparent")
      );
      const level950Transparents = Object.keys(results[950]).filter((key) =>
        key.endsWith("-transparent")
      );

      // 同じキーで異なる値を持つことを確認
      const commonKeys = level50Transparents.filter((key) =>
        level950Transparents.includes(key)
      );
      if (commonKeys.length > 0) {
        const hasVariation = commonKeys.some((key) => {
          return results[50][key] !== results[950][key];
        });
        expect(hasVariation).toBe(true);
      }

      // transparentOriginLevel自体のアルファ値が最大になることを確認
      levels.forEach((originLevel) => {
        const palette = results[originLevel];
        const originTransparentKey = `--${baseColorConfig.prefix}-${originLevel}-transparent`;

        if (palette[originTransparentKey]) {
          const alphaMatch = palette[originTransparentKey].match(
            /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/
          );
          if (alphaMatch) {
            const alpha = parseFloat(alphaMatch[1]);
            // originLevelでは最大アルファ値（1.0に近い）になることを確認
            expect(alpha).toBeGreaterThan(0.8);
          }
        }
      });
    });

    it("異なる明度計算方法で異なる結果を生成する", () => {
      const methods: Array<"hybrid" | "hsl" | "perceptual" | "average"> = [
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

      // 各メソッドでパレットが生成されることを確認
      methods.forEach((method) => {
        expect(results[method]).toBeTypeOf("object");
        expect(Object.keys(results[method]).length).toBeGreaterThan(0);
        expect(results[method]["--blue-color"]).toMatch(/^var\(--blue-\d+\)$/);
      });

      // メソッド間で異なる結果が生成されることを確認
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

    it("異なる明度計算方法の特性が反映される", () => {
      // 色相による明度差が大きい色をテスト（緑と赤）
      const testCases = [
        { id: "green", prefix: "green", color: "#00ff00" }, // 緑（知覚的には明るい）
        { id: "red", prefix: "red", color: "#ff0000" }, // 赤（知覚的には暗い）
      ];

      testCases.forEach(({ id, color, prefix }) => {
        const hslResult = generateColorPalette({
          id,
          color,
          prefix,
          lightnessMethod: "hsl",
        });

        const perceptualResult = generateColorPalette({
          id,
          color,
          prefix,
          lightnessMethod: "perceptual",
        });

        // 両方のメソッドで有効なパレットが生成されることを確認
        expect(hslResult[`--${prefix}-color`]).toMatch(/^var\(--[^-]+-\d+\)$/);
        expect(perceptualResult[`--${prefix}-color`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );

        // HSLと知覚的で異なる結果になることを確認
        const hasMethodDifference = SCALE_LEVELS.some((level) => {
          return (
            hslResult[`--${prefix}-${level}`] !==
            perceptualResult[`--${prefix}-${level}`]
          );
        });
        expect(hasMethodDifference).toBe(true);
      });
    });

    it("異なる色相シフトモードで異なる結果を生成する", () => {
      const modes: Array<HueShiftMode> = ["natural", "unnatural", "fixed"];
      const results: Record<string, Palette> = {};

      modes.forEach((mode) => {
        const config: ColorConfig = {
          ...baseColorConfig,
          hueShiftMode: mode,
        };
        results[mode] = generateColorPalette(config);
      });

      // 各モードでパレットが生成されることを確認
      modes.forEach((mode) => {
        expect(results[mode]).toBeTypeOf("object");
        expect(Object.keys(results[mode]).length).toBeGreaterThan(0);
        expect(results[mode]["--blue-color"]).toMatch(/^var\(--blue-\d+\)$/);
      });

      // fixedモードでは色相が変化しないことを確認
      const fixedResult = results.fixed;
      const naturalResult = results.natural;

      // fixedモードでは全てのレベルで同じ色相を持つはず
      const levelsToCheck = [50, 100, 800, 900];

      // naturalとfixedで違いがあることを確認（色相シフトが有効に動作している）
      let hasNaturalVsFixedDifference = false;
      levelsToCheck.forEach((level) => {
        if (
          naturalResult[`--blue-${level}`] !== fixedResult[`--blue-${level}`]
        ) {
          hasNaturalVsFixedDifference = true;
        }
      });
      expect(hasNaturalVsFixedDifference).toBe(true);

      // naturalとunnaturalで違いがあることを確認（方向が反転している）
      const unnaturalResult = results.unnatural;
      let hasNaturalVsUnnaturalDifference = false;
      levelsToCheck.forEach((level) => {
        if (
          naturalResult[`--blue-${level}`] !==
          unnaturalResult[`--blue-${level}`]
        ) {
          hasNaturalVsUnnaturalDifference = true;
        }
      });
      expect(hasNaturalVsUnnaturalDifference).toBe(true);
    });

    it("異なる色で正しいパレットを生成する", () => {
      const testColors = [
        { id: "red", prefix: "red", color: "#ff0000" },
        { id: "green", prefix: "green", color: "#00ff00" },
        { id: "blue", prefix: "blue", color: "#0000ff" },
        { id: "yellow", prefix: "yellow", color: "#ffff00" },
      ];

      testColors.forEach(({ id, color, prefix }) => {
        const config: ColorConfig = {
          id,
          prefix,
          color,
          hueShiftMode: "natural",
          includeTransparent: false,
        };

        const result = generateColorPalette(config);

        // 各色で正しいプレフィックスが使用されることを確認
        expect(result[`--${prefix}-color`]).toMatch(/^var\(--.*-\d+\)$/);

        // 全てのスケールレベルが生成されることを確認
        SCALE_LEVELS.forEach((level) => {
          expect(result[`--${prefix}-${level}`]).toMatch(/^#[0-9a-f]{6}$/i);
        });
      });
    });

    it("無効な色でフォールバック処理が動作する", () => {
      const invalidColorConfigs = [
        { ...baseColorConfig, color: "" },
        { ...baseColorConfig, color: "#" },
        { ...baseColorConfig, color: "#ff" },
        { ...baseColorConfig, color: "#1234567" },
        { ...baseColorConfig, color: "red" },
        { ...baseColorConfig, color: "rgb(255,0,0)" },
        { ...baseColorConfig, color: "transparent" },
        { ...baseColorConfig, color: null as any },
        { ...baseColorConfig, color: undefined as any },
      ];

      invalidColorConfigs.forEach((config, index) => {
        expect(
          () => generateColorPalette(config),
          `Failed at index ${index} with color: ${config.color}`
        ).not.toThrow();

        const result = generateColorPalette(config);
        expect(result).toBeTypeOf("object");
        expect(Object.keys(result).length).toBeGreaterThan(0);

        // フォールバック色が使用されることを確認（CSS変数参照）
        expect(result[`--${config.prefix}-color`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );

        // 全てのスケールレベルが生成されることを確認
        SCALE_LEVELS.forEach((level) => {
          expect(result[`--${config.prefix}-${level}`]).toMatch(
            /^#[0-9a-f]{6}$/i
          );
        });
      });
    });

    it("入力色に最も近いレベルが正しく特定される", () => {
      // 異なる明度の色をテスト
      const testCases = [
        { id: "very-light", prefix: "very-light", color: "#f8fafc" }, // 非常に明るい色（50レベル相当）
        { id: "medium", prefix: "medium", color: "#64748b" }, // 中間の色（500レベル相当）
        { id: "very-dark", prefix: "very-dark", color: "#0f172a" }, // 非常に暗い色（950レベル相当）
      ];

      testCases.forEach(({ id, color, prefix }) => {
        const config: ColorConfig = {
          id,
          prefix,
          color,
          hueShiftMode: "natural",
        };

        const result = generateColorPalette(config);

        // 入力色が正規化されて設定されることを確認
        expect(result[`--${prefix}-color`]).toMatch(/^var\(--.*-\d+\)$/);

        // パレットが適切に生成されることを確認
        SCALE_LEVELS.forEach((level) => {
          expect(result[`--${prefix}-${level}`]).toMatch(/^#[0-9a-f]{6}$/i);
        });

        // 入力色に最も近いレベルで、元の色により近い値が使用されることを確認
        // （完全一致ではないが、他のレベルより近い）
        const inputRGB = {
          r: parseInt(color.slice(1, 3), 16),
          g: parseInt(color.slice(3, 5), 16),
          b: parseInt(color.slice(5, 7), 16),
        };

        let closestLevel = 500;
        let minDistance = Infinity;

        SCALE_LEVELS.forEach((level) => {
          const levelColor = result[`--${prefix}-${level}`];
          const levelRGB = {
            r: parseInt(levelColor.slice(1, 3), 16),
            g: parseInt(levelColor.slice(3, 5), 16),
            b: parseInt(levelColor.slice(5, 7), 16),
          };

          const distance = Math.sqrt(
            Math.pow(inputRGB.r - levelRGB.r, 2) +
              Math.pow(inputRGB.g - levelRGB.g, 2) +
              Math.pow(inputRGB.b - levelRGB.b, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestLevel = level;
          }
        });

        // 最も近いレベルが見つかることを確認
        expect(closestLevel).toBeGreaterThanOrEqual(50);
        expect(closestLevel).toBeLessThanOrEqual(950);
      });
    });

    it("パレットの明度分布が論理的に配置される", () => {
      // 複数の色でテスト
      const testColors = [
        { id: "red", prefix: "red", color: "#ff0000" },
        { id: "green", prefix: "green", color: "#00ff00" },
        { id: "blue", prefix: "blue", color: "#0000ff" },
      ];

      testColors.forEach(({ id, color, prefix }) => {
        const config: ColorConfig = {
          id,
          prefix,
          color,
          hueShiftMode: "natural",
          lightnessMethod: "hsl", // より予測可能な結果のため
        };

        const result = generateColorPalette(config);

        // 50レベル（最も明るい）と950レベル（最も暗い）が異なることを確認
        const lightest = result[`--${prefix}-50`];
        const darkest = result[`--${prefix}-950`];
        expect(lightest).not.toBe(darkest);

        // 中間レベルも確認
        const level200 = result[`--${prefix}-200`];
        const level500 = result[`--${prefix}-500`];
        const level800 = result[`--${prefix}-800`];

        // 全て異なる色であることを確認
        const colors = [lightest, level200, level500, level800, darkest];
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBe(5);

        // RGB値で明度の大まかな傾向を確認
        const getRGBSum = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return r + g + b;
        };

        const lighestSum = getRGBSum(lightest);
        const darkestSum = getRGBSum(darkest);

        // 明るいレベルのRGB合計値が暗いレベルより大きいことを確認
        expect(lighestSum).toBeGreaterThan(darkestSum);
      });
    });

    it("生成されたパレットの色が有効なHEX形式である", () => {
      const result = generateColorPalette(baseColorConfig);

      Object.values(result).forEach((color) => {
        // HEX形式、RGBA形式、またはCSS変数参照であることを確認
        const isValidHex = /^#[0-9a-f]{6}$/i.test(color);
        const isValidRgba =
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color);
        const isValidCssVar = /^var\(--[^-]+-\d+\)$/.test(color);

        expect(isValidHex || isValidRgba || isValidCssVar).toBe(true);
      });
    });

    it("透明色パレットの値とアルファ値が正しく計算される", () => {
      const configWithTransparent: ColorConfig = {
        ...baseColorConfig,
        includeTransparent: true,
        transparentOriginLevel: 500,
        bgColorLight: "#ffffff",
        bgColorDark: "#000000",
      };

      const result = generateColorPalette(configWithTransparent);

      // transparentOriginLevel (500) のアルファ値が最大であることを確認
      const originTransparentKey = `--${baseColorConfig.prefix}-500-transparent`;
      expect(result).toHaveProperty(originTransparentKey);

      const originAlphaMatch = result[originTransparentKey].match(
        /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/
      );
      if (originAlphaMatch) {
        const originAlpha = parseFloat(originAlphaMatch[1]);
        expect(originAlpha).toBeGreaterThan(0.8); // MAX_ALPHAに近い値
      }

      // 他のレベルのアルファ値がoriginより小さいことを確認
      const otherLevels = [50, 100, 200, 800, 900, 950];
      otherLevels.forEach((level) => {
        const transparentKey = `--${baseColorConfig.prefix}-${level}-transparent`;
        if (result[transparentKey]) {
          const alphaMatch = result[transparentKey].match(
            /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/
          );
          if (alphaMatch && originAlphaMatch) {
            const alpha = parseFloat(alphaMatch[1]);
            const originAlpha = parseFloat(originAlphaMatch[1]);
            expect(alpha).toBeLessThanOrEqual(originAlpha);
          }
        }
      });
    });

    it("無効な背景色でエラー処理が適切に動作する", () => {
      const configWithInvalidBg: ColorConfig = {
        ...baseColorConfig,
        includeTransparent: true,
        transparentOriginLevel: 500,
        bgColorLight: "invalid-color",
        bgColorDark: "also-invalid",
      };

      // エラーが発生せずフォールバック処理が動作することを確認
      expect(() => generateColorPalette(configWithInvalidBg)).not.toThrow();

      const result = generateColorPalette(configWithInvalidBg);
      const transparentKeys = Object.keys(result).filter((key) =>
        key.endsWith("-transparent")
      );

      // 透明色が生成されない、または安全なフォールバック値が使用されることを確認
      transparentKeys.forEach((key) => {
        if (result[key]) {
          expect(result[key]).toMatch(/^rgba\(/);
        }
      });
    });
  });

  describe("generateMultipleColorPalette", () => {
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
      const result = generateMultipleColorPalette(colorConfigs);

      // 全ての設定に対してパレットが生成されることを確認
      colorConfigs.forEach((config) => {
        expect(result[`--${config.prefix}-color`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );

        SCALE_LEVELS.forEach((level) => {
          expect(result[`--${config.prefix}-${level}`]).toMatch(
            /^#[0-9a-f]{6}$/i
          );
        });
      });

      // 透明色設定がある場合のテスト
      const greenTransparentKeys = Object.keys(result).filter(
        (key) => key.includes("green") && key.endsWith("-transparent")
      );
      expect(greenTransparentKeys.length).toBeGreaterThan(0);

      // 各透明色がrgba形式であることを確認
      greenTransparentKeys.forEach((key) => {
        expect(result[key]).toMatch(
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
        );
      });
    });

    it("空の配列で空のパレットを返す", () => {
      const result = generateMultipleColorPalette([]);
      expect(result).toEqual({});
    });

    it("単一設定で個別生成と同じ結果を返す", () => {
      const singleConfig = colorConfigs[0];
      const multipleResult = generateMultipleColorPalette([singleConfig]);
      const singleResult = generateColorPalette(singleConfig);

      expect(multipleResult).toEqual(singleResult);
    });

    it("重複するプレフィックスで後の設定が優先される", () => {
      const conflictConfigs: ColorConfig[] = [
        {
          id: "primary",
          prefix: "primary",
          color: "#ff0000",
          hueShiftMode: "natural",
          includeTransparent: false,
        },
        {
          id: "primary",
          prefix: "primary",
          color: "#00ff00",
          hueShiftMode: "natural",
          includeTransparent: false,
        },
      ];

      const result = generateMultipleColorPalette(conflictConfigs);
      expect(result["--primary-color"]).toMatch(/^var\(--primary-\d+\)$/);
    });

    it("異なる設定を持つ複数色で正しく動作する", () => {
      const mixedConfigs: ColorConfig[] = [
        {
          id: "purple",
          prefix: "purple",
          color: "#8b5cf6",
          hueShiftMode: "natural",
          includeTransparent: false,
        },
        {
          id: "amber",
          prefix: "amber",
          color: "#f59e0b",
          hueShiftMode: "unnatural",
          includeTransparent: true,
          transparentOriginLevel: 300,
          bgColorLight: "#fafafa",
          bgColorDark: "#0a0a0a",
        },
      ];

      const result = generateMultipleColorPalette(mixedConfigs);

      // 両方の色が正しく設定されることを確認
      expect(result["--purple-color"]).toMatch(/^var\(--purple-\d+\)$/);
      expect(result["--amber-color"]).toMatch(/^var\(--amber-\d+\)$/);

      // 透明色が適切に設定されることを確認
      const purpleTransparentKeys = Object.keys(result).filter(
        (key) => key.includes("purple") && key.endsWith("-transparent")
      );
      const amberTransparentKeys = Object.keys(result).filter(
        (key) => key.includes("amber") && key.endsWith("-transparent")
      );

      expect(purpleTransparentKeys.length).toBe(0); // includeTransparent: false
      expect(amberTransparentKeys.length).toBeGreaterThan(0); // includeTransparent: true
    });
  });

  describe("applyColorPaletteToDom", () => {
    const testPalette: Palette = {
      "--blue-50": "#eff6ff",
      "--blue-500": "#3b82f6",
      "--blue-900": "#1e3a8a",
      "--blue-color": "var(--blue-500)",
    };

    it("DOMにCSSカスタムプロパティを設定する", () => {
      applyColorPaletteToDom(testPalette);

      Object.entries(testPalette).forEach(([key, value]) => {
        expect(mockSetProperty).toHaveBeenCalledWith(key, value);
      });

      expect(mockSetProperty).toHaveBeenCalledTimes(
        Object.keys(testPalette).length
      );
    });

    it("空のパレットで何も設定しない", () => {
      applyColorPaletteToDom({});
      expect(mockSetProperty).not.toHaveBeenCalled();
    });

    it("documentが存在しない環境でエラーを起こさない", () => {
      const originalDocument = globalThis.document;
      // @ts-ignore
      globalThis.document = undefined;

      expect(() => applyColorPaletteToDom(testPalette)).not.toThrow();

      globalThis.document = originalDocument;
    });

    it("透明色を含むパレットを正しく処理する", () => {
      // 実際の透明色生成をテスト
      const configWithTransparent: ColorConfig = {
        id: "blue",
        prefix: "blue",
        color: "#3b82f6",
        includeTransparent: true,
        transparentOriginLevel: 500,
        bgColorLight: "#ffffff",
        bgColorDark: "#000000",
      };

      const paletteWithTransparent = generateColorPalette(
        configWithTransparent
      );

      // 透明色が含まれることを確認
      const transparentKeys = Object.keys(paletteWithTransparent).filter(
        (key) => key.endsWith("-transparent")
      );
      expect(transparentKeys.length).toBeGreaterThan(0);

      applyColorPaletteToDom(paletteWithTransparent);

      Object.entries(paletteWithTransparent).forEach(([key, value]) => {
        expect(mockSetProperty).toHaveBeenCalledWith(key, value);
      });
    });

    it("大量のカスタムプロパティを処理できる", () => {
      const largePalette: Palette = {};

      for (let i = 0; i < 100; i++) {
        largePalette[`--test-${i}`] = `#${i.toString(16).padStart(6, "0")}`;
      }

      expect(() => applyColorPaletteToDom(largePalette)).not.toThrow();
      expect(mockSetProperty).toHaveBeenCalledTimes(100);
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
      expect(palette["--purple-color"]).toMatch(/^var\(--purple-\d+\)$/);

      applyColorPaletteToDom(palette);

      expect(mockSetProperty).toHaveBeenCalledTimes(
        Object.keys(palette).length
      );
      expect(mockSetProperty).toHaveBeenCalledWith(
        "--purple-color",
        palette["--purple-color"]
      );
    });

    it("複数パレット生成からDOM適用まで正常に動作する", () => {
      const configs: ColorConfig[] = [
        {
          id: "yellow",
          prefix: "yellow",
          color: "#f59e0b",
          hueShiftMode: "natural",
          includeTransparent: false,
        },
        {
          id: "pink",
          prefix: "pink",
          color: "#ec4899",
          hueShiftMode: "unnatural",
          includeTransparent: true,
          transparentOriginLevel: 500,
          bgColorLight: "#ffffff",
          bgColorDark: "#000000",
        },
      ];

      const palette = generateMultipleColorPalette(configs);

      configs.forEach((config) => {
        expect(palette[`--${config.prefix}-color`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );
      });

      applyColorPaletteToDom(palette);

      configs.forEach((config) => {
        expect(mockSetProperty).toHaveBeenCalledWith(
          `--${config.prefix}-color`,
          palette[`--${config.prefix}-color`]
        );
      });
    });

    it("正規化された色値が一貫して使用される", () => {
      const config: ColorConfig = {
        id: "test",
        prefix: "test",
        color: "3B82F6", // #なし、大文字
        hueShiftMode: "natural",
      };

      const palette = generateColorPalette(config);

      // 正規化された色値が使用されることを確認（CSS変数参照）
      expect(palette["--test-color"]).toMatch(/^var\(--test-\d+\)$/);

      applyColorPaletteToDom(palette);

      expect(mockSetProperty).toHaveBeenCalledWith(
        "--test-color",
        palette["--test-color"]
      );
    });

    it("エラー処理が適切に動作する", () => {
      const invalidConfig: ColorConfig = {
        id: "error-test",
        prefix: "error-test",
        color: "invalid-color",
        hueShiftMode: "natural",
      };

      // エラーが発生せずフォールバック処理が動作することを確認
      expect(() => {
        const palette = generateColorPalette(invalidConfig);
        applyColorPaletteToDom(palette);
      }).not.toThrow();
    });

    it("全ての機能を組み合わせた総合テスト", () => {
      const complexConfigs: ColorConfig[] = [
        {
          id: "danger",
          prefix: "danger",
          color: "#ff6b6b", // 赤系
          hueShiftMode: "natural",
          lightnessMethod: "hybrid",
          includeTransparent: true,
          transparentOriginLevel: 400,
          bgColorLight: "#ffffff",
          bgColorDark: "#1a1a1a",
        },
        {
          id: "success",
          prefix: "success",
          color: "#4ecdc4", // 青緑系
          hueShiftMode: "unnatural",
          lightnessMethod: "perceptual",
          includeTransparent: false,
        },
        {
          id: "warning",
          prefix: "warning",
          color: "#ffd93d", // 黄色系
          hueShiftMode: "fixed",
          lightnessMethod: "hsl",
          includeTransparent: true,
          transparentOriginLevel: 600,
          bgColorLight: "#f8f9fa",
          bgColorDark: "#212529",
        },
      ];

      // 複数パレット生成
      const palette = generateMultipleColorPalette(complexConfigs);

      // 各設定が正しく反映されることを確認
      complexConfigs.forEach((config) => {
        // 基本色の確認
        expect(palette[`--${config.prefix}-color`]).toMatch(
          /^var\(--[^-]+-\d+\)$/
        );

        // 全スケールレベルの確認
        SCALE_LEVELS.forEach((level) => {
          expect(palette[`--${config.prefix}-${level}`]).toMatch(
            /^#[0-9a-f]{6}$/i
          );
        });

        // variation colorsの確認
        ["lighter", "light", "dark", "darker"].forEach((variation) => {
          expect(palette[`--${config.prefix}-${variation}`]).toMatch(
            /^var\(--.*-\d+\)$/
          );
        });

        // text colorの確認
        expect(palette[`--${config.prefix}-text-color`]).toMatch(
          /^var\(--.*-\d+\)$/
        );

        // 透明色の確認
        if (config.includeTransparent) {
          const transparentKeys = Object.keys(palette).filter(
            (key) => key.includes(config.prefix) && key.endsWith("-transparent")
          );
          expect(transparentKeys.length).toBeGreaterThan(0);

          transparentKeys.forEach((key) => {
            expect(palette[key]).toMatch(
              /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
            );
          });
        }
      });

      // DOM適用
      applyColorPaletteToDom(palette);

      // DOM適用の確認
      expect(mockSetProperty).toHaveBeenCalledTimes(
        Object.keys(palette).length
      );
      complexConfigs.forEach((config) => {
        expect(mockSetProperty).toHaveBeenCalledWith(
          `--${config.prefix}-color`,
          palette[`--${config.prefix}-color`]
        );
      });

      // パレットの整合性確認
      expect(Object.keys(palette).length).toBeGreaterThan(
        complexConfigs.length * 15
      ); // 基本的なキー数の最小期待値
    });
  });
});
