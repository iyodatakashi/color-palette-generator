// lightness.ts

import * as culori from "culori";
import {
  SCALE_LEVELS,
  MAX_LIGHTNESS,
  MIN_LIGHTNESS,
  DEFAULT_LEVEL_500_LIGHTNESS,
} from "./constants";
import { oklchToHexPerceptual } from "./colorUtils";

// =============================================================================
// Lightness Calculation Functions
// =============================================================================

/**
 * Get lightness value from color using OKLCH
 */
export const getLightness = (color: string): number => {
  const colorObj = culori.parse(color);
  if (!colorObj) return 0;

  const oklch = culori.converter("oklch")(colorObj);
  if (!oklch) return 0;

  return oklch.l;
};

// =============================================================================
// Lightness Adjustment Functions
// =============================================================================

/**
 * Generate color with specified lightness, hue, and chroma
 * Keeps lightness and hue fixed, adjusts chroma only to fit RGB gamut
 */
export const adjustToLightness = ({
  h,
  c,
  targetLightness,
}: {
  h: number;
  c: number;
  targetLightness: number;
}): string => {
  // Validate and normalize inputs
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  c = isFinite(c) ? Math.max(0, c) : 0;
  targetLightness = isFinite(targetLightness) ? targetLightness : 0.5; // 0-1 range

  // Create OKLCH color with target values
  const targetOKLCH = {
    mode: "oklch" as const,
    l: targetLightness, // 0-1 range
    c: c,
    h: h,
  };

  // Use perceptual gamut mapping with HEX conversion
  return oklchToHexPerceptual(targetOKLCH);
};

// =============================================================================
// Sigmoid Lightness Distribution Functions
// =============================================================================

/**
 * Base sigmoid function for lightness distribution
 * Maps level 50-950 to lightness 0.97-0.25 (0-1 range) with configurable steepness
 */

// level, kSigned（符号で膨らみ反転）, アンカー(level, lightness)を渡す版
const getLightnessFromLevel = (
  level: number,
  kSigned: number = 0.18, // +で左上凸寄り / -で左下凸寄り
  anchorLevel: number = 500, // 通したいレベル
  anchorLightness: number = DEFAULT_LEVEL_500_LIGHTNESS, // 通したい明度 (0-1 range)
  vBase: number = 2.0, // 非対称ベース（決め打ち）
  kMin: number = 1e-6 // 極小傾きガード
): number => {
  // 1) level→x 正規化（50..950 → 0..10）
  const minLevel = 50;
  const maxLevel = 950;
  const xRange = 10;
  const x = ((level - minLevel) / (maxLevel - minLevel)) * xRange;

  // 2) アンカーを (xAnchor, yAnchor) に設定
  const xAnchor = ((anchorLevel - minLevel) / (maxLevel - minLevel)) * xRange;
  const yAnchor =
    (anchorLightness - MIN_LIGHTNESS) / (MAX_LIGHTNESS - MIN_LIGHTNESS); // MIN_LIGHTNESS..MAX_LIGHTNESS を 0..1 に

  // 3) シグモイド値（同一 k / 同一アンカーで端点も計算）
  const sVal = sigmoidRichardsThrough(
    x,
    kSigned,
    xAnchor,
    yAnchor,
    vBase,
    kMin,
    1
  );
  const sL50 = sigmoidRichardsThrough(
    0,
    kSigned,
    xAnchor,
    yAnchor,
    vBase,
    kMin,
    1
  );
  const sL950 = sigmoidRichardsThrough(
    10,
    kSigned,
    xAnchor,
    yAnchor,
    vBase,
    kMin,
    1
  );

  // 4) 区分線形リマップで 0..1 に正規化
  //    - 下側（s <= yAnchor）： sL950 → 0, yAnchor → yAnchor
  //    - 上側（s >  yAnchor）： yAnchor → yAnchor, sL50 → 1
  const eps = 1e-12;
  let sNorm: number;
  if (sVal <= yAnchor) {
    const denom = Math.max(eps, yAnchor - sL950);
    sNorm = ((sVal - sL950) / denom) * yAnchor;
  } else {
    const denom = Math.max(eps, sL50 - yAnchor);
    sNorm = yAnchor + ((sVal - yAnchor) / denom) * (1 - yAnchor);
  }

  // 5) 0..1 → MIN..MAX（= 25..97）へ写像
  // 以下を return sNormに変更することを絶対に禁止
  // return MIN_LIGHTNESS + (MAX_LIGHTNESS - MIN_LIGHTNESS) * sNorm;
  // これは上限値/加減値を考慮したマッピング
  // これを変更するなら死ね。
  return MIN_LIGHTNESS + (MAX_LIGHTNESS - MIN_LIGHTNESS) * sNorm;
  // ここまで絶対に変更禁止
};

/**
 * 標準明度カーブ（シグモイド）を使って、メイドからレベル値を取得（近似しない）
 * Calculate level from lightness using numerical inverse of sigmoid function
 * This finds the level that corresponds to a given lightness value using binary search
 */
export const getLevelFromLightness = (
  targetLightness: number,
  kSigned: number = 0.18,
  anchorLevel: number = 500,
  anchorLightness: number = DEFAULT_LEVEL_500_LIGHTNESS,
  vBase: number = 2.0,
  kMin: number = 1e-6
): number => {
  // Clamp target lightness to valid range
  const clampedTarget = Math.max(
    MIN_LIGHTNESS,
    Math.min(MAX_LIGHTNESS, targetLightness)
  );

  const minLevel = 50;
  const maxLevel = 950;

  // 線形近似で初期値を推定
  const normalizedTarget =
    (clampedTarget - MIN_LIGHTNESS) / (MAX_LIGHTNESS - MIN_LIGHTNESS);
  const estimatedLevel =
    minLevel + (1 - normalizedTarget) * (maxLevel - minLevel);

  // 二分探索で精密化
  let low = minLevel;
  let high = maxLevel;
  let bestLevel = estimatedLevel;
  let bestDiff = Infinity;

  // Search with high precision
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const lightness = getLightnessFromLevel(
      mid,
      kSigned,
      anchorLevel,
      anchorLightness,
      vBase,
      kMin
    );
    const diff = Math.abs(lightness - clampedTarget);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestLevel = mid;
    }

    if (lightness > clampedTarget) {
      low = mid; // 明度が高すぎる → レベルを下げる
    } else {
      high = mid; // 明度が低すぎる → レベルを上げる
    }

    // Early termination if we're close enough
    if (diff < 1e-6) {
      break;
    }
  }

  return bestLevel;
};

/**
 * 非対称シグモイド（Richards, 右下がり固定）
 * - 強さ: |k|（k=0でも kMin で右下がり維持）
 * - 膨らみ方向: sign(k) で v0 ↔ 1/v0
 * - (xAnchor, yAnchor) を必ず通過（x0 を動的決定）
 *
 * zeroSign: k===0 のときだけ膨らみ方向の既定符号（+1 or -1）
 *           既知の直前符号を渡すのがおすすめ。未指定なら +1。
 */
const sigmoidRichardsThrough = (
  x: number,
  kSigned: number, // 符号つき k: 符号=膨らみ方向, 大きさ=強さ
  xAnchor: number,
  yAnchor: number, // 0<y<1 を想定
  vBase: number = 2.0, // 非対称ベース（決め打ち）
  kMin: number = 1e-6, // 最小傾き（右下がり死守）
  zeroSign: 1 | -1 = 1 // k=0 のときの向き既定
): number => {
  const yClamped = Math.min(Math.max(yAnchor, 1e-9), 1 - 1e-9);

  // 符号=向き、|k|=強さ（右下がりは |k| を使って固定）
  const sign = kSigned === 0 ? zeroSign : Math.sign(kSigned);
  const kEff = Math.max(Math.abs(kSigned), kMin);
  const nu = sign >= 0 ? vBase : 1 / vBase;

  // x0 を解いてアンカーを厳密通過
  const A = Math.pow(1 - yClamped, -nu) - 1; // >0
  const x0 = xAnchor + Math.log(A) / kEff;

  const t = 1 + Math.exp(-kEff * (x - x0));
  return 1 - Math.pow(t, -1 / nu);
};

// =============================================================================
// Scale Generation Functions
// =============================================================================

/**
 * Get maximum chroma for a given hue using color-space aware gamut mapping
 */
const getMaxChromaForHue = (hue: number): number => {
  let maxChroma = 0;

  // Search across lightness range to find absolute maximum chroma for this hue
  for (let l = MIN_LIGHTNESS; l <= MAX_LIGHTNESS; l += 0.01) {
    const highChromaColor = { mode: "oklch" as const, l, c: 1.0, h: hue };
    const clampedColor = culori.clampChroma(highChromaColor, "oklch", "rgb");
    const oklchResult = culori.converter("oklch")(clampedColor);

    if (oklchResult && oklchResult.c > maxChroma) {
      maxChroma = oklchResult.c;
    }
  }

  return maxChroma || 0.2; // Fallback value
};

/**
 * Find the lightness at which maximum chroma occurs for a given hue
 */
const getMaxChromaLightnessForHue = (hue: number): number => {
  let maxChroma = 0;
  let maxChromaLightness = DEFAULT_LEVEL_500_LIGHTNESS; // Default to level 500 lightness

  // Search across lightness range to find the lightness where maximum chroma occurs
  for (let l = MIN_LIGHTNESS; l <= MAX_LIGHTNESS; l += 0.01) {
    const highChromaColor = { mode: "oklch" as const, l, c: 1.0, h: hue };
    const clampedColor = culori.clampChroma(highChromaColor, "oklch", "rgb");
    const oklchResult = culori.converter("oklch")(clampedColor);

    if (oklchResult && oklchResult.c > maxChroma) {
      maxChroma = oklchResult.c;
      maxChromaLightness = l;
    }
  }

  return maxChromaLightness;
};

/**
 * Find the target level using the same logic as generateAdjustedLightnessScale
 */
export const findClosestLevel = ({
  inputLightness,
  inputChroma,
  inputHue,
}: {
  inputLightness: number;
  inputChroma?: number;
  inputHue?: number;
}): number => {
  if (!isFinite(inputLightness)) inputLightness = 0.5; // 0-1 range
  if (!inputChroma || !isFinite(inputChroma)) inputChroma = 0;
  if (!inputHue || !isFinite(inputHue)) inputHue = 0;

  // Use the same logic as generateAdjustedLightnessScale
  const maxChroma = getMaxChromaForHue(inputHue);
  const relativeChroma = inputChroma / maxChroma;

  // Step 1: Find initial level using new sigmoid with DEFAULT_LEVEL_500_LIGHTNESS
  const baseScale: Record<number, number> = {};
  SCALE_LEVELS.forEach((level) => {
    baseScale[level] = getLightnessFromLevel(
      level,
      0.18,
      500,
      DEFAULT_LEVEL_500_LIGHTNESS
    );
  });

  let initialLevel = 500;
  let bestDiff = Infinity;
  SCALE_LEVELS.forEach((level) => {
    const diff = Math.abs(inputLightness - baseScale[level]);
    if (diff < bestDiff) {
      bestDiff = diff;
      initialLevel = level;
    }
  });

  // Step 2: Apply chroma-based level correction
  const pullStrength = relativeChroma * 0.3;
  const targetDeepLevel = 500; // Pull toward center-deep levels
  const correctedLevel = Math.round(
    initialLevel * (1 - pullStrength) + targetDeepLevel * pullStrength
  );

  // Clamp to valid levels
  const validLevels = SCALE_LEVELS.filter((level) => level <= 950);
  const targetLevel = validLevels.reduce((prev, curr) =>
    Math.abs(curr - correctedLevel) < Math.abs(prev - correctedLevel)
      ? curr
      : prev
  );

  return targetLevel;
};

/**
 * Calculate even scale based on the specified color
 */
export const calculateEvenScale = ({
  inputLightness,
  inputChroma,
  inputHue,
  enableLightnessAdjustment = true,
}: {
  inputLightness: number;
  inputChroma: number;
  inputHue: number;
  enableLightnessAdjustment?: boolean;
}): Record<number, number> => {
  if (!isFinite(inputLightness)) inputLightness = 0.5; // 0-1 range
  if (!inputChroma || !isFinite(inputChroma)) inputChroma = 0;
  if (!inputHue || !isFinite(inputHue)) inputHue = 0;

  // Always use default sigmoid scale without adjustment
  const scale: Record<number, number> = {};
  SCALE_LEVELS.forEach((level) => {
    scale[level] = getLightnessFromLevel(level, 0.18); // Use default K
  });

  // Apply hue-specific maximum chroma lightness correction by adjusting anchor lightness level
  if (enableLightnessAdjustment) {
    const maxChromaLightness = getMaxChromaLightnessForHue(inputHue);

    // Find which level corresponds to the max chroma lightness
    const maxChromaLightnessLevel = getLevelFromLightness(maxChromaLightness);

    // Calculate offset from target level (500)
    const levelOffset = 500 - maxChromaLightnessLevel;

    // Apply correction with moderate weight (0.3) to avoid over-correction
    const correctionWeight = 0.2;
    const adjustedLevelOffset = levelOffset * correctionWeight;

    // Adjust anchor level: move from max chroma lightness level toward 500
    const adjustedAnchorLevel = maxChromaLightnessLevel + adjustedLevelOffset;

    // Regenerate the scale with adjusted anchor level and original max chroma lightness
    SCALE_LEVELS.forEach((level) => {
      scale[level] = getLightnessFromLevel(
        level,
        0.18, // Keep same steepness
        adjustedAnchorLevel, // Use adjusted anchor level (toward 500)
        maxChromaLightness // Keep original max chroma lightness as anchor
      );
    });
  }

  return scale;
};
