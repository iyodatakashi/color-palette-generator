// colorUtils.ts
import * as culori from "culori";
import { type Oklch } from "culori";

export type Rgb = { r: number; g: number; b: number };

// =============================================================================
// Gamut Mapping Functions
// =============================================================================

/**
 * OKLCH → HEX変換（知覚的ガマットマッピング）
 */
export const oklchToHexPerceptual = (oklch: Oklch): string => {
  try {
    const gamutMapper = (culori as any).toGamut(
      "rgb",
      "oklch",
      (culori as any).differenceCiede2000("oklch")
    );
    const mappedColor = gamutMapper(oklch);

    if (!mappedColor || typeof mappedColor !== "object") {
      // フォールバック: 彩度調整でHEX変換
      return oklchToHexAdjustChroma(oklch);
    }

    // gamutMapperの結果はRGBモードなので、直接HEX変換
    const rgb = mappedColor as any;
    const result = `#${Math.round(rgb.r * 255)
      .toString(16)
      .padStart(2, "0")}${Math.round(rgb.g * 255)
      .toString(16)
      .padStart(2, "0")}${Math.round(rgb.b * 255)
      .toString(16)
      .padStart(2, "0")}`;
    return result;
  } catch (error) {
    console.log("error in oklchToHexPerceptual:", error);
    // エラー時もフォールバック
    return oklchToHexAdjustChroma(oklch);
  }
};

/**
 * OKLCH → RGB変換（色相・明度保持、彩度を調整）
 */
export const oklchToRgbAdjustChroma = (oklch: Oklch): Rgb => {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  // 安全な入力値に正規化
  const normalized: Oklch = {
    mode: "oklch",
    l: clamp01(oklch.l || 0),
    c: Math.max(0, oklch.c || 0),
    h: oklch.h || 0, // undefinedの場合は0をデフォルト値として使用
  };

  // 1. 元の色がRGB範囲内かチェック
  const rgbTest = culori.rgb(normalized) as any;
  if (
    rgbTest &&
    rgbTest.r >= 0 &&
    rgbTest.r <= 1 &&
    rgbTest.g >= 0 &&
    rgbTest.g <= 1 &&
    rgbTest.b >= 0 &&
    rgbTest.b <= 1
  ) {
    return {
      r: Math.round(rgbTest.r * 255),
      g: Math.round(rgbTest.g * 255),
      b: Math.round(rgbTest.b * 255),
    };
  }

  // 2. 彩度を段階的に下げる
  const chromaSteps = [
    0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1,
  ];
  for (const chromaRatio of chromaSteps) {
    const reducedChroma: Oklch = {
      mode: "oklch",
      l: normalized.l,
      c: normalized.c * chromaRatio,
      h: normalized.h,
    };

    const testRgb = culori.rgb(reducedChroma) as any;
    if (
      testRgb &&
      testRgb.r >= 0 &&
      testRgb.r <= 1 &&
      testRgb.g >= 0 &&
      testRgb.g <= 1 &&
      testRgb.b >= 0 &&
      testRgb.b <= 1
    ) {
      return {
        r: Math.round(testRgb.r * 255),
        g: Math.round(testRgb.g * 255),
        b: Math.round(testRgb.b * 255),
      };
    }
  }

  // 3. 最終手段: clampChromaで彩度を下げる
  const fallback = culori.clampChroma(normalized, "oklch", "rgb");
  const rgb = culori.rgb(fallback) as any;
  return {
    r: Math.round((rgb?.r || 0) * 255),
    g: Math.round((rgb?.g || 0) * 255),
    b: Math.round((rgb?.b || 0) * 255),
  };
};

/**
 * OKLCH → RGB変換（色相・彩度保持、明度を調整）
 */
export const oklchToRgbAdjustLightness = (oklch: Oklch): Rgb => {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  // 安全な入力値に正規化
  const normalized: Oklch = {
    mode: "oklch",
    l: clamp01(oklch.l || 0),
    c: Math.max(0, oklch.c || 0),
    h: oklch.h || 0, // undefinedの場合は0をデフォルト値として使用
  };

  // 1. 元の色がRGB範囲内かチェック
  const rgbTest = culori.rgb(normalized) as any;
  if (
    rgbTest &&
    rgbTest.r >= 0 &&
    rgbTest.r <= 1 &&
    rgbTest.g >= 0 &&
    rgbTest.g <= 1 &&
    rgbTest.b >= 0 &&
    rgbTest.b <= 1
  ) {
    return {
      r: Math.round(rgbTest.r * 255),
      g: Math.round(rgbTest.g * 255),
      b: Math.round(rgbTest.b * 255),
    };
  }

  // 2. 明度を段階的に調整（±0.25範囲）
  const lightnessSteps = [
    0, -0.01, 0.01, -0.02, 0.02, -0.03, 0.03, -0.05, 0.05, -0.08, 0.08, -0.12,
    0.12, -0.16, 0.16, -0.2, 0.2, -0.25, 0.25,
  ];

  for (const deltaL of lightnessSteps) {
    const adjustedLightness: Oklch = {
      mode: "oklch",
      l: clamp01(normalized.l + deltaL),
      c: normalized.c,
      h: normalized.h,
    };

    const testRgb = culori.rgb(adjustedLightness) as any;
    if (
      testRgb &&
      testRgb.r >= 0 &&
      testRgb.r <= 1 &&
      testRgb.g >= 0 &&
      testRgb.g <= 1 &&
      testRgb.b >= 0 &&
      testRgb.b <= 1
    ) {
      return {
        r: Math.round(testRgb.r * 255),
        g: Math.round(testRgb.g * 255),
        b: Math.round(testRgb.b * 255),
      };
    }
  }

  // 3. 最終手段: clampChromaで彩度を下げる
  const fallback = culori.clampChroma(normalized, "oklch", "rgb");
  const rgb = culori.rgb(fallback) as any;
  return {
    r: Math.round((rgb?.r || 0) * 255),
    g: Math.round((rgb?.g || 0) * 255),
    b: Math.round((rgb?.b || 0) * 255),
  };
};

/**
 * OKLCH → RGB変換（色相保持、明度・彩度をハイブリッド調整、彩度優先）
 * 旧 fitOklchToRgb の改良版
 */
export const oklchToRgbHybrid = (oklch: Oklch): Rgb => {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  // 安全な入力値に正規化
  const normalized: Oklch = {
    mode: "oklch",
    l: clamp01(oklch.l || 0),
    c: Math.max(0, oklch.c || 0),
    h: oklch.h || 0, // undefinedの場合は0をデフォルト値として使用
  };

  // 1. 元の色がRGB範囲内かチェック
  const rgbTest = culori.rgb(normalized) as any;
  if (
    rgbTest &&
    rgbTest.r >= 0 &&
    rgbTest.r <= 1 &&
    rgbTest.g >= 0 &&
    rgbTest.g <= 1 &&
    rgbTest.b >= 0 &&
    rgbTest.b <= 1
  ) {
    return {
      r: Math.round(rgbTest.r * 255),
      g: Math.round(rgbTest.g * 255),
      b: Math.round(rgbTest.b * 255),
    };
  }

  // 2. 明度調整で彩度保持を試行（±0.25範囲、より積極的）
  const lightnessCandidates = [
    0, -0.02, 0.02, -0.05, 0.05, -0.08, 0.08, -0.12, 0.12, -0.16, 0.16, -0.2,
    0.2, -0.25, 0.25,
  ];
  let bestCandidate: Oklch | null = null;
  let bestChroma = -1;

  for (const deltaL of lightnessCandidates) {
    const candidate: Oklch = {
      mode: "oklch",
      l: clamp01(normalized.l + deltaL),
      c: normalized.c,
      h: normalized.h,
    };

    const testRgb = culori.rgb(candidate) as any;
    if (
      testRgb &&
      testRgb.r >= 0 &&
      testRgb.r <= 1 &&
      testRgb.g >= 0 &&
      testRgb.g <= 1 &&
      testRgb.b >= 0 &&
      testRgb.b <= 1
    ) {
      if (candidate.c > bestChroma) {
        bestChroma = candidate.c;
        bestCandidate = candidate;
      }
    }
  }

  if (bestCandidate) {
    const rgb = culori.rgb(bestCandidate) as any;
    return {
      r: Math.round(rgb.r * 255),
      g: Math.round(rgb.g * 255),
      b: Math.round(rgb.b * 255),
    };
  }

  // 3. 彩度を段階的に下げながら最大保持を試行
  const chromaSteps = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6];
  for (const chromaRatio of chromaSteps) {
    const reducedChroma: Oklch = {
      mode: "oklch",
      l: normalized.l,
      c: normalized.c * chromaRatio,
      h: normalized.h,
    };

    const testRgb = culori.rgb(reducedChroma) as any;
    if (
      testRgb &&
      testRgb.r >= 0 &&
      testRgb.r <= 1 &&
      testRgb.g >= 0 &&
      testRgb.g <= 1 &&
      testRgb.b >= 0 &&
      testRgb.b <= 1
    ) {
      return {
        r: Math.round(testRgb.r * 255),
        g: Math.round(testRgb.g * 255),
        b: Math.round(testRgb.b * 255),
      };
    }
  }

  // 4. 最終手段: clampChromaで彩度を下げる
  const fallback = culori.clampChroma(normalized, "oklch", "rgb");
  const rgb = culori.rgb(fallback) as any;
  return {
    r: Math.round((rgb?.r || 0) * 255),
    g: Math.round((rgb?.g || 0) * 255),
    b: Math.round((rgb?.b || 0) * 255),
  };
};

// =============================================================================
// HEX Conversion Functions
// =============================================================================

/**
 * OKLCH → HEX変換（色相・明度保持、彩度を調整）
 */
export const oklchToHexAdjustChroma = (oklch: Oklch): string => {
  const rgb = oklchToRgbAdjustChroma(oklch);
  return `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g
    .toString(16)
    .padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
};

/**
 * OKLCH → HEX変換（色相・彩度保持、明度を調整）
 */
export const oklchToHexAdjustLightness = (oklch: Oklch): string => {
  const rgb = oklchToRgbAdjustLightness(oklch);
  return `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g
    .toString(16)
    .padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
};

/**
 * OKLCH → HEX変換（色相保持、明度・彩度をハイブリッド調整、彩度優先）
 */
export const oklchToHexHybrid = (oklch: Oklch): string => {
  const rgb = oklchToRgbHybrid(oklch);
  return `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g
    .toString(16)
    .padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
};
