// colorUtils.ts
import * as culori from "culori";
import { type Oklch } from "culori";

export type Rgb = { mode: "rgb"; r: number; g: number; b: number };

// =============================================================================
// OKLCH to HEX Conversion
// =============================================================================

/**
 * OKLCH → HEX変換（知覚的ガマットマッピング）
 */
export const oklchToHexPerceptual = (oklch: Oklch): string => {
  return culori.formatHex(oklchToRgbPerceptual(oklch));
};

/**
 * OKLCH → HEX変換（色相・明度保持、彩度を調整）
 */
export const oklchToHexAdjustChroma = (oklch: Oklch): string => {
  return culori.formatHex(oklchToRgbAdjustChroma(oklch));
};

/**
 * OKLCH → HEX変換（色相・彩度保持、明度を調整）
 */
export const oklchToHexAdjustLightness = (oklch: Oklch): string => {
  return culori.formatHex(oklchToRgbAdjustLightness(oklch));
};

/**
 * OKLCH → HEX変換（色相保持、明度・彩度をハイブリッド調整、彩度優先）
 */
export const oklchToHexHybrid = (oklch: Oklch): string => {
  return culori.formatHex(oklchToRgbHybrid(oklch));
};

// =============================================================================
// OKLCH to RGB Conversion
// =============================================================================

/**
 * OKLCH → RGB変換（知覚的ガマットマッピング）
 */
export const oklchToRgbPerceptual = (oklch: Oklch): Rgb => {
  const normalizedOklch = normalizeOklch(oklch);

  try {
    const gamutMapper = culori.toGamut(
      "rgb",
      "oklch",
      (culori as any).differenceCiede2000("oklch")
    );
    const clampedOklch = gamutMapper(normalizedOklch);

    if (!clampedOklch || typeof clampedOklch !== "object") {
      // フォールバック: 彩度調整でRGB変換
      return oklchToRgbAdjustChroma(normalizedOklch);
    }

    // gamutMapperの結果はRGBモードなので、そのまま返す
    return clampedOklch;
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
  return culori.rgb(clampedOklch);
};

/**
 * OKLCH → RGB変換（色相・彩度保持、明度を調整）
 */
export const oklchToRgbAdjustLightness = (oklch: Oklch): Rgb => {
  const normalizedOklch = normalizeOklch(oklch);

  const fallback = culori.clampChroma(normalizedOklch, "oklch", "rgb");
  return culori.rgb(fallback);
};

/**
 * OKLCH → RGB変換（色相保持、明度・彩度をハイブリッド調整、彩度優先）
 */
export const oklchToRgbHybrid = (oklch: Oklch): Rgb => {
  const normalizedOklch = normalizeOklch(oklch);

  // culoriのclampChromaを使用して彩度優先のガマットマッピング
  const clampedOklch = culori.clampChroma(normalizedOklch, "oklch", "rgb");
  return culori.rgb(clampedOklch);
};

// =============================================================================
// Chroma Analysis Functions
// =============================================================================

/**
 * 相対Chroma計算（最大可能Chromaに対する割合）
 */
export const calculateRelativeChroma = (oklch: Oklch): number => {
  const maxChroma = getMaxChromaForHue(oklch.h || 0, oklch.l);
  return Math.min(oklch.c / maxChroma, 1.0);
};

/**
 * 指定された色相で取りうる最大の彩度を取得
 */
const getMaxChromaForHue = (hue: number, lightness: number = 0.5): number => {
  // 色相固定で明度・彩度を調整して最大彩度を求める
  const targetOklch: Oklch = {
    mode: "oklch",
    l: lightness,
    c: 0.4, // 高いChroma値で開始
    h: hue,
  };

  const adjustedRgb = oklchToRgbAdjustLightness(targetOklch);
  const adjustedOklch = culori.converter("oklch")(adjustedRgb);
  return adjustedOklch.c || 0.1; // フォールバック値
};

// =============================================================================
// Utility Functions
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
