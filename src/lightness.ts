// lightness.ts

import * as culori from "culori";
import {
  SCALE_LEVELS,
  MAX_LIGHTNESS,
  MIN_LIGHTNESS,
  MAX_LEVEL,
  MIN_LEVEL,
} from "./constants";

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

  // OKLCH lightness is 0-1, convert to 0-100 scale
  return oklch.l * 100;
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
  targetLightness = isFinite(targetLightness) ? targetLightness : 50;

  // Create OKLCH color with target values
  const targetOKLCH = {
    mode: "oklch" as const,
    l: targetLightness / 100, // Convert to 0-1 range
    c: c,
    h: h,
  };

  // Use perceptual distance-based gamut mapping (CIE DE2000)
  const gamutMapper = (culori as any).toGamut(
    "rgb",
    "oklch",
    (culori as any).differenceCiede2000("oklch")
  );
  const mappedColor = gamutMapper(targetOKLCH);

  // Fallback to clampChroma if toGamut fails
  if (!mappedColor || typeof mappedColor !== "object") {
    const clampedColor = culori.clampChroma(targetOKLCH, "oklch", "rgb");
    return culori.formatHex(clampedColor);
  }

  const hexResult = culori.formatHex(mappedColor as any);
  return hexResult || "#000000"; // Ultimate fallback
};

// =============================================================================
// Sigmoid Lightness Distribution Functions
// =============================================================================

/**
 * Base sigmoid function for lightness distribution
 * Maps level 50-950 to lightness 97%-25% with configurable steepness
 */
/**
 * 非対称シグモイド（Richards, 右下がり固定）
 * - 強さ: |k|（k=0でも kMin で右下がり維持）
 * - 膨らみ方向: sign(k) で v0 ↔ 1/v0
 * - (xAnchor, yAnchor) を必ず通過（x0 を動的決定）
 *
 * zeroSign: k===0 のときだけ膨らみ方向の既定符号（+1 or -1）
 *           既知の直前符号を渡すのがおすすめ。未指定なら +1。
 */
function sigmoidRichardsThrough(
  x: number,
  kSigned: number, // 符号つき k: 符号=膨らみ方向, 大きさ=強さ
  xAnchor: number,
  yAnchor: number, // 0<y<1 を想定
  vBase: number = 2.0, // 非対称ベース（決め打ち）
  kMin: number = 1e-6, // 最小傾き（右下がり死守）
  zeroSign: 1 | -1 = 1 // k=0 のときの向き既定
): number {
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
}

// level, kSigned（符号で膨らみ反転）, アンカー(level, lightness)を渡す版
const getBaseSigmoidLightness = (
  level: number,
  kSigned: number = 0.18, // +で左上凸寄り / -で左下凸寄り
  anchorLevel: number = 500, // 通したいレベル
  anchorLightness: number = 61.0, // 通したい明度[%]
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
  return MIN_LIGHTNESS + (MAX_LIGHTNESS - MIN_LIGHTNESS) * sNorm;
};

/**
 * Generate asymmetric lightness scale with chroma-aware level mapping
 */
export const generateAdjustedLightnessScale = (
  inputLightness: number,
  inputChroma: number,
  inputHue: number,
  // 追加: 形の強さと膨らみ方向（符号）を外から決められるように
  kSigned: number = 0.18, // 例: -0.18 にすれば左下凸寄り
  vBase: number = 2.0
): Record<number, number> => {
  const scale: Record<number, number> = {};

  // 1) 相対彩度で「中心寄せ」補正（現状ロジックを踏襲）
  const maxChroma = getMaxChromaForHue(inputHue);
  const relativeChroma = inputChroma / maxChroma;

  // 基準スケール（K=0.18, アンカー=500/61）で初期レベルを推定
  const baseScale: Record<number, number> = {};
  SCALE_LEVELS.forEach((level) => {
    baseScale[level] = getBaseSigmoidLightness(level, 0.18, 500, 61.0, vBase);
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

  // 中心寄せ補正（既存ロジック）
  const pullStrength = relativeChroma * 0.3;
  const targetDeepLevel = 500;
  const correctedLevel = Math.round(
    initialLevel * (1 - pullStrength) + targetDeepLevel * pullStrength
  );

  // 有効レベルに丸め
  const validLevels = SCALE_LEVELS.filter((level) => level <= 950);
  const targetLevel = validLevels.reduce((prev, curr) =>
    Math.abs(curr - correctedLevel) < Math.abs(prev - correctedLevel)
      ? curr
      : prev
  );

  // 2) ★★ 相対Chromaシフト考慮：最終配置レベルで元明度を通る曲線を生成 ★★
  const anchorLevel = targetLevel; // シフト後の最終配置レベル
  const anchorLightness = inputLightness; // 元の入力色明度

  // 3) スケール生成：Kはそのまま（最適化しない）
  SCALE_LEVELS.forEach((level) => {
    scale[level] = getBaseSigmoidLightness(
      level,
      kSigned,
      anchorLevel,
      anchorLightness,
      vBase
    );
  });

  return scale;
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
  for (let l = MIN_LIGHTNESS / 100; l <= MAX_LIGHTNESS / 100; l += 0.01) {
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
  if (!isFinite(inputLightness)) inputLightness = 50;
  if (!inputChroma || !isFinite(inputChroma)) inputChroma = 0;
  if (!inputHue || !isFinite(inputHue)) inputHue = 0;

  // Use the same logic as generateAdjustedLightnessScale
  const maxChroma = getMaxChromaForHue(inputHue);
  const relativeChroma = inputChroma / maxChroma;

  // Step 1: Find initial level using new sigmoid (center=10)
  const baseScale: Record<number, number> = {};
  SCALE_LEVELS.forEach((level) => {
    baseScale[level] = getBaseSigmoidLightness(level, 0.18);
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
  if (!isFinite(inputLightness)) inputLightness = 50; // 0-100 range
  if (!inputChroma || !isFinite(inputChroma)) inputChroma = 0;
  if (!inputHue || !isFinite(inputHue)) inputHue = 0;

  if (enableLightnessAdjustment) {
    // Generate asymmetric lightness scale with chroma correction and K-value adjustment
    const adjustedScale = generateAdjustedLightnessScale(
      inputLightness,
      inputChroma,
      inputHue
    );
    return adjustedScale;
  } else {
    // Generate default sigmoid scale without K-value adjustment
    const scale: Record<number, number> = {};
    SCALE_LEVELS.forEach((level) => {
      scale[level] = getBaseSigmoidLightness(level, 0.18); // Use default K
    });
    return scale;
  }
};
