// lightness.ts

import * as culori from "culori";
import { adjustChromaForLightness } from "./chroma";
import {
  SCALE_LEVELS,
  STANDARD_LIGHTNESS_SCALE,
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
 * Adjust color to achieve specified lightness with optional chroma adjustment
 */
export const adjustToLightness = ({
  h,
  c,
  targetLightness,
  enableChromaAdjustment = true,
  baseLightness = 50,
  baseColor,
}: {
  h: number;
  c: number;
  targetLightness: number;
  enableChromaAdjustment?: boolean;
  baseLightness?: number;
  baseColor?: string;
}): string => {
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  c = isFinite(c) ? Math.max(0, c) : 0;
  targetLightness = isFinite(targetLightness) ? targetLightness : 50;
  baseLightness = isFinite(baseLightness) ? baseLightness : 50;

  // Adjust chroma based on lightness change if enabled
  const adjustedChroma = enableChromaAdjustment
    ? adjustChromaForLightness({
        h,
        s: c * 100, // Convert chroma to saturation-like scale for compatibility
        baseLightness,
        targetLightness,
      }) / 100 // Convert back to chroma scale
    : c;

  // Apply gamut mapping directly
  let originalOKLCH;

  if (baseColor) {
    const baseColorObj = culori.parse(baseColor);
    originalOKLCH = culori.converter("oklch")(baseColorObj);
  }

  // Use original hue or provided hue
  const targetHue = originalOKLCH?.h || h;

  // Create OKLCH with target lightness and hue
  let targetOKLCH = {
    mode: "oklch" as const,
    l: targetLightness / 100, // Convert to 0-1 range
    c: adjustedChroma,
    h: targetHue,
  };

  // Apply gamut mapping using culori's toGamut with LAB Euclidean distance
  const gamutMapper = culori.toGamut(
    "rgb",
    "oklch",
    culori.differenceEuclidean("lab")
  );
  const gamutMappedColor = gamutMapper(targetOKLCH);

  return culori.formatHex(gamutMappedColor);
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
 * Find the closest lightness level using relative chroma adjustment
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

  // Calculate relative chroma (chroma as percentage of maximum possible for this hue)
  const maxChroma = getMaxChromaForHue(inputHue);
  const relativeChroma = inputChroma / maxChroma;

  // High chroma colors should be pulled toward level 500 (52 lightness)
  const targetLightness = 52; // Level 500 lightness
  const pullStrength = relativeChroma * 0.6; // Strength of pull toward level 500

  // Interpolate between original lightness and target lightness based on chroma
  const adjustedLightness =
    inputLightness * (1 - pullStrength) + targetLightness * pullStrength;

  return SCALE_LEVELS.reduce((closestLevel, current) => {
    const lightness = STANDARD_LIGHTNESS_SCALE[current];

    const currentDiff = Math.abs(adjustedLightness - lightness);
    const closestDiff = Math.abs(
      adjustedLightness - STANDARD_LIGHTNESS_SCALE[closestLevel]
    );

    return currentDiff < closestDiff ? current : closestLevel;
  });
};

/**
 * Calculate even scale based on the specified color
 */
export const calculateEvenScale = ({
  inputLightness,
  baseLevel,
}: {
  inputLightness: number;
  baseLevel: number;
}): Record<number, number> => {
  if (!isFinite(inputLightness)) inputLightness = 50;

  // Use perceptual scale and limits
  const scale = STANDARD_LIGHTNESS_SCALE;
  const maxLightness = MAX_LIGHTNESS;
  const minLightness = MIN_LIGHTNESS;

  const clampedInputLightness = Math.max(
    minLightness,
    Math.min(maxLightness, inputLightness)
  );

  if (!SCALE_LEVELS.includes(baseLevel)) baseLevel = 500;

  const STEP_SIZE = 50;
  const baseIndex = (baseLevel - MIN_LEVEL) / STEP_SIZE;
  const totalSteps = (MAX_LEVEL - MIN_LEVEL) / STEP_SIZE;

  const upwardSteps = baseIndex;
  const downwardSteps = totalSteps - baseIndex;

  const availableUpward = maxLightness - clampedInputLightness;
  const availableDownward = clampedInputLightness - minLightness;

  const upwardInterval = upwardSteps > 0 ? availableUpward / upwardSteps : 0;
  const downwardInterval =
    downwardSteps > 0 ? availableDownward / downwardSteps : 0;

  const evenScale: Record<number, number> = {};

  // Use STANDARD_LIGHTNESS_SCALE directly
  SCALE_LEVELS.forEach((level) => {
    evenScale[level] = scale[level];
  });

  // Return clamped results
  const adjustedLightnessScale: Record<number, number> = {};
  SCALE_LEVELS.forEach((level) => {
    if (evenScale[level] !== undefined) {
      adjustedLightnessScale[level] = Math.max(
        minLightness,
        Math.min(maxLightness, evenScale[level])
      );
    }
  });

  return adjustedLightnessScale;
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get adjusted lightness using perceptual scale
 */
const getAdjustedLightness = ({ level }: { level: number }): number => {
  return STANDARD_LIGHTNESS_SCALE[level];
};
