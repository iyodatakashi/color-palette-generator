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
 * Calculate optimal k parameter to achieve target lightness at target level
 */
const calculateOptimalK = (
  targetLevel: number,
  targetLightness: number
): number => {
  const tolerance = 0.1;
  const maxIterations = 100;

  let currentK = 0.18; // Start with optimized default for level 500 ≈ 63%

  for (let i = 0; i < maxIterations; i++) {
    const currentLightness = getBaseSigmoidLightness(targetLevel, currentK);
    const error = targetLightness - currentLightness;

    if (Math.abs(error) < tolerance) {
      break;
    }

    // Adjust k based on error direction
    // If we need higher lightness, decrease k (less steep)
    // If we need lower lightness, increase k (more steep)
    const adjustment = error * 0.01; // Larger adjustment factor
    currentK = Math.max(0.1, Math.min(2.0, currentK + adjustment));
  }

  return currentK;
};

/**
 * Base sigmoid function for lightness distribution
 * Maps level 0-1000 to lightness 100%-20% with configurable steepness
 */
const getBaseSigmoidLightness = (level: number, k: number = 0.18): number => {
  const MIN_LIGHTNESS_LOCAL = 10; // 10% to 100% range
  const MAX_LIGHTNESS_LOCAL = 100;
  const xRange = 10;
  const x = (level / 1000) * xRange;
  // Fixed center at 10 (use upper curve only)
  const center = 10;
  const rawSigmoid = 1 / (1 + Math.exp(-k * (x - center)));

  const minRaw = 1 / (1 + Math.exp(-k * (0 - center)));
  const maxRaw = 1 / (1 + Math.exp(-k * (xRange - center)));
  const scaledSigmoid =
    1.0 - ((1.0 - 0.1) * (rawSigmoid - minRaw)) / (maxRaw - minRaw);

  const lightness =
    MIN_LIGHTNESS_LOCAL +
    (MAX_LIGHTNESS_LOCAL - MIN_LIGHTNESS_LOCAL) *
      ((scaledSigmoid - 0.1) / (1.0 - 0.1));

  return Math.max(
    MIN_LIGHTNESS_LOCAL,
    Math.min(MAX_LIGHTNESS_LOCAL, lightness)
  );
};

/**
 * Mathematical transformation function
 */
const applyMathematicalTransform = (
  x: number,
  newCenter: number,
  originalCenter: number
): number => {
  const xRange = 10;

  // Step 1: Apply scaling around the NEW center (not original center)
  let transformedX: number;
  if (x <= newCenter) {
    // Left side: scale 0~newCenter to 0~originalCenter
    const leftRatio = originalCenter / newCenter;
    transformedX = x * leftRatio;
  } else {
    // Right side: scale newCenter~10 to originalCenter~10
    const rightOffset = x - newCenter;
    const newRightRange = xRange - newCenter;
    const originalRightRange = xRange - originalCenter;
    const rightRatio = originalRightRange / newRightRange;
    transformedX = originalCenter + rightOffset * rightRatio;
  }

  return transformedX;
};

/**
 * Calculate asymmetric transformation parameters once
 */
const calculateAdjustedTransform = (
  targetLevel: number,
  targetLightness: number,
  k: number = 0.4
): { center: number; targetOriginalLevel: number } => {
  const xRange = 10;
  const originalCenter = xRange / 2; // Always 5.0

  // Find the original level that corresponds to target lightness
  let targetOriginalLevel = 0;
  let minError = Infinity;

  for (let testLevel = 0; testLevel <= 1000; testLevel += 0.1) {
    const lightness = getBaseSigmoidLightness(testLevel, k);
    const error = Math.abs(lightness - targetLightness);

    if (error < minError) {
      minError = error;
      targetOriginalLevel = testLevel;
    }
  }

  const targetOriginalX = (targetOriginalLevel / 1000) * xRange;
  const targetFinalX = (targetLevel / 1000) * xRange;

  // Iteratively find the center that maps targetFinalX to targetOriginalX
  let currentCenter = originalCenter;
  const maxIterations = 10;
  const tolerance = 0.01;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const transformedFinalX = applyMathematicalTransform(
      targetFinalX,
      currentCenter,
      originalCenter
    );

    const error = targetOriginalX - transformedFinalX;

    if (Math.abs(error) < tolerance) {
      break;
    }

    currentCenter -= error;
    currentCenter = Math.max(0.5, Math.min(9.5, currentCenter));
  }

  console.log(
    `[DEBUG] 変換パラメータ: center=${currentCenter.toFixed(
      3
    )}, targetOriginalLevel=${targetOriginalLevel.toFixed(1)}`
  );

  return { center: currentCenter, targetOriginalLevel };
};

/**
 * Apply asymmetric transformation to a single level
 */
const applyAdjustedTransform = (
  level: number,
  transform: { center: number; targetOriginalLevel: number },
  k: number = 0.4
): number => {
  const xRange = 10;
  const originalCenter = xRange / 2;

  const inputX = (level / 1000) * xRange;
  const transformedX = applyMathematicalTransform(
    inputX,
    transform.center,
    originalCenter
  );
  const transformedLevel = (transformedX / xRange) * 1000;

  // Debug log for edge cases
  if (level === 0 || level === 1000) {
    const resultLightness = getBaseSigmoidLightness(transformedLevel, k);
    console.log(
      `[DEBUG] レベル${level}: X=${inputX.toFixed(
        3
      )} → transformedX=${transformedX.toFixed(
        3
      )} → transformedLevel=${transformedLevel.toFixed(
        1
      )} → 明度=${resultLightness.toFixed(1)}%`
    );
  }

  return getBaseSigmoidLightness(transformedLevel, k);
};

/**
 * Generate asymmetric lightness scale with chroma-aware level mapping
 */
export const generateAdjustedLightnessScale = (
  inputLightness: number,
  inputChroma: number,
  inputHue: number
): Record<number, number> => {
  const scale: Record<number, number> = {};

  // Determine target level based on relative chroma
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

  // Step 3: Target lightness = original input lightness (to preserve input color characteristics)
  const targetLightness = inputLightness;

  // Step 4: Generate adjusted sigmoid by tuning k parameter
  // Use fixed center=10 (upper curve only) and adjust k to hit target lightness
  const adjustedK = calculateOptimalK(targetLevel, targetLightness);

  SCALE_LEVELS.forEach((level) => {
    scale[level] = getBaseSigmoidLightness(level, adjustedK);
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
  for (let l = 0.1; l <= 0.9; l += 0.01) {
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
}: {
  inputLightness: number;
  inputChroma: number;
  inputHue: number;
}): Record<number, number> => {
  if (!isFinite(inputLightness)) inputLightness = 50;
  if (!inputChroma || !isFinite(inputChroma)) inputChroma = 0;
  if (!inputHue || !isFinite(inputHue)) inputHue = 0;

  // Generate asymmetric lightness scale with chroma correction
  const adjustedScale = generateAdjustedLightnessScale(
    inputLightness,
    inputChroma,
    inputHue
  );

  return adjustedScale;
};

// =============================================================================
// Helper Functions
// =============================================================================
