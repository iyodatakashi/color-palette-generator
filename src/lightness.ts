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
): { k: number; gamma: number } => {
  const tolerance = 0.1;
  const maxIterations = 100;

  let currentK = 0.18; // Start with optimized default for level 500 ≈ 63%

  // Determine gamma based on shift direction
  // Disable gamma correction completely
  const gamma = 1.0;

  for (let i = 0; i < maxIterations; i++) {
    const currentLightness = getBaseSigmoidLightness(
      targetLevel,
      currentK,
      gamma
    );
    const error = targetLightness - currentLightness;

    if (Math.abs(error) < tolerance) {
      break;
    }

    // Adjust k based on error direction
    // If we need higher lightness, decrease k (less steep)
    // If we need lower lightness, increase k (more steep)
    const adjustment = error * 0.01;
    currentK = Math.max(0.1, Math.min(10.0, currentK + adjustment));
  }

  return { k: currentK, gamma };
};

/**
 * Base sigmoid function for lightness distribution
 * Maps level 50-950 to lightness 97%-25% with configurable steepness
 */
const getBaseSigmoidLightness = (
  level: number,
  k: number = 0.18,
  gamma: number = 1.0
): number => {
  // Map level 50-950 to normalized range [0, 10]
  const minLevel = 50;
  const maxLevel = 950;
  const normalizedLevel = (level - minLevel) / (maxLevel - minLevel);
  const xRange = 10;
  const x = normalizedLevel * xRange;

  // Fixed center at 10 (corresponds to level 950, the darkest level)
  const center = 10;

  const rawSigmoid = 1 / (1 + Math.exp(-Math.abs(k) * (x - center)));

  const minRaw = 1 / (1 + Math.exp(-Math.abs(k) * (0 - center)));
  const maxRaw = 1 / (1 + Math.exp(-Math.abs(k) * (xRange - center)));

  // Normalize sigmoid to 0-1 range
  const normalizedSigmoid = (rawSigmoid - minRaw) / (maxRaw - minRaw);

  // Apply gamma correction to change curve shape
  const gammaCorrected = Math.pow(normalizedSigmoid, gamma);

  // Map to target lightness range: 97% to 25% (inverted: level 50 = bright, level 950 = dark)
  const maxLightness = 97;
  const minLightness = 25;
  const lightness =
    minLightness + (maxLightness - minLightness) * (1 - gammaCorrected);

  return lightness;
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

  // Step 4: Generate adjusted sigmoid by tuning k parameter and gamma
  // Use fixed center=10 (upper curve only) and adjust k to hit target lightness
  const { k: adjustedK, gamma } = calculateOptimalK(
    targetLevel,
    targetLightness
  );

  SCALE_LEVELS.forEach((level) => {
    scale[level] = getBaseSigmoidLightness(level, adjustedK, gamma);
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
