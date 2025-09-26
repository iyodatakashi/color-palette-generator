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
 * 探索型で明度を調整してガマット内に収める
 */
export const oklchToRgbAdjustLightness = (oklch: Oklch): Rgb => {
  const normalizedOklch = normalizeOklch(oklch);

  // 色相・彩度を保持し、明度のみを調整してガマットに収める
  // 明度ごとの最大chromaを探索して最適な明度を見つける
  const targetChroma = normalizedOklch.c;
  const hue = normalizedOklch.h || 0;

  let bestLightness = normalizedOklch.l;
  let bestRgb: Rgb | null = null;
  let bestChromaRatio = 0;

  // 明度を0.01刻みで探索（0.1から0.9まで）
  for (let lightness = 0.1; lightness <= 0.9; lightness += 0.01) {
    const testOklch: Oklch = {
      mode: "oklch",
      l: lightness,
      c: targetChroma,
      h: hue,
    };

    try {
      // 高chromaのOKLCHをoklchToRgbAdjustChromaで変換
      const testRgb = oklchToRgbAdjustChroma(testOklch);

      // 変換後のchromaが目標に近いかチェック
      const convertedOklch = culori.converter("oklch")(testRgb);
      const actualChroma = convertedOklch.c || 0;
      const chromaRatio = actualChroma / targetChroma;

      // 目標chromaにより近い明度を選択
      if (chromaRatio > bestChromaRatio) {
        bestChromaRatio = chromaRatio;
        bestLightness = lightness;
        bestRgb = testRgb;
      }
    } catch (error) {
      // エラー時はスキップ
      continue;
    }
  }

  // 最適な明度で最終変換
  const finalOklch: Oklch = {
    mode: "oklch",
    l: bestLightness,
    c: targetChroma,
    h: hue,
  };

  return bestRgb || oklchToRgbAdjustChroma(finalOklch);
};

// =============================================================================
// OKLCH Gamut Mapping (returns OKLCH)
// =============================================================================

/**
 * OKLCH → OKLCH変換（知覚的ガマットマッピング）
 * ガマットマッピング済みのOKLCHを返す
 */
export const oklchGamutMappingPerceptual = (oklch: Oklch): Oklch => {
  const normalizedOklch = normalizeOklch(oklch);

  try {
    const gamutMapper = culori.toGamut(
      "rgb",
      "oklch",
      (culori as any).differenceCiede2000("oklch")
    );
    const clampedOklch = gamutMapper(normalizedOklch);

    if (!clampedOklch || typeof clampedOklch !== "object") {
      // フォールバック: 彩度調整でOKLCH変換
      return oklchGamutMappingAdjustChroma(normalizedOklch);
    }

    // RGBをOKLCHに変換して返す
    return culori.converter("oklch")(clampedOklch);
  } catch (error) {
    // エラー時もフォールバック
    return oklchGamutMappingAdjustChroma(normalizedOklch);
  }
};

/**
 * OKLCH → OKLCH変換（色相・明度保持、彩度を調整）
 * ガマットマッピング済みのOKLCHを返す
 */
export const oklchGamutMappingAdjustChroma = (oklch: Oklch): Oklch => {
  const normalizedOklch = normalizeOklch(oklch);

  // culoriのclampChromaを使用してガマットマッピング
  const clampedOklch = culori.clampChroma(normalizedOklch, "oklch", "rgb");
  return clampedOklch;
};

/**
 * OKLCH → OKLCH変換（色相・彩度保持、明度を調整）
 * ガマットマッピング済みのOKLCHを返す
 */
export const oklchGamutMappingAdjustLightness = (oklch: Oklch): Oklch => {
  const normalizedOklch = normalizeOklch(oklch);

  // 色相・彩度を保持し、明度のみを調整してガマットに収める
  // 明度ごとの最大chromaを探索して最適な明度を見つける
  const targetChroma = normalizedOklch.c;
  const hue = normalizedOklch.h || 0;

  let bestLightness = normalizedOklch.l;
  let bestChromaRatio = 0;

  // 明度を0.01刻みで探索（0.1から0.9まで）
  for (let lightness = 0.1; lightness <= 0.9; lightness += 0.01) {
    const testOklch: Oklch = {
      mode: "oklch",
      l: lightness,
      c: targetChroma,
      h: hue,
    };

    try {
      // 高chromaのOKLCHをoklchGamutMappingAdjustChromaで変換
      const testGamutMapped = oklchGamutMappingAdjustChroma(testOklch);
      const actualChroma = testGamutMapped.c || 0;
      const chromaRatio = actualChroma / targetChroma;

      // 目標chromaにより近い明度を選択
      if (chromaRatio > bestChromaRatio) {
        bestChromaRatio = chromaRatio;
        bestLightness = lightness;
      }
    } catch (error) {
      // エラー時はスキップ
      continue;
    }
  }

  // 最適な明度で最終OKLCHを作成
  const finalOklch: Oklch = {
    mode: "oklch",
    l: bestLightness,
    c: targetChroma,
    h: hue,
  };

  return oklchGamutMappingAdjustChroma(finalOklch);
};

// =============================================================================
// Chroma Analysis Functions
// =============================================================================

/**
 * 相対Chroma計算（最大可能Chromaに対する割合）
 */
export const calculateRelativeChroma = (oklch: Oklch): number => {
  const maxChroma = getMaxChromaForHue(oklch.h || 0);
  return Math.min(oklch.c / maxChroma, 1.0);
};

/**
 * 指定された色相で取りうる最大の彩度を取得
 */
export const getMaxChromaForHue = (hue: number): number => {
  // 色相固定で明度・彩度を調整して最大彩度を求める
  const targetOklch: Oklch = {
    mode: "oklch",
    l: 0.5,
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
export const normalizeOklch = (oklch: Oklch): Oklch => {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  return {
    mode: "oklch",
    l: clamp01(oklch.l || 0),
    c: Math.max(0, oklch.c || 0),
    h: oklch.h || 0, // undefinedの場合は0をデフォルト値として使用
  };
};

/**
 * Validate OKLCH object structure
 */
export const isValidOklch = (oklch: any): oklch is Oklch => {
  return (
    oklch &&
    typeof oklch === "object" &&
    oklch.mode === "oklch" &&
    isFinite(oklch.l) &&
    isFinite(oklch.c) &&
    isFinite(oklch.h || 0)
  );
};
