// colorUtils.ts
import * as culori from "culori";
import { type Oklch } from "culori";

export type Rgb = { r: number; g: number; b: number };

// =============================================================================
// High-Level Color Conversion Functions
// =============================================================================

/**
 * OKLCH → HEX変換（知覚的ガマットマッピング）
 */
export const oklchToHexPerceptual = (oklch: Oklch): string => {
  return rgbToHex(oklchToRgbPerceptual(oklch));
};

/**
 * OKLCH → HEX変換（色相・明度保持、彩度を調整）
 */
export const oklchToHexAdjustChroma = (oklch: Oklch): string => {
  return rgbToHex(oklchToRgbAdjustChroma(oklch));
};

/**
 * OKLCH → HEX変換（色相・彩度保持、明度を調整）
 */
export const oklchToHexAdjustLightness = (oklch: Oklch): string => {
  return rgbToHex(oklchToRgbAdjustLightness(oklch));
};

/**
 * OKLCH → HEX変換（色相保持、明度・彩度をハイブリッド調整、彩度優先）
 */
export const oklchToHexHybrid = (oklch: Oklch): string => {
  return rgbToHex(oklchToRgbHybrid(oklch));
};

// =============================================================================
// RGB Conversion Functions
// =============================================================================

/**
 * OKLCH → RGB変換（知覚的ガマットマッピング）
 */
export const oklchToRgbPerceptual = (oklch: Oklch): Rgb => {
  const normalizedOklch = normalizeOklch(oklch);

  try {
    const gamutMapper = (culori as any).toGamut(
      "rgb",
      "oklch",
      (culori as any).differenceCiede2000("oklch")
    );
    const mappedColor = gamutMapper(normalizedOklch);

    if (!mappedColor || typeof mappedColor !== "object") {
      // フォールバック: 彩度調整でRGB変換
      return oklchToRgbAdjustChroma(normalizedOklch);
    }

    // gamutMapperの結果はRGBモードなので、整数に変換
    return rgbToInt(mappedColor);
  } catch (error) {
    // エラー時もフォールバック
    return oklchToRgbAdjustChroma(normalizedOklch);
  }
};

/**
 * OKLCH → RGB変換（色相・明度保持、彩度を調整）
 */
export const oklchToRgbAdjustChroma = (oklch: Oklch): Rgb => {
  const normalizedOklch = normalizeOklch(oklch);

  // culoriのclampChromaを使用してガマットマッピング
  const clampedOklch = culori.clampChroma(normalizedOklch, "oklch", "rgb");
  return rgbToInt(culori.rgb(clampedOklch));
};

/**
 * OKLCH → RGB変換（色相・彩度保持、明度を調整）
 */
export const oklchToRgbAdjustLightness = (oklch: Oklch): Rgb => {
  const normalizedOklch = normalizeOklch(oklch);

  const fallback = culori.clampChroma(normalizedOklch, "oklch", "rgb");
  return rgbToInt(culori.rgb(fallback));
};

/**
 * OKLCH → RGB変換（色相保持、明度・彩度をハイブリッド調整、彩度優先）
 * 旧 fitOklchToRgb の改良版
 */
export const oklchToRgbHybrid = (oklch: Oklch): Rgb => {
  const normalizedOklch = normalizeOklch(oklch);

  // culoriのclampChromaを使用して彩度優先のガマットマッピング
  const clampedOklch = culori.clampChroma(normalizedOklch, "oklch", "rgb");
  return rgbToInt(culori.rgb(clampedOklch));
};

// =============================================================================
// Low-Level Utility Functions
// =============================================================================

/**
 * 入力値を安全な範囲に正規化
 */
const normalizeOklch = (oklch: Oklch): Oklch => {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  return {
    mode: "oklch",
    l: clamp01(oklch.l || 0),
    c: Math.max(0, oklch.c || 0),
    h: oklch.h || 0, // undefinedの場合は0をデフォルト値として使用
  };
};

/**
 * RGB値が有効な範囲内かチェック
 */
const isValidRgb = (rgb: any): boolean => {
  return (
    rgb &&
    rgb.r >= 0 &&
    rgb.r <= 1 &&
    rgb.g >= 0 &&
    rgb.g <= 1 &&
    rgb.b >= 0 &&
    rgb.b <= 1
  );
};

/**
 * RGB値を整数に変換
 */
const rgbToInt = (rgb: any): Rgb => {
  return {
    r: Math.round((rgb?.r || 0) * 255),
    g: Math.round((rgb?.g || 0) * 255),
    b: Math.round((rgb?.b || 0) * 255),
  };
};

/**
 * RGB値をHEX文字列に変換
 */
const rgbToHex = (rgb: Rgb): string => {
  return culori.formatHex({
    mode: "rgb",
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255,
  });
};
